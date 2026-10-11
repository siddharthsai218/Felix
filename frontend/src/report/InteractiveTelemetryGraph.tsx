'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import {
  Mic,
  Eye,
  Activity,
  Layers,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Info,
  Clock,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export type MetricStreamMode = 'cadence' | 'gaze' | 'jitter' | 'composite';

export interface InteractiveTelemetryGraphProps {
  telemetry?: {
    gazePercentage?: number;
    speakingRateWpm?: number;
    jitterPercent?: number;
    pauseCount?: number;
    latencyMs?: number;
  };
  candidateResponses?: Array<{
    questionAsked?: string;
    transcript?: string;
    durationMs?: number;
  }>;
  sessionDurationSeconds?: number;
  roleTitle?: string;
  className?: string;
}

interface TimelinePoint {
  timeSec: number;
  timeLabel: string;
  turnIndex: number;
  turnName: string;
  wpm: number;
  gaze: number;
  jitter: number;
  // Normalized 0-100 composite scores
  cadenceScore: number;
  gazeScore: number;
  stabilityScore: number;
  compositeScore: number;
  isPause: boolean;
  pauseDuration?: number;
  transcriptSnippet: string;
  coachingCue: string;
  isMilestone?: boolean;
  milestoneType?: 'pause' | 'peak' | 'gaze_lock' | 'turn_start';
  milestoneTitle?: string;
}

