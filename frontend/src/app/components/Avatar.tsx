'use client';

import React, { useEffect, useState, useMemo } from 'react';
import type { TurnState, InterviewerArchetype } from '../lib/types';
import { INTERVIEWER_ARCHETYPES } from '../lib/types';

interface AvatarProps {
  state: TurnState;
  isSpeaking: boolean;
  audioLevel?: number;
  captionText?: string;
  themeColor?: string;
  beyondPresenceAgentId?: string;
  beyondPresenceUrl?: string;
  sessionId?: string;
  archetype?: InterviewerArchetype;
}

/**
 * Isolated, memoized iframe component that NEVER re-renders or updates its DOM node.
 * This ensures Beyond Presence WebRTC connection is never torn down or reloaded by parent state updates.
 */
const StableIframe = React.memo<{ url: string }>(({ url }) => {
  return (
    <iframe
      src={url}
      title="Beyond Presence AI Avatar"
      // Remove camera permission from iframe to prevent Linux V4L2 device lock collisions with local MediaCapture
      allow="microphone; autoplay; display-capture; encrypted-media; fullscreen; speaker-selection; microphone *;"
      allowFullScreen
      className="w-full h-full border-none object-cover pointer-events-auto"
    />
  );
});
StableIframe.displayName = 'StableIframe';

