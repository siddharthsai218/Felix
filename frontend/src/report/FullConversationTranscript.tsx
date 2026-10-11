'use client';

import React, { useState, useMemo } from 'react';
import type { TranscriptLine, InterviewerArchetype } from '../app/lib/types';
import { INTERVIEWER_ARCHETYPES } from '../app/lib/types';
import { TurnVideoPlayer } from '../app/components/TurnVideoPlayer';

interface FullConversationTranscriptProps {
  sessionId?: string;
  transcriptLines?: TranscriptLine[];
  candidateResponses?: Array<{ questionAsked: string; transcript: string; durationMs?: number }>;
  archetype?: InterviewerArchetype;
  learnerName?: string;
  roleTitle?: string;
}

export function FullConversationTranscript({
  sessionId,
  transcriptLines = [],
  candidateResponses = [],
  archetype = 'supportive-coach',
  learnerName = 'Candidate',
  roleTitle = 'Software Engineer',
}: FullConversationTranscriptProps) {
  const [filter, setFilter] = useState<'all' | 'interviewer' | 'candidate'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const archConfig = INTERVIEWER_ARCHETYPES[archetype] || INTERVIEWER_ARCHETYPES['supportive-coach'];

  const [vaultLines, setVaultLines] = useState<TranscriptLine[]>([]);

  // Resiliently check localStorage and sessionStorage if props are momentarily unhydrated
  React.useEffect(() => {
    if (typeof window !== 'undefined' && (!transcriptLines || transcriptLines.length === 0)) {
      try {
        const rawSess = sessionStorage.getItem('felix_session_transcript');
        if (rawSess) {
          const parsed = JSON.parse(rawSess);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setVaultLines(parsed);
            return;
          }
        }
        if (sessionId) {
          const rawVault = localStorage.getItem('felix_all_transcripts_vault_v1');
          if (rawVault) {
            const vault = JSON.parse(rawVault);
            if (vault[sessionId] && Array.isArray(vault[sessionId]) && vault[sessionId].length > 0) {
              setVaultLines(vault[sessionId]);
              return;
            }
          }
        }
      } catch (e) {}
    }
  }, [sessionId, transcriptLines]);

  // Synthesize normalized dialogue lines from transcriptLines, vault, or candidateResponses
  const effectiveLines: TranscriptLine[] = useMemo(() => {
    if (transcriptLines && transcriptLines.length > 0) {
      return transcriptLines;
    }
    if (vaultLines && vaultLines.length > 0) {
      return vaultLines;
    }

    // Fallback synthesis from candidateResponses
    const lines: TranscriptLine[] = [];
    let responsesSource = candidateResponses;
    if ((!responsesSource || responsesSource.length === 0) && typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem('felix_session_responses');
        if (raw) responsesSource = JSON.parse(raw);
      } catch (e) {}
    }

    (responsesSource || []).forEach((r, idx) => {
      if (r.questionAsked) {
        lines.push({
          lineId: `syn-q-${idx}`,
          speaker: 'interviewer',
          speakerName: archConfig.name,
          text: r.questionAsked,
          timestamp: new Date().toISOString(),
          turnIndex: idx,
          questionIndex: idx + 1,
          type: 'question',
        });
      }
      if (r.transcript) {
        lines.push({
          lineId: `syn-a-${idx}`,
          speaker: 'candidate',
          speakerName: learnerName,
          text: r.transcript,
          timestamp: new Date().toISOString(),
          turnIndex: idx,
          questionIndex: idx + 1,
          type: 'response',
          durationMs: r.durationMs,
        });
      }
    });

    return lines;
  }, [transcriptLines, vaultLines, candidateResponses, archConfig.name, learnerName]);

  const filteredLines = useMemo(() => {
    return effectiveLines.filter((line) => {
      const matchesFilter = filter === 'all' || line.speaker === filter;
      const matchesSearch =
        !searchQuery.trim() ||
        line.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        line.speakerName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [effectiveLines, filter, searchQuery]);

  const handleCopyTranscript = () => {
    const markdown = effectiveLines
      .map((l) => {
        const speaker = l.speaker === 'interviewer' ? `[${l.speakerName}]` : `[${learnerName}]`;
        const timeStr = l.timestamp ? ` (${new Date(l.timestamp).toLocaleTimeString()})` : '';
        return `### ${speaker}${timeStr}\n${l.text}\n`;
      })
      .join('\n');

    navigator.clipboard.writeText(markdown);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2200);
  };

  const handleDownloadTranscript = () => {
    const textData = effectiveLines
      .map((l) => {
        const timeStr = l.timestamp ? ` [${new Date(l.timestamp).toLocaleTimeString()}]` : '';
        return `${l.speakerName}${timeStr}:\n${l.text}\n`;
      })
      .join('\n---\n\n');

    const header = `FELIX AI INTERVIEW CONVERSATION TRANSCRIPT\nSession ID: ${sessionId || 'unknown'}\nTarget Role: ${roleTitle}\nLearner: ${learnerName}\nInterviewer Archetype: ${archConfig.name}\nGenerated: ${new Date().toLocaleString()}\n=======================================================\n\n`;

    const blob = new Blob([header + textData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Felix-Transcript-${sessionId || 'session'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl bg-[#0d131f] border border-slate-800/90 p-5 sm:p-7 shadow-2xl space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-violet-400 text-xs font-mono">📜</span>
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-violet-400">
              COMPLETE DIALOGUE ARCHIVE
            </span>
            <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-mono border border-violet-500/30">
              {effectiveLines.length} Spoken Utterances
            </span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            Full Interview Conversation Transcript
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological turn-by-turn dialogue archive permanently stored in local memory and cloud audit logs.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyTranscript}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-mono font-medium transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Copy markdown transcript to clipboard"
          >
            <span>{isCopied ? '✓' : '📋'}</span>
            <span>{isCopied ? 'Copied to Clipboard!' : 'Copy Transcript'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadTranscript}
            className="px-3 py-1.5 rounded-lg bg-violet-950/70 hover:bg-violet-900/80 text-violet-200 border border-violet-700/60 text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Download plain text conversation transcript"
          >
            <span>💾</span>
            <span>Export .TXT</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white text-xs font-mono transition-colors"
          >
            {isExpanded ? 'Collapse ▴' : 'Expand ▾'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Controls: Search & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 bg-[#080d16] p-1 rounded-xl border border-slate-800/80">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                All Dialogue ({effectiveLines.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('interviewer')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                  filter === 'interviewer'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Interviewer ({effectiveLines.filter((l) => l.speaker === 'interviewer').length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('candidate')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                  filter === 'candidate'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                Candidate ({effectiveLines.filter((l) => l.speaker === 'candidate').length})
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search dialogue words..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 px-3.5 py-1.5 rounded-xl bg-[#080d16] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/80 font-mono transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-xs text-slate-500 hover:text-white font-mono"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Dialogue Feed */}
          <div className="space-y-3.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredLines.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-[#080d16] border border-slate-800/60 text-slate-500 text-xs font-mono">
                No matching dialogue lines found for "{searchQuery}".
              </div>
            ) : (
              filteredLines.map((line, idx) => {
                const isInterviewer = line.speaker === 'interviewer';
                const isDrill = line.type === 'drill';
                const isHint = line.type === 'hint';
                const isFollowup = line.type === 'followup';

                return (
                  <div
                    key={line.lineId || idx}
                    className={`flex items-start gap-3 ${isInterviewer ? '' : 'pl-3 sm:pl-8'}`}
                  >
                    {/* Avatar Icon */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold font-mono text-white shrink-0 mt-0.5 shadow-md ${
                        isInterviewer
                          ? isHint
                            ? 'bg-amber-600'
                            : isDrill
                            ? 'bg-cyan-600'
                            : 'bg-violet-600'
                          : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isInterviewer ? (isHint ? '💡' : isDrill ? '🎯' : archConfig.icon) : 'YOU'}
                    </div>

                    {/* Speech Bubble */}
                    <div
                      className={`flex-1 rounded-xl p-3.5 sm:p-4 text-xs leading-relaxed space-y-1.5 shadow-sm ${
                        isInterviewer
                          ? isHint
                            ? 'bg-amber-950/30 border border-amber-800/50 text-amber-100'
                            : isDrill
                            ? 'bg-cyan-950/30 border border-cyan-800/50 text-cyan-100'
                            : 'bg-violet-950/30 border border-violet-800/40 text-violet-100'
                          : 'bg-[#090e18] border border-slate-800 text-slate-200'
                      }`}
                    >
                      {/* Bubble Metadata Header */}
                      <div className="flex items-center justify-between text-[10px] font-mono pb-1 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold uppercase tracking-wider ${
                              isInterviewer
                                ? isHint
                                  ? 'text-amber-400'
                                  : isDrill
                                  ? 'text-cyan-400'
                                  : 'text-violet-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {isInterviewer
                              ? isHint
                                ? 'Coach Hint'
                                : isDrill
                                ? 'Micro-Drill Coaching'
                                : isFollowup
                                ? 'Follow-Up Probe'
                                : `${line.speakerName || 'Interviewer'} Question ${line.questionIndex || ''}`
                              : `Candidate Spoken Answer`}
                          </span>

                          {!isInterviewer && line.durationMs && (
                            <span className="text-slate-500">
                              ⏱️ {Math.round(line.durationMs / 1000)}s turn
                            </span>
                          )}
                        </div>

                        {line.timestamp && (
                          <span className="text-slate-500 font-mono">
                            {new Date(line.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        )}
                      </div>

                      {/* Verbatim Spoken Text */}
                      <p className="whitespace-pre-wrap text-xs sm:text-[13px] leading-relaxed pt-1">
                        {line.text}
                      </p>

                      {/* Video Player if candidate response has associated turn */}
                      {!isInterviewer && sessionId && (
                        <div className="pt-2">
                          <TurnVideoPlayer
                            sessionId={sessionId}
                            responseIndex={line.turnIndex > 0 ? line.turnIndex - 1 : 0}
                            turnLabel={line.questionIndex ? `Question ${line.questionIndex}` : `Turn ${line.turnIndex || 1}`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
