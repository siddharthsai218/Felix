'use client';

import React from 'react';
import { BehavioralSignalRecord } from './types';
import { mockSignalRecord } from './mockData';
import { StatCard } from './StatCard';
import { SpeakingRateChart } from './SpeakingRateChart';
import { PitchContourChart } from './PitchContourChart';
import { PauseTimeline } from './PauseTimeline';
import { GazeChart } from './GazeChart';
import { ExpressionChart } from './ExpressionChart';
import { AnomalyTimeline } from './AnomalyTimeline';

interface BehavioralDashboardProps {
  record?: BehavioralSignalRecord;
}

export const BehavioralDashboard: React.FC<BehavioralDashboardProps> = ({
  record = mockSignalRecord,
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Behavioral Coaching Insights
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Objective telemetry on speech pacing, vocal prosody, and visual engagement to build interview self-awareness.
        </p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          label="Speaking Rate"
          value={`${record.prosody.speaking_rate_wpm.toFixed(0)} WPM`}
          subtext="Target: 130–160 WPM"
          trend="optimal"
        />
        <StatCard
          label="Camera Eye Contact"
          value={`${record.gaze.eye_contact_pct.toFixed(0)}%`}
          subtext="MediaPipe tracking"
          trend={record.gaze.eye_contact_pct >= 50 ? 'optimal' : 'attention'}
        />
        <StatCard
          label="Vocal Jitter"
          value={`${record.prosody.jitter_percent.toFixed(2)}%`}
          subtext="Parselmouth perturbation"
          trend={record.prosody.jitter_percent < 2.0 ? 'optimal' : 'attention'}
        />
        <StatCard
          label="Total Pauses"
          value={`${record.prosody.pause_segments.length}`}
          subtext={`${record.prosody.total_pause_duration_s.toFixed(1)}s total hesitation`}
          trend="neutral"
        />
        <StatCard
          label="Dominant Expression"
          value={record.facial.dominant_expression}
          subtext="Py-feat emotion model"
          trend="neutral"
        />
      </div>

      {/* Primary Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpeakingRateChart
          speakingRateWpm={record.prosody.speaking_rate_wpm}
          pauseSegments={record.prosody.pause_segments}
        />
        <PitchContourChart
          pitchContour={record.prosody.pitch_contour}
          pitchMeanHz={record.prosody.pitch_mean_hz}
          jitterPercent={record.prosody.jitter_percent}
          shimmerPercent={record.prosody.shimmer_percent}
        />
      </div>

      {/* Full Width Pause Track */}
      <PauseTimeline
        pauseSegments={record.prosody.pause_segments}
        totalResponseDurationS={30.0}
      />

      {/* Gaze & Facial Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GazeChart gaze={record.gaze} />
        <ExpressionChart facial={record.facial} />
      </div>

      {/* Coaching Moments Timeline */}
      <AnomalyTimeline anomalies={record.anomalies} />

      {/* Pedagogical disclaimer footer */}
      <div className="text-center py-4 border-t border-slate-200">
        <p className="text-xs text-slate-400">
          ⚖️ <strong>Pedagogical Guarantee:</strong> Behavioral telemetry is never used as an evaluation penalty.
          These indicators are formative tools designed to help learners self-reflect and refine their communication.
        </p>
      </div>
    </div>
  );
};
