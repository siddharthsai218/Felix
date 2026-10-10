'use client';

import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { GazeSignal } from './types';
import { mockSignalRecord } from './mockData';

interface GazeChartProps {
  gaze?: GazeSignal;
}

const COLORS: Record<string, string> = {
  center: '#0284c7', // Sky-600
  left: '#94a3b8',   // Slate-400
  right: '#64748b',  // Slate-500
  up: '#cbd5e1',     // Slate-300
  down: '#475569',   // Slate-600
};

export const GazeChart: React.FC<GazeChartProps> = ({
  gaze = mockSignalRecord.gaze,
}) => {
  // Aggregate gaze timeline directions
  const directionCounts: Record<string, number> = {};
  gaze.gaze_direction_timeline.forEach((pt) => {
    directionCounts[pt.direction] = (directionCounts[pt.direction] || 0) + 1;
  });

  const pieData = Object.entries(directionCounts).map(([dir, count]) => ({
    name: dir.toUpperCase(),
    value: count,
    color: COLORS[dir] || '#94a3b8',
  }));

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">MediaPipe Gaze & Eye Contact</h3>
          <p className="text-xs text-slate-500">Camera orientation and visual engagement patterns</p>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-sky-600">{gaze.eye_contact_pct.toFixed(0)}%</span>
          <span className="text-xs text-slate-400 block">Camera Focus</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 items-center">
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={40}
                outerRadius={65}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2 text-xs">
          {pieData.map((d) => (
            <div key={d.name} className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name}
              </span>
              <span className="font-semibold text-slate-800">{d.value} frames</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
        Looking slightly away while accessing recall is completely normal. Maintaining roughly 50–70% focus towards the lens conveys attentiveness.
      </div>
    </div>
  );
};
