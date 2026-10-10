/**
 * Behavioral Telemetry Types — Part [2]
 *
 * TypeScript interfaces for the BehavioralSignalRecord produced by the
 * server/behavioral/ pipeline (MediaPipe, Py-feat, Parselmouth).
 *
 * These types define the contract between the behavioral analysis backend
 * and the frontend coaching dashboard.  See docs/contracts/ for the full
 * Signal Record contract (owned by Part 2).
 */

// ─── Prosody (Parselmouth + STT timestamps) ─────────────────────────

export interface PauseSegment {
  /** Pause start time in seconds from response start */
  start_s: number;
  /** Pause end time in seconds from response start */
  end_s: number;
  /** Duration of the pause in seconds */
  duration_s: number;
}

export interface PitchPoint {
  /** Time in seconds from response start */
  time_s: number;
  /** Fundamental frequency in Hz */
  hz: number;
}

export interface ProsodySignal {
  /** Overall speaking rate in words per minute */
  speaking_rate_wpm: number;
  /** Individual pause segments detected in the response */
  pause_segments: PauseSegment[];
  /** Total pause time across all segments (seconds) */
  total_pause_duration_s: number;
  /** Mean fundamental frequency (Hz) */
  pitch_mean_hz: number;
  /** Standard deviation of fundamental frequency (Hz) */
  pitch_std_hz: number;
  /** Pitch contour — (time, frequency) samples across the response */
  pitch_contour: PitchPoint[];
  /** Jitter percent — cycle-to-cycle pitch perturbation */
  jitter_percent: number;
  /** Shimmer percent — cycle-to-cycle amplitude perturbation */
  shimmer_percent: number;
  /** Harmonics-to-noise ratio (dB) */
  hnr_db: number;
}

// ─── Gaze (MediaPipe) ───────────────────────────────────────────────

export type GazeDirection = 'center' | 'left' | 'right' | 'up' | 'down';

export interface GazePoint {
  /** Time in seconds from response start */
  time_s: number;
  /** Estimated gaze direction */
  direction: GazeDirection;
}

export interface HeadPose {
  /** Time in seconds from response start */
  time_s: number;
  /** Yaw angle (degrees): negative = left, positive = right */
  yaw: number;
  /** Pitch angle (degrees): negative = down, positive = up */
  pitch: number;
  /** Roll angle (degrees): negative = left tilt, positive = right tilt */
  roll: number;
}

export interface GazeSignal {
  /** Percentage of time eyes were directed at the camera */
  eye_contact_pct: number;
  /** Gaze direction over time */
  gaze_direction_timeline: GazePoint[];
  /** Head pose over time */
  head_pose_timeline: HeadPose[];
  /** Mean yaw angle (degrees) */
  avg_yaw: number;
  /** Mean pitch angle (degrees) */
  avg_pitch: number;
}

// ─── Facial Expressions (Py-feat) ───────────────────────────────────

export interface ExpressionPoint {
  /** Time in seconds from response start */
  time_s: number;
  /** Detected expression label */
  expression: string;
  /** Model confidence (0–1) */
  confidence: number;
}

export interface FacialSignal {
  /** Mean activation of each Action Unit (AU code → intensity 0–5) */
  au_means: Record<string, number>;
  /** Expression labels over time */
  expression_timeline: ExpressionPoint[];
  /** Most frequent expression label */
  dominant_expression: string;
  /** Fraction of time spent in each expression (sums to ~1) */
  expression_distribution: Record<string, number>;
}

// ─── Anomalies / Coaching Moments ───────────────────────────────────

export type AnomalySeverity = 'low' | 'medium' | 'high';

export interface Anomaly {
  /** Time in seconds from response start */
  time_s: number;
  /** Machine-readable anomaly type (e.g. "long_pause", "gaze_aversion") */
  type: string;
  /** Human-readable coaching description */
  description: string;
  /** Severity: low = informational, medium = worth noting, high = key coaching moment */
  severity: AnomalySeverity;
}

// ─── Top-level record ───────────────────────────────────────────────

export interface BehavioralSignalRecord {
  session_id: string;
  learner_id: string;
  response_id: string;
  /** ISO 8601 timestamp — start of the learner's response */
  response_start_ts: string;
  /** ISO 8601 timestamp — end of the learner's response */
  response_end_ts: string;
  prosody: ProsodySignal;
  gaze: GazeSignal;
  facial: FacialSignal;
  anomalies: Anomaly[];
  /** ISO 8601 timestamp — when analysis completed */
  analyzed_at: string;
}

// ─── Helper / derived types used by dashboard components ────────────

/** A single stat rendered in a StatCard */
export interface StatItem {
  label: string;
  value: string | number;
  unit?: string;
  icon?: string;
  coachingTip?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
}

/** Color scale for severity badges */
export const SEVERITY_COLORS: Record<AnomalySeverity, string> = {
  low: '#3B82F6',    // blue-500
  medium: '#F59E0B', // amber-500
  high: '#EF4444',   // red-500
};

/** Coaching-friendly labels for anomaly severity */
export const SEVERITY_LABELS: Record<AnomalySeverity, string> = {
  low: 'Info',
  medium: 'Attention',
  high: 'Focus',
};
