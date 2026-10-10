'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { PitchPoint } from './types';
import { mockSignalRecord } from './mockData';

interface PitchContourChartProps {
  pitchContour?: PitchPoint[];
  pitchMeanHz?: number;
  jitterPercent?: number;
  shimmerPercent?: number;
}

export const PitchContourChart: React.FC<PitchContourChartProps> = ({
  pitchContour = mockSignalRecord.prosody.pitch_contour,
  pitchMeanHz = mockSignalRecord.prosody.pitch_mean_hz,
  jitterPercent = mockSignalRecord.prosody.jitter_percent,
  shimmerPercent = mockSignalRecord.prosody.shimmer_percent,
}) => {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Pitch & Vocal Stability (F0)</h3>
          <p className="text-xs text-slate-500">
            Parselmouth fundamental frequency with cycle-to-cycle perturbation
          </p>
        </div>
        <div className="flex gap-2">
          <span className="text-xs font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
            Jitter: {jitterPercent.toFixed(2)}%
          </span>
          <span className="text-xs font-medium px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
            Shimmer: {shimmerPercent.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={pitchContour} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="time_s"
              unit="s"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              stroke="#cbd5e1"
            />
            <YAxis
              unit="Hz"
              domain={['auto', 'auto']}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              stroke="#cbd5e1"
            />
            <Tooltip
              formatter={(value: any) => [`${Number(value).toFixed(1)} Hz`, 'Pitch']}
              labelFormatter={(label) => `Time: ${label}s`}
              contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
            />
            <ReferenceLine
              y={pitchMeanHz}
              stroke="#3b82f6"
              strokeDasharray="4 4"
              label={{
                value: `Mean (${pitchMeanHz.toFixed(0)} Hz)`,
                fill: '#3b82f6',
                fontSize: 10,
                position: 'insideTopLeft',
              }}
            />
            <Line
              type="monotone"
              dataKey="hz"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 text-xs text-slate-500">
        A steady pitch contour indicates relaxed vocal delivery. Variations are natural for emphasis and engagement.
      </div>
    </div>
  );
};
