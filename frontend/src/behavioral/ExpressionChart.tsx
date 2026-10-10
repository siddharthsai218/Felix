'use client';

import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { FacialSignal } from './types';
import { mockSignalRecord } from './mockData';

interface ExpressionChartProps {
  facial?: FacialSignal;
}

export const ExpressionChart: React.FC<ExpressionChartProps> = ({
  facial = mockSignalRecord.facial,
}) => {
  const chartData = Object.entries(facial.expression_distribution).map(([expr, frac]: [string, any]) => ({
    expression: expr.charAt(0).toUpperCase() + expr.slice(1),
    percentage: Math.round(Number(frac) * 100),
  }));

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Py-feat Expression & Action Units</h3>
          <p className="text-xs text-slate-500">Non-verbal facial cues and engagement distribution</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 capitalize">
          Dominant: {facial.dominant_expression}
        </span>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" unit="%" domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis type="category" dataKey="expression" tick={{ fontSize: 11, fill: '#475569' }} />
            <Tooltip
              formatter={(val: any) => [`${val}%`, 'Time Active']}
              contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
            />
            <Bar dataKey="percentage" fill="#14b8a6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
        <span><strong>AU01 (Inner Brow):</strong> {facial.au_means['AU01'] ?? 0.2}</span>
        <span><strong>AU06 (Cheek Raiser):</strong> {facial.au_means['AU06'] ?? 0.4}</span>
        <span><strong>AU12 (Lip Corner Puller):</strong> {facial.au_means['AU12'] ?? 0.5}</span>
      </div>
    </div>
  );
};
