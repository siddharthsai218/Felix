'use client';

import React from 'react';
import { Anomaly } from './types';
import { mockSignalRecord } from './mockData';

interface AnomalyTimelineProps {
  anomalies?: Anomaly[];
}

export const AnomalyTimeline: React.FC<AnomalyTimelineProps> = ({
  anomalies = mockSignalRecord.anomalies,
}) => {
  const getBadgeStyle = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'low':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Targeted Coaching Moments</h3>
          <p className="text-xs text-slate-500">
            Temporally correlated moments where delivery technique can be polished
          </p>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
          {anomalies.length} Moments Flagged
        </span>
      </div>

      <div className="space-y-3">
        {anomalies.map((item: Anomaly, index: number) => (
          <div
            key={index}
            className="flex items-start gap-3.5 p-3.5 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors"
          >
            <div className="mt-0.5">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border uppercase ${getBadgeStyle(item.severity)}`}>
                {item.type.replace('_', ' ')}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-semibold text-slate-700">Timestamp: {item.time_s.toFixed(1)}s</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