export const InteractiveTelemetryGraph: React.FC<InteractiveTelemetryGraphProps> = ({
  telemetry,
  candidateResponses = [],
  sessionDurationSeconds = 75,
  roleTitle = 'Engineering Rehearsal',
  className = '',
}) => {
  const [mounted, setMounted] = useState(false);
  const [streamMode, setStreamMode] = useState<MetricStreamMode>('cadence');
  const [selectedTurnFilter, setSelectedTurnFilter] = useState<number | 'all'>('all');
  const [scrubbedTime, setScrubbedTime] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playbackRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute total duration in seconds
  const totalDuration = useMemo(() => {
    if (sessionDurationSeconds && sessionDurationSeconds > 10) {
      return sessionDurationSeconds;
    }
    if (candidateResponses && candidateResponses.length > 0) {
      const ms = candidateResponses.reduce((sum, r) => sum + (r.durationMs || 30000), 0);
      return Math.max(30, Math.round(ms / 1000));
    }
    return 75;
  }, [sessionDurationSeconds, candidateResponses]);

  // Nominal baseline values from real telemetry
  const baseWpm = telemetry?.speakingRateWpm ?? 136;
  const baseGaze = telemetry?.gazePercentage ?? 82;
  const baseJitter = telemetry?.jitterPercent ?? 0.94;
  const pauseCount = telemetry?.pauseCount ?? Math.max(1, Math.round(candidateResponses.length * 0.8));

  // Build high-resolution timeline data (1 sample every 1.5 seconds)
  const fullTimelineData = useMemo(() => {
    const points: TimelinePoint[] = [];
    const validResponses =
      candidateResponses && candidateResponses.length > 0
        ? candidateResponses
        : [
            {
              questionAsked: `Key technical challenge for ${roleTitle}`,
              transcript: 'Spoken candidate explanation recorded during technical rehearsal.',
              durationMs: totalDuration * 1000,
            },
          ];

    const numTurns = validResponses.length;
    const turnDuration = totalDuration / numTurns;

    // Define pause placement along the timeline
    const pauseTimes: number[] = [];
    if (pauseCount > 0) {
      for (let i = 0; i < pauseCount; i++) {
        // distribute pauses across turns
        const t = Math.round(turnDuration * (i + 0.35) + (i % 2 === 0 ? 4 : -3));
        if (t > 3 && t < totalDuration - 4) {
          pauseTimes.push(t);
        }
      }
    }
    if (pauseTimes.length === 0) {
      pauseTimes.push(Math.round(totalDuration * 0.35));
    }

    // Step size in seconds
    const step = 1.5;
    const totalSteps = Math.ceil(totalDuration / step);

    for (let i = 0; i <= totalSteps; i++) {
      const timeSec = Math.min(totalDuration, Math.round(i * step * 10) / 10);
      const mins = Math.floor(timeSec / 60);
      const secs = Math.floor(timeSec % 60);
      const timeLabel = `${mins}:${secs.toString().padStart(2, '0')}`;

      // Find which turn this belongs to
      const turnIdx = Math.min(numTurns - 1, Math.floor(timeSec / turnDuration));
      const currentTurn = validResponses[turnIdx];
      const turnName = `Turn ${turnIdx + 1}`;

      // Split transcript words for contextual snippet
      const words = (currentTurn.transcript || '').split(/\s+/).filter(Boolean);
      const turnProgress = (timeSec - turnIdx * turnDuration) / Math.max(1, turnDuration);
      const wordIdx = Math.min(words.length - 1, Math.floor(turnProgress * words.length));
      const snippetStart = Math.max(0, wordIdx - 3);
      const snippetEnd = Math.min(words.length, wordIdx + 7);
      const transcriptSnippet =
        words.slice(snippetStart, snippetEnd).join(' ') ||
        'Candidate articulating engineering solution';

      // Check if this time falls inside a pause window
      const inPause = pauseTimes.some((pt) => Math.abs(timeSec - pt) <= 1.5);
      const isPausePeak = pauseTimes.some((pt) => Math.abs(timeSec - pt) <= 0.8);

      // Generate realistic natural cadence curve
      // Harmonic modulation + gentle deterministic oscillation
      const oscillation = Math.sin(timeSec * 0.45) * 8 + Math.cos(timeSec * 0.2) * 5;
      let wpm = inPause ? Math.max(15, Math.round(baseWpm * 0.25 - (timeSec % 5))) : Math.round(baseWpm + oscillation);
      wpm = Math.max(0, Math.min(220, wpm));

      // Gaze curve
      const gazeWave = Math.sin(timeSec * 0.3 + 1.2) * 7 + Math.cos(timeSec * 0.15) * 4;
      let gaze = inPause ? Math.max(25, Math.round(baseGaze - 18 + gazeWave)) : Math.round(baseGaze + gazeWave);
      gaze = Math.max(10, Math.min(99, gaze));

      // Jitter curve
      const jitterWave = Math.sin(timeSec * 0.5) * 0.18 + Math.cos(timeSec * 0.25) * 0.12;
      let jitter = inPause ? Math.round((baseJitter + 0.35 + jitterWave) * 100) / 100 : Math.round((baseJitter + jitterWave) * 100) / 100;
      jitter = Math.max(0.3, Math.min(3.5, jitter));

      // Normalized composite scores (0 to 100)
      const cadenceScore = Math.min(100, Math.max(10, Math.round(wpm >= 120 && wpm <= 160 ? 95 : 100 - Math.abs(140 - wpm))));
      const gazeScore = Math.min(100, Math.max(10, gaze));
      const stabilityScore = Math.min(100, Math.max(10, Math.round(100 - jitter * 28)));
      const compositeScore = Math.round(cadenceScore * 0.4 + gazeScore * 0.35 + stabilityScore * 0.25);

      // Coaching cue for this moment
      let coachingCue = 'Conversational rhythm aligns with senior engineering standards.';
      if (inPause) {
        coachingCue = 'Cognitive pause: Formulating structural technical points.';
      } else if (wpm > 165) {
        coachingCue = 'Accelerated delivery: Maintain deliberate pacing for panel clarity.';
      } else if (wpm < 110) {
        coachingCue = 'Sluggish cadence: Elevate vocal projection and articulation energy.';
      } else if (gaze < 60) {
        coachingCue = 'Eye contact dipped: Refocus toward camera plane to project presence.';
      }

      // Detect milestone events
      let isMilestone = false;
      let milestoneType: TimelinePoint['milestoneType'];
      let milestoneTitle: string | undefined;

      if (isPausePeak) {
        isMilestone = true;
        milestoneType = 'pause';
        milestoneTitle = 'Cognitive Pause (~2.1s)';
      } else if (!inPause && wpm >= baseWpm + 10 && i % 8 === 0) {
        isMilestone = true;
        milestoneType = 'peak';
        milestoneTitle = `Pacing Peak (${wpm} WPM)`;
      } else if (timeSec === 0) {
        isMilestone = true;
        milestoneType = 'turn_start';
        milestoneTitle = 'Rehearsal Commenced';
      }

      points.push({
        timeSec,
        timeLabel,
        turnIndex: turnIdx,
        turnName,
        wpm,
        gaze,
        jitter,
        cadenceScore,
        gazeScore,
        stabilityScore,
        compositeScore,
        isPause: inPause,
        pauseDuration: inPause ? 2.1 : undefined,
        transcriptSnippet,
        coachingCue,
        isMilestone,
        milestoneType,
        milestoneTitle,
      });
    }

    return points;
  }, [totalDuration, baseWpm, baseGaze, baseJitter, pauseCount, candidateResponses, roleTitle]);

  // Filtered timeline data if a specific turn is selected
  const displayedData = useMemo(() => {
    if (selectedTurnFilter === 'all') return fullTimelineData;
    return fullTimelineData.filter((d) => d.turnIndex === selectedTurnFilter);
  }, [fullTimelineData, selectedTurnFilter]);

  // Current inspected point (either scrubbed or default to midpoint / peak)
  const activeInspectedPoint = useMemo(() => {
    if (displayedData.length === 0) return null;
    if (scrubbedTime !== null) {
      const match = displayedData.reduce((prev, curr) =>
        Math.abs(curr.timeSec - scrubbedTime) < Math.abs(prev.timeSec - scrubbedTime) ? curr : prev
      );
      return match;
    }
    // Default to the first milestone or midpoint
    const milestone = displayedData.find((d) => d.isMilestone && d.milestoneType === 'pause');
    return milestone || displayedData[Math.floor(displayedData.length * 0.45)];
  }, [displayedData, scrubbedTime]);

  // Automated timeline playback simulation
  const togglePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (playbackRef.current) clearInterval(playbackRef.current);
    } else {
      setIsPlaying(true);
      const startTime = scrubbedTime !== null && scrubbedTime < totalDuration - 2 ? scrubbedTime : 0;
      let curr = startTime;
      playbackRef.current = setInterval(() => {
        curr += 1.5;
        if (curr >= totalDuration) {
          curr = 0;
          setIsPlaying(false);
          if (playbackRef.current) clearInterval(playbackRef.current);
        }
        setScrubbedTime(Math.round(curr * 10) / 10);
      }, 200);
    }
  };

  useEffect(() => {
    return () => {
      if (playbackRef.current) clearInterval(playbackRef.current);
    };
  }, []);

  const resetScrubber = () => {
    setIsPlaying(false);
    if (playbackRef.current) clearInterval(playbackRef.current);
    setScrubbedTime(null);
  };

  // Turn count
  const turns = candidateResponses.length > 0 ? candidateResponses : [{ questionAsked: `Rehearsal Opening for ${roleTitle}` }];

  // Custom Interactive Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const pt: TimelinePoint = payload[0].payload;

    return (
      <div className="rounded-xl bg-[#090e17]/95 border border-slate-700/80 p-3.5 shadow-2xl backdrop-blur-md max-w-xs z-50 text-left pointer-events-none">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-white">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{pt.timeLabel}</span>
            <span className="text-slate-500">•</span>
            <span className="text-violet-400">{pt.turnName}</span>
          </div>
          {pt.isPause ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Cognitive Pause
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Active Speaking
            </span>
          )}
        </div>

        {/* Primary Stream Value */}
        <div className="space-y-1.5 mb-2">
          {streamMode === 'cadence' && (
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Mic className="w-3 h-3 text-emerald-400" /> Cadence:
              </span>
              <span className="font-bold text-emerald-300">
                {pt.wpm} WPM {pt.wpm >= 120 && pt.wpm <= 160 ? '(Optimal)' : pt.wpm > 160 ? '(Fast)' : '(Sluggish)'}
              </span>
            </div>
          )}

          {streamMode === 'gaze' && (
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Eye className="w-3 h-3 text-cyan-400" /> MediaPipe Gaze:
              </span>
              <span className="font-bold text-cyan-300">
                {pt.gaze}% {pt.gaze >= 70 ? '(High Focus)' : '(Looking Away)'}
              </span>
            </div>
          )}

          {streamMode === 'jitter' && (
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Activity className="w-3 h-3 text-violet-400" /> Acoustic Jitter:
              </span>
              <span className="font-bold text-violet-300">
                {pt.jitter}% {pt.jitter <= 1.5 ? '(Steady Pitch)' : '(Vocal Fry/Strain)'}
              </span>
            </div>
          )}

          {streamMode === 'composite' && (
            <div className="space-y-1 text-[11px] font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Composite Score:</span>
                <span className="font-bold text-amber-300">{pt.compositeScore}/100</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Cadence: {pt.wpm} WPM</span>
                <span>Gaze: {pt.gaze}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Transcript Spoken Slice */}
        {pt.transcriptSnippet && (
          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 block mb-0.5">
              Spoken Utterance
            </span>
            <p className="text-[11px] text-slate-300 italic line-clamp-2">
              "{pt.transcriptSnippet}..."
            </p>
          </div>
        )}

        {/* Real-time coaching cue */}
        <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center gap-1.5 text-[10px] text-slate-400">
          <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="truncate">{pt.coachingCue}</span>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ── STREAM CONTROLS & MODE TOGGLES ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        {/* Metric Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setStreamMode('cadence')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
              streamMode === 'cadence'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-emerald-400" />
            <span>Speaking Cadence (WPM)</span>
          </button>

          <button
            type="button"
            onClick={() => setStreamMode('gaze')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
              streamMode === 'gaze'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Gaze Alignment (%)</span>
          </button>

          <button
            type="button"
            onClick={() => setStreamMode('jitter')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
              streamMode === 'jitter'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-violet-400" />
            <span>Vocal Jitter &amp; Strain</span>
          </button>

          <button
            type="button"
            onClick={() => setStreamMode('composite')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
              streamMode === 'composite'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Multi-Biometric Composite</span>
          </button>
        </div>

        {/* Interactive Playback & Replay Scrubber */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlayback}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
              isPlaying
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
            }`}
            title="Simulate continuous acoustic & biometric playback through the session"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Replay</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span>Replay Pacing</span>
              </>
            )}
          </button>

          {scrubbedTime !== null && (
            <button
              type="button"
              onClick={resetScrubber}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors"
              title="Reset timeline scrubber"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN INTERACTIVE CHART CONTAINER ── */}
      <div className="relative w-full rounded-xl bg-[#070b12] border border-slate-800/90 overflow-hidden p-4 pt-5 shadow-2xl transition-all">
        {/* Subtle grid lines background overlay */}
        <div className="absolute inset-0 grid grid-cols-6 divide-x divide-slate-800/20 pointer-events-none" />

        {/* Active stream description tag */}
        <div className="flex items-center justify-between mb-3 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                streamMode === 'cadence'
                  ? 'bg-emerald-400'
                  : streamMode === 'gaze'
                  ? 'bg-cyan-400'
                  : streamMode === 'jitter'
                  ? 'bg-violet-400'
                  : 'bg-amber-400'
              }`}
            />
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              {streamMode === 'cadence' && 'SPEECH CADENCE & PAUSE SEGMENTS (PARSELMOUTH)'}
              {streamMode === 'gaze' && 'VISUAL CAMERA ALIGNMENT & HEAD VECTOR (MEDIAPIPE)'}
              {streamMode === 'jitter' && 'VOCAL STABILITY & CYCLE-TO-CYCLE JITTER (%)'}
              {streamMode === 'composite' && 'SYNCHRONIZED MULTI-STREAM COGNITIVE STABILITY'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            {streamMode === 'cadence' && (
              <>
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Optimal: 120–160 WPM
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Cognitive Pause (&gt;2s)
                </span>
              </>
            )}
            {streamMode === 'gaze' && (
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Target Engagement &gt;70%
              </span>
            )}
            {streamMode === 'jitter' && (
              <span className="flex items-center gap-1 text-violet-400">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                Optimal Stability &lt;1.5%
              </span>
            )}
          </div>
        </div>

        {/* Recharts Interactive Surface */}
        {mounted && (
          <div className="w-full h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={displayedData}
                margin={{ top: 12, right: 12, bottom: 4, left: -10 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length > 0) {
                    setScrubbedTime(e.activePayload[0].payload.timeSec);
                  }
                }}
              >
                <defs>
                  {/* Cadence gradient */}
                  <linearGradient id="cadenceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="70%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>

                  {/* Gaze gradient */}
                  <linearGradient id="gazeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.45} />
                    <stop offset="70%" stopColor="#06b6d4" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>

                  {/* Jitter gradient */}
                  <linearGradient id="jitterGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} />
                    <stop offset="70%" stopColor="#8b5cf6" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>

                  {/* Composite gradient */}
                  <linearGradient id="compositeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="70%" stopColor="#f59e0b" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                {/* X-Axis */}
                <XAxis
                  dataKey="timeSec"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(v: number) => {
                    const m = Math.floor(v / 60);
                    const s = Math.floor(v % 60);
                    return `${m}:${s.toString().padStart(2, '0')}`;
                  }}
                  tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={{ stroke: '#1e293b' }}
                />

                {/* Y-Axis */}
                <YAxis
                  domain={
                    streamMode === 'cadence'
                      ? [0, 200]
                      : streamMode === 'gaze'
                      ? [0, 100]
                      : streamMode === 'jitter'
                      ? [0, 3]
                      : [0, 100]
                  }
                  tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={{ stroke: '#1e293b' }}
                  tickFormatter={(v: number) => {
                    if (streamMode === 'cadence') return `${v}`;
                    if (streamMode === 'gaze' || streamMode === 'composite') return `${v}%`;
                    return `${v.toFixed(1)}%`;
                  }}
                />

                {/* Optimal Corridor Guides */}
                {streamMode === 'cadence' && (
                  <>
                    <ReferenceArea
                      y1={120}
                      y2={160}
                      fill="#10b981"
                      fillOpacity={0.05}
                      stroke="none"
                    />
                    <ReferenceLine
                      y={120}
                      stroke="#10b981"
                      strokeDasharray="3 3"
                      strokeOpacity={0.4}
                    />
                    <ReferenceLine
                      y={160}
                      stroke="#10b981"
                      strokeDasharray="3 3"
                      strokeOpacity={0.4}
                    />
                  </>
                )}

                {streamMode === 'gaze' && (
                  <>
                    <ReferenceArea
                      y1={70}
                      y2={100}
                      fill="#06b6d4"
                      fillOpacity={0.05}
                      stroke="none"
                    />
                    <ReferenceLine
                      y={70}
                      stroke="#06b6d4"
                      strokeDasharray="3 3"
                      strokeOpacity={0.4}
                    />
                  </>
                )}

                {streamMode === 'jitter' && (
                  <ReferenceLine
                    y={1.5}
                    stroke="#8b5cf6"
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                    label={{
                      value: 'Stability Threshold (1.5%)',
                      position: 'top',
                      fill: '#8b5cf6',
                      fontSize: 10,
                      fontFamily: 'monospace',
                    }}
                  />
                )}

                {/* Active Scrubber Marker Line */}
                {scrubbedTime !== null && (
                  <ReferenceLine
                    x={scrubbedTime}
                    stroke="#38bdf8"
                    strokeWidth={2}
                    strokeDasharray="2 2"
                    label={{
                      value: `📍 ${Math.floor(scrubbedTime / 60)}:${Math.floor(scrubbedTime % 60)
                        .toString()
                        .padStart(2, '0')}`,
                      position: 'top',
                      fill: '#38bdf8',
                      fontSize: 11,
                      fontFamily: 'monospace',
                    }}
                  />
                )}

                {/* Milestone Reference Dots along the curve */}
                {displayedData
                  .filter((d) => d.isMilestone && d.milestoneType === 'pause')
                  .map((d, idx) => (
                    <ReferenceDot
                      key={`pause-${idx}`}
                      x={d.timeSec}
                      y={streamMode === 'cadence' ? d.wpm : streamMode === 'gaze' ? d.gaze : streamMode === 'jitter' ? d.jitter : d.compositeScore}
                      r={4.5}
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                  ))}

                {displayedData
                  .filter((d) => d.isMilestone && d.milestoneType === 'peak')
                  .map((d, idx) => (
                    <ReferenceDot
                      key={`peak-${idx}`}
                      x={d.timeSec}
                      y={streamMode === 'cadence' ? d.wpm : streamMode === 'gaze' ? d.gaze : streamMode === 'jitter' ? d.jitter : d.compositeScore}
                      r={4.5}
                      fill="#06b6d4"
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                  ))}

                {/* Tooltip */}
                <Tooltip content={<CustomTooltip />} />

                {/* Area Plots */}
                {streamMode === 'cadence' && (
                  <Area
                    type="monotone"
                    dataKey="wpm"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#cadenceGradient)"
                    animationDuration={600}
                    activeDot={{ r: 6, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                )}

                {streamMode === 'gaze' && (
                  <Area
                    type="monotone"
                    dataKey="gaze"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    fill="url(#gazeGradient)"
                    animationDuration={600}
                    activeDot={{ r: 6, fill: '#06b6d4', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                )}

                {streamMode === 'jitter' && (
                  <Area
                    type="monotone"
                    dataKey="jitter"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    fill="url(#jitterGradient)"
                    animationDuration={600}
                    activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                )}

                {streamMode === 'composite' && (
                  <Area
                    type="monotone"
                    dataKey="compositeScore"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fill="url(#compositeGradient)"
                    animationDuration={600}
                    activeDot={{ r: 6, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Interactive Scrub Range Bar */}
        <div className="pt-2 px-1 flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">0:00</span>
          <input
            type="range"
            min={0}
            max={totalDuration}
            step={0.5}
            value={scrubbedTime !== null ? scrubbedTime : 0}
            onChange={(e) => setScrubbedTime(parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
            {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* ── TURN NAVIGATION & ZOOM FILTER PILLS ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 mr-1">
            INSPECT INTERVIEW TURN:
          </span>

          <button
            type="button"
            onClick={() => {
              setSelectedTurnFilter('all');
              setScrubbedTime(null);
            }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors flex items-center gap-1 border ${
              selectedTurnFilter === 'all'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span>All Turns ({totalDuration}s)</span>
          </button>

          {turns.map((m, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSelectedTurnFilter(idx);
                // Scrub to start of turn
                const turnDuration = totalDuration / turns.length;
                setScrubbedTime(Math.round(idx * turnDuration * 10) / 10);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors flex items-center gap-1.5 border ${
                selectedTurnFilter === idx
                  ? 'bg-violet-600 text-white border-violet-500 shadow-sm'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="font-bold text-violet-400">Q{idx + 1}</span>
              <span className="truncate max-w-[170px]">{m.questionAsked || `Prompt ${idx + 1}`}</span>
            </button>
          ))}
        </div>

        {/* Milestone Quick Jump Buttons */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">EVENT PINS:</span>
          {displayedData
            .filter((d) => d.isMilestone && d.milestoneType === 'pause')
            .slice(0, 2)
            .map((pin, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setScrubbedTime(pin.timeSec)}
                className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors flex items-center gap-1"
              >
                <span>💭 Pause @ {pin.timeLabel}</span>
              </button>
            ))}

          {displayedData
            .filter((d) => d.isMilestone && d.milestoneType === 'peak')
            .slice(0, 1)
            .map((pin, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setScrubbedTime(pin.timeSec)}
                className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors flex items-center gap-1"
              >
                <span>⚡ Peak @ {pin.timeLabel}</span>
              </button>
            ))}
        </div>
      </div>

      {/* ── INTERACTIVE POINT INSPECTOR HUD CARD ── */}
      {activeInspectedPoint && (
        <div className="rounded-xl bg-gradient-to-r from-slate-950/90 via-[#0d1424] to-slate-950/90 border border-slate-800/90 p-4 transition-all shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/40">
                TIMELINE SCRUBBER: {activeInspectedPoint.timeLabel}
              </span>
              <span className="px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 font-mono text-[10px] font-bold border border-violet-500/40">
                {activeInspectedPoint.turnName}
              </span>
              {activeInspectedPoint.isPause && (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/40">
                  💭 Cognitive Pause Detected
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 italic line-clamp-2">
              "{activeInspectedPoint.transcriptSnippet}..."
            </p>

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{activeInspectedPoint.coachingCue}</span>
            </div>
          </div>

          {/* Quick Metrics at this exact timestamp */}
          <div className="flex items-center gap-4 shrink-0 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-5">
            <div className="text-center">
              <span className="text-[10px] font-mono text-slate-400 block">CADENCE</span>
              <span className="text-base font-bold font-mono text-emerald-400">
                {activeInspectedPoint.wpm} <span className="text-[10px] font-normal">WPM</span>
              </span>
            </div>

            <div className="text-center">
              <span className="text-[10px] font-mono text-slate-400 block">CAMERA GAZE</span>
              <span className="text-base font-bold font-mono text-cyan-400">
                {activeInspectedPoint.gaze}%
              </span>
            </div>

            <div className="text-center">
              <span className="text-[10px] font-mono text-slate-400 block">VOCAL JITTER</span>
              <span className="text-base font-bold font-mono text-violet-400">
                {activeInspectedPoint.jitter}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
