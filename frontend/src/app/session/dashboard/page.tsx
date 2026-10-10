'use client';

import React, { Suspense, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  BehavioralDashboard,
  buildSignalRecordFromSession,
  type BehavioralSignalRecord,
  type StoredTelemetryData,
  type StoredResponseRecord,
} from '../../../behavioral';

function DashboardContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId') || 'demo';

  const [roleTitle, setRoleTitle] = useState<string>('Software Engineer');
  const [telemetry, setTelemetry] = useState<StoredTelemetryData | null>(null);
  const [responses, setResponses] = useState<StoredResponseRecord[]>([]);
  const [selectedResponseIndex, setSelectedResponseIndex] = useState<number>(0);
  const [hasRealData, setHasRealData] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedRole = sessionStorage.getItem('felix_session_role') || 'Software Engineer';
    setRoleTitle(storedRole);

    let parsedTelem: StoredTelemetryData | null = null;
    let parsedResps: StoredResponseRecord[] = [];

    try {
      const rawTelem = sessionStorage.getItem('felix_session_telemetry');
      if (rawTelem) {
        parsedTelem = JSON.parse(rawTelem);
      }
    } catch (e) {
      console.warn('Error reading stored telemetry:', e);
    }

    try {
      const rawResps = sessionStorage.getItem('felix_session_responses');
      if (rawResps) {
        parsedResps = JSON.parse(rawResps);
      }
    } catch (e) {
      console.warn('Error reading stored responses:', e);
    }

    setTelemetry(parsedTelem);
    setResponses(parsedResps);

    const hasResponses = Array.isArray(parsedResps) && parsedResps.length > 0;
    const hasTelemetry = Boolean(parsedTelem && (parsedTelem.gazePercentage !== undefined || parsedTelem.speakingRateWpm));
    setHasRealData(hasResponses || hasTelemetry);

    // Also attempt to fetch signals from backend if available
    if (sessionId && sessionId !== 'demo') {
      fetch(`/api/sessions/${sessionId}/signals`)
        .then((res) => (res.ok ? res.json() : null))
        .then((serverSignals) => {
          if (serverSignals && Object.keys(serverSignals).length > 0) {
            console.log('Loaded server-side signals:', serverSignals);
          }
        })
        .catch(() => {});
    }
  }, [sessionId]);

  // Dynamically compute the signal record from the candidate's actual interview data
  const dynamicRecord: BehavioralSignalRecord = useMemo(() => {
    return buildSignalRecordFromSession(
      telemetry,
      responses,
      sessionId,
      selectedResponseIndex
    );
  }, [telemetry, responses, sessionId, selectedResponseIndex]);

  const activeResponse = responses[selectedResponseIndex] || responses[0] || null;

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4 sm:p-8 flex flex-col justify-between">
      {/* Top Header */}
      <header className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-800 gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-xl shadow">
            🎓
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base">Felix</h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-950/80 text-violet-300 border border-violet-800/60">
                {roleTitle}
              </span>
            </div>
            <p className="text-[11px] text-gray-500">Session ID: {sessionId}</p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/session/history"
            className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-xs text-gray-300 border border-gray-800 transition-colors"
          >
            Interview History 📜
          </Link>
          <Link
            href={`/session/report?sessionId=${sessionId}`}
            className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-xs text-gray-300 border border-gray-800 transition-colors flex items-center gap-1.5"
          >
            <span>📋</span>
            <span>Evaluation Report →</span>
          </Link>
          <Link
            href="/session/setup"
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs text-white font-semibold transition-colors"
          >
            New Session
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto w-full my-6 space-y-6">
        {/* Real Data Provenance Banner */}
        <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
          hasRealData
            ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
            : 'bg-indigo-950/30 border-indigo-800/60 text-indigo-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full animate-pulse ${hasRealData ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
            <div>
              <p className="text-xs font-semibold">
                {hasRealData
                  ? 'Grounded in Candidate Interview Telemetry'
                  : 'Demonstration Telemetry Fixture'}
              </p>
              <p className="text-[11px] opacity-80">
                {hasRealData
                  ? `Telemetry reflects your camera gaze (${dynamicRecord.gaze.eye_contact_pct}% focus), speech cadence (${dynamicRecord.prosody.speaking_rate_wpm} WPM), and vocal jitter (${dynamicRecord.prosody.jitter_percent}%).`
                  : 'Complete an interview session to calibrate personal MediaPipe eye-tracking and Web Audio prosody.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-black/40 border border-current opacity-75">
              MediaPipe Vision + WebAudio + STT
            </span>
          </div>
        </div>

        {/* Turn Selector & Spoken Transcript Bar (if candidate answered questions) */}
        {responses.length > 0 && (
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Interview Turns:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {responses.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedResponseIndex(idx)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        selectedResponseIndex === idx
                          ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                          : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-750'
                      }`}
                    >
                      Question {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
              {activeResponse?.durationMs && (
                <span className="text-xs text-gray-400 font-mono">
                  Duration: {Math.round(activeResponse.durationMs / 1000)}s
                </span>
              )}
            </div>

            {activeResponse && (
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-semibold text-violet-400">Interviewer Question: </span>
                  <span className="text-gray-200">{activeResponse.questionAsked || 'Technical Interview Question'}</span>
                </div>
                {activeResponse.transcript && (
                  <div className="bg-gray-950/60 p-3 rounded-xl border border-gray-800/70">
                    <span className="font-semibold text-emerald-400">Your Spoken Answer: </span>
                    <span className="text-gray-300 italic">"{activeResponse.transcript}"</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Behavioral Coaching Dashboard Component */}
        <div className="bg-slate-100 rounded-3xl p-4 sm:p-6 shadow-2xl border border-gray-800">
          <BehavioralDashboard record={dynamicRecord} />
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full pt-6 pb-2 border-t border-gray-900 text-center text-xs text-gray-500">
        Felix EdTech Coaching Platform • Behavioral signals are formative coaching cues, never evaluation penalties.
      </footer>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
          Loading Behavioral Telemetry Dashboard…
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
