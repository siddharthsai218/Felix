import type { RubricScoreItem, BehavioralInsightItem } from '../../report';
import type { StarResponseTransformation } from '../../report/AnswerTransformer';

export interface HistoryTurnResponse {
  questionAsked: string;
  transcript: string;
  durationMs?: number;
}

export interface HistoricalSession {
  sessionId: string;
  learnerId: string;
  roleTitle: string;
  createdAt: string; // ISO string
  durationSeconds: number;
  overallScore: number;
  questionCount: number;
  githubUrl?: string;
  responses: HistoryTurnResponse[];
  telemetry?: {
    gazePercentage?: number;
    speakingRateWpm?: number;
    jitterPercent?: number;
    composureScore?: number;
  };
  evaluation: {
    overallScore: number;
    rubricScores: RubricScoreItem[];
    behavioralInsights: BehavioralInsightItem[];
    transformations: StarResponseTransformation[];
    remediationPlan?: Array<{
      topic: string;
      drillQuestion: string;
      targetOutcome: string;
    }>;
  };
}

const STORAGE_KEY = 'felix_interview_history_v1';

// Seed sample historical sessions so the page looks rich and ready on first launch
const SAMPLE_SESSIONS: HistoricalSession[] = [
  {
    sessionId: 'FLX-98219',
    learnerId: 'Siddharth',
    roleTitle: 'Senior Systems & Frontend Architect',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    durationSeconds: 145,
    overallScore: 4.1,
    questionCount: 3,
    githubUrl: 'https://github.com/siddharthsai218',
    telemetry: {
      gazePercentage: 84,
      speakingRateWpm: 148,
      jitterPercent: 0.92,
      composureScore: 88,
    },
    responses: [
      {
        questionAsked: 'Can you walk me through an architectural challenge you solved involving low-latency WebRTC streaming and WebSockets?',
        transcript:
          'In my recent project, we observed video frame stalls under network jitter on mobile devices. I designed an auto-recovery stall-detection loop in React listening to video stalled events, which forced muted playback retries. Concurrently, we optimized input event delivery by routing trackpad events over raw WebRTC DataChannels instead of HTTP, reducing overall latency to under 12 milliseconds.',
        durationMs: 45000,
      },
      {
        questionAsked: 'How did you handle cross-platform OS clipboard synchronization without external driver dependencies?',
        transcript:
          'We implemented native OS standard input pipes using child_process spawn. On Linux we interfaced with wl-copy and xclip, on macOS with pbcopy and pbpaste, and on Windows with PowerShell. We piped input directly through stdin streams to avoid command injection vulnerabilities.',
        durationMs: 48000,
      },
      {
        questionAsked: 'How did you ensure mobile clients on plain HTTP local networks could still copy and paste?',
        transcript:
          'Since modern browsers disable navigator.clipboard on plain HTTP LAN connections, we built an off-screen textarea fallback with document.execCommand copy. This allowed seamless clipboard sync across mobile browsers on local Wi-Fi without requiring SSL certificates.',
        durationMs: 52000,
      },
    ],
    evaluation: {
      overallScore: 4.1,
      rubricScores: [
        {
          criterion: 'Technical Depth & Domain Competency',
          score: 4.3,
          feedback: 'Exceptional architectural precision. Demonstrated clear understanding of WebRTC event lifecycles and native OS process piping.',
          quotes: [
            { text: 'designed an auto-recovery stall-detection loop in React listening to video stalled events', time: '00:32' },
          ],
        },
        {
          criterion: 'STAR Structure & Impact Quantification',
          score: 4.0,
          feedback: 'Clear Situation and Task framing with direct engineering ownership. Strongly articulated quantifiable results (12 ms latency benchmark).',
          quotes: [
            { text: 'reducing overall latency to under 12 milliseconds', time: '01:15' },
          ],
        },
        {
          criterion: 'Communication Pacing & Clarity',
          score: 4.2,
          feedback: 'Consistent speaking cadence at 148 WPM with clear articulation of technical terminology.',
          quotes: [
            { text: 'Steady pacing and crisp diction across all responses.', time: 'Prosody' },
          ],
        },
        {
          criterion: 'Composure & Behavioral Presence',
          score: 4.0,
          feedback: 'High visual engagement (84% gaze stability) and minimal hesitation pauses.',
          quotes: [
            { text: 'Sustained focus and calm composure during technical questioning.', time: 'Telemetry' },
          ],
        },
      ],
      behavioralInsights: [
        {
          icon: '👁️',
          title: 'MediaPipe Eye Contact',
          text: '84% Camera gaze focus maintained. Excellent direct eye contact with the interviewer avatar.',
          metric: '84% Gaze',
          status: 'optimal',
        },
        {
          icon: '🗣️',
          title: 'Parselmouth Cadence',
          text: 'Speaking rate averaged 148 WPM. Confident and measured professional pacing.',
          metric: '148 WPM',
          status: 'optimal',
        },
        {
          icon: '📊',
          title: 'Vocal Perturbation',
          text: 'Vocal stability steady at 0.92% jitter. Clear vocal projection without vocal fry.',
          metric: '0.92% Jitter',
          status: 'optimal',
        },
        {
          icon: '⏱️',
          title: 'Cognitive Hesitation',
          text: '2 natural thinking pauses detected. Well-composed response organization.',
          metric: '2 Pauses',
          status: 'optimal',
        },
      ],
      transformations: [
        {
          questionAsked: 'Can you walk me through an architectural challenge you solved involving low-latency WebRTC streaming?',
          originalTranscript:
            'In my recent project, we observed video frame stalls under network jitter on mobile devices. I designed an auto-recovery stall-detection loop in React listening to video stalled events...',
          critiqueNotes: [
            'Strong technical ownership: clearly separated personal decisions from general team effort.',
            'Impactful metrics: cited the 12 ms latency benchmark directly.',
            'Can elevate further by mentioning trade-offs considered prior to implementation.',
          ],
          starRewrite: {
            situation: 'During mobile screen mirroring tests under unstable LAN Wi-Fi, Android Chrome clients experienced silent video frame stalls.',
            task: 'I spearheaded the diagnosis of browser media event loops and architected a client-side recovery mechanism.',
            action: 'Implemented passive stall event listeners that dynamically restarted playback with muted audio fallback, and migrated input signaling to low-latency DataChannels.',
            result: 'Eliminated frozen frame hangs completely and maintained sub-15ms input response across physical devices.',
          },
          competency: 'WebRTC Architecture & Real-Time Media',
          scoreImprovement: '+45% Executive Delivery',
        },
      ],
    },
  },
  {
    sessionId: 'FLX-41092',
    learnerId: 'Siddharth',
    roleTitle: 'Distributed Systems & Backend Engineer',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // 1 day ago
    durationSeconds: 120,
    overallScore: 3.6,
    questionCount: 3,
    telemetry: {
      gazePercentage: 73,
      speakingRateWpm: 135,
      jitterPercent: 1.15,
      composureScore: 78,
    },
    responses: [
      {
        questionAsked: 'How do you design an idempotent payment processing API to prevent double-charging?',
        transcript:
          'We use unique idempotency keys supplied in the HTTP request header. The server records the key in Redis with a TTL. If a duplicate request arrives while processing or completed, we return the cached response immediately.',
        durationMs: 38000,
      },
    ],
    evaluation: {
      overallScore: 3.6,
      rubricScores: [
        {
          criterion: 'Technical Depth & Domain Competency',
          score: 3.8,
          feedback: 'Solid foundational knowledge of idempotency keys and Redis locking semantics.',
          quotes: [{ text: 'records the key in Redis with a TTL', time: '00:22' }],
        },
        {
          criterion: 'STAR Structure & Impact Quantification',
          score: 3.4,
          feedback: 'Good technical explanation, but lacked a concrete situation narrative or quantifiable impact metrics.',
          quotes: [{ text: 'We use unique idempotency keys supplied in the HTTP request header', time: '00:10' }],
        },
        {
          criterion: 'Communication Pacing & Clarity',
          score: 3.9,
          feedback: 'Clear, concise pacing at 135 WPM.',
          quotes: [{ text: 'Clear diction and straightforward explanations.', time: 'Prosody' }],
        },
        {
          criterion: 'Composure & Behavioral Presence',
          score: 3.6,
          feedback: 'Good overall focus with 73% camera eye contact.',
          quotes: [{ text: 'Maintained composure throughout questioning.', time: 'Telemetry' }],
        },
      ],
      behavioralInsights: [
        {
          icon: '👁️',
          title: 'MediaPipe Eye Contact',
          text: '73% Camera gaze focus. Solid visual presence.',
          metric: '73% Gaze',
          status: 'optimal',
        },
        {
          icon: '🗣️',
          title: 'Parselmouth Cadence',
          text: 'Speaking rate averaged 135 WPM. Good conversational pace.',
          metric: '135 WPM',
          status: 'optimal',
        },
        {
          icon: '📊',
          title: 'Vocal Perturbation',
          text: 'Vocal jitter measured at 1.15%. Steady tone.',
          metric: '1.15% Jitter',
          status: 'optimal',
        },
        {
          icon: '⏱️',
          title: 'Cognitive Hesitation',
          text: 'Brief pauses before answering. Good preparation.',
          metric: '1 Pause',
          status: 'optimal',
        },
      ],
      transformations: [
        {
          questionAsked: 'How do you design an idempotent payment processing API?',
          originalTranscript:
            'We use unique idempotency keys supplied in the HTTP request header. The server records the key in Redis with a TTL...',
          critiqueNotes: [
            'Lacked a real-world project story (Situation & Task).',
            'Missing error handling and race condition mitigation detail.',
            'Include measurable volume and failure rate reduction in Result.',
          ],
          starRewrite: {
            situation: 'In our checkout microservice, network timeouts caused clients to retry payment requests, risking duplicate billing.',
            task: 'I was tasked with making the payment endpoint strictly idempotent across high-concurrency spikes.',
            action: 'Implemented Redis distributed locking with atomic SETNX on the idempotency key, persisting transactions in PostgreSQL with unique constraints.',
            result: 'Eliminated 100% of double-charge race conditions during high-volume flash sales.',
          },
          competency: 'Distributed Architecture & Idempotency',
          scoreImprovement: '+35% Narrative Impact',
        },
      ],
    },
  },
];

