'use client';

import React, { useEffect, useState, useRef } from 'react';
import type { TurnState } from '../lib/types';

interface AvatarProps {
  state: TurnState;
  isSpeaking: boolean;
  audioLevel?: number; // 0 - 100 for mouth movement modulation
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
  const [mouthOpen, setMouthOpen] = useState(0);
  const [blink, setBlink] = useState(false);
  const [headTilt, setHeadTilt] = useState({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);

  // Beyond Presence agent ID or custom URL from props or env
  const agentId =
    beyondPresenceAgentId ||
    process.env.NEXT_PUBLIC_BEYOND_PRESENCE_AGENT_ID ||
    '';

  const customUrl =
    beyondPresenceUrl ||
    process.env.NEXT_PUBLIC_BEYOND_PRESENCE_URL ||
    '';

  const hasLiveBeyondPresenceFeed = Boolean(agentId || customUrl);
  const [viewMode, setViewMode] = useState<'native' | 'beyond'>('native');

  const computedEmbedUrl = customUrl
    ? customUrl
    : agentId
    ? `https://bey.chat/${agentId}?transparent=1`
    : '';

  // Natural blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 3800 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Subtle natural head movement & breathing
  useEffect(() => {
    let t = 0;
    const animateHead = () => {
      t += 0.03;
      if (state === 'listening') {
        // Attentive slight nod/lean
        setHeadTilt({
          x: Math.sin(t * 0.8) * 2,
          y: Math.sin(t * 1.2) * 3 - 2,
        });
      } else if (state === 'speaking') {
        // Natural speech rhythm
        setHeadTilt({
          x: Math.sin(t * 1.5) * 3.5,
          y: Math.cos(t * 1.1) * 2.5,
        });
      } else if (state === 'rescue') {
        // Leaning in supportively
        setHeadTilt({
          x: Math.sin(t * 0.5) * 1.5,
          y: 6,
        });
      } else {
        // Gentle idle drift
        setHeadTilt({
          x: Math.sin(t * 0.5) * 1.5,
          y: Math.cos(t * 0.4) * 1.2,
        });
      }
      animFrameRef.current = requestAnimationFrame(animateHead);
    };

    animFrameRef.current = requestAnimationFrame(animateHead);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [state]);

  // Lip-sync / Mouth opening dynamics
  useEffect(() => {
    if (!isSpeaking) {
      setMouthOpen(0);
      return;
    }

    const interval = setInterval(() => {
      const dynamicLevel = audioLevel > 5 ? audioLevel / 100 : Math.random() * 0.7 + 0.25;
      setMouthOpen(Math.min(1, Math.max(0.18, dynamicLevel)));
    }, 100);

    return () => clearInterval(interval);
  }, [isSpeaking, audioLevel]);

  // Status badge styling
  const getStatusBadge = () => {
    switch (state) {
      case 'speaking':
        return { text: 'Speaking', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'listening':
        return { text: 'Listening…', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 animate-pulse' };
      case 'processing':
        return { text: 'Thinking…', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
      case 'rescue':
        return { text: '🛟 Rescue Scaffolding', color: 'bg-amber-500/30 text-amber-200 border-amber-500/40 animate-bounce' };
      case 'drill':
        return { text: '⚡ Micro-Drill', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      default:
        return { text: 'Ready', color: 'bg-gray-800 text-gray-400 border-gray-700' };
    }
  };

  const status = getStatusBadge();

  // Glow ring color based on state
  const getGlowBorder = () => {
    if (state === 'rescue') return 'border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_50px_rgba(251,191,36,0.25)]';
    if (state === 'speaking') return 'border-emerald-400 ring-2 ring-emerald-400/50 shadow-[0_0_40px_rgba(52,211,153,0.25)]';
    if (state === 'listening') return 'border-cyan-400/80 ring-1 ring-cyan-400/30 shadow-[0_0_30px_rgba(34,211,238,0.2)]';
    if (state === 'processing') return 'border-indigo-400/80 ring-1 ring-indigo-400/30';
    return 'border-gray-800 shadow-[0_0_20px_rgba(0,0,0,0.5)]';
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden">
      {/* Beyond Presence Live Feed (if toggled by user) */}
      {hasLiveBeyondPresenceFeed && computedEmbedUrl && viewMode === 'beyond' ? (
        <div className="w-full h-full relative rounded-2xl overflow-hidden bg-black flex items-center justify-center">
          <iframe
            src={computedEmbedUrl}
            title="Beyond Presence AI Avatar"
            allow="camera; microphone; display-capture; autoplay"
            className="w-full h-full border-none object-cover"
          />

          {/* Top-Right Toggle back to Native Avatar */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <button
              onClick={() => setViewMode('native')}
              className="px-3 py-1.5 rounded-full bg-violet-950/90 hover:bg-violet-900 border border-violet-500/50 text-xs font-semibold text-violet-200 flex items-center gap-1.5 backdrop-blur-md shadow-lg transition-all"
            >
              <span>🎓</span>
              <span>Switch to Interactive Avatar</span>
            </button>
          </div>
        </div>
      ) : (
        /* Permanent Beyond Presence Avatar Stage (Full Google Meet Speaker View) */
        <div
          className={`relative w-full h-full rounded-2xl border transition-all duration-500 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-slate-900/90 to-gray-950 overflow-hidden ${getGlowBorder()}`}
        >
          {/* Studio Lighting Backdrop */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-900/25 via-gray-950/70 to-black pointer-events-none" />

          {/* Active Speaker Ambient Aura */}
          <div
            className={`absolute w-96 h-96 rounded-full opacity-30 blur-3xl transition-all duration-700 pointer-events-none ${
              state === 'rescue'
                ? 'bg-amber-500/40'
                : state === 'speaking'
                ? 'bg-emerald-500/40 scale-110'
                : state === 'listening'
                ? 'bg-cyan-500/30'
                : 'bg-violet-600/25'
            }`}
          />

          {/* Large High-Definition Scalable Human Coach Avatar */}
          <div
            className="relative w-full max-w-lg aspect-square flex items-center justify-center transition-transform duration-200 ease-out"
            style={{
              transform: `translate(${headTilt.x}px, ${headTilt.y}px)`,
            }}
          >
            <svg
              viewBox="0 0 240 240"
              className="w-full h-full max-h-[480px] drop-shadow-2xl"
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

              {/* Shoulders & Suit Jacket */}
              <path
                d="M20 240 C28 175, 70 162, 120 162 C170 162, 212 175, 220 240 Z"
                fill="url(#blazerGrad)"
              />
              {/* White Collar / Shirt */}
              <polygon points="120,162 98,195 142,195" fill="url(#shirtGrad)" />
              {/* Modern Purple Tie */}
              <polygon points="115,190 125,190 128,236 120,240 112,236" fill="url(#tieGrad)" />

              {/* Neck */}
              <rect x="105" y="136" width="30" height="34" rx="4" fill="#f59e0b" />

              {/* Head Contour */}
              <ellipse cx="120" cy="112" rx="46" ry="54" fill="url(#skinGrad)" />

              {/* Modern Professional Hair Cut */}
              <path
                d="M71 106 C69 60, 98 46, 120 46 C146 46, 171 60, 169 106 C166 82, 146 65, 120 65 C94 65, 74 82, 71 106 Z"
                fill="url(#hairGrad)"
              />
              <path d="M71 103 L73 125 L77 114 Z" fill="url(#hairGrad)" />
              <path d="M169 103 L167 125 L163 114 Z" fill="url(#hairGrad)" />

              {/* Eyebrows */}
              {state === 'rescue' ? (
                <>
                  <path d="M88 95 Q102 88 111 93" stroke="#0f172a" strokeWidth="3.2" strokeLinecap="round" />
                  <path d="M129 93 Q138 88 152 95" stroke="#0f172a" strokeWidth="3.2" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <path d="M89 92 Q102 90 112 93" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
                  <path d="M128 93 Q138 90 151 92" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
                </>
              )}

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

              {/* Glasses Frames */}
              <rect x="87" y="96" width="28" height="19" rx="5" fill="none" stroke="#6366f1" strokeWidth="2.6" />
              <rect x="125" y="96" width="28" height="19" rx="5" fill="none" stroke="#6366f1" strokeWidth="2.6" />
              <line x1="115" y1="105" x2="125" y2="105" stroke="#6366f1" strokeWidth="2.6" />

              {/* Subtle Nose */}
              <path d="M118 114 L116 125 L123 125" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" fill="none" />

              {/* Animated Mouth (Speaking Lip-Sync) */}
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
                  <ellipse
                    cx="120"
                    cy={137 + mouthOpen * 3.5}
                    rx={12 + mouthOpen * 4}
                    ry={4 + mouthOpen * 10}
                    fill="none"
                    stroke="#b45309"
                    strokeWidth="2"
                  />
                </g>
              ) : state === 'rescue' ? (
                <path
                  d="M109 136 Q120 144 131 136"
                  stroke="#92400e"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  fill="none"
                />
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

          {/* Top-Right Tag & Optional Beyond Presence Toggle */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            {hasLiveBeyondPresenceFeed && computedEmbedUrl ? (
              <button
                onClick={() => setViewMode('beyond')}
                className="px-3 py-1 rounded-full bg-gray-900/90 hover:bg-gray-800 border border-gray-700/80 text-[11px] font-semibold text-gray-200 hover:text-white flex items-center gap-1.5 backdrop-blur-md shadow-lg transition-all"
                title="Switch to Beyond Presence video stream"
              >
                <span>🎥</span>
                <span>Beyond Presence Stream</span>
              </button>
            ) : (
              <span className="px-3 py-1 rounded-full bg-violet-950/80 border border-violet-500/40 text-[11px] font-semibold text-violet-300 flex items-center gap-1.5 backdrop-blur-md shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                AI Interview Coach
              </span>
            )}
          </div>
        </div>
      )}

      {/* Participant Name Tag (Google Meet Style) */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-950/80 border border-gray-800/80 backdrop-blur-md shadow-lg">
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
