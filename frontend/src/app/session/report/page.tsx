'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { DrillModal } from '../../components/DrillModal';
import type { DrillSpec } from '../../lib/types';

function ReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('sessionId') || 'demo-session';

  const [drillModalOpen, setDrillModalOpen] = useState(false);
  const [activeDrill, setActiveDrill] = useState<DrillSpec | null>(null);

  // Fallback demo drill per AGENTS.md § Sequencing & risk patches
  useEffect(() => {
    setActiveDrill({
      drillId: 'demo-p0-drill-1',
      sessionId,
      responseIndex: 0,
      targetLearningOutcome: 'Apply the STAR method to behavioral questions',
      targetCompetency: 'communication',
      gapSeverity: 'high',
      question:
        'Tell me about a time you had to debug a critical production issue under pressure. Use the STAR method.',
      timeLimitSeconds: 30,
      hints: [
        'Start with Situation: set the scene briefly in 1 sentence',
        'Describe the specific Task you were responsible for',
        'Focus on YOUR Actions — what tools and fixes did you run?',
        'End with the measurable Result (e.g. 99.9% uptime restored)',
      ],
    });
  }, [sessionId]);

  const handleStartDrill = (drillId: string) => {
    // Navigate back to live session in drill mode
    router.push(`/session/live?drillId=${drillId}&sessionId=${sessionId}`);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6 sm:p-12 flex flex-col justify-between">
      {/* Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between pb-6 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-xl shadow">
            🎓
          </div>
          <div>
            <h1 className="font-bold text-base">Felix</h1>
            <p className="text-[11px] text-gray-500">Formative Assessment Report</p>
          </div>
        </Link>
        <div className="flex gap-3">
          <Link
            href={`/session/dashboard?sessionId=${sessionId}`}
            className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-xs text-gray-300 border border-gray-800 transition-colors"
          >
            Telemetry Graphs →
          </Link>
          <Link
            href="/session/setup"
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs text-white font-semibold transition-colors"
          >
            New Session
          </Link>
        </div>
      </header>

      {/* Main Report Body / Route Slot */}
      <div className="max-w-4xl mx-auto w-full my-8 space-y-6">
        {/* Banner with One-Click Drill [1+3] Demonstration */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-violet-950/70 via-gray-900 to-indigo-950/70 border border-violet-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
                P0 Learning Loop Integration
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                [1+3] Drill Handshake
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">Targeted Remediation Drill</h3>
            <p className="text-xs text-gray-300 max-w-md mt-1">
              Felix mapped your answer to a communication gap. Run a 30-second targeted micro-drill to retry and visibly improve your score.
            </p>
          </div>

          <button
            onClick={() => setDrillModalOpen(true)}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-violet-500/30 transition-all flex items-center gap-2 flex-shrink-0"
          >
            <span>Practice This Weak Area</span>
            <span>⚡</span>
          </button>
        </div>

        {/* Route slot for Part 3 content */}
        <div className="p-8 rounded-3xl bg-gray-900/60 border border-gray-800 text-center">
          <div className="text-4xl mb-3">🌟</div>
          <h2 className="text-xl font-bold mb-2">Answer Transformer & Rubric Scoring</h2>
          <p className="text-gray-400 text-xs max-w-md mx-auto mb-4">
            This route slot hosts the side-by-side STAR Rewrite ("What you said" vs. "The Felix STAR Rewrite") and criterion-level rubric evaluation.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
            <span>Part 3 Integration Point:</span>
            <code className="text-[11px] font-mono text-white">frontend/src/report/</code>
          </div>
        </div>
      </div>

      <footer className="max-w-5xl mx-auto w-full text-center text-xs text-gray-600 pt-6 border-t border-gray-900">
        Felix is an EdTech career-readiness learning tool.
      </footer>

      {/* 30s Micro-Drill Modal */}
      <DrillModal
        isOpen={drillModalOpen}
        drill={activeDrill}
        onStartDrill={handleStartDrill}
        onCancel={() => setDrillModalOpen(false)}
      />
    </main>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading Report…</div>}>
      <ReportContent />
    </Suspense>
  );
}
