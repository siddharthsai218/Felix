'use client';

import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isActive: boolean;
  onVolumeChange?: (vol: number) => void;
  barCount?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  stream,
  isActive,
  onVolumeChange,
  barCount = 28,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream || !isActive) {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      audioCtxRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.75;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const renderBars = () => {
        if (!canvasRef.current || !analyserRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume for callback
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalizedVol = Math.min(100, Math.round((avg / 255) * 100));
        if (onVolumeChange) onVolumeChange(normalizedVol);

        // Draw visualizer
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const width = canvas.width;
        const height = canvas.height;
        const barWidth = (width / barCount) - 3;

        for (let i = 0; i < barCount; i++) {
          const index = Math.floor((i / barCount) * bufferLength);
          const value = dataArray[index] || 0;
          const percent = value / 255;
          const barHeight = Math.max(4, percent * height * 0.9);

          const x = i * (barWidth + 3);
          const y = (height - barHeight) / 2;

          // Gradient color: Cyan to Violet
          const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          gradient.addColorStop(0, '#38bdf8');
          gradient.addColorStop(0.5, '#818cf8');
          gradient.addColorStop(1, '#c084fc');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 2);
          ctx.fill();
        }

        animFrameRef.current = requestAnimationFrame(renderBars);
      };

      animFrameRef.current = requestAnimationFrame(renderBars);
    } catch (err) {
      console.error('AudioVisualizer initialization error:', err);
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stream, isActive, barCount, onVolumeChange]);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <canvas
        ref={canvasRef}
        width={340}
        height={48}
        className="w-full max-w-sm h-12 rounded-lg bg-gray-900/60 border border-gray-800 backdrop-blur-sm"
      />
      <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
        <span
          className={`w-2 h-2 rounded-full ${
            isActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'
          }`}
        />
        <span>{isActive ? 'Microphone Active' : 'Microphone Muted'}</span>
      </div>
    </div>
  );
};
