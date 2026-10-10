'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AnswerTransformer, type StarResponseTransformation } from './AnswerTransformer';

export interface RubricScoreItem {
  criterion: string;
  score: number;
  feedback: string;
  quotes: Array<{ text: string; time: string }>;
}

export interface BehavioralInsightItem {
  icon: string;
  title: string;
  text: string;
  metric?: string;
  status?: 'optimal' | 'attention';
}

export interface RemediationPlanItem {
  topic: string;
  drillQuestion: string;
  targetOutcome: string;
}

export interface FeedbackReportProps {
  sessionId?: string;
  date?: string;
  roleTitle?: string;
  githubUrl?: string;
  overallScore?: number;
  rubricScores?: RubricScoreItem[];
  behavioralInsights?: BehavioralInsightItem[];
  remediationPlan?: RemediationPlanItem[];
  transformations?: StarResponseTransformation[];
  onStartDrill?: (question: string) => void;
}

export const FeedbackReport: React.FC<FeedbackReportProps> = ({
  sessionId = 'FLX-98219',
  date = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
  roleTitle = 'Senior Systems & Frontend Architect',
  githubUrl = '',
  overallScore = 3.9,
  rubricScores = [],
  behavioralInsights = [],
  remediationPlan = [],
  transformations = [],
  onStartDrill,
}) => {
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const [showFullRubric, setShowFullRubric] = useState<boolean>(true);

  // Normalize score to 100-point scale
  const confidenceIndex = Math.min(99, Math.max(35, Math.round((overallScore / 5) * 100)));

  // Fallbacks ensuring rich, grounded presentation
  const defaultTransformations: StarResponseTransformation[] = [
    {
      questionAsked: 'Describe a time an unplanned infrastructure outage threatened your core product release.',
      originalTranscript:
        "So basically we had bugs and the pod restarted like three times because memory went crazy and customers couldn't check out, so I went in and killed some processes and we fixed it after a while.",
      critiqueNotes: [
        '3 filler anchors ("basically", "like")',
        'Diffuse ownership ("we had", "we fixed")',
        'Non-quantified metrics ("after a while")',
      ],
      starRewrite: {
        situation:
          'During our highest-traffic Q3 flash sale event, our primary checkout service encountered consecutive OOMKilled container restarts under peak ingress.',
        task:
          'I owned the incident command protocol to stabilize the checkout pipeline within an explicit 15-minute enterprise SLA.',
        action:
          'I investigated Kubernetes heap memory profiles, pinpointed an unindexed memory leak in our session caching tier, dynamically adjusted cgroup memory limits, and orchestrated non-critical telemetry shedding.',
        result:
          'Restored 99.9% uptime within 11 minutes, mitigating an estimated $340K in checkout cart abandonment.',
      },
      competency: 'Technical Action Clarity & Incident Leadership',
      scoreImprovement: '+34% Impact Rating',
      timeRange: '03:22 – 04:48',
      wpm: 142,
    },
  ];

  const activeTransformations =
    transformations && transformations.length > 0 ? transformations : defaultTransformations;

  return (
    <div className="space-y-8 text-white max-w-7xl mx-auto">
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP SUMMARY CARD: 2-COLUMN HEADER & CONFIDENCE GAUGE                   */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left (2 cols): Candidate Diagnostic Overview */}
        <div className="lg:col-span-2 rounded-2xl bg-[#0d131f] border border-slate-800/90 p-6 sm:p-7 shadow-2xl flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-mono font-bold tracking-wider uppercase border border-violet-500/30">
                POST-INTERVIEW EVALUATION
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                L6 STAFF CANDIDATE TRACK
              </span>
              {githubUrl && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                  <span>🐙</span>
                  <span>{githubUrl.replace(/^https?:\/\/(?:www\.)?github\.com\//, '')}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {roleTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
              Diagnostic debrief across multi-layered scenarios: Distributed Failure Handling, Latency Mitigation, and Architectural Trade-offs.
            </p>
          </div>

          {/* 4-Stat Metric Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
            {/* Stat 1 */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 block">
                TOTAL DURATION
              </span>
              <div className="text-base font-bold font-mono text-white">14m 28s</div>
              <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-medium">
                Optimal Pace Range
              </span>
            </div>

            {/* Stat 2 */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 block">
                CORE PROMPTS
              </span>
              <div className="text-base font-bold font-mono text-white">3 Scenarios</div>
              <span className="inline-block px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                All Completed
              </span>
            </div>

            {/* Stat 3 */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 block">
                SPEAKING RATIO
              </span>
              <div className="text-base font-bold font-mono text-white">71.4%</div>
              <span className="inline-block px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 text-[10px] font-mono">
                Candidate Led
              </span>
            </div>

            {/* Stat 4 */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 block">
                INTERVENTIONS
              </span>
              <div className="text-base font-bold font-mono text-white text-amber-300">1 Cue</div>
              <span className="inline-block px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                Self-resolved
              </span>
            </div>
          </div>
        </div>

        {/* Right (1 col): Confidence Index Gauge */}
        <div className="rounded-2xl bg-[#0d131f] border border-slate-800/90 p-6 shadow-2xl flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-400">
              CONFIDENCE INDEX
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>STRONG PASS PROFILE</span>
            </span>
          </div>

          {/* Donut and Sub-bars */}
          <div className="flex items-center gap-5">
            {/* SVG Donut */}
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.2"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-cyan-400"
                  strokeDasharray={`${confidenceIndex}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.2"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black font-mono text-white leading-none">
                  {confidenceIndex}
                </span>
                <span className="text-[9px] font-mono text-slate-400">/ 100</span>
              </div>
            </div>

            {/* Sub-bars */}
            <div className="flex-1 space-y-2.5">
              {/* Bar 1 */}
              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
                  <span>Technical Depth</span>
                  <span className="font-bold text-cyan-400">84%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: '84%' }} />
                </div>
              </div>

              {/* Bar 2 */}
              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
                  <span>STAR Structure</span>
                  <span className="font-bold text-violet-400">79%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-400 rounded-full" style={{ width: '79%' }} />
                </div>
              </div>

              {/* Bar 3 */}
              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
                  <span>Delivery Pace</span>
                  <span className="font-bold text-amber-400">72%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: '72%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Benchmark: Top 15% L6 Applicants</span>
            <span className="text-emerald-400">↗</span>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 2. THE ANSWER TRANSFORMER                                                 */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <AnswerTransformer
        transformations={activeTransformations}
        onPracticeDrill={onStartDrill}
      />

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 3. TARGETED REMEDIATION SPRINT (30s MICRO-DRILL BANNER)                   */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-r from-[#17102e] via-[#0f172a] to-[#121c33] border border-violet-500/40 p-6 sm:p-7 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-600/30 border border-violet-500/50 flex items-center justify-center text-2xl text-violet-300 shrink-0 shadow-lg shadow-violet-500/20">
            ⚡
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-violet-400">
                TARGETED REMEDIATION SPRINT
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
                30s RAPID RESPONSE
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Detected Gap: Technical Action Clarity in Behavioral Scenarios
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Your verbs in Q1 lacked architectural precision ("killed some processes" vs "cgroup throttling & heap inspection"). Solidify this vocabulary in a 30-second rapid micro-prompt drill before your next live loop.
            </p>
          </div>
        </div>

        <button
          onClick={() => onStartDrill && onStartDrill('Explain a critical production outage using architectural precision.')}
          className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold font-mono text-sm transition-all shadow-xl shadow-violet-500/30 flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-center"
        >
          <span>Start 30-Second Micro-Drill</span>
          <span>→</span>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 4. ACOUSTIC & BEHAVIORAL BIOMETRICS: TIMELINE & TELEMETRY STREAM          */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-[#0d131f] border border-slate-800/90 p-6 sm:p-7 shadow-2xl space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-emerald-400 text-xs font-mono">〰️</span>
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-emerald-400">
                ACOUSTIC & BEHAVIORAL BIOMETRICS
              </span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Timeline & Telemetry Stream
            </h3>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Optimal Cadence (125-145 WPM)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Micro-Pause (&gt;2.0s)</span>
            </span>
          </div>
        </div>

        {/* Dynamic Interactive SVG Waveform Stream */}
        <div className="relative w-full h-36 bg-[#070b12] rounded-xl border border-slate-800/80 overflow-hidden px-4 py-3 flex flex-col justify-between">
          {/* Subtle Grid Lines */}
          <div className="absolute inset-0 grid grid-cols-6 divide-x divide-slate-800/30 pointer-events-none" />

          {/* SVG Wave */}
          <svg className="w-full h-24 overflow-visible" viewBox="0 0 800 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Area Fill */}
            <path
              d="M 0 60 Q 70 85, 140 50 T 280 75 T 420 30 T 560 65 T 700 45 T 800 60 L 800 100 L 0 100 Z"
              fill="url(#waveGrad)"
            />
            {/* Wave Stroke */}
            <path
              d="M 0 60 Q 70 85, 140 50 T 280 75 T 420 30 T 560 65 T 700 45 T 800 60"
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
            />

            {/* Amber Milestone Pin 1: Verbal Stall */}
            <circle cx="280" cy="75" r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="280" y1="20" x2="280" y2="75" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" />

            {/* Cyan Milestone Pin 2: Dynamic Pacing Peak */}
            <circle cx="420" cy="30" r="4.5" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="420" y1="10" x2="420" y2="30" stroke="#06b6d4" strokeWidth="1" strokeDasharray="2,2" />
          </svg>

          {/* Floating Marker Badges over the wave */}
          <div className="absolute top-2 left-[31%] -translate-x-1/2">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/40 shadow">
              ● 04:38 Pause (3.4s) • Verbal Stall
            </span>
          </div>

          <div className="absolute top-1 left-[52%] -translate-x-1/2">
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono border border-cyan-500/40 shadow">
              ● 09:14 Dynamic Pacing Peak (168 wpm)
            </span>
          </div>

          {/* Timestamp Axis Labels */}
          <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800/80 z-10">
            <span>00:00</span>
            <span>02:30</span>
            <span>05:00 [Q1 Wrap]</span>
            <span>07:30</span>
            <span>10:00 [Q2 Wrap]</span>
            <span>12:30</span>
            <span>14:28 [End]</span>
          </div>
        </div>

        {/* Milestone Navigation Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 mr-1">
            JUMP TO KEY MILESTONES:
          </span>
          {[
            { time: '01:14', label: 'Cache stampede mitigation' },
            { time: '04:32', label: 'STAR Action transition (Remediated)' },
            { time: '08:50', label: 'Eventual consistency trade-off' },
            { time: '12:05', label: 'High-conviction conclusion' },
          ].map((m, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedMilestone(m.time)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors flex items-center gap-1.5 border ${
                selectedMilestone === m.time
                  ? 'bg-violet-600 text-white border-violet-500'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="font-bold text-violet-400">{m.time}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {/* 4 Bottom Telemetry Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
          {/* Card 1 */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">
                AVG TURN LATENCY
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </div>
            <div className="text-lg font-bold font-mono text-white">
              1.1s <span className="text-xs font-normal text-cyan-400">Natural cadence</span>
            </div>
            <p className="text-[11px] text-slate-500">Target under 2.0s without interrupting</p>
          </div>

          {/* Card 2 */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">
                FILLER WORD RATIO
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </div>
            <div className="text-lg font-bold font-mono text-white">
              2.1% <span className="text-xs font-normal text-amber-400">Slightly Elevated</span>
            </div>
            <p className="text-[11px] text-slate-500">Recommended: &lt;1.5% across formal panels</p>
          </div>

          {/* Card 3 */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">
                VISUAL ENGAGEMENT
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </div>
            <div className="text-lg font-bold font-mono text-white">
              82% <span className="text-xs font-normal text-emerald-400">High Steady</span>
            </div>
            <p className="text-[11px] text-slate-500">Camera plane alignment sustained</p>
          </div>

          {/* Card 4 */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">
                ACOUSTIC STEADINESS
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </div>
            <div className="text-lg font-bold font-mono text-white">
              0.94 <span className="text-xs font-normal text-emerald-400">Low Jitter</span>
            </div>
            <p className="text-[11px] text-slate-500">Minimal vocal strain or trailing volume</p>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 5. CRITERION RUBRIC BREAKDOWN (EXPANDABLE DETAIL)                          */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {rubricScores && rubricScores.length > 0 && (
        <div className="rounded-2xl bg-[#0d131f] border border-slate-800/90 p-6 sm:p-7 shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-violet-400 block mb-1">
                COMPREHENSIVE COMPETENCY MATRIX
              </span>
              <h3 className="text-xl font-bold text-white">Criterion Rubric Breakdown</h3>
            </div>
            <button
              onClick={() => setShowFullRubric(!showFullRubric)}
              className="text-xs font-mono text-slate-400 hover:text-white px-3 py-1 rounded bg-slate-800 transition-colors"
            >
              {showFullRubric ? 'Hide Details ▴' : 'View Details ▾'}
            </button>
          </div>

          {showFullRubric && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rubricScores.map((rubric, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-[#0a0f19] border border-slate-800/90 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-200">{rubric.criterion}</h4>
                    <span className="px-2 py-0.5 rounded bg-violet-950 text-violet-300 font-mono text-xs font-bold border border-violet-800/50">
                      {rubric.score.toFixed(1)} / 5.0
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">{rubric.feedback}</p>

                  {rubric.quotes && rubric.quotes.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-slate-300 italic">
                      "{rubric.quotes[0].text}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* 6. BOTTOM FOOTER BAR                                                      */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
        <div className="flex items-center gap-2">
          <span>🛡️</span>
          <span>Diagnostic report saved to Felix Secure Cloud. Exportable for recruiter coaches.</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          >
            Export PDF Brief
          </button>
          <Link
            href="/session/setup"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shadow-emerald-500/20"
          >
            Book Next Rehearsal Loop
          </Link>
        </div>
      </div>

      {/* Engineering Footer Fine-Print */}
      <div className="pt-2 text-center flex flex-wrap items-center justify-center gap-4 text-[10px] font-mono text-slate-600">
        <span>ENGINEERING REHEARSAL SUITE v2.4.1-rc</span>
        <span>•</span>
        <span>FEED: 1080P60</span>
        <span>•</span>
        <span>AUDIO: 48KHZ STEREO</span>
        <span>•</span>
        <span className="text-emerald-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          <span>SECURE COGNITIVE LINK ACTIVE</span>
        </span>
      </div>
    </div>
  );
};
