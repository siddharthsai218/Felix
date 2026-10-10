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
  const active = transformations[selectedIndex] || transformations[0];

  if (!active) return null;

  return (
    <div className={`rounded-3xl bg-gray-900/90 border border-violet-500/30 p-6 sm:p-8 shadow-2xl backdrop-blur-sm ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-gray-800 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xl">✨</span>
            <span className="text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Core EdTech Feature
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-semibold border border-violet-500/30">
              STAR Method Transformation
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">Answer Transformer</h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Compare what you said side-by-side with the Felix STAR rewrite to master concise executive communication.
          </p>
        </div>

        {/* Tab switcher if multiple questions */}
        {transformations.length > 1 && (
          <div className="flex items-center gap-1.5 bg-gray-950 p-1 rounded-xl border border-gray-800">
            {transformations.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedIndex === idx
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900'
                }`}
              >
                Turn {idx + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Target Question Asked */}
      <div className="my-6 p-4 rounded-2xl bg-gray-950/80 border border-gray-800">
        <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400 block mb-1">
          Interview Question
        </span>
        <p className="text-sm font-medium text-gray-200 italic">
          "{active.questionAsked}"
        </p>
      </div>

      {/* Side-by-Side Comparison Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: What You Said */}
        <div className="flex flex-col justify-between rounded-2xl bg-gray-950/90 border border-amber-500/30 p-5 shadow-inner">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <h3 className="font-bold text-sm text-amber-200">What You Said (Raw Delivery)</h3>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">Original Transcript</span>
            </div>

            <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-800/80 text-sm leading-relaxed text-gray-300 font-normal">
              "{active.originalTranscript}"
            </div>

            {/* Formative Critique Callouts */}
            <div className="mt-4 space-y-2">
              <span className="text-[11px] font-semibold text-gray-400 block uppercase tracking-wider">
                Coaching Growth Opportunities:
              </span>
              {active.critiqueNotes.map((note, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-amber-300/90 bg-amber-950/20 border border-amber-900/40 p-2.5 rounded-xl"
                >
                  <span className="text-amber-400 font-bold shrink-0">⚠️</span>
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-gray-800 text-[11px] text-gray-500 flex items-center justify-between">
            <span>Competency: <strong className="text-gray-400 capitalize">{active.competency}</strong></span>
            <span>Uncalibrated structure</span>
          </div>
        </div>

        {/* Right: The Felix STAR Rewrite */}
        <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-b from-violet-950/40 to-gray-950 border border-violet-500/50 p-5 shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-violet-800/40">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="font-bold text-sm text-emerald-300">Felix STAR Rewrite (High-Impact)</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                {active.scoreImprovement}
              </span>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              {/* Situation */}
              <div className="p-3 rounded-xl bg-gray-900/80 border border-violet-900/40">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="px-1.5 py-0.2 rounded bg-violet-600/40 text-violet-300 font-bold text-[10px]">
                    S
                  </span>
                  <span className="font-bold text-xs text-violet-200">Situation</span>
                </div>
                <p className="text-gray-300 text-xs leading-relaxed">
                  {active.starRewrite.situation}
                </p>
              </div>

              {/* Task */}
              <div className="p-3 rounded-xl bg-gray-900/80 border border-blue-900/40">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="px-1.5 py-0.2 rounded bg-blue-600/40 text-blue-300 font-bold text-[10px]">
                    T
                  </span>
                  <span className="font-bold text-xs text-blue-200">Task</span>
                </div>
                <p className="text-gray-300 text-xs leading-relaxed">
                  {active.starRewrite.task}
                </p>
              </div>

              {/* Action */}
              <div className="p-3 rounded-xl bg-gray-900/80 border border-indigo-900/40">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="px-1.5 py-0.2 rounded bg-indigo-600/40 text-indigo-300 font-bold text-[10px]">
                    A
                  </span>
                  <span className="font-bold text-xs text-indigo-200">Action</span>
                </div>
                <p className="text-gray-300 text-xs leading-relaxed">
                  {active.starRewrite.action}
                </p>
              </div>

              {/* Result */}
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="px-1.5 py-0.2 rounded bg-emerald-600/40 text-emerald-300 font-bold text-[10px]">
                    R
                  </span>
                  <span className="font-bold text-xs text-emerald-200">Result</span>
                </div>
                <p className="text-emerald-300/90 text-xs leading-relaxed font-medium">
                  {active.starRewrite.result}
                </p>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between">
            <span className="text-[11px] text-emerald-400 font-medium">
              ✓ Ready for Senior Interview Bar
            </span>
            {onPracticeDrill && (
              <button
                onClick={() => onPracticeDrill(active.questionAsked)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-500/25 transition-all flex items-center gap-1.5"
              >
                <span>Practice This Answer</span>
                <span>⚡</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
