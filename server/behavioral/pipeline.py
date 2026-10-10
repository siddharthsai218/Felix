"""
Main pipeline orchestrator for Behavioral Telemetry (Part 2).

Executes prosody, gaze, and facial analysis modules and aggregates
them into a BehavioralSignalRecord for Part 3.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
import logging
from typing import Optional

from server.behavioral.correlator import TemporalCorrelator
from server.behavioral.facial import FacialAnalyzer
from server.behavioral.gaze import GazeAnalyzer
from server.behavioral.models import (
    BehavioralSignalRecord,
    CaptureHandoff,
)
from server.behavioral.prosody import ProsodyAnalyzer

logger = logging.getLogger(__name__)


class BehavioralPipeline:
    """End-to-end behavioral analysis pipeline."""

    def __init__(self):
        self.prosody = ProsodyAnalyzer()
        self.gaze = GazeAnalyzer()
        self.facial = FacialAnalyzer()
        self.correlator = TemporalCorrelator()

    async def analyze(self, handoff: CaptureHandoff) -> BehavioralSignalRecord:
        """
        Asynchronously analyze captured audio and video frames.

        Runs outside of the critical live-turn path (< 1.5s latency).
        """
        # Execute CPU/IO bound tasks in thread pool
        loop = asyncio.get_running_loop()

        prosody_task = loop.run_in_executor(
            None, self.prosody.analyze, handoff.audio_path, handoff.stt_words
        )
        gaze_task = loop.run_in_executor(
            None, self.gaze.analyze_frames, handoff.video_frames_dir
        )
        facial_task = loop.run_in_executor(
            None, self.facial.analyze_frames, handoff.video_frames_dir
        )

        prosody_sig, gaze_sig, facial_sig = await asyncio.gather(
            prosody_task, gaze_task, facial_task
        )

        anomalies = self.correlator.correlate(
            prosody=prosody_sig,
            gaze=gaze_sig,
            facial=facial_sig,
            stt_words=handoff.stt_words,
        )

        return BehavioralSignalRecord(
            session_id=handoff.session_id,
            learner_id=handoff.learner_id,
            response_id=handoff.response_id,
            response_start_ts=handoff.response_start_ts,
            response_end_ts=handoff.response_end_ts,
            prosody=prosody_sig,
            gaze=gaze_sig,
            facial=facial_sig,
            anomalies=anomalies,
            analyzed_at=datetime.now(timezone.utc).isoformat(),
        )

    def analyze_sync(self, handoff: CaptureHandoff) -> BehavioralSignalRecord:
        """Synchronous version for direct offline evaluation & testing."""
        prosody_sig = self.prosody.analyze(handoff.audio_path, handoff.stt_words)
        gaze_sig = self.gaze.analyze_frames(handoff.video_frames_dir)
        facial_sig = self.facial.analyze_frames(handoff.video_frames_dir)

        anomalies = self.correlator.correlate(
            prosody=prosody_sig,
            gaze=gaze_sig,
            facial=facial_sig,
            stt_words=handoff.stt_words,
        )

        return BehavioralSignalRecord(
            session_id=handoff.session_id,
            learner_id=handoff.learner_id,
            response_id=handoff.response_id,
            response_start_ts=handoff.response_start_ts,
            response_end_ts=handoff.response_end_ts,
            prosody=prosody_sig,
            gaze=gaze_sig,
            facial=facial_sig,
            anomalies=anomalies,
            analyzed_at=datetime.now(timezone.utc).isoformat(),
        )
