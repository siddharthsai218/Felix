'use client';

import React from 'react';

interface CoachPanelProps {
  isOpen: boolean;
  hint: string | null;
  isLoading: boolean;
  onRequestHint: () => void;
  onClose: () => void;
}

export const CoachPanel: React.FC<CoachPanelProps> = ({
  isOpen,
  hint,
  isLoading,
  onRequestHint,
  onClose,
}) => {
  if (!isOpen) {
    return (
      <button
        onClick={onRequestHint}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-600/30 hover:bg-violet-600/40 border border-violet-500/40 text-violet-200 text-xs font-medium transition-all shadow-lg hover:shadow-violet-500/20"
      >
        <span>💡</span>
        <span>Need a hint? (Coach Mode)</span>
      </button>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto my-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="p-4 rounded-2xl bg-gray-900/90 border border-violet-500/30 backdrop-blur-md shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">💡</span>
            <h4 className="text-sm font-semibold text-violet-300">Coach Mode — STAR Guidance</h4>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded transition-colors"
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 py-4 text-xs text-gray-400 justify-center">
            <span className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            <span>Consulting interview coach…</span>
          </div>
        ) : hint ? (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-violet-950/40 border border-violet-800/30 text-xs text-gray-200 whitespace-pre-line leading-relaxed">
              {hint}
            </div>

            {/* Quick STAR Cheatsheet */}
            <div className="grid grid-cols-4 gap-1.5 text-[11px] text-center pt-1 border-t border-gray-800">
              <div className="p-1.5 rounded bg-gray-800/60">
                <span className="font-bold text-violet-400 block">S</span>
                <span className="text-gray-400 text-[10px]">Situation</span>
              </div>
              <div className="p-1.5 rounded bg-gray-800/60">
                <span className="font-bold text-indigo-400 block">T</span>
                <span className="text-gray-400 text-[10px]">Task</span>
              </div>
              <div className="p-1.5 rounded bg-gray-800/60">
                <span className="font-bold text-cyan-400 block">A</span>
                <span className="text-gray-400 text-[10px]">Action</span>
              </div>
              <div className="p-1.5 rounded bg-gray-800/60">
                <span className="font-bold text-emerald-400 block">R</span>
                <span className="text-gray-400 text-[10px]">Result</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-2 text-center">
            <button
              onClick={onRequestHint}
              className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
            >
              Get Instant Hint
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
