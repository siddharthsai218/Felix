'use client';

import React, { useState } from 'react';

export interface StarResponseTransformation {
  questionAsked: string;
  originalTranscript: string;
  critiqueNotes: string[];
  starRewrite: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  competency: string;
  scoreImprovement: string;
  timeRange?: string;
  wpm?: number;
  fillerCount?: number;
}

interface AnswerTransformerProps {
  transformations: StarResponseTransformation[];
  onPracticeDrill?: (question: string) => void;
  className?: string;
}

export const AnswerTransformer: React.FC<AnswerTransformerProps> = ({
  transformations,
  onPracticeDrill,
  className = '',
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const active = transformations[selectedIndex] || transformations[0];

  if (!active) return null;

  const handleCopy = () => {
    const starText = `[SITUATION]\n${active.starRewrite.situation}\n\n[TASK]\n${active.starRewrite.task}\n\n[ACTION]\n${active.starRewrite.action}\n\n[RESULT]\n${active.starRewrite.result}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(starText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePlayAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(active.originalTranscript);
    utterance.rate = 1.0;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  // Highlight filler phrases in original transcript
  const renderHighlightedTranscript = (text: string) => {
    const fillerWords = ['so basically', 'basically', 'like', 'after a while', 'um', 'uh', 'you know', 'kind of', 'sort of'];
    const regex = new RegExp(`\\b(${fillerWords.join('|')})\\b`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) => {
      if (fillerWords.some((f) => f.toLowerCase() === part.toLowerCase())) {
        return (
          <span
            key={i}
            className="bg-amber-500/25 text-amber-300 font-semibold px-1.5 py-0.5 rounded border border-amber-500/40 inline-block my-0.5"
            title="Filler / Low-conviction phrasing"
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-cyan-400 text-xs font-mono">⚡</span>
            <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-cyan-400">
              CORE SYNTHESIS ENGINE
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            The Answer Transformer
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Contrast unstructured spoken transcripts against executive-level STAR framing optimized for committee review.
          </p>
        </div>

        {/* Tab switcher if multiple questions */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {transformations.map((t, idx) => {
            const label = idx === 0 ? 'Q1: Core Incident' : idx === 1 ? 'Q2: Architecture Sync' : `Q${idx + 1}: Follow-up`;
            const isActive = selectedIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => setSelectedIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all whitespace-nowrap border ${
                  isActive
                    ? 'bg-violet-950/80 text-violet-300 border-violet-500/80 shadow-[0_0_15px_rgba(139,92,246,0.25)]'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Transformer Container */}
      <div className="rounded-2xl bg-[#0d131f] border border-slate-800/90 shadow-2xl overflow-hidden">
        {/* Prompt Header Bar */}
        <div className="px-5 py-3.5 bg-slate-900/80 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono font-bold border border-slate-700 shrink-0">
              PROMPT 0{selectedIndex + 1}
            </span>
            <p className="text-xs sm:text-sm font-medium text-slate-200 italic line-clamp-2">
              "{active.questionAsked}"
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[11px] font-mono font-medium border border-amber-500/30">
              <span>⚠️</span>
              <span>Casual Verb Fillers Detected</span>
            </span>
          </div>
        </div>

        {/* Side-by-Side Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/80">
          {/* Left Column: What You Said */}
          <div className="p-6 flex flex-col justify-between space-y-6 bg-[#0a0f19]/60">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-[11px] font-mono font-bold tracking-wider text-amber-300 uppercase">
                    WHAT YOU SAID (VERBATIM RECORD)
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  Timestamp: {active.timeRange || '01:15 – 02:40'}
                </span>
              </div>

              {/* Verbatim quote block with highlighted words */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                "{renderHighlightedTranscript(active.originalTranscript)}"
              </div>

              {/* Cognitive Friction Factors */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 block">
                  COGNITIVE FRICTION FACTORS:
                </span>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-950/40 text-rose-300 text-[11px] font-mono border border-rose-800/50">
                    <span>✕</span>
                    <span>3 filler anchors ("basically", "like")</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-950/40 text-amber-300 text-[11px] font-mono border border-amber-800/50">
                    <span>⇄</span>
                    <span>Diffuse ownership ("we had", "we fixed")</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-950/40 text-amber-300 text-[11px] font-mono border border-amber-800/50">
                    <span>→</span>
                    <span>Non-quantified metrics ("after a while")</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Audio Replay Footer */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
              <button
                onClick={handlePlayAudio}
                className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors group"
              >
                <span className="w-6 h-6 rounded-full bg-slate-800 group-hover:bg-violet-600 flex items-center justify-center text-[10px] text-white transition-colors">
                  {isPlayingAudio ? '⏸' : '▶'}
                </span>
                <span>{isPlayingAudio ? 'Pause Segment' : 'Replay Original Audio Segment'}</span>
              </button>
              <span className="text-slate-500">{active.wpm || 142} wpm (Optimal)</span>
            </div>
          </div>

          {/* Right Column: The Felix STAR Formulation */}
          <div className="p-6 flex flex-col justify-between space-y-6 bg-[#0d1424]/40">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-mono font-bold tracking-wider text-emerald-400 uppercase">
                    THE FELIX STAR FORMULATION (EXECUTIVE-READY)
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
                  {active.scoreImprovement || '+38% Impact Rating'}
                </span>
              </div>

              {/* STAR Formatted Beats */}
              <div className="space-y-3">
                {/* Situation */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-violet-400 block tracking-wider uppercase">
                    [SITUATION] CONTEXT & SCALE
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    "{active.starRewrite.situation}"
                  </p>
                </div>

                {/* Task */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-cyan-400 block tracking-wider uppercase">
                    [TASK] ACCOUNTABILITY SLA
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    "{active.starRewrite.task}"
                  </p>
                </div>

                {/* Action */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 block tracking-wider uppercase">
                    [ACTION] ARCHITECTURAL SPECIFICITY
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    "{active.starRewrite.action}"
                  </p>
                </div>

                {/* Result */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-emerald-300 block tracking-wider uppercase">
                    [RESULT] QUANTIFIED OUTCOME
                  </span>
                  <p className="text-xs sm:text-sm text-emerald-300 font-medium leading-relaxed">
                    "{active.starRewrite.result}"
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 transition-colors flex items-center gap-1.5"
                >
                  <span>📋</span>
                  <span>{copied ? 'Copied!' : 'Copy STAR Formulation'}</span>
                </button>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                  30s
                </span>
              </div>

              <button
                onClick={() => onPracticeDrill && onPracticeDrill(active.questionAsked)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold font-mono transition-all shadow-md shadow-violet-500/25 flex items-center gap-1.5"
              >
                <span>🎙️</span>
                <span>Practice Speaking This Version</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
