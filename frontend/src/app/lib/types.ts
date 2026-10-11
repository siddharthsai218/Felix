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
  };
}

export interface SessionConfig {
  targetRole: string;
  learnerId: string;
  questionCount: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  coachModeEnabled: boolean;
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
