'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getVideoUrl, hasVideo } from '../lib/video-store';

interface TurnVideoPlayerProps {
  sessionId: string;
  responseIndex: number;
  turnLabel?: string;
  className?: string;
}

export function TurnVideoPlayer({
  sessionId,
  responseIndex,
  turnLabel = 'Turn',
  className = '',
}: TurnVideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState<number>(0);
  const [isVideoAvailable, setIsVideoAvailable] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let currentObjectUrl: string | null = null;
    let isMounted = true;

    async function loadVideo() {
      setIsLoading(true);
      try {
        const available = await hasVideo(sessionId, responseIndex);
        if (!isMounted) return;
        setIsVideoAvailable(available);

        if (available) {
          const res = await getVideoUrl(sessionId, responseIndex);
          if (!isMounted) return;
          if (res && res.url) {
            currentObjectUrl = res.url;
            setVideoUrl(res.url);
            setDurationMs(res.durationMs || 0);
          }
        }
      } catch (err) {
        console.warn('Error loading turn video:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadVideo();

    return () => {
      isMounted = false;
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
      }
    };
  }, [sessionId, responseIndex]);

  if (isLoading) {
    return (
      <div className={`text-[10px] font-mono text-slate-500 animate-pulse ${className}`}>
        Checking video stream…
      </div>
    );
  }

  if (!isVideoAvailable || !videoUrl) {
    return (
      <div className={`flex items-center gap-2 text-[11px] font-mono text-slate-500 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-800/60 ${className}`}>
        <span>🎙️</span>
        <span>Acoustic Transcript Active · Video feed disabled or pending</span>
      </div>
    );
  }

  const durationSec = durationMs > 0 ? (durationMs / 1000).toFixed(1) : null;

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Toggle button */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shadow-sm ${
            isOpen
              ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60 hover:bg-rose-900/60'
              : 'bg-violet-950/80 text-violet-200 border border-violet-700/60 hover:bg-violet-900/80 hover:text-white'
          }`}
        >
          <span>{isOpen ? '✕ Close Video Replay' : '🎬 Watch Video Replay'}</span>
          {durationSec && (
            <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded text-slate-300">
              {durationSec}s
            </span>
          )}
        </button>

        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40 hidden sm:inline-block">
          ● Synced IndexedDB Video Vault
        </span>
      </div>

      {/* Video Container */}
      {isOpen && (
        <div className="rounded-2xl overflow-hidden bg-black border border-slate-800/90 shadow-2xl relative aspect-video max-w-xl">
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/70 border border-slate-800 text-[10px] font-mono text-slate-300 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>CANDIDATE REPLAY · {turnLabel}</span>
          </div>

          <video
            ref={videoRef}
            src={videoUrl}
            controls
            playsInline
            className="w-full h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
