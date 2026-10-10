/**
 * Mock data for the Behavioral Dashboard — Part [2]
 *
 * Realistic fixture data used for development and the hackathon demo.
 * Values model a learner answering a ~45-second behavioral question
 * with natural speech patterns and a few coaching-worthy moments.
 */

import type { BehavioralSignalRecord } from './types';

// ─── Helpers ────────────────────────────────────────────────────────

/** Generate a pitch contour that varies naturally around a mean */
function generatePitchContour(
  durationS: number,
  meanHz: number,
  stdHz: number,
  stepS = 0.1,
): { time_s: number; hz: number }[] {
  const points: { time_s: number; hz: number }[] = [];
  let current = meanHz;
  for (let t = 0; t <= durationS; t += stepS) {
    // Random walk with mean-reversion
    const drift = (meanHz - current) * 0.05;
    const noise = (Math.random() - 0.5) * stdHz * 0.6;
    current = Math.max(meanHz - stdHz * 3, Math.min(meanHz + stdHz * 3, current + drift + noise));
    points.push({ time_s: Math.round(t * 100) / 100, hz: Math.round(current * 10) / 10 });
  }
  return points;
}

/** Generate gaze direction timeline with mostly center + some aversion */
function generateGazeTimeline(
  durationS: number,
  stepS = 0.5,
): { time_s: number; direction: 'center' | 'left' | 'right' | 'up' | 'down' }[] {
  const directions: ('center' | 'left' | 'right' | 'up' | 'down')[] = [
    'center', 'left', 'right', 'up', 'down',
  ];
  const weights = [0.72, 0.08, 0.08, 0.07, 0.05]; // mostly center
  const points: { time_s: number; direction: 'center' | 'left' | 'right' | 'up' | 'down' }[] = [];

  for (let t = 0; t <= durationS; t += stepS) {
    const r = Math.random();
    let cumulative = 0;
    let dir: 'center' | 'left' | 'right' | 'up' | 'down' = 'center';
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (r <= cumulative) {
        dir = directions[i];
        break;
      }
    }
    points.push({ time_s: Math.round(t * 100) / 100, direction: dir });
  }
  return points;
}

/** Generate head pose timeline with slight natural sway */
function generateHeadPoseTimeline(
  durationS: number,
  stepS = 0.5,
): { time_s: number; yaw: number; pitch: number; roll: number }[] {
  const points: { time_s: number; yaw: number; pitch: number; roll: number }[] = [];
  let yaw = 0, pitch = 0, roll = 0;
  for (let t = 0; t <= durationS; t += stepS) {
    yaw += (Math.random() - 0.5) * 3;
    pitch += (Math.random() - 0.5) * 2;
    roll += (Math.random() - 0.5) * 1.5;
    yaw *= 0.9; pitch *= 0.9; roll *= 0.9; // dampen
    points.push({
      time_s: Math.round(t * 100) / 100,
      yaw: Math.round(yaw * 10) / 10,
      pitch: Math.round(pitch * 10) / 10,
      roll: Math.round(roll * 10) / 10,
    });
  }
  return points;
}

/** Generate expression timeline with natural shifts */
function generateExpressionTimeline(
  durationS: number,
  stepS = 1.0,
): { time_s: number; expression: string; confidence: number }[] {
  const expressions = ['neutral', 'happy', 'surprise', 'contempt', 'neutral', 'happy'];
  const points: { time_s: number; expression: string; confidence: number }[] = [];
  let idx = 0;

  for (let t = 0; t <= durationS; t += stepS) {
    // Switch expression roughly every 8 seconds
    if (t > 0 && Math.random() < 0.12) {
      idx = (idx + 1) % expressions.length;
    }
    const confidence = 0.6 + Math.random() * 0.35;
    points.push({
      time_s: Math.round(t * 100) / 100,
      expression: expressions[idx],
      confidence: Math.round(confidence * 100) / 100,
    });
  }
  return points;
}

