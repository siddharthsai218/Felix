'use client';

import React, { useState, useEffect } from 'react';
import type { DrillSpec } from '../lib/types';

interface DrillModalProps {
  isOpen: boolean;
  drill: DrillSpec | null;
  onStartDrill: (drillId: string) => void;
  onCancel: () => void;
}

export const DrillModal: React.FC<DrillModalProps> = ({
  isOpen,
  drill,
  onStartDrill,
  onCancel,
}) => {
  if (!isOpen || !drill) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg p-6 rounded-3xl bg-gray-900 border border-violet-500/40 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-2xl shadow-lg shadow-violet-500/30">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
                Targeted Micro-Drill
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {drill.timeLimitSeconds}s Sprint
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">Practice Weak Area</h3>
          </div>
        </div>

        {/* Learning Outcome */}
        <div className="mb-4 p-3.5 rounded-xl bg-violet-950/40 border border-violet-800/40 text-xs">
          <span className="text-gray-400 font-medium block mb-1">Target Learning Outcome:</span>
          <p className="text-violet-200 font-semibold">{drill.targetLearningOutcome}</p>
        </div>

        {/* Drill Question Preview */}
        <div className="mb-5 p-4 rounded-xl bg-gray-950 border border-gray-800 text-sm">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
            Drill Challenge:
          </span>
          <p className="text-gray-100 font-medium italic">"{drill.question}"</p>
        </div>

        {/* Hints */}
        {drill.hints && drill.hints.length > 0 && (
          <div className="mb-6 space-y-1.5">
            <span className="text-xs font-semibold text-gray-400">Quick Tips for Retry:</span>
            <ul className="text-xs text-gray-300 space-y-1 pl-4 list-disc marker:text-violet-400">
              {drill.hints.map((hint, idx) => (
                <li key={idx}>{hint}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            type="button"
            className="flex-1 py-3 px-4 rounded-xl border border-gray-700 bg-gray-800/80 hover:bg-gray-700 text-gray-300 font-medium text-sm transition-colors"
          >
            Review Later
          </button>
          <button
            onClick={() => onStartDrill(drill.drillId)}
            type="button"
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2"
          >
            <span>Start 30s Retry</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
