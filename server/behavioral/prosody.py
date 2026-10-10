"""
Prosody analyser — extracts vocal metrics from a WAV file.

Uses **Parselmouth** (a Python wrapper for Praat) to compute pitch,
jitter, shimmer, and HNR.  Speaking rate and pause detection are
derived from the STT word-level timestamps supplied by Part 1.

Graceful degradation
--------------------
If ``parselmouth`` is not installed the analyser returns a zeroed-out
``ProsodySignal`` and logs a warning.  This lets the rest of the
pipeline keep running during development or in environments where the
library is unavailable.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from server.behavioral.models import (
    PauseSegment,
    PitchPoint,
    ProsodySignal,
    STTWord,
)

if TYPE_CHECKING:  # pragma: no cover
    pass

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Conditional import — parselmouth is a heavy C++ extension; we allow
# the module to be imported even if it is missing.
# ---------------------------------------------------------------------------
try:
    import parselmouth
    from parselmouth.praat import call as praat_call

    _HAS_PARSELMOUTH = True
except ImportError:  # pragma: no cover
    _HAS_PARSELMOUTH = False
    logger.warning(
        "parselmouth is not installed — ProsodyAnalyzer will return default "
        "(zeroed) signals. Install with: pip install parselmouth"
    )


# Pause detection threshold in seconds — gaps between STT words longer
# than this are classified as pauses.
_PAUSE_THRESHOLD_S: float = 0.3


class ProsodyAnalyzer:
    """Extracts prosody signals from a WAV audio file.

    Parameters
    ----------
    pause_threshold_s : float, optional
        Minimum gap between STT words (in seconds) to classify as a
        pause.  Defaults to 0.3 s.
    """

    def __init__(self, pause_threshold_s: float = _PAUSE_THRESHOLD_S) -> None:
        self._pause_threshold = pause_threshold_s

    # ------------------------------------------------------------------ #
    #  Public API                                                         #
    # ------------------------------------------------------------------ #

    def analyze(
        self,
        audio_path: str,
        stt_words: list[STTWord],
    ) -> ProsodySignal:
        """Analyse a WAV file and return a ``ProsodySignal``.

        Parameters
        ----------
        audio_path:
            Filesystem path to a mono/stereo WAV file.
        stt_words:
            Word-level STT timestamps from Part 1's capture handoff.

        Returns
        -------
        ProsodySignal
            Aggregated prosody metrics.  If *parselmouth* is not
            installed, a zeroed-out signal is returned.
        """
        # --- Pause detection (works without parselmouth) ---------------
        pauses = self._detect_pauses(stt_words)
        total_pause = sum(p.duration_s for p in pauses)

        # --- Speaking rate (works without parselmouth) -----------------
        speaking_rate = self._compute_speaking_rate(stt_words, total_pause)

        if not _HAS_PARSELMOUTH:
            logger.warning(
                "Returning zeroed prosody signal (parselmouth unavailable)."
            )
            return ProsodySignal(
                speaking_rate_wpm=speaking_rate,
                pause_segments=pauses,
                total_pause_duration_s=total_pause,
            )

        # --- Parselmouth analysis --------------------------------------
        try:
            sound = parselmouth.Sound(audio_path)
        except Exception:
            logger.exception("Failed to load audio file %s", audio_path)
            return ProsodySignal(
                speaking_rate_wpm=speaking_rate,
                pause_segments=pauses,
                total_pause_duration_s=total_pause,
            )

        pitch_mean, pitch_std, contour = self._extract_pitch(sound)
        jitter = self._extract_jitter(sound)
        shimmer = self._extract_shimmer(sound)
        hnr = self._extract_hnr(sound)

        return ProsodySignal(
            speaking_rate_wpm=speaking_rate,
            pause_segments=pauses,
            total_pause_duration_s=total_pause,
            pitch_mean_hz=pitch_mean,
            pitch_std_hz=pitch_std,
            pitch_contour=contour,
            jitter_percent=jitter,
            shimmer_percent=shimmer,
            hnr_db=hnr,
        )

    # ------------------------------------------------------------------ #
    #  Pause detection                                                    #
    # ------------------------------------------------------------------ #

    def _detect_pauses(self, stt_words: list[STTWord]) -> list[PauseSegment]:
        """Detect pauses (gaps > threshold) between consecutive STT words."""
        if len(stt_words) < 2:
            return []

        pauses: list[PauseSegment] = []
        for prev_word, cur_word in zip(stt_words[:-1], stt_words[1:]):
            gap = cur_word.start_s - prev_word.end_s
            if gap >= self._pause_threshold:
                pauses.append(
                    PauseSegment(
                        start_s=prev_word.end_s,
                        end_s=cur_word.start_s,
                        duration_s=round(gap, 4),
                    )
                )
        return pauses

    # ------------------------------------------------------------------ #
    #  Speaking rate                                                      #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _compute_speaking_rate(
        stt_words: list[STTWord],
        total_pause_s: float,
    ) -> float:
        """Compute speaking rate in words-per-minute, excluding pauses."""
        if not stt_words:
            return 0.0

        total_duration = stt_words[-1].end_s - stt_words[0].start_s
        speaking_time = total_duration - total_pause_s
        if speaking_time <= 0:
            return 0.0

        return round(len(stt_words) / (speaking_time / 60.0), 2)

    # ------------------------------------------------------------------ #
    #  Pitch extraction                                                   #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _extract_pitch(
        sound: "parselmouth.Sound",
    ) -> tuple[float, float, list[PitchPoint]]:
        """Extract pitch statistics and contour from *sound*.

        Returns
        -------
        (mean_hz, std_hz, contour)
        """
        try:
            pitch_obj = sound.to_pitch()
            pitch_values = pitch_obj.selected_array["frequency"]

            # Filter out unvoiced frames (0 Hz)
            voiced = [v for v in pitch_values if v > 0]
            if not voiced:
                return 0.0, 0.0, []

            import numpy as np

            mean_hz = float(np.mean(voiced))
            std_hz = float(np.std(voiced))

            # Build a time-stamped contour for the dashboard
            times = pitch_obj.xs()
            contour: list[PitchPoint] = []
            for t, f in zip(times, pitch_values):
                if f > 0:
                    contour.append(PitchPoint(time_s=round(float(t), 4), hz=round(float(f), 2)))

            return round(mean_hz, 2), round(std_hz, 2), contour
        except Exception:
            logger.exception("Pitch extraction failed")
            return 0.0, 0.0, []

    # ------------------------------------------------------------------ #
    #  Jitter                                                             #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _extract_jitter(sound: "parselmouth.Sound") -> float:
        """Extract local jitter (%) from *sound*."""
        try:
            point_process = praat_call(
                sound, "To PointProcess (periodic, cc)", 75.0, 600.0
            )
            jitter = praat_call(
                point_process,
                "Get jitter (local)",
                0.0,
                0.0,
                0.0001,
                0.02,
                1.3,
            )
            return round(float(jitter) * 100.0, 4) if jitter is not None else 0.0
        except Exception:
            logger.exception("Jitter extraction failed")
            return 0.0

    # ------------------------------------------------------------------ #
    #  Shimmer                                                            #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _extract_shimmer(sound: "parselmouth.Sound") -> float:
        """Extract local shimmer (%) from *sound*."""
        try:
            point_process = praat_call(
                sound, "To PointProcess (periodic, cc)", 75.0, 600.0
            )
            shimmer = praat_call(
                [sound, point_process],
                "Get shimmer (local)",
                0.0,
                0.0,
                0.0001,
                0.02,
                1.3,
                1.6,
            )
            return round(float(shimmer) * 100.0, 4) if shimmer is not None else 0.0
        except Exception:
            logger.exception("Shimmer extraction failed")
            return 0.0

    # ------------------------------------------------------------------ #
    #  Harmonics-to-Noise Ratio                                           #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _extract_hnr(sound: "parselmouth.Sound") -> float:
        """Extract mean HNR (dB) from *sound*."""
        try:
            harmonicity = praat_call(
                sound,
                "To Harmonicity (cc)",
                0.01,
                75.0,
                0.1,
                1.0,
            )
            hnr = praat_call(harmonicity, "Get mean", 0.0, 0.0)
            return round(float(hnr), 2) if hnr is not None else 0.0
        except Exception:
            logger.exception("HNR extraction failed")
            return 0.0
