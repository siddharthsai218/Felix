'use client';

import React, { useEffect, useState, useRef } from 'react';
import type { TurnState } from '../lib/types';

interface AvatarProps {
  state: TurnState;
  isSpeaking: boolean;
  audioLevel?: number;
  captionText?: string;
  themeColor?: string;
  beyondPresenceAgentId?: string;
  beyondPresenceUrl?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  state,
  isSpeaking,
  audioLevel = 0,
  captionText,
  beyondPresenceAgentId,
  beyondPresenceUrl,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isJoined, setIsJoined] = useState(false);

  // Beyond Presence agent ID or custom URL from props or env
  const agentId =
    beyondPresenceAgentId ||
    process.env.NEXT_PUBLIC_BEYOND_PRESENCE_AGENT_ID ||
    'bb8ad996-52ca-4039-98ff-8c5ec31e0ccc';

  const customUrl =
    beyondPresenceUrl ||
    process.env.NEXT_PUBLIC_BEYOND_PRESENCE_URL ||
    '';

  const embedUrl = customUrl
    ? customUrl
    : `https://bey.chat/${agentId}?transparent=1`;

  // Listen to postMessage from bey.chat for lifecycle events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object') {
        if (event.data.type === 'CALL_STARTED' || event.data.type === 'AGENT_JOINED') {
          setIsJoined(true);
        } else if (event.data.type === 'CALL_ENDED') {
          setIsJoined(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Status text for the interviewer
  const getStatusBadge = () => {
    switch (state) {
      case 'speaking':
        return { text: 'Speaking', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'listening':
        return { text: 'Listening', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
      case 'processing':
        return { text: 'Thinking…', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
      case 'rescue':
        return { text: '🛟 Rescue Scaffolding', color: 'bg-amber-500/30 text-amber-200 border-amber-500/40' };
      default:
        return { text: isJoined ? 'Live' : 'Ready', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    }
  };

  const status = getStatusBadge();

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden bg-black rounded-2xl sm:rounded-3xl">
      {/* Beyond Presence Video Agent Iframe */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        title="Beyond Presence AI Avatar"
        allow="camera *; microphone *; autoplay *; display-capture *; encrypted-media *; fullscreen *;"
        allowFullScreen
        className="w-full h-full border-none object-cover"
      />

      {/* Top-Right Permanent Beyond Presence Badge */}
      <div className="absolute top-4 right-4 z-10 pointer-events-none flex items-center gap-2">
        <span className="px-3 py-1 rounded-full bg-violet-950/80 border border-violet-500/40 text-[11px] font-semibold text-violet-300 flex items-center gap-1.5 backdrop-blur-md shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Beyond Presence Stream
        </span>
      </div>

      {/* Participant Name Tag (Google Meet Style) */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-950/80 border border-gray-800/80 backdrop-blur-md shadow-lg">
        {isSpeaking ? (
          <div className="flex items-center gap-0.5 h-3.5">
            <span className="w-1 bg-emerald-400 rounded-full animate-pulse h-3.5" />
            <span className="w-1 bg-emerald-400 rounded-full animate-pulse h-2" />
            <span className="w-1 bg-emerald-400 rounded-full animate-pulse h-3" />
          </div>
        ) : (
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        )}
        <span className="text-xs font-semibold text-gray-100">Felix — AI Coach</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${status.color}`}>
          {status.text}
        </span>
      </div>
    </div>
  );
};
