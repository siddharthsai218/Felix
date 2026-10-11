// frontend/src/app/lib/types.ts
// Shared types for Frontend Live Session & Interface

export type TurnState =
  | 'idle'
  | 'asking'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'rescue'
  | 'drill'
  | 'complete';

export interface SttWordTimestamp {
  text: string;
  start: number;
  end: number;
  confidence: number;
}

export interface DrillSpec {
  drillId: string;
  sessionId: string;
  responseIndex: number;
  targetLearningOutcome: string;
  targetCompetency: string;
  gapSeverity: 'low' | 'medium' | 'high';
  question: string;
  timeLimitSeconds: number;
  context?: string;
  hints?: string[];
  originalQuestion?: string;
  studentMistake?: string;
  problemFirstExplanation?: string;
}

export interface SessionResponseRecord {
  sessionId: string;
  learnerId: string;
  responseIndex: number;
  questionAsked: string;
  questionType: 'behavioral' | 'technical' | 'situational' | 'follow-up' | 'drill';
  targetCompetency?: string;
  transcript: string;
  timestamps: SttWordTimestamp[];
  startedAt: string;
  endedAt: string;
  durationMs: number;
  rescueModeTriggered: boolean;
  coachModeUsed: boolean;
  isDrill: boolean;
  drillSpec?: DrillSpec;
}

/** A single spoken line/utterance in the session transcript */
export interface TranscriptLine {
  id?: string;
  lineId?: string;
  turnIndex: number;
  questionIndex?: number;
  speaker: 'interviewer' | 'candidate';
  speakerName?: string;
  text: string;
  timestamp: string; // ISO 8601
  type: 'question' | 'response' | 'follow-up' | 'followup' | 'hint' | 'greeting' | 'clarification' | 'drill';
  durationMs?: number;
  wordTimestamps?: SttWordTimestamp[];
  timestamps?: any;
}

/** Complete chronological session dialogue transcript */
export interface SessionTranscript {
  sessionId: string;
  learnerId?: string;
  targetRole?: string;
  startedAt: string;
  endedAt?: string;
  lines: TranscriptLine[];
}

/** Configurable Interviewer Archetypes */
export type InterviewerArchetype =
  | 'supportive-coach'
  | 'pragmatic-architect'
  | 'rapid-fire-recruiter';

export interface InterviewerArchetypeConfig {
  id: InterviewerArchetype;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  icon: string;
  color: string;
  badgeClass: string;
  borderClass: string;
  accentClass: string;
  traits: string[];
}

export const INTERVIEWER_ARCHETYPES: Record<InterviewerArchetype, InterviewerArchetypeConfig> = {
  'supportive-coach': {
    id: 'supportive-coach',
    name: 'Supportive Felix',
    shortName: 'Supportive Coach',
    tagline: 'Patience, high reassurance & positive reinforcement',
    description: 'Nurturing and encouraging environment. Prioritizes psychological safety, scaffolding structured thinking, and affirming candidate effort before probing.',
    icon: '🤝',
    color: 'from-emerald-400 to-teal-500',
    badgeClass: 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300',
    borderClass: 'border-emerald-500/40 hover:border-emerald-400',
    accentClass: 'text-emerald-400',
    traits: ['Patience & Affirmation', 'Gentle Scaffolding', 'Confidence Building', 'Safe Practice Space'],
  },
  'pragmatic-architect': {
    id: 'pragmatic-architect',
    name: 'Pragmatic Staff Architect',
    shortName: 'Staff Architect',
    tagline: 'Zeroes in on edge cases, failure states & trade-offs',
    description: 'Analytical and rigorous. Probes architectural boundaries, distributed consensus, data consistency models, p99 latencies, and explicit system trade-offs.',
    icon: '🏗️',
    color: 'from-cyan-400 to-blue-500',
    badgeClass: 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300',
    borderClass: 'border-cyan-500/40 hover:border-cyan-400',
    accentClass: 'text-cyan-400',
    traits: ['Edge-Case Stress Testing', 'Distributed Trade-offs', 'Failure Mode Analysis', 'P99 Latency & Scale'],
  },
  'rapid-fire-recruiter': {
    id: 'rapid-fire-recruiter',
    name: 'Rapid-Fire Recruiter',
    shortName: 'Rapid Recruiter',
    tagline: 'Tests time management, executive summaries & elevator pitches',
    description: 'Fast-paced, executive-focused, and concise. Tests time management, 30-second elevator summaries, and quantified business impact without rambling.',
    icon: '⚡',
    color: 'from-amber-400 to-orange-500',
    badgeClass: 'bg-amber-950/70 border-amber-500/50 text-amber-300',
    borderClass: 'border-amber-500/40 hover:border-amber-400',
    accentClass: 'text-amber-400',
    traits: ['Executive Summaries', 'Time-Boxed Delivery', 'Metric & ROI Attribution', 'Zero Fluff / Concise'],
  },
};

export interface SessionRecord {
  sessionId: string;
  learnerId: string;
  targetRole: string;
  startedAt: string;
  endedAt: string;
  totalDurationMs: number;
  responses: SessionResponseRecord[];
  transcript?: TranscriptLine[];
  sessionConfig: {
    questionCount: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    coachModeEnabled: boolean;
    archetype?: InterviewerArchetype;
  };
}

export interface SessionConfig {
  targetRole: string;
  learnerId: string;
  questionCount: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  coachModeEnabled: boolean;
  archetype?: InterviewerArchetype;
  githubUrl?: string;
  resumeText?: string;
  jobDescription?: string;
}

export type ClientMessage =
  | { type: 'session:start'; config: SessionConfig }
  | { type: 'audio:chunk'; data: string }
  | { type: 'audio:end' }
  | { type: 'stt:partial'; text: string }
  | { type: 'stt:final'; text: string; timestamps?: SttWordTimestamp[] }
  | { type: 'coach:request' }
  | { type: 'drill:start'; drillId: string }
  | { type: 'transcript:append'; line: TranscriptLine }
  | { type: 'session:end' };

export type ServerMessage =
  | { type: 'session:started'; sessionId: string }
  | { type: 'turn:state'; state: TurnState }
  | { type: 'question:text'; text: string; questionIndex: number }
  | { type: 'stt:partial'; text: string }
  | { type: 'stt:final'; text: string; timestamps: SttWordTimestamp[] }
  | { type: 'tts:audio'; data: string; isLast: boolean }
  | { type: 'rescue:activate'; message: string }
  | { type: 'coach:hint'; hint: string }
  | { type: 'transcript:line'; line: TranscriptLine }
  | { type: 'transcript:sync'; lines: TranscriptLine[] }
  | { type: 'response:complete'; record: SessionResponseRecord }
  | { type: 'session:complete'; record: SessionRecord }
  | { type: 'error'; message: string };
