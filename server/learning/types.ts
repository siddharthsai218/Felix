export interface SttWordTimestamp {
  word?: string;
  text?: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface SessionResponseRecord {
  sessionId: string;
  learnerId: string;
  responseIndex: number;
  questionAsked: string;
  questionType?: string;
  targetCompetency?: string;
  transcript: string;
  timestamps: SttWordTimestamp[];
  startedAt?: string;
  endedAt?: string;
  durationMs?: number;
  rescueModeTriggered?: boolean;
  coachModeUsed?: boolean;
  isDrill?: boolean;
}

export interface SessionRecord {
  sessionId: string;
  learnerId: string;
  targetRole?: string;
  startedAt?: string;
  endedAt?: string;
  totalDurationMs?: number;
  responses: SessionResponseRecord[];
  sessionConfig?: {
    questionCount?: number;
    difficulty?: string;
    coachModeEnabled?: boolean;
    githubUrl?: string;
  };
}

export interface SignalRecord {
  speakingRate?: number;
  speakingRateWpm?: number;
  pauseSegments?: Array<{ start: number; end: number; duration?: number }>;
  pauseCount?: number;
  pitch?: number;
  pitchMeanHz?: number;
  jitter?: number;
  jitterPercent?: number;
  shimmer?: number;
  gazeStats?: {
    lookingAtCameraPct?: number;
    awaySegments?: Array<{ start: number; end: number; duration: number }>;
  };
  gazePercentage?: number;
  expressionStats?: {
    dominantExpression?: string;
    confidenceScore?: number;
    engagementScore?: number;
  };
  dominantExpression?: string;
  composureScore?: number;
  timestamps?: any;
}

export interface RubricScoreItem {
  criterion: string;
  score: number;
  feedback: string;
  quotes: Array<{ text: string; time: string }>;
}

export interface BehavioralInsightItem {
  icon: string;
  title: string;
  text: string;
  metric?: string;
  status?: 'optimal' | 'attention';
}

export interface StarResponseTransformation {
  questionAsked: string;
  originalTranscript: string;
  critiqueNotes: string[];
  starRewrite: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  competency: string;
  scoreImprovement: string;
}

export interface RemediationPlanItem {
  topic: string;
  drillQuestion: string;
  targetOutcome: string;
  originalProblem?: string;
  studentMistake?: string;
  problemFirstExplanation?: string;
}

export interface GeneratedReportResult {
  overallScore: number;
  rubricScores: RubricScoreItem[];
  behavioralInsights: BehavioralInsightItem[];
  transformations: StarResponseTransformation[];
  remediationPlan: RemediationPlanItem[];
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
