'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getHistoricalSessions,
  deleteHistoricalSession,
  clearAllHistoricalSessions,
  type HistoricalSession,
} from '../../lib/history-store';
import { exportHistoricalSessionToPdf } from '../../lib/pdf-exporter';
import { TurnVideoPlayer } from '../../components/TurnVideoPlayer';

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<HistoricalSession[]>([]);
  const [selectedLearner, setSelectedLearner] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTranscriptSession, setActiveTranscriptSession] = useState<HistoricalSession | null>(null);
  const [copiedTranscript, setCopiedTranscript] = useState<boolean>(false);

  // Load sessions on mount
  useEffect(() => {
    const list = getHistoricalSessions();
    setSessions(list);
  }, []);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      const matchesLearner =
        selectedLearner === 'all' ||
        session.learnerId.toLowerCase() === selectedLearner.toLowerCase();

      const matchesSearch =
        searchQuery.trim() === '' ||
        session.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.sessionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.responses.some(r =>
          r.questionAsked.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.transcript.toLowerCase().includes(searchQuery.toLowerCase())
        );

      return matchesLearner && matchesSearch;
    });
  }, [sessions, selectedLearner, searchQuery]);

  // Unique learners for filter
  const learners = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach(s => {
      if (s.learnerId) set.add(s.learnerId);
    });
    return Array.from(set);
  }, [sessions]);

  // Aggregated stats
  const averageScore = useMemo(() => {
    if (filteredSessions.length === 0) return 0;
    const sum = filteredSessions.reduce((acc, s) => acc + s.overallScore, 0);
    return (sum / filteredSessions.length).toFixed(1);
  }, [filteredSessions]);

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (confirm('Delete this interview record from history?')) {
      deleteHistoricalSession(sessionId);
      setSessions(getHistoricalSessions());
      if (activeTranscriptSession?.sessionId === sessionId) {
        setActiveTranscriptSession(null);
      }
    }
  };

  const handleCopyTranscript = (session: HistoricalSession) => {
    let text = '';
    if (session.transcriptLines && session.transcriptLines.length > 0) {
      text = session.transcriptLines
        .map((l, i) => {
          const speakerLabel = l.speaker === 'interviewer' ? 'Felix (Interviewer)' : 'Candidate';
          const typeTag = l.type ? ` [${l.type.toUpperCase()}]` : '';
          return `${speakerLabel}${typeTag}:\n"${l.text}"\n`;
        })
        .join('\n');
    } else {
      text = session.responses
        .map(
          (r, i) =>
            `[Question ${i + 1}]\nInterviewer: "${r.questionAsked}"\n\nCandidate Response:\n"${r.transcript}"\n`
        )
        .join('\n---\n\n');
    }

    navigator.clipboard.writeText(text);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  return (
    <main className="min-h-screen bg-[#070b12] text-white flex flex-col selection:bg-violet-500/30">
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* Top Header Bar                                                            */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <header className="w-full bg-[#090d16] border-b border-slate-800/80 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-violet-500/20">
                F
              </div>
              <span className="font-extrabold text-sm tracking-wider uppercase text-white font-mono">
                FELIX AI
              </span>
            </Link>

            <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-950/50 border border-violet-800/40 text-[10px] font-mono text-violet-300">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              <span>INTERVIEW SESSION ARCHIVE</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/session/history"
              className="px-3 py-1 rounded-lg bg-slate-800 text-xs font-mono text-white border border-slate-700 transition-colors"
            >
              History
            </Link>
            <Link
              href="/session/setup"
              className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-mono font-bold text-white shadow-md shadow-violet-500/20 transition-all"
            >
              + New Interview
            </Link>
          </div>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* Main Container                                                            */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10 flex-1 space-y-8">
        {/* Title & Description */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-950/50 border border-cyan-800/40 text-cyan-300 text-[11px] font-mono mb-2">
              <span>Formative Skill Progression</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Rehearsal History & Transcripts
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Track longitudinal interview performance across technical depth, STAR structure, and non-verbal behavioral poise.
            </p>
          </div>

          {/* Quick Filter Pill Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Learner:</span>
            <div className="inline-flex p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => setSelectedLearner('all')}
                className={`px-3 py-1 rounded-md transition-all ${
                  selectedLearner === 'all'
                    ? 'bg-violet-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              {learners.map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setSelectedLearner(l)}
                  className={`px-3 py-1 rounded-md transition-all ${
                    selectedLearner === l
                      ? 'bg-violet-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────────── */}
        {/* Summary Ribbon (3 Metric Cards - Clean & Uncluttered)                   */}
        {/* ─────────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Total Sessions Completed
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1 font-mono">
              {filteredSessions.length} <span className="text-sm font-normal text-slate-500">interviews</span>
            </div>
            <div className="text-[11px] text-emerald-400/90 mt-1 flex items-center gap-1 font-mono">
              <span>● Complete transcripts archived</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Average Mastery Score
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1 font-mono flex items-baseline gap-2">
              <span className="text-violet-400">{averageScore}</span>
              <span className="text-xs text-slate-500 font-normal">/ 5.0</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              Rubric weighted average
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Latest Target Track
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-200 mt-1.5 truncate">
              {filteredSessions[0]?.roleTitle || 'No sessions yet'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              {filteredSessions[0]
                ? new Date(filteredSessions[0].createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—'}
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────────── */}
        {/* Search & Actions Bar                                                    */}
        {/* ─────────────────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search by role or question..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
            <span className="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
          </div>

          <div className="text-xs font-mono text-slate-500 self-end sm:self-center">
            Showing {filteredSessions.length} of {sessions.length} sessions
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────────── */}
        {/* Session Timeline Cards                                                  */}
        {/* ─────────────────────────────────────────────────────────────────────── */}
        {filteredSessions.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 space-y-4">
            <div className="text-3xl">📋</div>
            <h3 className="text-base font-bold text-slate-300">No interview sessions found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Complete an interview rehearsal to automatically generate and save your report, transcript, and behavioral analytics.
            </p>
            <Link
              href="/session/setup"
              className="inline-block px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-mono font-bold text-white transition-all shadow-md shadow-violet-500/20"
            >
              Start Rehearsal Now →
            </Link>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredSessions.map((session, index) => {
              const formattedDate = new Date(session.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              const isHigh = session.overallScore >= 4.0;
              const isMid = session.overallScore >= 3.0 && session.overallScore < 4.0;

              return (
                <div
                  key={session.sessionId}
                  className="p-4 sm:p-5 rounded-xl bg-slate-900/70 border border-slate-800/90 hover:border-violet-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group shadow-sm hover:shadow-md hover:shadow-violet-950/20"
                >
                  {/* Left: Role, Date, Tags */}
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                        {session.sessionId}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                        👤 {session.learnerId || 'Candidate'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {formattedDate}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-violet-300 transition-colors">
                      {session.roleTitle}
                    </h3>

                    {/* Quick Metrics / Behavioral Highlights */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span className="text-[11px] font-mono text-slate-400">
                        💬 {session.responses.length} Question{session.responses.length !== 1 ? 's' : ''}
                      </span>
                      {session.telemetry?.gazePercentage && (
                        <span className="text-[11px] font-mono text-slate-400">
                          👁️ {session.telemetry.gazePercentage}% Gaze
                        </span>
                      )}
                      {session.telemetry?.speakingRateWpm && (
                        <span className="text-[11px] font-mono text-slate-400">
                          🗣️ {session.telemetry.speakingRateWpm} WPM
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle: Score Badge */}
                  <div className="flex items-center gap-4 sm:border-l sm:border-slate-800 sm:pl-6 shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">
                        Mastery Score
                      </div>
                      <div
                        className={`text-xl font-black font-mono ${
                          isHigh
                            ? 'text-emerald-400'
                            : isMid
                            ? 'text-violet-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {session.overallScore.toFixed(1)} <span className="text-xs text-slate-500 font-normal">/ 5.0</span>
                      </div>
                      {session.progression && session.progression.hasPriorSession && (
                        <div
                          className={`text-[10px] font-mono font-bold mt-0.5 ${
                            session.progression.trend === 'improved'
                              ? 'text-emerald-400'
                              : session.progression.trend === 'needs_calibration'
                              ? 'text-amber-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {session.progression.scoreDelta > 0
                            ? `▲ +${session.progression.scoreDelta.toFixed(1)} Growth`
                            : session.progression.scoreDelta < 0
                            ? `▼ ${session.progression.scoreDelta.toFixed(1)} Dip`
                            : '● Baseline'}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => exportHistoricalSessionToPdf(session)}
                        className="px-2.5 py-1.5 rounded-lg bg-violet-950/80 hover:bg-violet-900 border border-violet-700/60 text-xs font-mono font-bold text-violet-300 transition-colors flex items-center gap-1 shadow-sm"
                        title="Download Executive Coaching PDF"
                      >
                        <span>📄</span>
                        <span>PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTranscriptSession(session)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 transition-colors"
                        title="Read full turn-by-turn dialogue"
                      >
                        Transcript
                      </button>

                      <Link
                        href={`/session/report?sessionId=${session.sessionId}&fromHistory=true`}
                        className="px-3.5 py-1.5 rounded-lg bg-violet-600/90 hover:bg-violet-600 text-xs font-mono font-bold text-white shadow-sm transition-all"
                      >
                        Full Report →
                      </Link>

                      <button
                        type="button"
                        onClick={e => handleDelete(e, session.sessionId)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        title="Delete session"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* Interactive Transcript Modal                                              */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {activeTranscriptSession && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveTranscriptSession(null)}
          onKeyDown={e => {
            if (e.key === 'Escape') setActiveTranscriptSession(null);
          }}
          tabIndex={-1}
        >
          <div
            className="bg-[#0b101c] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800/90 flex items-center justify-between bg-slate-900/50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                    {activeTranscriptSession.sessionId}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {new Date(activeTranscriptSession.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-1">
                  Full Interview Transcript — {activeTranscriptSession.roleTitle}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportHistoricalSessionToPdf(activeTranscriptSession)}
                  className="px-2.5 py-1 rounded bg-violet-950/80 hover:bg-violet-900 border border-violet-700/60 text-xs font-mono font-bold text-violet-300 transition-colors flex items-center gap-1 shadow-sm"
                  title="Download Formative Assessment PDF"
                >
                  <span>📄</span>
                  <span>PDF Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyTranscript(activeTranscriptSession)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 transition-colors"
                >
                  {copiedTranscript ? '✓ Copied' : 'Copy All'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTranscriptSession(null)}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body: Dialogue Transcript */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 font-sans">
              {activeTranscriptSession.transcriptLines && activeTranscriptSession.transcriptLines.length > 0 ? (
                // Full verbatim dialogue stream
                <div className="space-y-4">
                  {activeTranscriptSession.transcriptLines.map((line, idx) => {
                    const isInterviewer = line.speaker === 'interviewer';
                    const isHint = line.type === 'hint';
                    const isDrill = line.type === 'drill';

                    return (
                      <div
                        key={line.lineId || idx}
                        className={`flex items-start gap-3 ${isInterviewer ? '' : 'pl-4'}`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold font-mono text-white shrink-0 mt-0.5 shadow-sm ${
                            isInterviewer
                              ? isHint
                                ? 'bg-amber-600'
                                : isDrill
                                ? 'bg-cyan-600'
                                : 'bg-violet-600'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {isInterviewer ? (isHint ? '💡' : 'F') : 'YOU'}
                        </div>

                        <div
                          className={`flex-1 rounded-xl p-3.5 text-xs leading-relaxed space-y-1.5 ${
                            isInterviewer
                              ? isHint
                                ? 'bg-amber-950/40 border border-amber-800/40 text-amber-100'
                                : 'bg-violet-950/30 border border-violet-800/40 text-violet-100'
                              : 'bg-slate-900/90 border border-slate-800 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span
                              className={`font-bold uppercase tracking-wider ${
                                isInterviewer
                                  ? isHint
                                    ? 'text-amber-400'
                                    : 'text-violet-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              {isInterviewer
                                ? isHint
                                  ? 'Coach Hint'
                                  : isDrill
                                  ? 'Micro-Drill Challenge'
                                  : `Interviewer Turn ${idx + 1}`
                                : 'Candidate Response'}
                            </span>
                            {line.timestamp && (
                              <span className="text-slate-500">
                                {new Date(line.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </span>
                            )}
                          </div>

                          <p className="whitespace-pre-wrap">{line.text}</p>

                          {!isInterviewer && (
                            <TurnVideoPlayer
                              sessionId={activeTranscriptSession.sessionId}
                              responseIndex={line.turnIndex > 0 ? line.turnIndex - 1 : 0}
                              turnLabel={line.questionIndex ? `Question ${line.questionIndex}` : `Turn ${line.turnIndex || 1}`}
                              className="pt-2"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Fallback turn responses
                activeTranscriptSession.responses.map((turn, idx) => (
                  <div key={idx} className="space-y-3">
                    {/* Interviewer Question Bubble */}
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-bold font-mono text-white shrink-0 mt-0.5">
                        F
                      </div>
                      <div className="flex-1 bg-violet-950/30 border border-violet-800/40 rounded-xl p-3.5 text-xs text-violet-100 leading-relaxed">
                        <div className="text-[10px] font-mono text-violet-400 font-bold mb-1 uppercase tracking-wider">
                          Interviewer Question {idx + 1}
                        </div>
                        {turn.questionAsked}
                      </div>
                    </div>

                    {/* Candidate Answer Bubble */}
                    <div className="flex items-start gap-3 pl-4">
                      <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold font-mono text-slate-300 shrink-0 mt-0.5">
                        YOU
                      </div>
                      <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 leading-relaxed space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span>Spoken Transcript</span>
                          {turn.durationMs && (
                            <span>{(turn.durationMs / 1000).toFixed(1)}s turn</span>
                          )}
                        </div>
                        <p className="text-slate-200">{turn.transcript}</p>

                        <TurnVideoPlayer
                          sessionId={activeTranscriptSession.sessionId}
                          responseIndex={idx}
                          turnLabel={`Question ${idx + 1}`}
                          className="pt-2"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500">
                  Score: <strong className="text-violet-400">{activeTranscriptSession.overallScore.toFixed(1)}/5.0</strong>
                </span>
                {activeTranscriptSession.progression && activeTranscriptSession.progression.hasPriorSession && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      activeTranscriptSession.progression.trend === 'improved'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                        : activeTranscriptSession.progression.trend === 'needs_calibration'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {activeTranscriptSession.progression.scoreDelta > 0
                      ? `▲ +${activeTranscriptSession.progression.scoreDelta.toFixed(1)} vs Prior`
                      : activeTranscriptSession.progression.scoreDelta < 0
                      ? `▼ ${activeTranscriptSession.progression.scoreDelta.toFixed(1)} vs Prior`
                      : '● Steady'}
                  </span>
                )}
              </div>

              <Link
                href={`/session/report?sessionId=${activeTranscriptSession.sessionId}&fromHistory=true`}
                className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-mono font-bold text-white transition-colors"
              >
                Go to Evaluation Report →
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
