'use client';

import React from 'react';
import Link from 'next/link';
import type { LearnerProgression } from '../app/lib/history-store';

interface LearnerProgressionCardProps {
  progression: LearnerProgression | null | undefined;
  learnerName?: string;
  className?: string;
}

export function LearnerProgressionCard({
  progression,
  learnerName = 'Candidate',
  className = '',
}: LearnerProgressionCardProps) {
  if (!progression) return null;

  const isImproved = progression.trend === 'improved';
  const isSteady = progression.trend === 'steady';
  const isDipped = progression.trend === 'needs_calibration';

  return (
    <div
      className={`rounded-2xl bg-gradient-to-br from-[#0c1424] via-[#0d131f] to-[#141b2d] border border-slate-800/90 p-5 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden ${className}`}
    >
      {/* Decorative gradient glow */}
      <div
        className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20 ${
          isImproved ? 'bg-emerald-500' : isDipped ? 'bg-amber-500' : 'bg-cyan-500'
        }`}
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shadow-md ${
              isImproved
                ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                : isDipped
                ? 'bg-amber-950/80 border border-amber-500/40 text-amber-300'
                : 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-300'
            }`}
          >
            {isImproved ? '📈' : isDipped ? '📉' : '📊'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-cyan-400">
                LONGITUDINAL MASTERY COMPARISON
              </span>
              <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.2 rounded bg-slate-800">
                Learner: {learnerName}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Progress & Growth vs. Previous Rehearsal
            </h3>
          </div>
        </div>

        {/* Delta Badge */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <div
            className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border flex items-center gap-1.5 ${
              isImproved
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : isDipped
                ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-300'
            }`}
          >
            <span>{isImproved ? '▲' : isDipped ? '▼' : '●'}</span>
            <span>
              {progression.scoreDelta > 0
                ? `+${progression.scoreDelta.toFixed(1)} Mastery Growth`
                : progression.scoreDelta < 0
                ? `${progression.scoreDelta.toFixed(1)} Score Dip`
                : 'Steady Baseline'}
            </span>
          </div>

          {progression.priorSessionId && (
            <Link
              href={`/session/report?sessionId=${progression.priorSessionId}&fromHistory=true`}
              className="text-[11px] font-mono text-violet-400 hover:text-violet-300 bg-violet-950/50 hover:bg-violet-900/50 px-2.5 py-1 rounded-lg border border-violet-800/40 transition-colors hidden md:inline-block"
            >
              Compare Prior Report →
            </Link>
          )}
        </div>
      </div>

      {/* Main Score Comparison Visual */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
        {/* Prior Score */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">
            Previous Attempt
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-400">
            {progression.priorOverallScore !== undefined
              ? progression.priorOverallScore.toFixed(1)
              : '—'}{' '}
            <span className="text-xs text-slate-600 font-normal">/ 5.0</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            {progression.priorRoleTitle || 'Prior baseline session'}
          </p>
        </div>

        {/* Current Score */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">
            Current Attempt
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-white flex items-baseline gap-1.5">
            <span className={isImproved ? 'text-emerald-400' : isDipped ? 'text-amber-400' : 'text-cyan-400'}>
              {progression.currentOverallScore.toFixed(1)}
            </span>
            <span className="text-xs text-slate-600 font-normal">/ 5.0</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {isImproved
              ? 'Visible upward trajectory'
              : isDipped
              ? 'Needs structural focus'
              : 'Consistent delivery'}
          </p>
        </div>

        {/* Longitudinal Trajectory Status */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">
            Mastery Trend
          </span>
          <div className="text-sm sm:text-base font-bold font-mono text-slate-200 mt-1 flex items-center gap-1.5">
            <span>{isImproved ? '🚀 Leveled Up' : isDipped ? '⚠️ Calibration Needed' : '🎯 Maintained Baseline'}</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {isImproved
              ? 'STAR clarity & technical ownership strengthened'
              : isDipped
              ? 'Informal pacing deducted points'
              : 'Metrics and cadence held steady'}
          </p>
        </div>
      </div>

      {/* AI Formative Commentary */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed space-y-2 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-400">
            AI Formative Feedback & Progression Commentary
          </span>
        </div>
        <p className="text-slate-300 text-xs leading-relaxed">
          {progression.feedbackCommentary}
        </p>

        {/* Growth Highlights */}
        {progression.growthHighlights && progression.growthHighlights.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
            {progression.growthHighlights.map((hl, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300 font-mono">
                <span className="text-emerald-400 shrink-0">✓</span>
                <span>{hl}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
