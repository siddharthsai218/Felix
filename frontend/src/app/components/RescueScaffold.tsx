'use client';

import React from 'react';

interface RescueScaffoldProps {
  isActive: boolean;
  message: string;
  onDismiss?: () => void;
}

export const RescueScaffold: React.FC<RescueScaffoldProps> = ({
  isActive,
  message,
  onDismiss,
}) => {
  if (!isActive) return null;

  return (
    <div className="w-full max-w-xl mx-auto my-3 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="relative p-5 rounded-2xl bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-2 border-amber-500/50 shadow-2xl backdrop-blur-md">
        {/* Glow accent */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-ping" />

        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-2xl border border-amber-500/30 flex-shrink-0">
            🛟
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Rescue Mode Activated
                </span>
                <span className="text-[10px] text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  Pedagogical Scaffolding
                </span>
              </div>
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-gray-400 hover:text-white text-xs transition-colors"
                >
                  ✕
                </button>
              )}
            </div>

            <p className="text-sm font-medium text-amber-100 leading-relaxed">
              "{message}"
            </p>

            <div className="mt-3 flex items-center gap-3 text-xs text-amber-300/80">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Take a breath — speak whenever you're ready
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
