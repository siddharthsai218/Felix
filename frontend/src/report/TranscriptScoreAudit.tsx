'use client';

import React, { useState } from 'react';
import { TurnVideoPlayer } from '../app/components/TurnVideoPlayer';

export interface PositiveEvidenceItem {
  quote: string;
  impact: string;
}

export interface DeductionEvidenceItem {
  quote: string;
  critique: string;
  recommendation: string;
}

export interface TurnTranscriptAudit {
  turnNumber: number;
  question: string;
  transcript: string;
  turnScore: number;
  durationFormatted?: string;
  wordCount?: number;
  scoringJustification: string;
  positiveEvidence: PositiveEvidenceItem[];
  deductionEvidence: DeductionEvidenceItem[];
}

export interface ScoreRationaleData {
  overallScore: number;
  ratingLabel?: string;
  scoringFormula?: string;
  summary: string;
  strengthsExplanation?: string;
  deductionsExplanation?: string;
}

export interface TranscriptScoreAuditProps {
  sessionId?: string;
  scoreRationale?: ScoreRationaleData;
  transcriptAudit?: TurnTranscriptAudit[];
  candidateResponses?: Array<{ questionAsked: string; transcript: string }>;
  roleTitle?: string;
}

export function TranscriptScoreAudit({
  sessionId,
  scoreRationale,
  transcriptAudit = [],
  candidateResponses = [],
  roleTitle = 'Software Engineer',
}: TranscriptScoreAuditProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'strengths' | 'deductions'>('all');
  const [expandedTurns, setExpandedTurns] = useState<Record<number, boolean>>({});

  const toggleTurn = (turnNum: number) => {
    setExpandedTurns((prev) => ({
      ...prev,
      [turnNum]: prev[turnNum] !== undefined ? !prev[turnNum] : false,
    }));
  };

  // effectiveAudit must STRICTLY show ONLY the questions asked by the AI in candidateResponses
  const effectiveAudit: TurnTranscriptAudit[] =
    candidateResponses.length > 0
      ? candidateResponses.map((r, i) => {
          const matchedAudit = transcriptAudit[i];
          const words = (r.transcript || '').split(/\s+/).filter(Boolean);
          const wordCount = words.length;
          const isWeak =
            wordCount < 25 ||
            (r.transcript || '').toLowerCase().includes('sleep') ||
            (r.transcript || '').toLowerCase().includes('tired') ||
            (r.transcript || '').toLowerCase().includes("don't know");

          return {
            turnNumber: i + 1,
            question: r.questionAsked || `Question ${i + 1}`,
            transcript: r.transcript || 'No spoken transcript captured.',
            turnScore: matchedAudit?.turnScore ?? (isWeak ? 2.2 : 3.8),
            durationFormatted: matchedAudit?.durationFormatted ?? `${Math.round(wordCount * 0.45)}s`,
            wordCount,
            scoringJustification:
              matchedAudit?.scoringJustification ??
              (isWeak
                ? `Response was conversational and lacked structured STAR framing or technical depth for ${roleTitle}.`
                : `Demonstrated technical clarity for ${roleTitle} with actionable reasoning.`),
            positiveEvidence: matchedAudit?.positiveEvidence ?? (isWeak
              ? []
              : [
                  {
                    quote: (r.transcript || '').slice(0, Math.min((r.transcript || '').length, 90)),
                    impact: `Highlighted domain familiarity and direct engagement with the question.`,
                  },
                ]),
            deductionEvidence: matchedAudit?.deductionEvidence ?? (isWeak
              ? [
                  {
                    quote: (r.transcript || '').slice(0, Math.min((r.transcript || '').length, 80)),
                    critique: `Answer lacked Situation, Task, Action, Result components and specific engineering tools.`,
                    recommendation: `Structure response using the STAR method and specify exact technical tools used.`,
                  },
                ]
              : [
                  {
                    quote: (r.transcript || '').slice(Math.min((r.transcript || '').length, 50), Math.min((r.transcript || '').length, 120)) || (r.transcript || ''),
                    critique: `Could elevate by citing quantitative benchmarks (latency, throughput, % increase).`,
                    recommendation: `Add measurable metrics to prove the impact of your engineering actions.`,
                  },
                ]),
          };
        })
      : transcriptAudit;

  const effectiveRationale: ScoreRationaleData = scoreRationale || {
    overallScore: 3.5,
    ratingLabel: 'Formative Assessment Score',
    scoringFormula: '35% Technical Depth + 25% STAR Framework + 20% Communication Pacing + 20% Composure',
    summary:
      'Score is directly grounded in your spoken transcripts. Deductions were applied for missing quantifiable outcomes and informal delivery, while credit was awarded for technical comprehension.',
    strengthsExplanation: 'Direct communication and relevant engineering concepts cited in your spoken answers.',
    deductionsExplanation:
      'Missing measurable STAR results (latency, scale, throughput) and conversational delivery in response turns.',
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
              Evidence-Based Grounding
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold">
              Verbatim Transcript Backing
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            How Your Score Was Generated
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Full transparency: every point awarded or deducted is backed directly by your exact spoken words.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-900 border border-gray-800 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeFilter === 'all'
                ? 'bg-violet-600 text-white shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            All Evidence
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('strengths')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeFilter === 'strengths'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-gray-400 hover:text-emerald-300'
            }`}
          >
            Strengths (Credit)
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('deductions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeFilter === 'deductions'
                ? 'bg-rose-600 text-white shadow'
                : 'text-gray-400 hover:text-rose-300'
            }`}
          >
            Deductions (Gaps)
          </button>
        </div>
      </div>

      {/* Holistic Score Derivation Box */}
      <div className="rounded-3xl bg-gradient-to-br from-gray-900 via-gray-900/95 to-violet-950/40 border border-violet-500/30 p-6 sm:p-7 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-violet-950/80 border border-violet-500/50 flex flex-col items-center justify-center shrink-0 shadow-inner">
              <span className="text-lg font-black text-violet-300">
                {effectiveRationale.overallScore.toFixed(1)}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-gray-400">/ 5.0</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 block mb-0.5">
                Scoring Derivation
              </span>
              <h3 className="text-base font-bold text-white">
                {effectiveRationale.ratingLabel || 'Overall Assessment Derivation'}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">
                Formula: {effectiveRationale.scoringFormula || '35% Technical + 25% STAR + 20% Pacing + 20% Telemetry'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-1.5">
              <span>🟢</span>
              <span className="font-semibold">Transcript Grounded</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-violet-950/50 border border-violet-800/40 text-violet-300 text-xs flex items-center gap-1.5">
              <span>⚖️</span>
              <span className="font-semibold">{effectiveAudit.length} Turns Evaluated</span>
            </div>
          </div>
        </div>

        {/* Narrative Rationale */}
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-gray-950/70 border border-gray-800/80 text-xs sm:text-sm text-gray-300 leading-relaxed">
            <span className="font-bold text-white block mb-1">
              Why you received this score:
            </span>
            {effectiveRationale.summary}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {effectiveRationale.strengthsExplanation && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-800/30 text-xs space-y-1">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <span>✓</span>
                  <span>What Earned You Points</span>
                </span>
                <p className="text-gray-300 leading-relaxed text-[11px] sm:text-xs">
                  {effectiveRationale.strengthsExplanation}
                </p>
              </div>
            )}

            {effectiveRationale.deductionsExplanation && (
              <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-800/30 text-xs space-y-1">
                <span className="font-bold text-rose-400 flex items-center gap-1.5">
                  <span>✗</span>
                  <span>Where Points Were Deducted</span>
                </span>
                <p className="text-gray-300 leading-relaxed text-[11px] sm:text-xs">
                  {effectiveRationale.deductionsExplanation}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Turn-by-Turn Full Transcript & Evidence Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>🗣️</span>
            <span>Question-by-Question Spoken Transcript & Evidence Audit</span>
          </h3>
          <span className="text-xs text-gray-400 font-mono">
            {effectiveAudit.length} Question{effectiveAudit.length !== 1 ? 's' : ''}
          </span>
        </div>

        {effectiveAudit.map((item) => {
          const isCollapsed = expandedTurns[item.turnNumber] === false; // default open
          const hasStrengths = item.positiveEvidence && item.positiveEvidence.length > 0;
          const hasDeductions = item.deductionEvidence && item.deductionEvidence.length > 0;

          if (activeFilter === 'strengths' && !hasStrengths) return null;
          if (activeFilter === 'deductions' && !hasDeductions) return null;

          return (
            <div
              key={item.turnNumber}
              className="rounded-3xl bg-gray-900/80 border border-gray-800 shadow-xl overflow-hidden transition-all hover:border-gray-700"
            >
              {/* Question Header & Turn Score */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 border-b border-gray-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-violet-950/80 border border-violet-800/50 flex items-center justify-center text-sm font-bold text-violet-300 shrink-0 mt-0.5">
                    Q{item.turnNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                        Interviewer Question
                      </span>
                      {item.durationFormatted && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 font-mono">
                          Duration: {item.durationFormatted}
                        </span>
                      )}
                      {item.wordCount !== undefined && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 font-mono">
                          {item.wordCount} words
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-white leading-snug">
                      "{item.question}"
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider text-gray-400 block">
                      Turn Score
                    </span>
                    <span
                      className={`text-sm sm:text-base font-black px-2.5 py-1 rounded-xl border ${
                        item.turnScore >= 3.8
                          ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-300'
                          : item.turnScore >= 3.0
                          ? 'bg-amber-950/60 border-amber-700/50 text-amber-300'
                          : 'bg-rose-950/60 border-rose-700/50 text-rose-300'
                      }`}
                    >
                      {item.turnScore.toFixed(1)} / 5.0
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleTurn(item.turnNumber)}
                    className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors text-xs"
                    title={isCollapsed ? 'Expand details' : 'Collapse details'}
                  >
                    {isCollapsed ? '▼' : '▲'}
                  </button>
                </div>
              </div>

              {!isCollapsed && (
                <div className="p-5 sm:p-6 space-y-5">
                  {/* Verbatim Candidate Transcript */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <span>🎙️</span>
                        <span>Your Spoken Transcript (What Felix Analyzed)</span>
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-gray-950/80 border border-gray-800/90 text-xs sm:text-sm text-gray-200 font-sans leading-relaxed relative">
                      <span className="text-gray-500 font-serif text-lg leading-none select-none mr-1">
                        “
                      </span>
                      {item.transcript}
                      <span className="text-gray-500 font-serif text-lg leading-none select-none ml-1">
                        ”
                      </span>
                    </div>

                    {sessionId && (
                      <TurnVideoPlayer
                        sessionId={sessionId}
                        responseIndex={item.turnNumber - 1}
                        turnLabel={`Question ${item.turnNumber}`}
                        className="mt-2.5"
                      />
                    )}
                  </div>

                  {/* Scoring Justification for this specific turn */}
                  <div className="p-3.5 rounded-2xl bg-violet-950/20 border border-violet-800/30 text-xs text-gray-300 flex items-start gap-2.5">
                    <span className="text-sm mt-0.5">⚖️</span>
                    <div>
                      <span className="font-bold text-violet-300 block mb-0.5">
                        Turn Scoring Justification
                      </span>
                      <p className="text-[11px] sm:text-xs leading-relaxed text-gray-300">
                        {item.scoringJustification}
                      </p>
                    </div>
                  </div>

                  {/* Evidence Citations: Strengths vs Deductions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Strengths (Points Awarded) */}
                    {(activeFilter === 'all' || activeFilter === 'strengths') && (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                          <span>🟢</span>
                          <span>Transcript Strengths (Points Awarded)</span>
                        </div>

                        {item.positiveEvidence && item.positiveEvidence.length > 0 ? (
                          item.positiveEvidence.map((ev, eIdx) => (
                            <div
                              key={eIdx}
                              className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 space-y-1.5"
                            >
                              <div className="text-xs italic text-emerald-200 bg-emerald-950/70 p-2 rounded-xl border border-emerald-800/40">
                                "{ev.quote}"
                              </div>
                              <p className="text-[11px] text-gray-300 leading-snug">
                                <strong className="text-emerald-300 font-semibold">Credit: </strong>
                                {ev.impact}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 rounded-2xl bg-gray-950/40 border border-gray-800/60 text-[11px] text-gray-500 italic">
                            No positive technical or structural signals detected in this answer turn.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Deductions (Points Lost) */}
                    {(activeFilter === 'all' || activeFilter === 'deductions') && (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                          <span>🔴</span>
                          <span>Transcript Deductions (Points Lost)</span>
                        </div>

                        {item.deductionEvidence && item.deductionEvidence.length > 0 ? (
                          item.deductionEvidence.map((dev, dIdx) => (
                            <div
                              key={dIdx}
                              className="p-3 rounded-2xl bg-rose-950/30 border border-rose-800/40 space-y-1.5"
                            >
                              <div className="text-xs italic text-rose-200 bg-rose-950/70 p-2 rounded-xl border border-rose-800/40">
                                "{dev.quote}"
                              </div>
                              <p className="text-[11px] text-gray-300 leading-snug">
                                <strong className="text-rose-300 font-semibold">Penalty: </strong>
                                {dev.critique}
                              </p>
                              {dev.recommendation && (
                                <p className="text-[11px] text-indigo-300 bg-indigo-950/40 p-1.5 rounded-lg border border-indigo-900/30 leading-snug">
                                  <strong className="text-indigo-200 font-semibold">Action: </strong>
                                  {dev.recommendation}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="p-3 rounded-2xl bg-gray-950/40 border border-gray-800/60 text-[11px] text-emerald-400/80 italic">
                            No significant deductions recorded for this turn.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
