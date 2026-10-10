'use client';

import React, { useEffect, useState, useRef } from 'react';
import type { TurnState } from '../lib/types';

interface AvatarProps {
  state: TurnState;
  isSpeaking: boolean;
  audioLevel?: number; // 0 - 100 for mouth movement modulation
  captionText?: string;
  themeColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  state,
  isSpeaking,
  audioLevel = 0,
  captionText,
}) => {
  const [mouthOpen, setMouthOpen] = useState(0);
  const [blink, setBlink] = useState(false);
  const [headTilt, setHeadTilt] = useState({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);

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
          x: Math.sin(t * 0.8) * 1.5,
          y: Math.sin(t * 1.2) * 2.5 - 2,
        });
      } else if (state === 'speaking') {
        // Natural speech rhythm
        setHeadTilt({
          x: Math.sin(t * 1.5) * 2.2,
          y: Math.cos(t * 1.1) * 1.8,
        });
      } else if (state === 'rescue') {
        // Leaning in supportively
        setHeadTilt({
          x: Math.sin(t * 0.5) * 1.0,
          y: 4, // lean forward
        });
      } else {
        // Gentle idle drift
        setHeadTilt({
          x: Math.sin(t * 0.5) * 1.2,
          y: Math.cos(t * 0.4) * 1.0,
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

    // Modulate mouth opening based on audioLevel or simulated syllable oscillation
    const interval = setInterval(() => {
      const dynamicLevel = audioLevel > 5 ? audioLevel / 100 : Math.random() * 0.7 + 0.2;
      setMouthOpen(Math.min(1, Math.max(0.15, dynamicLevel)));
    }, 110);

    return () => clearInterval(interval);
  }, [isSpeaking, audioLevel]);

  // Status badge styling
  const getStatusBadge = () => {
    switch (state) {
      case 'speaking':
        return { text: 'Felix is speaking', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'listening':
        return { text: 'Felix is listening…', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 animate-pulse' };
      case 'processing':
        return { text: 'Felix is thinking…', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
      case 'rescue':
        return { text: '🛟 Rescue Mode Active', color: 'bg-amber-500/30 text-amber-200 border-amber-500/40 animate-bounce' };
      case 'drill':
        return { text: '⚡ Micro-Drill in Progress', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      default:
        return { text: 'Felix (Ready)', color: 'bg-gray-800 text-gray-400 border-gray-700' };
    }
  };

  const status = getStatusBadge();

  // Glow ring color based on state
  const getGlowColor = () => {
    if (state === 'rescue') return 'ring-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.35)]';
    if (state === 'speaking') return 'ring-emerald-400/80 shadow-[0_0_40px_rgba(52,211,153,0.3)]';
    if (state === 'listening') return 'ring-cyan-400/80 shadow-[0_0_40px_rgba(34,211,238,0.3)]';
    if (state === 'processing') return 'ring-indigo-400/80 shadow-[0_0_35px_rgba(129,140,248,0.3)]';
    return 'ring-violet-500/40 shadow-[0_0_25px_rgba(139,92,246,0.15)]';
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto select-none">
      {/* Outer Halo */}
      <div
        className={`relative w-64 h-64 sm:w-72 sm:h-72 rounded-full ring-4 transition-all duration-500 flex items-center justify-center bg-gradient-to-b from-gray-900 via-slate-900 to-gray-950 overflow-hidden ${getGlowColor()}`}
      >
        {/* Background Ambient Glow */}
        <div
          className={`absolute inset-0 rounded-full opacity-40 blur-2xl transition-all duration-700 ${
            state === 'rescue'
              ? 'bg-amber-500/40'
              : state === 'speaking'
              ? 'bg-emerald-500/30'
              : state === 'listening'
              ? 'bg-cyan-500/30'
              : 'bg-violet-600/20'
          }`}
        />

        {/* Scalable Vector Human Coach Avatar */}
        <div
          className="relative w-full h-full flex items-center justify-center transition-transform duration-150 ease-out"
          style={{
            transform: `translate(${headTilt.x}px, ${headTilt.y}px)`,
          }}
        >
          <svg
            viewBox="0 0 240 240"
            className="w-56 h-56 sm:w-64 sm:h-64 drop-shadow-2xl"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Defs / Gradients */}
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
              d="M30 240 C35 185, 75 168, 120 168 C165 168, 205 185, 210 240 Z"
              fill="url(#blazerGrad)"
            />
            {/* White Collar / Shirt */}
            <polygon points="120,168 100,195 140,195" fill="url(#shirtGrad)" />
            {/* Modern Purple Tie */}
            <polygon points="116,192 124,192 127,235 120,240 113,235" fill="url(#tieGrad)" />

            {/* Neck */}
            <rect x="105" y="140" width="30" height="32" rx="4" fill="#f59e0b" />

            {/* Head Contour */}
            <ellipse cx="120" cy="115" rx="45" ry="52" fill="url(#skinGrad)" />

            {/* Modern Professional Hair Cut */}
            <path
              d="M72 108 C70 65, 100 50, 120 50 C145 50, 170 65, 168 108 C165 85, 145 68, 120 68 C95 68, 75 85, 72 108 Z"
              fill="url(#hairGrad)"
            />
            {/* Hair Sideburns */}
            <path d="M72 105 L74 125 L78 115 Z" fill="url(#hairGrad)" />
            <path d="M168 105 L166 125 L162 115 Z" fill="url(#hairGrad)" />

            {/* Eyebrows — adjust dynamically during Rescue Mode */}
            {state === 'rescue' ? (
              // Reassuring, sympathetic arched brows
              <>
                <path d="M90 98 Q102 91 110 96" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
                <path d="M130 96 Q138 91 150 98" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
              </>
            ) : (
              // Focused professional brows
              <>
                <path d="M90 95 Q102 93 112 96" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
                <path d="M128 96 Q138 93 150 95" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
              </>
            )}

            {/* Eyes */}
            {blink ? (
              // Blinking line
              <>
                <line x1="92" y1="108" x2="110" y2="108" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="130" y1="108" x2="148" y2="108" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
              </>
            ) : (
              // Expressive eyes with pupil reflection
              <>
                {/* Left eye */}
                <ellipse cx="101" cy="107" rx="7" ry="5.5" fill="#ffffff" />
                <ellipse cx="102" cy="107" rx="3.5" ry="3.8" fill="#1e293b" />
                <circle cx="103.5" cy="105.5" r="1.3" fill="#ffffff" />

                {/* Right eye */}
                <ellipse cx="139" cy="107" rx="7" ry="5.5" fill="#ffffff" />
                <ellipse cx="138" cy="107" rx="3.5" ry="3.8" fill="#1e293b" />
                <circle cx="139.5" cy="105.5" r="1.3" fill="#ffffff" />
              </>
            )}

            {/* Glasses Frames (Adds warm academic/coach persona) */}
            <rect x="88" y="99" width="26" height="17" rx="4" fill="none" stroke="#6366f1" strokeWidth="2.5" />
            <rect x="126" y="99" width="26" height="17" rx="4" fill="none" stroke="#6366f1" strokeWidth="2.5" />
            <line x1="114" y1="107" x2="126" y2="107" stroke="#6366f1" strokeWidth="2.5" />

            {/* Subtle Nose */}
            <path d="M118 116 L116 126 L122 126" stroke="#d97706" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* Animated Mouth (Speaking Lip-Sync) */}
            {isSpeaking ? (
              // Open animated mouth with teeth & tongue
              <g>
                <ellipse
                  cx="120"
                  cy={138 + mouthOpen * 3}
                  rx={10 + mouthOpen * 4}
                  ry={3 + mouthOpen * 9}
                  fill="#7f1d1d"
                />
                {/* Upper teeth */}
                <path
                  d={`M ${114 - mouthOpen * 2} 136 Q 120 137 ${126 + mouthOpen * 2} 136 Z`}
                  fill="#ffffff"
                />
                {/* Lip outline */}
                <ellipse
                  cx="120"
                  cy={138 + mouthOpen * 3}
                  rx={11 + mouthOpen * 4}
                  ry={3.5 + mouthOpen * 9}
                  fill="none"
                  stroke="#b45309"
                  strokeWidth="1.8"
                />
              </g>
            ) : state === 'rescue' ? (
              // Warm reassuring slight smile
              <path
                d="M110 137 Q120 144 130 137"
                stroke="#92400e"
                strokeWidth="2.6"
                strokeLinecap="round"
                fill="none"
              />
            ) : (
              // Neutral resting expression
              <path
                d="M112 139 Q120 141 128 139"
                stroke="#92400e"
                strokeWidth="2.4"
                strokeLinecap="round"
                fill="none"
              />
            )}
          </svg>
        </div>

        {/* Live Audio Waves radiating during speech */}
        {isSpeaking && (
          <div className="absolute inset-0 rounded-full border border-emerald-400/50 animate-ping opacity-30 pointer-events-none" />
        )}
      </div>

      {/* Dynamic Status Indicator Pill */}
      <div className="mt-4 flex items-center justify-center">
        <span
          className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 ${status.color}`}
        >
          {status.text}
        </span>
      </div>

      {/* Live Avatar Captions (if provided) */}
      {captionText && (
        <div className="mt-3 px-4 py-2 rounded-xl bg-gray-900/90 border border-gray-800 text-center text-sm text-gray-200 max-w-sm shadow-lg backdrop-blur-sm">
          <p className="italic font-sans">"{captionText}"</p>
        </div>
      )}
    </div>
  );
};
