"""
Temporal correlator detecting behavioral anomalies and coaching moments.

Correlates gaze aversion, vocal stress (jitter/pitch), and pauses/silence
to find pedagogical coaching opportunities.
"""

from __future__ import annotations

import logging
from server.behavioral.models import (
    Anomaly,
    FacialSignal,
    GazeSignal,
    ProsodySignal,
    STTWord,
)

logger = logging.getLogger(__name__)


class TemporalCorrelator:
    """Detects multi-modal anomalies and coaching cues across time."""

    def correlate(
        self,
        prosody: ProsodySignal,
        gaze: GazeSignal,
        facial: FacialSignal,
        stt_words: list[STTWord],
    ) -> list[Anomaly]:
        anomalies: list[Anomaly] = []

        # 1. Extended pauses (> 3.0 seconds)
        for pause in prosody.pause_segments:
            if pause.duration_s >= 3.0:
                severity = "high" if pause.duration_s >= 5.0 else "medium"
                anomalies.append(
                    Anomaly(
                        time_s=pause.start_s,
                        type="long_pause",
                        description=(
                            f"Extended hesitation ({pause.duration_s:.1f}s). "
                            "Consider using a transition phrase or structuring your thoughts using STAR."
                        ),
                        severity=severity,
                    )
                )

        # 2. Vocal stress / jitter spikes (> 2.5%)
        if prosody.jitter_percent > 2.5:
            anomalies.append(
                Anomaly(
                    time_s=0.0,
                    type="vocal_stress",
                    description=(
                        f"Elevated vocal jitter ({prosody.jitter_percent:.1f}%). "
                        "Try taking a slow breath before delivering key arguments."
                    ),
                    severity="medium",
                )
            )

        # 3. Low camera engagement / eye contact (< 40%)
        if gaze.eye_contact_pct < 40.0 and len(gaze.gaze_direction_timeline) > 0:
            anomalies.append(
                Anomaly(
                    time_s=0.0,
                    type="gaze_aversion",
                    description=(
                        f"Camera eye contact was {gaze.eye_contact_pct:.0f}%. "
                        "Looking toward the camera lens periodically builds connection with remote interviewers."
                    ),
                    severity="low",
                )
            )

        # 4. Multi-modal confidence drops: pause coinciding with looking away
        for pause in prosody.pause_segments:
            if pause.duration_s >= 2.0:
                # Check if gaze was averted during this pause
                looking_away = any(
                    gp.direction != "center"
                    for gp in gaze.gaze_direction_timeline
                    if pause.start_s <= gp.time_s <= pause.end_s
                )
                if looking_away:
                    anomalies.append(
                        Anomaly(
                            time_s=pause.start_s,
                            type="confidence_drop",
                            description=(
                                f"Noticeable hesitation at {pause.start_s:.1f}s while looking away. "
                                "It's natural to look away to think, but bridging with 'That's an interesting challenge...' keeps engagement high."
                            ),
                            severity="medium",
                        )
                    )

        # 5. Rapid speech rate (> 175 WPM)
        if prosody.speaking_rate_wpm > 175.0:
            anomalies.append(
                Anomaly(
                    time_s=0.0,
                    type="rapid_speech",
                    description=(
                        f"Fast speaking pace ({prosody.speaking_rate_wpm:.0f} WPM). "
                        "Slowing down slightly gives your audience time to absorb technical details."
                    ),
                    severity="low",
                )
            )

        # Sort anomalies by timestamp
        anomalies.sort(key=lambda a: a.time_s)
        return anomalies
