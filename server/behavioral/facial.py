"""
Facial expression and Action Unit (AU) analyzer using Py-feat.

Extracts facial action units, expression distributions, and expression
timelines across video frames. Degrades gracefully if py-feat or opencv
are not installed.
"""

from __future__ import annotations

import logging
import os
from typing import Optional

from server.behavioral.models import (
    ExpressionPoint,
    FacialSignal,
)

logger = logging.getLogger(__name__)

# Conditional import for Py-feat and OpenCV
_HAS_PYFEAT = False
_HAS_CV2 = False

try:
    import cv2
    _HAS_CV2 = True
except ImportError:
    logger.warning("opencv-python not found; FacialAnalyzer video processing disabled.")

try:
    from feat import Detector
    _HAS_PYFEAT = True
except ImportError:
    logger.warning("py-feat not installed; FacialAnalyzer will return default empty signals.")


class FacialAnalyzer:
    """Analyzes facial expressions and FACS action units across video frames."""

    def __init__(self):
        self._detector: Optional[Detector] = None
        if _HAS_PYFEAT:
            try:
                self._detector = Detector(
                    face_model="retinaface",
                    landmark_model="mobilenet",
                    au_model="svm",
                    emotion_model="resmasknet",
                )
            except Exception as e:
                logger.warning("Failed to initialize Py-feat detector: %s", e)
                self._detector = None

    def analyze_frames(
        self, frames_dir: Optional[str], fps: float = 30.0
    ) -> FacialSignal:
        """
        Analyze all frame images in a directory.

        Parameters
        ----------
        frames_dir:
            Path to folder containing extracted JPEG/PNG image frames.
        fps:
            Sampling rate of the frames in frames_dir.

        Returns
        -------
        FacialSignal with AU means and expression timeline.
        """
        if not frames_dir or not os.path.exists(frames_dir):
            return FacialSignal()

        if not self._detector or not _HAS_CV2:
            logger.info("Py-feat detector or OpenCV unavailable. Returning default FacialSignal.")
            return FacialSignal(
                au_means={"AU01": 0.0, "AU02": 0.0, "AU04": 0.0, "AU12": 0.0},
                dominant_expression="neutral",
                expression_distribution={"neutral": 1.0},
            )

        try:
            # List image files sorted
            frame_files = sorted(
                [
                    os.path.join(frames_dir, f)
                    for f in os.listdir(frames_dir)
                    if f.lower().endswith((".jpg", ".jpeg", ".png"))
                ]
            )

            if not frame_files:
                return FacialSignal()

            # Process with Py-feat
            predictions = self._detector.detect_image(frame_files)
            if predictions.empty:
                return FacialSignal()

            # Calculate emotion predictions
            emotions = ["anger", "disgust", "fear", "happiness", "sadness", "surprise", "neutral"]
            timeline: list[ExpressionPoint] = []
            emotion_counts: dict[str, int] = {e: 0 for e in emotions}

            # Extract timeline
            for idx, row in predictions.iterrows():
                time_s = idx / fps
                # Find highest probability emotion
                best_emo = "neutral"
                best_val = 0.0
                for emo in emotions:
                    if emo in row and row[emo] > best_val:
                        best_val = float(row[emo])
                        best_emo = emo

                timeline.append(
                    ExpressionPoint(
                        time_s=round(time_s, 2),
                        expression=best_emo,
                        confidence=round(best_val, 2),
                    )
                )
                emotion_counts[best_emo] += 1

            total_frames = len(timeline)
            distribution = {
                emo: round(count / total_frames, 2)
                for emo, count in emotion_counts.items()
                if total_frames > 0
            }

            dominant_expression = max(distribution, key=distribution.get) if distribution else "neutral"

            # Compute AU means
            au_columns = [c for c in predictions.columns if c.startswith("AU")]
            au_means: dict[str, float] = {}
            for au in au_columns:
                mean_val = float(predictions[au].mean())
                au_means[au] = round(mean_val, 3)

            return FacialSignal(
                au_means=au_means,
                expression_timeline=timeline,
                dominant_expression=dominant_expression,
                expression_distribution=distribution,
            )

        except Exception as err:
            logger.error("Error running facial analysis: %s", err, exc_info=True)
            return FacialSignal()
