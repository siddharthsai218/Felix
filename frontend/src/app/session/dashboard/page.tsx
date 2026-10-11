'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BehavioralDashboard } from '../../../behavioral';

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
            href="/session/history"
            className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-xs text-gray-300 border border-gray-800 transition-colors"
          >
            Interview History 📜
          </Link>
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

      {/* Live Behavioral Telemetry Dashboard (Part 2) */}
      <div className="max-w-6xl mx-auto w-full my-8">
        <div className="bg-slate-100 rounded-3xl p-4 sm:p-6 shadow-2xl border border-gray-800">
          <BehavioralDashboard />
        </div>
      </div>

      
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
