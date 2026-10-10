'use client';

import React from 'react';
import type { StatItem } from './types';

// ─── Props ──────────────────────────────────────────────────────────

export interface StatCardProps {
  /** Label displayed above the value */
  label: string;
  /** Primary value to display */
  value: string | number;
  /** Optional unit shown after the value */
  unit?: string;
  /** Emoji or icon character shown to the left */
  icon?: string;
  /** Optional coaching tooltip shown on hover */
  coachingTip?: string;
  /** Trend direction indicator */
  trend?: 'up' | 'down' | 'neutral';
  /** Optional label next to the trend arrow */
  trendLabel?: string;
  /** Additional Tailwind classes */
  className?: string;
}

// ─── Trend Arrow ────────────────────────────────────────────────────

function TrendIndicator({ trend, label }: { trend: 'up' | 'down' | 'neutral'; label?: string }) {
  const arrows: Record<string, string> = { up: '↑', down: '↓', neutral: '→' };
  const colors: Record<string, string> = {
    up: 'text-emerald-500',
    down: 'text-amber-500',
    neutral: 'text-slate-400',
  };
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${colors[trend]}`}>
      <span className="text-sm">{arrows[trend]}</span>
      {label && <span>{label}</span>}
    </span>
  );
}

// ─── Component ──────────────────────────────────────────────────────

export default function StatCard({
  label,
  value,
  unit,
  icon,
  coachingTip,
  trend,
  trendLabel,
  className = '',
}: StatCardProps) {
  return (
    <div
      className={`group relative rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md ${className}`}
      title={coachingTip}
    >
      {/* Icon */}
      {icon && (
        <span className="mb-1 block text-2xl" aria-hidden="true">
          {icon}
        </span>
      )}

      {/* Label */}
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>

      {/* Value row */}
      <div className="mt-1 flex items-end gap-1.5">
        <span className="text-3xl font-bold text-slate-900">{value}</span>
        {unit && <span className="mb-0.5 text-sm font-medium text-slate-400">{unit}</span>}
      </div>

      {/* Trend */}
      {trend && (
        <div className="mt-1.5">
          <TrendIndicator trend={trend} label={trendLabel} />
        </div>
      )}

      {/* Coaching tooltip — visible on hover */}
      {coachingTip && (
        <div className="pointer-events-none absolute -top-2 left-1/2 z-10 w-56 -translate-x-1/2 -translate-y-full rounded-lg bg-slate-800 px-3 py-2 text-xs leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          <span className="mb-0.5 block font-semibold text-teal-300">💡 Coaching Insight</span>
          {coachingTip}
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-4 border-transparent border-t-slate-800" />
        </div>
      )}
    </div>
  );
}

// ─── Convenience helper ─────────────────────────────────────────────

/** Render a StatCard from a StatItem object */
export function StatCardFromItem({ item, className }: { item: StatItem; className?: string }) {
  return <StatCard {...item} className={className} />;
}
