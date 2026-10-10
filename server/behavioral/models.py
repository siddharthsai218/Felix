"""
Pydantic v2 data models for the Behavioral Telemetry pipeline.

Every model here is a strict, validated schema:

* **Input** models (``CaptureHandoff``, ``CaptureFrame``, ``STTWord``)
  describe data received from Part 1's capture subsystem.
* **Signal** models (``ProsodySignal``, ``GazeSignal``, ``FacialSignal``)
  hold per-analyzer output.
* **Output** model (``BehavioralSignalRecord``) is the contract handed
  to Part 3 for scoring and report generation — see
  ``docs/contracts/signal_record.md``.

Behavioral signals are **coaching cues for self-awareness**, never
penalties or personality judgments.
"""

from __future__ import annotations

import enum
import logging
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Conditional numpy import — numpy is only needed for CaptureFrame's
# ``frame_bgr`` field. If numpy is not installed we still want the rest
# of the models to be importable.
# ---------------------------------------------------------------------------
try:
    import numpy as np  # noqa: F401

    _HAS_NUMPY = True
except ImportError:  # pragma: no cover
    _HAS_NUMPY = False
    logger.warning(
        "numpy is not installed — CaptureFrame.frame_bgr will be unavailable."
    )


# ===================================================================== #
#  Input models — data from Part 1's capture subsystem                  #
# ===================================================================== #


class STTWord(BaseModel):
    """A single word with speech-to-text timing information."""

    word: str
    start_s: float = Field(..., description="Start time in seconds")
    end_s: float = Field(..., description="End time in seconds")
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="STT confidence score"
    )


class CaptureFrame(BaseModel):
    """
    A single captured frame from the live session.

    Received from Part 1's capture handoff on a per-frame basis.
    ``frame_bgr`` is a BGR numpy array (OpenCV convention); it may be
    ``None`` for audio-only frames.
    """

    model_config = ConfigDict(arbitrary_types_allowed=True)

    timestamp_s: float = Field(..., description="Timestamp in seconds")
    frame_bgr: Optional[object] = Field(
        default=None,
        description="Video frame as a numpy ndarray in BGR colour order",
    )
    audio_chunk: Optional[bytes] = Field(
        default=None, description="Raw PCM audio chunk"
    )


class CaptureHandoff(BaseModel):
    """
    Full capture handoff payload from Part 1 for **one learner response**.

    This is the primary input to ``BehavioralPipeline.analyze()``.
    """

    session_id: str
    learner_id: str
    response_id: str
    response_start_ts: str = Field(
        ..., description="ISO-8601 timestamp for the response start"
    )
    response_end_ts: str = Field(
        ..., description="ISO-8601 timestamp for the response end"
    )
    audio_path: str = Field(
        ..., description="Filesystem path to the WAV file for this response"
    )
    video_frames_dir: Optional[str] = Field(
        default=None,
        description="Directory containing extracted video frames (or None)",
    )
    stt_words: list[STTWord] = Field(
        default_factory=list,
        description="Word-level STT timestamps from Part 1",
    )


# ===================================================================== #
#  Prosody signal models                                                #
# ===================================================================== #


class PauseSegment(BaseModel):
    """A detected pause (silence) in the learner's speech."""

    start_s: float
    end_s: float
    duration_s: float = Field(..., ge=0.0)


class PitchPoint(BaseModel):
    """A single pitch measurement at a point in time."""

    time_s: float
    hz: float


class ProsodySignal(BaseModel):
    """
    Aggregated prosody metrics for one response.

    All values are **coaching cues** — e.g. a high jitter percentage is
    a cue that the learner may benefit from breathing exercises, not a
    penalty.
    """

    speaking_rate_wpm: float = Field(
        default=0.0, description="Words per minute (excluding pauses)"
    )
    pause_segments: list[PauseSegment] = Field(default_factory=list)
    total_pause_duration_s: float = Field(default=0.0, ge=0.0)
    pitch_mean_hz: float = Field(default=0.0)
    pitch_std_hz: float = Field(default=0.0)
    pitch_contour: list[PitchPoint] = Field(default_factory=list)
    jitter_percent: float = Field(default=0.0)
    shimmer_percent: float = Field(default=0.0)
    hnr_db: float = Field(default=0.0, description="Harmonics-to-noise ratio")


