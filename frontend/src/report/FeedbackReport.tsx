'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ScoreIndicator } from './ScoreIndicator';
import { DrillCard } from './DrillCard';
import { AnswerTransformer, type StarResponseTransformation } from './AnswerTransformer';
import {
  TranscriptScoreAudit,
  type ScoreRationaleData,
  type TurnTranscriptAudit,
} from './TranscriptScoreAudit';

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
  scoreRationale?: ScoreRationaleData;
  transcriptAudit?: TurnTranscriptAudit[];
  candidateResponses?: Array<{ questionAsked: string; transcript: string }>;
  onStartDrill?: (question: string) => void;
}

export const FeedbackReport: React.FC<FeedbackReportProps> = ({
  sessionId = 'demo_session',
  date = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
  roleTitle = 'Software Engineer',
  githubUrl = '',
  overallScore = 4.1,
  rubricScores = [
    {
      criterion: 'Technical Depth & Architecture',
      score: 4,
      feedback:
        'Strong grasp of system design trade-offs, state management, and real-time event streaming.',
      quotes: [
        {
          text: 'I structured the data pipeline with WebSocket event queues and decoupled the state machine...',
          time: '01:14',
        },
      ],
    },
    {
      criterion: 'STAR Method & Structural Delivery',
      score: 3.5,
      feedback:
        'You communicated the core technical problem well, but the measurable business result was vague. Use quantifiable benchmarks.',
      quotes: [
        {
          text: 'So basically we moved to optimistic UI updates which made the experience feel a lot faster...',
          time: '02:40',
        },
      ],
    },
    {
      criterion: 'Communication Clarity & Conciseness',
      score: 4.2,
      feedback:
        'Articulate and structured pacing. Good balance of technical depth without unnecessary filler.',
      quotes: [
        {
          text: 'First, I prioritized network payload minimization. Second, browser execution profiling.',
          time: '00:48',
        },
      ],
    },
    {
      criterion: 'Composure & Behavioral Presence',
      score: 4.5,
      feedback:
        'Consistent eye contact with the camera (88%) and steady vocal prosody with natural pauses for thinking.',
      quotes: [
        {
          text: 'Camera gaze remained focused through difficult architectural questions.',
          time: 'Telemetry',
        },
      ],
    },
  ],
  behavioralInsights = [
    {
      icon: '👁️',
      title: 'MediaPipe Eye Contact',
      text: '88% Camera focus maintained throughout response delivery. High visual engagement.',
      metric: '88% Gaze',
      status: 'optimal',
    },
    {
      icon: '🗣️',
      title: 'Parselmouth Pacing',
      text: 'Speaking cadence averaged 138 WPM (Target: 120-160 WPM). Ideal conversational rhythm.',
      metric: '138 WPM',
      status: 'optimal',
    },
    {
      icon: '📊',
      title: 'Vocal Perturbation (Jitter)',
      text: 'Vocal stability steady at 0.82%. Indicates calm composure under technical questioning.',
      metric: '0.82% Jitter',
      status: 'optimal',
    },
    {
      icon: '⏱️',
      title: 'Cognitive Hesitation',
      text: 'One 3.2s pause during system scalability question. Good recovery using structured logic.',
      metric: '1 Long Pause',
      status: 'attention',
    },
  ],
  remediationPlan = [
    {
      topic: 'Quantifying Architectural Results',
      drillQuestion:
        'Tell me about a time you had to debug a critical production latency issue. Use the STAR method with concrete numbers.',
      targetOutcome: 'State exact latency drop (e.g. 800ms to 95ms) and business uptime impact.',
    },
  ],
  transformations = [
    {
      questionAsked:
        'Walk me through the most challenging architectural trade-off in your projects.',
      originalTranscript:
        'In my project, we had problems with live data lagging. So I decided to switch from standard REST polling to WebSockets. It was tricky because of reconnection drops, but we fixed it with a retry loop and it worked much better.',
      critiqueNotes: [
        'Vague agency: Used "we had problems" instead of defining your personal leadership role.',
        'Missing quantifiable metric: "Worked much better" does not provide measurable engineering impact.',
        'Thin technical architecture: Needs specific explanation of the heartbeat/backoff algorithm.',
      ],
      starRewrite: {
        situation:
          'In our live interview coaching platform, real-time audio telemetry suffered from a 1,200ms latency bottleneck due to HTTP polling.',
        task:
          'I took direct ownership of designing an ultra-low-latency bidirectional streaming architecture capable of sub-200ms round trips.',
        action:
          'I implemented a WebSocket pipeline with exponential backoff heartbeat reconnection, audio slice streaming, and client-side audio context synchronization.',
        result:
          'Turn latency dropped from 1,200ms to 140ms (<1.5s total loop), eliminating voice overlap and supporting 100% stable live coaching turns.',
      },
      competency: 'Architecture & STAR Structure',
      scoreImprovement: '+45% Clarity & Impact',
    },
  ],
  scoreRationale,
  transcriptAudit,
  candidateResponses,
  onStartDrill,
}) => {
  const effectiveRubricScores = rubricScores && rubricScores.length > 0 ? rubricScores : [
    {
      criterion: 'Technical Depth & Architecture',
      score: 3.5,
      feedback: `Demonstrated technical understanding for ${roleTitle}.`,
      quotes: [{ text: 'Technical response captured during session.', time: '01:00' }],
    },
  ];
  const effectiveBehavioralInsights = behavioralInsights && behavioralInsights.length > 0 ? behavioralInsights : [
    {
      icon: '👁️',
      title: 'MediaPipe Eye Contact',
      text: 'Visual gaze and eye contact tracking recorded during live responses.',
      metric: 'Telemetry',
      status: 'optimal' as const,
    },
  ];
  const effectiveTransformations = transformations && transformations.length > 0 ? transformations : [];
  return (
    <div className="space-y-8 text-white">
      {/* Executive Summary Header */}
      <div className="rounded-3xl bg-gradient-to-r from-gray-900 via-gray-900/90 to-violet-950/50 border border-violet-500/30 p-6 sm:p-8 shadow-2xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold border border-violet-500/30">
              Formative Assessment Report
            </span>
            <span className="text-xs text-gray-400 font-mono">ID: {sessionId}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Interview Performance Report
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-400 mt-2">
            <span className="font-semibold text-violet-300">{roleTitle}</span>
            <span>•</span>
            <span>{date}</span>
            {githubUrl && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-indigo-300 font-mono bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-800/40">
                  <span>🐙</span>
                  <span>{githubUrl.replace(/^https?:\/\/(?:www\.)?github\.com\//, '')}</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Overall Score Badge */}
        <div className="flex items-center gap-4 bg-gray-950/80 px-6 py-4 rounded-2xl border border-gray-800 shadow-inner">
          <ScoreIndicator score={overallScore} size="lg" label="Overall Mastery" />
          <div className="text-left">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Career-Ready
            </div>
            <div className="text-[11px] text-gray-400 max-w-[130px] leading-tight mt-0.5">
              Strong technical reasoning with clear growth pathways.
            </div>
          </div>
        </div>
      </div>

      {/* Answer Transformer Component (Core P0 Feature) */}
      <AnswerTransformer
        transformations={effectiveTransformations}
        onPracticeDrill={onStartDrill}
      />

      {/* Transcript & Score Generation Audit (Full Grounding in Candidate's Actual Spoken Words) */}
      <TranscriptScoreAudit
        scoreRationale={scoreRationale}
        transcriptAudit={transcriptAudit}
        candidateResponses={candidateResponses}
        roleTitle={roleTitle}
      />

      {/* Main Grid: Rubric Breakdown (Left) & Behavioral + Action Plan (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Formative Rubric Evaluation */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <div>
              <h2 className="text-xl font-bold text-white">Criterion Rubric Breakdown</h2>
              <p className="text-xs text-gray-400">
                Evaluation grounded in specific timestamps and transcript evidence.
              </p>
            </div>
            <span className="text-xs text-violet-400 font-medium">4 Core Dimensions</span>
          </div>

          <div className="space-y-4">
            {effectiveRubricScores.map((rubric, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-gray-900/70 border border-gray-800 p-5 shadow-lg transition-all hover:border-gray-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-gray-100">{rubric.criterion}</h3>
                  <div className="w-28">
                    <ScoreIndicator score={rubric.score} type="bar" />
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-4">
                  {rubric.feedback}
                </p>

                {/* Evidence quotes */}
                {rubric.quotes && rubric.quotes.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-gray-950/70 border border-gray-800/80 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                      Transcript Evidence
                    </span>
                    {rubric.quotes.map((quote, qIdx) => (
                      <div key={qIdx} className="flex items-start gap-2.5 text-xs">
                        <span className="px-2 py-0.5 rounded bg-violet-950 text-violet-300 font-mono text-[10px] font-bold border border-violet-800/50 shrink-0">
                          {quote.time}
                        </span>
                        <span className="italic text-gray-300">"{quote.text}"</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Behavioral Telemetry & Action Plan */}
        <div className="space-y-6">
          {/* Behavioral Telemetry Summary */}
          <div className="rounded-2xl bg-gray-900/70 border border-gray-800 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-800">
              <h2 className="font-bold text-base text-white">Behavioral Telemetry</h2>
              <Link
                href={`/session/dashboard?sessionId=${sessionId}`}
                className="text-[11px] font-bold text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
              >
                <span>Deep Dive Graphs</span>
                <span>→</span>
              </Link>
            </div>

            <div className="space-y-3">
              {effectiveBehavioralInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-gray-950/60 border border-gray-800/80"
                >
                  <span className="text-xl">{insight.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-200">{insight.title}</span>
                      {insight.metric && (
                        <span className="text-[10px] font-mono font-bold text-emerald-400">
                          {insight.metric}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{insight.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href={`/session/dashboard?sessionId=${sessionId}`}
              className="block w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-750 text-center text-xs font-semibold text-gray-200 border border-gray-700 transition-colors"
            >
              Open Full Telemetry Dashboard (6 Charts) →
            </Link>
          </div>

          {/* Action Plan & Remediation Micro-Drill */}
          <div className="rounded-2xl bg-gradient-to-b from-gray-900 to-indigo-950/40 border border-indigo-500/30 p-5 shadow-lg space-y-4">
            <div className="pb-2 border-b border-gray-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-0.5">
                Targeted Remediation
              </span>
              <h2 className="font-bold text-base text-white">Remediation Micro-Drills</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Retry weak competencies in 30-second focused sprints to visibly improve your score.
              </p>
            </div>

            <div className="space-y-3">
              {remediationPlan.map((plan, idx) => (
                <div key={idx}>
                  <DrillCard
                    question={plan.drillQuestion}
                    targetOutcome={plan.targetOutcome}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
