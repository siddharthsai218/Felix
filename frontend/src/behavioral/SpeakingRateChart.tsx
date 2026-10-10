'use client';

import React, { useMemo } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { ProsodySignal } from './types';
import { MOCK_SIGNAL_RECORD } from './mockData';

// ─── Props ──────────────────────────────────────────────────────────

export interface SpeakingRateChartProps {
  prosody?: ProsodySignal;
  speakingRateWpm?: number;
  pauseSegments?: any[];
  /** Total response duration in seconds (derived from timestamps if omitted) */
  durationS?: number;
  className?: string;
}

// ─── Optimal range constants ────────────────────────────────────────

const OPTIMAL_LOW = 120;
const OPTIMAL_HIGH = 160;

// ─── Component ──────────────────────────────────────────────────────

export default function SpeakingRateChart({
  prosody = MOCK_SIGNAL_RECORD.prosody,
  speakingRateWpm,
  pauseSegments,
  durationS,
  className = '',
}: SpeakingRateChartProps) {
  // Derive a speaking-rate proxy from the pitch contour:
  // Use a rolling window that maps pitch activity to an approximate WPM.
  // In production the server would provide per-window WPM from STT timestamps.
  const data = useMemo(() => {
    const contour = prosody.pitch_contour;
    if (!contour.length) return [];

    const windowSize = 10; // 10 samples ≈ 1 second at 0.1 s steps
    const meanWpm = prosody.speaking_rate_wpm;

    return contour.map((pt, i) => {
      // Simple rolling variance of pitch as proxy for articulation rate
      const start = Math.max(0, i - windowSize);
      const slice = contour.slice(start, i + 1);
      const mean = slice.reduce((s, p) => s + p.hz, 0) / slice.length;
      const variance = slice.reduce((s, p) => s + (p.hz - mean) ** 2, 0) / slice.length;
      // More pitch variation → faster speech (rough heuristic for demo)
      const rateOffset = (Math.sqrt(variance) / prosody.pitch_std_hz - 1) * 15;
      const wpm = Math.max(60, Math.min(220, meanWpm + rateOffset + (Math.random() - 0.5) * 6));

      // Check if this time falls in a pause
      const inPause = prosody.pause_segments.some(
        (p) => pt.time_s >= p.start_s && pt.time_s <= p.end_s,
      );

      return {
        time: Math.round(pt.time_s * 10) / 10,
        wpm: Math.round(wpm),
        pause: inPause ? OPTIMAL_HIGH + 10 : null,
        optLow: OPTIMAL_LOW,
        optHigh: OPTIMAL_HIGH,
      };
    });
  }, [prosody]);

  const maxTime = durationS ?? (data.length > 0 ? data[data.length - 1].time : 45);

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">Speaking Rate</h3>
          <p className="text-xs text-slate-400">Words per minute over time</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1">
          <span className="text-xl font-bold text-teal-700">{prosody.speaking_rate_wpm}</span>
          <span className="text-xs text-teal-500">WPM avg</span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
          <defs>
            <linearGradient id="wpmGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="time"
            type="number"
            domain={[0, maxTime]}
            tickFormatter={(v: number) => `${v}s`}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            domain={[60, 220]}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={{ stroke: '#e2e8f0' }}
            label={{
              value: 'WPM',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 11, fill: '#94a3b8' },
            }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              fontSize: 12,
            }}
            labelFormatter={(v: any) => `${v}s`}
            formatter={(value: any, name: any) => {
              if (name === 'wpm') return [`${value} WPM`, 'Speaking Rate'];
              return [value, name];
            }}
          />

          {/* Optimal range band */}
          <ReferenceArea
            y1={OPTIMAL_LOW}
            y2={OPTIMAL_HIGH}
            fill="#10b981"
            fillOpacity={0.06}
            stroke="none"
          />
          <ReferenceLine
            y={OPTIMAL_LOW}
            stroke="#10b981"
            strokeDasharray="4 4"
            strokeOpacity={0.4}
          />
          <ReferenceLine
            y={OPTIMAL_HIGH}
            stroke="#10b981"
            strokeDasharray="4 4"
            strokeOpacity={0.4}
          />

          {/* Pause highlight areas */}
          {prosody.pause_segments.map((seg, i) => (
            <ReferenceArea
              key={i}
              x1={seg.start_s}
              x2={seg.end_s}
              fill="#f59e0b"
              fillOpacity={0.12}
              stroke="#f59e0b"
              strokeOpacity={0.3}
              strokeDasharray="3 3"
              label={{
                value: '💭',
                position: 'insideTop',
                style: { fontSize: 14 },
              }}
            />
          ))}

          {/* WPM line */}
          <Area
            type="monotone"
            dataKey="wpm"
            stroke="#14b8a6"
            strokeWidth={2}
            fill="url(#wpmGradient)"
            dot={false}
            animationDuration={1200}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend / coaching note */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-200" />
          Optimal range ({OPTIMAL_LOW}–{OPTIMAL_HIGH} WPM)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-200" />
          Reflection moments (pauses)
        </span>
      </div>
    </div>
  );
}

export { SpeakingRateChart };
