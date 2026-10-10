'use client';

import React from 'react';
import { PauseSegment } from './types';
import { mockSignalRecord } from './mockData';

interface PauseTimelineProps {
  pauseSegments?: PauseSegment[];
  totalResponseDurationS?: number;
}

export const PauseTimeline: React.FC<PauseTimelineProps> = ({
  pauseSegments = mockSignalRecord.prosody.pause_segments,
  totalResponseDurationS = 30.0,
}) => {
  const totalPauseDuration = pauseSegments.reduce((sum, p) => sum + p.duration_s, 0);

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Pause & Hesitation Timeline</h3>
          <p className="text-xs text-slate-500">
            {pauseSegments.length} reflection moments totaling {totalPauseDuration.toFixed(1)}s
          </p>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
          Coaching Cue
        </span>
      </div>

      {/* Progress track */}
      <div className="relative w-full h-8 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
        {pauseSegments.map((segment, idx) => {
          const leftPct = (segment.start_s / totalResponseDurationS) * 100;
          const widthPct = (segment.duration_s / totalResponseDurationS) * 100;
          const isLong = segment.duration_s >= 3.0;

          return (
            <div
              key={idx}
              title={`Pause: ${segment.duration_s.toFixed(1)}s (at ${segment.start_s.toFixed(1)}s)`}
              className={`absolute top-0 bottom-0 flex items-center justify-center text-[10px] font-bold text-white transition-opacity hover:opacity-80 cursor-pointer ${
                isLong ? 'bg-amber-500' : 'bg-amber-400'
              }`}
              style={{
                left: `${leftPct}%`,
                width: `${Math.max(widthPct, 2)}%`,
              }}
            >
              {segment.duration_s >= 2.0 && `${segment.duration_s.toFixed(1)}s`}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between text-[11px] text-slate-400 mt-2">
        <span>0s (Start)</span>
        <span>15s</span>
        <span>{totalResponseDurationS.toFixed(0)}s (End)</span>
      </div>

      <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
        💡 <strong>Coaching insight:</strong> Pausing 1–2 seconds before answering demonstrates deliberate thought. Pauses over 3 seconds are great places to practice linking phrases like <em>"A key factor to consider here is..."</em>.
      </div>
    </div>
  );
};