/**
 * Retrieve all historical interview sessions.
 */
export function getHistoricalSessions(learnerId?: string): HistoricalSession[] {
  if (typeof window === 'undefined') return SAMPLE_SESSIONS;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with sample sessions on initial load
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_SESSIONS));
      return learnerId ? SAMPLE_SESSIONS.filter(s => s.learnerId.toLowerCase() === learnerId.toLowerCase()) : SAMPLE_SESSIONS;
    }

    const sessions: HistoricalSession[] = JSON.parse(raw);
    if (!Array.isArray(sessions) || sessions.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_SESSIONS));
      return SAMPLE_SESSIONS;
    }

    if (learnerId && learnerId !== 'all') {
      return sessions.filter(s => s.learnerId.toLowerCase() === learnerId.toLowerCase());
    }

    return sessions;
  } catch (err) {
    console.warn('Failed to parse history from localStorage:', err);
    return SAMPLE_SESSIONS;
  }
}

/**
 * Retrieve a single historical interview session by ID.
 */
export function getHistoricalSessionById(sessionId: string): HistoricalSession | null {
  const all = getHistoricalSessions();
  const normalized = sessionId.trim().toUpperCase();
  return (
    all.find(
      s =>
        s.sessionId.toUpperCase() === normalized ||
        s.sessionId.replace(/-/g, '').toUpperCase() === normalized.replace(/-/g, '')
    ) || null
  );
}

/**
 * Save or update an interview session in history.
 */
export function saveHistoricalSession(session: HistoricalSession): void {
  if (typeof window === 'undefined') return;

  try {
    const all = getHistoricalSessions();
    const existingIndex = all.findIndex(
      s => s.sessionId.toUpperCase() === session.sessionId.toUpperCase()
    );

    if (existingIndex >= 0) {
      all[existingIndex] = { ...all[existingIndex], ...session };
    } else {
      all.unshift(session); // Add newest session to top
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.error('Failed to save session to history:', err);
  }
}

/**
 * Delete a specific interview session.
 */
export function deleteHistoricalSession(sessionId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const all = getHistoricalSessions();
    const filtered = all.filter(s => s.sessionId.toUpperCase() !== sessionId.toUpperCase());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete session from history:', err);
  }
}

/**
 * Clear all history (resets to default).
 */
export function clearAllHistoricalSessions(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {}
}
