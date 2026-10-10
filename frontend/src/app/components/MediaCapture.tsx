'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { captureEventBus, type SttWordTimestamp } from '../lib/event-bus';

interface MediaCaptureProps {
  sessionId: string;
  responseIndex: number;
  isRecordingResponse: boolean;
  sttTimestamps?: SttWordTimestamp[];
  className?: string;
  onStreamReady?: (stream: MediaStream) => void;
  onError?: (err: string) => void;
}

export const MediaCapture: React.FC<MediaCaptureProps> = ({
  sessionId,
  responseIndex,
  isRecordingResponse,
  sttTimestamps = [],
  className = '',
  onStreamReady,
  onError,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoChunksRef = useRef<Blob[]>([]);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [isMicActive, setIsMicActive] = useState<boolean>(true);
  const responseStartTimeRef = useRef<number>(0);

  const onStreamReadyRef = useRef(onStreamReady);
  onStreamReadyRef.current = onStreamReady;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Request permissions and initialize media stream ONCE on mount
  useEffect(() => {
    let isMounted = true;

    async function initMedia() {
      // If already initialized, avoid re-requesting
      if (mediaStreamRef.current && mediaStreamRef.current.active) {
        if (videoRef.current && videoRef.current.srcObject !== mediaStreamRef.current) {
          videoRef.current.srcObject = mediaStreamRef.current;
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setHasPermission(true);
        if (onStreamReadyRef.current) onStreamReadyRef.current(stream);
      } catch (err: any) {
        console.warn('Full media capture failed, attempting audio-only fallback:', err);
        try {
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          if (!isMounted) return;
          mediaStreamRef.current = audioOnlyStream;
          setHasPermission(true);
          setIsCameraActive(false);
          if (onStreamReadyRef.current) onStreamReadyRef.current(audioOnlyStream);
        } catch (audioErr: any) {
          console.error('Microphone permission denied:', audioErr);
          if (onErrorRef.current) onErrorRef.current('Microphone access is required for live voice interviews.');
        }
      }
    }

    initMedia();

    return () => {
      isMounted = false;
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []); // Run only once on mount!

  // Video Frame Streaming to Part 2 via EventBus (~5 fps)
  const extractAndEmitFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isRecordingResponse) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || video.videoWidth === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const timestamp = Date.now() - responseStartTimeRef.current;

      captureEventBus.emit('capture:video-frame', {
        type: 'video-frame',
        sessionId,
        responseIndex,
        timestamp,
        imageData,
        width: canvas.width,
        height: canvas.height,
      });
    } catch (e) {
      // Ignore security or context errors
    }
  }, [sessionId, responseIndex, isRecordingResponse]);

  // Handle Response-Level Recording (per-response audio & video handoffs)
  useEffect(() => {
    if (!mediaStreamRef.current || !hasPermission) return;

    if (isRecordingResponse) {
      // Start of response
      responseStartTimeRef.current = Date.now();
      audioChunksRef.current = [];
      videoChunksRef.current = [];

      try {
        const stream = mediaStreamRef.current;
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : 'audio/webm';

        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            videoChunksRef.current.push(event.data);
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.start(250); // Slice every 250ms

        // Start 5 fps frame emitter for Part 2
        frameIntervalRef.current = setInterval(extractAndEmitFrame, 200);
      } catch (e) {
        console.error('MediaRecorder start error:', e);
      }
    } else {
      // End of response
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        const durationMs = Date.now() - responseStartTimeRef.current;
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
          const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm;codecs=vp8' });

          // Emit Audio Handoff [1] -> [2]
          captureEventBus.emit('capture:audio-handoff', {
            type: 'audio-handoff',
            sessionId,
            responseIndex,
            audioBlob,
            format: 'audio/webm;codecs=opus',
            sampleRate: 48000,
            durationMs,
            sttTimestamps,
          });

          // Emit Video Handoff [1] -> [2]
          captureEventBus.emit('capture:video-handoff', {
            type: 'video-handoff',
            sessionId,
            responseIndex,
            videoBlob,
            format: 'video/webm;codecs=vp8',
            durationMs,
          });
        };

        mediaRecorderRef.current.stop();
      }
    }
  }, [isRecordingResponse, hasPermission, sessionId, responseIndex, sttTimestamps, extractAndEmitFrame]);

  // Toggle Camera
  const toggleCamera = () => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraActive(videoTrack.enabled);
      }
    }
  };

  // Toggle Mic
  const toggleMic = () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicActive(audioTrack.enabled);
      }
    }
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Hidden canvas for extracting pixel data */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Video Container */}
      <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-violet-500/40 bg-gray-900 shadow-xl backdrop-blur-md">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform -scale-x-100 ${
            !isCameraActive ? 'hidden' : ''
          }`}
        />

        {!isCameraActive && (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-950 text-gray-500 text-xs">
            <span className="text-3xl mb-1">📷</span>
            <span>Camera Off</span>
          </div>
        )}

        {/* Recording badge */}
        {isRecordingResponse && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/90 text-white text-[11px] font-semibold tracking-wide animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            REC
          </div>
        )}

        {/* Media Controls Overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1.5">
            <button
              onClick={toggleMic}
              type="button"
              className={`p-1.5 rounded-lg text-xs backdrop-blur-md transition-colors ${
                isMicActive
                  ? 'bg-gray-800/80 text-gray-200 hover:bg-gray-700/80'
                  : 'bg-red-500/80 text-white'
              }`}
              title={isMicActive ? 'Mute Mic' : 'Unmute Mic'}
            >
              {isMicActive ? '🎙️' : '🔇'}
            </button>
            <button
              onClick={toggleCamera}
              type="button"
              className={`p-1.5 rounded-lg text-xs backdrop-blur-md transition-colors ${
                isCameraActive
                  ? 'bg-gray-800/80 text-gray-200 hover:bg-gray-700/80'
                  : 'bg-red-500/80 text-white'
              }`}
              title={isCameraActive ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {isCameraActive ? '📹' : '🚫'}
            </button>
          </div>
          <span className="text-[10px] text-gray-400 bg-gray-950/70 px-2 py-0.5 rounded">
            You
          </span>
        </div>
      </div>
    </div>
  );
};
