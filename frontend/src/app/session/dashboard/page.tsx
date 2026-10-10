'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function DashboardContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId') || 'demo';

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6 sm:p-12 flex flex-col justify-between">
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between pb-6 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-xl shadow">
            🎓
          </div>
          <div>
            <h1 className="font-bold text-base">Felix</h1>
            <p className="text-[11px] text-gray-500">Session ID: {sessionId}</p>
          </div>
        </Link>
        <div className="flex gap-3">
          <Link
            href={`/session/report?sessionId=${sessionId}`}
            className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-xs text-gray-300 border border-gray-800 transition-colors"
          >
            Feedback Report →
          </Link>
          <Link
            href="/session/setup"
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs text-white font-semibold transition-colors"
          >
            New Session
          </Link>
        </div>
      </header>

      {/* Route slot for Part 2 */}
      <div className="max-w-4xl mx-auto w-full my-12 text-center">
        <div className="p-8 rounded-3xl bg-gray-900/60 border border-gray-800 backdrop-blur-sm">
          <div className="text-5xl mb-4">📈</div>
          <h2 className="text-2xl font-bold mb-2">Behavioral Telemetry Dashboard</h2>
          <p className="text-gray-400 text-sm max-w-lg mx-auto mb-6">
            This route slot displays gaze estimation (MediaPipe), vocal jitter/shimmer and pause timelines (Parselmouth).
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs">
            <span>Part 2 Integration Point:</span>
            <code className="text-[11px] font-mono text-white">frontend/src/behavioral/</code>
          </div>
        </div>
      </div>

      <footer className="max-w-5xl mx-auto w-full text-center text-xs text-gray-600 pt-6 border-t border-gray-900">
        Felix EdTech Hackathon Architecture
      </footer>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading Dashboard…</div>}>
      <DashboardContent />
    </Suspense>
  );
}