export const Avatar: React.FC<AvatarProps> = React.memo(({
  state,
  isSpeaking,
  beyondPresenceAgentId,
  beyondPresenceUrl,
  archetype = 'supportive-coach',
}) => {
  // Default to native interactive avatar for instant reliability (< 1.5s latency, no cloud WebRTC crashes)
  const [viewMode, setViewMode] = useState<'beyond' | 'interactive'>('interactive');
  const [isJoined, setIsJoined] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(0);
  const [blink, setBlink] = useState(false);
  const archConfig = INTERVIEWER_ARCHETYPES[archetype] || INTERVIEWER_ARCHETYPES['supportive-coach'];

  // Beyond Presence agent ID strictly configured via environment
  const agentId =
    process.env.NEXT_PUBLIC_BEYOND_PRESENCE_AGENT_ID ||
    beyondPresenceAgentId ||
    '36be1e17-4228-4557-9cdc-45bdd5420814';

  const customUrl =
    beyondPresenceUrl ||
    process.env.NEXT_PUBLIC_BEYOND_PRESENCE_URL ||
    '';

  // Completely stable URL with no mutating parameters so iframe never reloads
  const embedUrl = useMemo(() => {
    return customUrl || `https://bey.chat/${agentId}?transparent=1`;
  }, [agentId, customUrl]);

  // Listen to postMessage from bey.chat for lifecycle events with safe error handling
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        if (event.data && typeof event.data === 'object') {
          if (event.data.type === 'CALL_STARTED' || event.data.type === 'AGENT_JOINED') {
            setIsJoined(true);
          } else if (event.data.type === 'CALL_ENDED') {
            setIsJoined(false);
          }
        }
      } catch (e) {
        // Safe fallback for cross-origin postMessage errors
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Natural eye blinking animation for the interactive native avatar
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 3800 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Synchronized mouth movement when speaking
  useEffect(() => {
    if (!isSpeaking) {
      setMouthOpen(0);
      return;
    }
    const interval = setInterval(() => {
      setMouthOpen((prev) => (prev > 0.4 ? 0.1 : 0.85));
    }, 130);
    return () => clearInterval(interval);
  }, [isSpeaking]);

  const getStatusBadge = () => {
    switch (state) {
      case 'speaking':
        return { text: 'Speaking', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'listening':
        return { text: 'Listening', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
      case 'processing':
        return { text: 'Thinking…', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
      default:
        return { text: isJoined ? 'Live' : 'Ready', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    }
  };

  const status = getStatusBadge();

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden bg-black rounded-2xl sm:rounded-3xl">
      {/* Beyond Presence Video Agent Iframe */}
      {viewMode === 'beyond' ? (
        <div className="relative w-full h-full">
          <StableIframe url={embedUrl} />
        </div>
      ) : (
        /* Resilient High-Fidelity Interactive Avatar */
        <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-950 via-slate-900 to-indigo-950/80">
          <div className="relative w-64 sm:w-80 h-64 sm:h-80 flex items-center justify-center">
            {/* Halo pulse when speaking */}
            {isSpeaking && (
              <div className="absolute inset-0 rounded-full bg-violet-600/20 animate-ping duration-1000" />
            )}

            <svg
              viewBox="0 0 240 240"
              className="w-full h-full max-h-[360px] drop-shadow-2xl"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fcd34d" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <linearGradient id="blazerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#312e81" />
                  <stop offset="100%" stopColor="#1e1b4b" />
                </linearGradient>
                <linearGradient id="shirtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>
                <linearGradient id="tieGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>

              {/* Shoulders & Jacket */}
              <path
                d="M20 240 C28 175, 70 162, 120 162 C170 162, 212 175, 220 240 Z"
                fill="url(#blazerGrad)"
              />
              <polygon points="120,162 98,195 142,195" fill="url(#shirtGrad)" />
              <polygon points="115,190 125,190 128,236 120,240 112,236" fill="url(#tieGrad)" />

              {/* Neck & Head */}
              <rect x="105" y="136" width="30" height="34" rx="4" fill="#f59e0b" />
              <ellipse cx="120" cy="112" rx="46" ry="54" fill="url(#skinGrad)" />

              {/* Hair */}
              <path
                d="M71 106 C69 60, 98 46, 120 46 C146 46, 171 60, 169 106 C166 82, 146 65, 120 65 C94 65, 74 82, 71 106 Z"
                fill="url(#hairGrad)"
              />

              {/* Eyebrows */}
              <path d="M89 92 Q102 90 112 93" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
              <path d="M128 93 Q138 90 151 92" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />

              {/* Eyes */}
              {blink ? (
                <>
                  <line x1="91" y1="106" x2="111" y2="106" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
                  <line x1="129" y1="106" x2="149" y2="106" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <ellipse cx="101" cy="105" rx="7.5" ry="6" fill="#ffffff" />
                  <ellipse cx="102" cy="105" rx="3.8" ry="4" fill="#1e293b" />
                  <circle cx="103.5" cy="103.5" r="1.5" fill="#ffffff" />

                  <ellipse cx="139" cy="105" rx="7.5" ry="6" fill="#ffffff" />
                  <ellipse cx="138" cy="105" rx="3.8" ry="4" fill="#1e293b" />
                  <circle cx="139.5" cy="103.5" r="1.5" fill="#ffffff" />
                </>
              )}

              {/* Glasses */}
              <rect x="87" y="96" width="28" height="19" rx="5" fill="none" stroke="#6366f1" strokeWidth="2.6" />
              <rect x="125" y="96" width="28" height="19" rx="5" fill="none" stroke="#6366f1" strokeWidth="2.6" />
              <line x1="115" y1="105" x2="125" y2="105" stroke="#6366f1" strokeWidth="2.6" />

              {/* Nose */}
              <path d="M118 114 L116 125 L123 125" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" fill="none" />

              {/* Lip-Sync Animated Mouth */}
              {isSpeaking ? (
                <g>
                  <ellipse
                    cx="120"
                    cy={137 + mouthOpen * 3.5}
                    rx={11 + mouthOpen * 4}
                    ry={3.5 + mouthOpen * 10}
                    fill="#7f1d1d"
                  />
                  <path
                    d={`M ${113 - mouthOpen * 2} 135 Q 120 136 ${127 + mouthOpen * 2} 135 Z`}
                    fill="#ffffff"
                  />
                </g>
              ) : (
                <path
                  d="M111 138 Q120 141 129 138"
                  stroke="#92400e"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  fill="none"
                />
              )}
            </svg>
          </div>
        </div>
      )}

      {/* View Mode Toggle Button in Top-Left */}
      <div className="absolute top-3 left-3 z-30">
        <button
          onClick={() => setViewMode(viewMode === 'beyond' ? 'interactive' : 'beyond')}
          className="px-2.5 py-1 rounded-xl bg-gray-900/80 hover:bg-gray-800 text-[11px] font-semibold text-gray-200 border border-gray-700/80 backdrop-blur-md shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
          title="Toggle between Beyond Presence cloud stream and Native Avatar"
        >
          <span>{viewMode === 'beyond' ? '🎨 Native Avatar' : '🎥 Beyond Presence Stream'}</span>
        </button>
      </div>

      {/* Participant Name Tag */}
      <div className="absolute bottom-3 left-3 z-30 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-950/80 border border-gray-800/80 backdrop-blur-md shadow-lg pointer-events-none">
        {isSpeaking ? (
          <div className="flex items-center gap-0.5 h-3.5">
            <span className="w-1 bg-emerald-400 rounded-full animate-pulse h-3.5" />
            <span className="w-1 bg-emerald-400 rounded-full animate-pulse h-2" />
            <span className="w-1 bg-emerald-400 rounded-full animate-pulse h-3" />
          </div>
        ) : (
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        )}
        <span className="text-xs font-semibold text-gray-100 flex items-center gap-1.5">
          <span>{archConfig.icon}</span>
          <span>{archConfig.name}</span>
        </span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${status.color}`}>
          {status.text}
        </span>
      </div>
    </div>
  );
});

Avatar.displayName = 'Avatar';
