export interface SessionRecord {
  sessionId: string;
  learnerId: string;
  questionAsked: string;
  transcript: string;
  timestamps: Array<{ word: string; start: number; end: number }>;
}

export interface SignalRecord {
  speakingRate: number;
  pauseSegments: Array<{ start: number; end: number }>;
  pitch: number;
  jitter: number;
  shimmer: number;
  gazeStats: any;
  expressionStats: any;
  timestamps: any;
}

export interface RubricCriterion {
  dimension: string;
  score: number;
  evidenceQuotes: string[];
  learningOutcome: string;
  feedback: string;
}

export interface RubricResult {
  criteria: RubricCriterion[];
  overallScore: number;
  strengths: string[];
  areasForImprovement: string[];
}

export interface LearningGap {
  outcome: string;
  domain: 'technical' | 'communication' | 'behavioral';
  concept: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

export interface GapAnalysis {
  masteredOutcomes: string[];
  unmasteredOutcomes: string[];
  gaps: LearningGap[];
}