// ─── Mock record ────────────────────────────────────────────────────

const RESPONSE_DURATION_S = 45;

const expressionTimeline = generateExpressionTimeline(RESPONSE_DURATION_S);

// Count expression distribution from timeline
function computeExpressionDistribution(
  timeline: { expression: string }[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const pt of timeline) {
    counts[pt.expression] = (counts[pt.expression] || 0) + 1;
  }
  const total = timeline.length;
  const dist: Record<string, number> = {};
  for (const [key, val] of Object.entries(counts)) {
    dist[key] = Math.round((val / total) * 100) / 100;
  }
  return dist;
}

function computeDominantExpression(dist: Record<string, number>): string {
  let max = 0;
  let dominant = 'neutral';
  for (const [key, val] of Object.entries(dist)) {
    if (val > max) {
      max = val;
      dominant = key;
    }
  }
  return dominant;
}

const expressionDist = computeExpressionDistribution(expressionTimeline);
const dominantExpression = computeDominantExpression(expressionDist);

export const MOCK_SIGNAL_RECORD: BehavioralSignalRecord = {
  session_id: 'ses_demo_001',
  learner_id: 'lrn_demo_alice',
  response_id: 'resp_demo_q1',
  response_start_ts: '2026-10-10T09:30:00.000Z',
  response_end_ts: '2026-10-10T09:30:45.000Z',
  analyzed_at: '2026-10-10T09:30:46.200Z',

  prosody: {
    speaking_rate_wpm: 142,
    pause_segments: [
      { start_s: 1.2, end_s: 2.4, duration_s: 1.2 },   // brief thinking pause
      { start_s: 18.5, end_s: 22.1, duration_s: 3.6 },  // long pause — coaching moment
      { start_s: 35.0, end_s: 36.1, duration_s: 1.1 },  // brief transition pause
    ],
    total_pause_duration_s: 5.9,
    pitch_mean_hz: 178,
    pitch_std_hz: 24,
    pitch_contour: generatePitchContour(RESPONSE_DURATION_S, 178, 24),
    jitter_percent: 1.52,
    shimmer_percent: 4.8,
    hnr_db: 18.3,
  },

  gaze: {
    eye_contact_pct: 72,
    gaze_direction_timeline: generateGazeTimeline(RESPONSE_DURATION_S),
    head_pose_timeline: generateHeadPoseTimeline(RESPONSE_DURATION_S),
    avg_yaw: 1.2,
    avg_pitch: -0.8,
  },

  facial: {
    au_means: {
      AU01: 0.3,  // Inner Brow Raise
      AU02: 0.15, // Outer Brow Raise
      AU04: 0.4,  // Brow Lowerer (concentration)
      AU06: 0.6,  // Cheek Raiser
      AU12: 0.55, // Lip Corner Puller (smile)
      AU14: 0.2,  // Dimpler
      AU15: 0.1,  // Lip Corner Depressor
      AU17: 0.25, // Chin Raiser
      AU20: 0.1,  // Lip stretcher
      AU23: 0.15, // Lip Tightener
    },
    expression_timeline: expressionTimeline,
    dominant_expression: dominantExpression,
    expression_distribution: expressionDist,
  },

  anomalies: [
    {
      time_s: 19.5,
      type: 'long_pause',
      description:
        'A 3.6-second pause was detected here. This may indicate you were gathering your thoughts — consider preparing key points for similar questions.',
      severity: 'medium',
    },
    {
      time_s: 28.0,
      type: 'elevated_jitter',
      description:
        'Vocal jitter was slightly elevated (1.5%). This can happen when you feel uncertain — practicing your answer out loud a few times can help smooth delivery.',
      severity: 'low',
    },
    {
      time_s: 38.0,
      type: 'gaze_aversion',
      description:
        'Eye contact dropped briefly during the conclusion. Maintaining camera focus during your closing statement strengthens your final impression.',
      severity: 'medium',
    },
  ],
};