# ===================================================================== #
#  Gaze signal models                                                   #
# ===================================================================== #


class GazeDirection(str, enum.Enum):
    """Estimated categorical gaze direction."""

    CENTER = "center"
    LEFT = "left"
    RIGHT = "right"
    UP = "up"
    DOWN = "down"


class GazePoint(BaseModel):
    """Gaze direction at a single point in time."""

    time_s: float
    direction: GazeDirection


class HeadPose(BaseModel):
    """Head orientation (Euler angles in degrees) at a point in time."""

    time_s: float
    yaw: float
    pitch: float
    roll: float


class GazeSignal(BaseModel):
    """
    Aggregated gaze / head-pose metrics for one response.

    ``eye_contact_pct`` is a coaching cue — low eye contact may indicate
    that the learner is reading notes or feeling uncertain; it is **not**
    a penalty.
    """

    eye_contact_pct: float = Field(
        default=0.0,
        ge=0.0,
        le=100.0,
        description="Percentage of frames with gaze classified as 'center'",
    )
    gaze_direction_timeline: list[GazePoint] = Field(default_factory=list)
    head_pose_timeline: list[HeadPose] = Field(default_factory=list)
    avg_yaw: float = Field(default=0.0)
    avg_pitch: float = Field(default=0.0)


# ===================================================================== #
#  Facial expression signal models                                      #
# ===================================================================== #


class ExpressionPoint(BaseModel):
    """A detected facial expression at a point in time."""

    time_s: float
    expression: str
    confidence: float = Field(..., ge=0.0, le=1.0)


class FacialSignal(BaseModel):
    """
    Aggregated facial action-unit / expression metrics for one response.

    AU intensities and expression distributions are coaching cues that
    help the learner become aware of their non-verbal communication
    patterns.
    """

    au_means: dict[str, float] = Field(
        default_factory=dict,
        description="Mean AU intensities, e.g. {'AU01': 0.42, 'AU06': 0.65}",
    )
    expression_timeline: list[ExpressionPoint] = Field(default_factory=list)
    dominant_expression: str = Field(default="neutral")
    expression_distribution: dict[str, float] = Field(
        default_factory=dict,
        description="Fraction of time per expression, e.g. {'happy': 0.3, 'neutral': 0.7}",
    )


# ===================================================================== #
#  Anomaly / correlation models                                         #
# ===================================================================== #


class Anomaly(BaseModel):
    """
    A temporally-localised behavioural anomaly worth surfacing to the
    learner as a coaching cue.

    ``description`` is always phrased constructively (e.g. "You paused
    for 4 seconds here — a brief pause can be powerful, but a long one
    may signal uncertainty to your interviewer").
    """

    time_s: float
    type: str = Field(
        ...,
        description="Anomaly category, e.g. 'confidence_drop', 'long_pause', 'gaze_aversion'",
    )
    description: str = Field(
        ...,
        description="Coaching-friendly (never punitive) description",
    )
    severity: str = Field(
        ...,
        description="One of 'low', 'medium', 'high'",
    )


# ===================================================================== #
#  Output contract — BehavioralSignalRecord sent to Part 3              #
# ===================================================================== #


class BehavioralSignalRecord(BaseModel):
    """
    **The** output contract from Part 2 → Part 3.

    Contains all behavioural signals for a single learner response,
    timestamped and ready for evidence-based feedback generation.
    Part 3 owns how these numbers are **worded** in the feedback report.
    """

    session_id: str
    learner_id: str
    response_id: str
    response_start_ts: str
    response_end_ts: str
    prosody: ProsodySignal = Field(default_factory=ProsodySignal)
    gaze: GazeSignal = Field(default_factory=GazeSignal)
    facial: FacialSignal = Field(default_factory=FacialSignal)
    anomalies: list[Anomaly] = Field(default_factory=list)
    analyzed_at: str = Field(
        ..., description="ISO-8601 timestamp when analysis completed"
    )
