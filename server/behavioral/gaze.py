"""
Gaze analyser — estimates gaze direction and head pose from video frames.

Uses **MediaPipe FaceMesh** (with ``refine_landmarks=True`` for iris
tracking) to determine where the learner is looking and how their head
is oriented.

Eye-contact percentage is a **coaching cue** — low contact may suggest
the learner is reading notes or feeling uncertain.  It is **never** a
penalty or personality judgment.

Graceful degradation
--------------------
If ``mediapipe`` or ``opencv-python`` are not installed the analyser
returns a zeroed-out ``GazeSignal`` and logs a warning.
"""

from __future__ import annotations

import logging
import math
import os
from pathlib import Path
from typing import Optional

from server.behavioral.models import (
    GazeDirection,
    GazePoint,
    GazeSignal,
    HeadPose,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Conditional imports
# ---------------------------------------------------------------------------
try:
    import cv2

    _HAS_CV2 = True
except ImportError:  # pragma: no cover
    _HAS_CV2 = False
    logger.warning("opencv-python is not installed — GazeAnalyzer unavailable.")

try:
    import mediapipe as mp

    _HAS_MEDIAPIPE = True
except ImportError:  # pragma: no cover
    _HAS_MEDIAPIPE = False
    logger.warning("mediapipe is not installed — GazeAnalyzer unavailable.")

try:
    import numpy as np

    _HAS_NUMPY = True
except ImportError:  # pragma: no cover
    _HAS_NUMPY = False
    logger.warning("numpy is not installed — GazeAnalyzer unavailable.")


# ---------------------------------------------------------------------------
# Landmark indices used by solvePnP for head-pose estimation
# (Nose tip, Chin, Left eye left corner, Right eye right corner,
#  Left mouth corner, Right mouth corner)
# ---------------------------------------------------------------------------
_POSE_LANDMARKS = [1, 152, 33, 263, 61, 291]

# Iris landmark ranges (available when refine_landmarks=True)
_LEFT_IRIS = list(range(468, 473))
_RIGHT_IRIS = list(range(473, 478))

# Eye corner landmarks for gaze-direction estimation
_LEFT_EYE_INNER = 133
_LEFT_EYE_OUTER = 33
_RIGHT_EYE_INNER = 362
_RIGHT_EYE_OUTER = 263

# Vertical eye landmarks for up/down estimation
_LEFT_EYE_TOP = 159
_LEFT_EYE_BOTTOM = 145
_RIGHT_EYE_TOP = 386
_RIGHT_EYE_BOTTOM = 374


class GazeAnalyzer:
    """Estimates gaze direction and head pose from extracted video frames.

    Parameters
    ----------
    face_mesh_kwargs : dict, optional
        Extra keyword arguments forwarded to
        ``mediapipe.solutions.face_mesh.FaceMesh``.
    """

    def __init__(self, **face_mesh_kwargs: object) -> None:
        self._fm_kwargs = {
            "static_image_mode": True,
            "max_num_faces": 1,
            "refine_landmarks": True,
            "min_detection_confidence": 0.5,
            **face_mesh_kwargs,
        }
        self._face_mesh: Optional[object] = None

    # ------------------------------------------------------------------ #
    #  Lazy initialisation                                                #
    # ------------------------------------------------------------------ #

    def _get_face_mesh(self) -> object:
        """Return a FaceMesh instance, creating it lazily."""
        if self._face_mesh is None:
            if not _HAS_MEDIAPIPE:
                raise RuntimeError("mediapipe is not installed")
            self._face_mesh = mp.solutions.face_mesh.FaceMesh(**self._fm_kwargs)
        return self._face_mesh

    # ------------------------------------------------------------------ #
    #  Public API                                                         #
    # ------------------------------------------------------------------ #

    def analyze_frames(
        self,
        frames_dir: str,
        fps: float = 30.0,
    ) -> GazeSignal:
        """Analyse all image frames in *frames_dir*.

        Parameters
        ----------
        frames_dir:
            Path to a directory of image files (sorted alphabetically
            for temporal ordering).
        fps:
            Assumed frames-per-second for timestamp calculation.

        Returns
        -------
        GazeSignal
        """
        if not (_HAS_MEDIAPIPE and _HAS_CV2 and _HAS_NUMPY):
            logger.warning(
                "Returning zeroed gaze signal (missing dependencies)."
            )
            return GazeSignal()

        frame_paths = self._sorted_frame_paths(frames_dir)
        if not frame_paths:
            logger.warning("No image frames found in %s", frames_dir)
            return GazeSignal()

        gaze_timeline: list[GazePoint] = []
        head_timeline: list[HeadPose] = []
        center_count = 0

        face_mesh = self._get_face_mesh()

        for idx, fpath in enumerate(frame_paths):
            time_s = round(idx / fps, 4)
            img = cv2.imread(str(fpath))
            if img is None:
                continue

            h, w, _ = img.shape
            rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb)

            if not results.multi_face_landmarks:
                continue

            landmarks = results.multi_face_landmarks[0].landmark

            # Gaze direction
            direction = self._estimate_gaze_direction(landmarks, w, h)
            gaze_timeline.append(GazePoint(time_s=time_s, direction=direction))
            if direction == GazeDirection.CENTER:
                center_count += 1

            # Head pose
            yaw, pitch, roll = self._estimate_head_pose(landmarks, w, h)
            head_timeline.append(
                HeadPose(time_s=time_s, yaw=yaw, pitch=pitch, roll=roll)
            )

        total = len(gaze_timeline) if gaze_timeline else 1
        eye_contact_pct = round((center_count / total) * 100.0, 2)

        avg_yaw = round(
            sum(hp.yaw for hp in head_timeline) / max(len(head_timeline), 1), 2
        )
        avg_pitch = round(
            sum(hp.pitch for hp in head_timeline) / max(len(head_timeline), 1),
            2,
        )

        return GazeSignal(
            eye_contact_pct=eye_contact_pct,
            gaze_direction_timeline=gaze_timeline,
            head_pose_timeline=head_timeline,
            avg_yaw=avg_yaw,
            avg_pitch=avg_pitch,
        )

    # ------------------------------------------------------------------ #
    #  Gaze direction estimation                                          #
    # ------------------------------------------------------------------ #

    def _estimate_gaze_direction(
        self,
        landmarks: object,
        image_w: int,
        image_h: int,
    ) -> GazeDirection:
        """Determine categorical gaze direction from iris position.

        Compares the horizontal position of each iris centre relative
        to the inner/outer eye corners and the vertical position
        relative to the upper/lower eyelid to classify gaze.
        """
        try:
            # Average iris centres (pixel coords)
            l_iris_x = np.mean([landmarks[i].x for i in _LEFT_IRIS]) * image_w
            l_iris_y = np.mean([landmarks[i].y for i in _LEFT_IRIS]) * image_h
            r_iris_x = np.mean([landmarks[i].x for i in _RIGHT_IRIS]) * image_w
            r_iris_y = np.mean([landmarks[i].y for i in _RIGHT_IRIS]) * image_h

            # Horizontal: ratio = (iris_x - outer) / (inner - outer)
            l_inner_x = landmarks[_LEFT_EYE_INNER].x * image_w
            l_outer_x = landmarks[_LEFT_EYE_OUTER].x * image_w
            r_inner_x = landmarks[_RIGHT_EYE_INNER].x * image_w
            r_outer_x = landmarks[_RIGHT_EYE_OUTER].x * image_w

            l_h_range = l_inner_x - l_outer_x
            r_h_range = r_inner_x - r_outer_x

            if abs(l_h_range) < 1 or abs(r_h_range) < 1:
                return GazeDirection.CENTER

            l_ratio_h = (l_iris_x - l_outer_x) / l_h_range
            r_ratio_h = (r_iris_x - r_outer_x) / r_h_range  # Note: reversed for right eye
            avg_ratio_h = (l_ratio_h + r_ratio_h) / 2.0

            # Vertical: ratio = (iris_y - top) / (bottom - top)
            l_top_y = landmarks[_LEFT_EYE_TOP].y * image_h
            l_bot_y = landmarks[_LEFT_EYE_BOTTOM].y * image_h
            r_top_y = landmarks[_RIGHT_EYE_TOP].y * image_h
            r_bot_y = landmarks[_RIGHT_EYE_BOTTOM].y * image_h

            l_v_range = l_bot_y - l_top_y
            r_v_range = r_bot_y - r_top_y

            if abs(l_v_range) > 1 and abs(r_v_range) > 1:
                l_ratio_v = (l_iris_y - l_top_y) / l_v_range
                r_ratio_v = (r_iris_y - r_top_y) / r_v_range
                avg_ratio_v = (l_ratio_v + r_ratio_v) / 2.0
            else:
                avg_ratio_v = 0.5  # default to centre

            # Thresholds
            if avg_ratio_h < 0.35:
                return GazeDirection.LEFT
            if avg_ratio_h > 0.65:
                return GazeDirection.RIGHT
            if avg_ratio_v < 0.3:
                return GazeDirection.UP
            if avg_ratio_v > 0.7:
                return GazeDirection.DOWN

            return GazeDirection.CENTER

        except Exception:
            logger.debug("Gaze direction estimation failed for a frame", exc_info=True)
            return GazeDirection.CENTER

    # ------------------------------------------------------------------ #
    #  Head-pose estimation via solvePnP                                  #
    # ------------------------------------------------------------------ #

    def _estimate_head_pose(
        self,
        landmarks: object,
        image_w: int,
        image_h: int,
    ) -> tuple[float, float, float]:
        """Estimate head yaw/pitch/roll using OpenCV's ``solvePnP``.

        Uses six well-defined facial landmarks and a generic 3-D face
        model to solve the Perspective-n-Point problem.

        Returns
        -------
        (yaw, pitch, roll) in degrees.
        """
        try:
            # 3-D model points (generic face, arbitrary units)
            model_points = np.array(
                [
                    (0.0, 0.0, 0.0),  # Nose tip
                    (0.0, -330.0, -65.0),  # Chin
                    (-225.0, 170.0, -135.0),  # Left eye left corner
                    (225.0, 170.0, -135.0),  # Right eye right corner
                    (-150.0, -150.0, -125.0),  # Left mouth corner
                    (150.0, -150.0, -125.0),  # Right mouth corner
                ],
                dtype=np.float64,
            )

            # 2-D image points
            image_points = np.array(
                [
                    (landmarks[idx].x * image_w, landmarks[idx].y * image_h)
                    for idx in _POSE_LANDMARKS
                ],
                dtype=np.float64,
            )

            # Camera internals (approximate)
            focal_length = image_w
            center = (image_w / 2.0, image_h / 2.0)
            camera_matrix = np.array(
                [
                    [focal_length, 0, center[0]],
                    [0, focal_length, center[1]],
                    [0, 0, 1],
                ],
                dtype=np.float64,
            )
            dist_coeffs = np.zeros((4, 1))

            success, rotation_vec, _ = cv2.solvePnP(
                model_points,
                image_points,
                camera_matrix,
                dist_coeffs,
                flags=cv2.SOLVEPNP_ITERATIVE,
            )
            if not success:
                return 0.0, 0.0, 0.0

            rmat, _ = cv2.Rodrigues(rotation_vec)

            # Decompose rotation matrix into Euler angles
            yaw = math.degrees(math.atan2(rmat[1, 0], rmat[0, 0]))
            pitch = math.degrees(
                math.atan2(
                    -rmat[2, 0],
                    math.sqrt(rmat[2, 1] ** 2 + rmat[2, 2] ** 2),
                )
            )
            roll = math.degrees(math.atan2(rmat[2, 1], rmat[2, 2]))

            return round(yaw, 2), round(pitch, 2), round(roll, 2)

        except Exception:
            logger.debug("Head pose estimation failed for a frame", exc_info=True)
            return 0.0, 0.0, 0.0

    # ------------------------------------------------------------------ #
    #  Helpers                                                            #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _sorted_frame_paths(frames_dir: str) -> list[Path]:
        """Return sorted image file paths from *frames_dir*."""
        supported = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
        dirpath = Path(frames_dir)
        if not dirpath.is_dir():
            return []
        return sorted(
            p for p in dirpath.iterdir() if p.suffix.lower() in supported
        )
