# Signal Record Contract — `[2] → [3]`

> **Producer:** Part 2 (Behavioral Telemetry)
> **Consumer:** Part 3 (Learning Engine & Integrations)
> **Transport:** In-process function call (for hackathon MVP); JSON-serializable for future HTTP/message bus
> **Frequency:** One record per learner response within a session
> **Version:** 0.1.0

## Purpose

After Part 1 hands off captured audio and video for a response (via the Capture Handoff contract `[1] → [2]`), Part 2 analyzes the behavioral signals and produces a `BehavioralSignalRecord`. Part 3 consumes this record to:

- Include behavioral coaching insights in the evidence-based feedback report
- Correlate behavioral patterns with content quality gaps
- Generate coaching-friendly descriptions of behavioral patterns

> [!WARNING]
> **Ethical constraint:** Part 2 provides raw measurements only. Part 3 owns all human-facing interpretation and **must** frame signals as coaching cues for self-awareness — **never** penalties, personality judgments, or neurotype indicators.

---

## Schema

All types below are JSON-serializable. Field names use `snake_case`. Timestamps are ISO 8601 strings; durations and offsets are floating-point seconds.

### `BehavioralSignalRecord` (top-level)

| Field | Type | Required | Description |
|---|---|---|---|
| `session_id` | `string` | ✅ | Session identifier (from Part 1's capture handoff) |
| `learner_id` | `string` | ✅ | Learner identifier |
| `response_id` | `string` | ✅ | Unique ID for this response within the session |
| `response_start_ts` | `string` (ISO 8601) | ✅ | When the learner's response began |
| `response_end_ts` | `string` (ISO 8601) | ✅ | When the learner's response ended |
| `prosody` | [`ProsodySignal`](#prosodysignal) | ✅ | Speech prosody measurements |
| `gaze` | [`GazeSignal`](#gazesignal) | ✅ | Gaze and head-pose measurements |
| `facial` | [`FacialSignal`](#facialsignal) | ✅ | Facial expression and action-unit measurements |
| `anomalies` | [`Anomaly[]`](#anomaly) | ✅ | Notable behavioral moments detected by temporal correlation (may be empty `[]`) |
| `analyzed_at` | `string` (ISO 8601) | ✅ | When Part 2 completed this analysis |

---

### `ProsodySignal`

Measured with **Parselmouth** (Praat bindings) + STT word-level timestamps from Part 1.

| Field | Type | Required | Description |
|---|---|---|---|
| `speaking_rate_wpm` | `float` | ✅ | Words per minute (derived from STT word timestamps) |
| `pause_segments` | [`PauseSegment[]`](#pausesegment) | ✅ | Detected pauses > 0.3 s (may be empty `[]`) |
| `total_pause_duration_s` | `float` | ✅ | Sum of all pause durations in seconds |
| `pitch_mean_hz` | `float` | ✅ | Mean fundamental frequency (F0) across voiced frames |
| `pitch_std_hz` | `float` | ✅ | Standard deviation of F0 |
| `pitch_contour` | [`PitchPoint[]`](#pitchpoint) | ✅ | Time-series of pitch values (sampled ≤ 100 ms apart) |
| `jitter_percent` | `float` | ✅ | Cycle-to-cycle pitch variation (%) |
| `shimmer_percent` | `float` | ✅ | Cycle-to-cycle amplitude variation (%) |
| `hnr_db` | `float` | ✅ | Harmonics-to-noise ratio in dB |

### `PauseSegment`

| Field | Type | Required | Description |
|---|---|---|---|
| `start_s` | `float` | ✅ | Pause start time (seconds from response start) |
| `end_s` | `float` | ✅ | Pause end time (seconds from response start) |
| `duration_s` | `float` | ✅ | Pause duration in seconds (`end_s − start_s`) |

### `PitchPoint`

| Field | Type | Required | Description |
|---|---|---|---|
| `time_s` | `float` | ✅ | Time in seconds from response start |
| `hz` | `float` | ✅ | Pitch frequency in Hertz |

---

### `GazeSignal`

Measured with **MediaPipe Face Mesh** (468-landmark model).

| Field | Type | Required | Description |
|---|---|---|---|
| `eye_contact_pct` | `float` | ✅ | Percentage of frames with center gaze (0–100) |
| `gaze_direction_timeline` | [`GazePoint[]`](#gazepoint) | ✅ | Time-series of gaze direction (sampled per video frame) |
| `head_pose_timeline` | [`HeadPose[]`](#headpose) | ✅ | Time-series of head orientation |
| `avg_yaw` | `float` | ✅ | Average horizontal head rotation in degrees |
| `avg_pitch` | `float` | ✅ | Average vertical head rotation in degrees |

### `GazePoint`

| Field | Type | Required | Description |
|---|---|---|---|
| `time_s` | `float` | ✅ | Time in seconds from response start |
| `direction` | `enum` | ✅ | One of: `"center"`, `"left"`, `"right"`, `"up"`, `"down"` |

### `HeadPose`

| Field | Type | Required | Description |
|---|---|---|---|
| `time_s` | `float` | ✅ | Time in seconds from response start |
| `yaw` | `float` | ✅ | Horizontal rotation in degrees (0 = facing camera) |
| `pitch` | `float` | ✅ | Vertical rotation in degrees |
| `roll` | `float` | ✅ | Tilt rotation in degrees |

---

### `FacialSignal`

Measured with **Py-feat** (facial action coding).

| Field | Type | Required | Description |
|---|---|---|---|
| `au_means` | `object` | ✅ | Map of Action Unit ID (e.g. `"AU06"`) → mean intensity (`0.0`–`5.0`) |
| `expression_timeline` | [`ExpressionPoint[]`](#expressionpoint) | ✅ | Time-series of detected expressions |
| `dominant_expression` | `string` | ✅ | Most frequent expression across the response |
| `expression_distribution` | `object` | ✅ | Map of expression name → fraction of time (`0.0`–`1.0`); values sum to 1.0 |

### `ExpressionPoint`

| Field | Type | Required | Description |
|---|---|---|---|
| `time_s` | `float` | ✅ | Time in seconds from response start |
| `expression` | `string` | ✅ | Detected expression (e.g. `"neutral"`, `"happy"`, `"surprise"`, `"fear"`, `"sadness"`, `"anger"`, `"disgust"`, `"contempt"`) |
| `confidence` | `float` | ✅ | Detection confidence (`0.0`–`1.0`) |

---

### `Anomaly`

Temporal-correlation layer: Part 2 detects notable behavioral moments and describes them in a coaching-friendly way. Part 3 may refine or override descriptions when generating the final report.

| Field | Type | Required | Description |
|---|---|---|---|
| `time_s` | `float` | ✅ | Time in seconds from response start |
| `type` | `string` | ✅ | Anomaly category — one of: `"long_pause"`, `"vocal_stress"`, `"gaze_aversion"`, `"confidence_drop"`, `"rapid_speech"`, `"monotone"` |
| `description` | `string` | ✅ | Coaching-friendly description of the detected pattern (e.g. _"Noticeable pause while gathering thoughts — consider using a bridging phrase"_) |
| `severity` | `enum` | ✅ | One of: `"low"`, `"medium"`, `"high"` |

---

## Example Record

```json
{
  "session_id": "sess_abc123",
  "learner_id": "learner_42",
  "response_id": "resp_001",
  "response_start_ts": "2026-10-10T14:32:10.000Z",
  "response_end_ts": "2026-10-10T14:33:25.000Z",
  "prosody": {
    "speaking_rate_wpm": 142.5,
    "pause_segments": [
      { "start_s": 8.2, "end_s": 9.7, "duration_s": 1.5 },
      { "start_s": 23.1, "end_s": 23.8, "duration_s": 0.7 }
    ],
    "total_pause_duration_s": 2.2,
    "pitch_mean_hz": 185.3,
    "pitch_std_hz": 32.1,
    "pitch_contour": [
      { "time_s": 0.0, "hz": 180.0 },
      { "time_s": 0.1, "hz": 183.5 },
      { "time_s": 0.2, "hz": 190.2 }
    ],
    "jitter_percent": 1.12,
    "shimmer_percent": 3.45,
    "hnr_db": 18.7
  },
  "gaze": {
    "eye_contact_pct": 72.4,
    "gaze_direction_timeline": [
      { "time_s": 0.0, "direction": "center" },
      { "time_s": 0.033, "direction": "center" },
      { "time_s": 0.066, "direction": "left" },
      { "time_s": 8.5, "direction": "down" },
      { "time_s": 9.0, "direction": "center" }
    ],
    "head_pose_timeline": [
      { "time_s": 0.0, "yaw": 2.1, "pitch": -1.3, "roll": 0.5 },
      { "time_s": 0.033, "yaw": 2.0, "pitch": -1.2, "roll": 0.6 }
    ],
    "avg_yaw": 3.2,
    "avg_pitch": -1.5
  },
  "facial": {
    "au_means": {
      "AU01": 0.3,
      "AU02": 0.1,
      "AU06": 1.2,
      "AU12": 1.8,
      "AU15": 0.2
    },
    "expression_timeline": [
      { "time_s": 0.0, "expression": "neutral", "confidence": 0.92 },
      { "time_s": 1.0, "expression": "happy", "confidence": 0.78 },
      { "time_s": 8.5, "expression": "fear", "confidence": 0.61 },
      { "time_s": 10.0, "expression": "neutral", "confidence": 0.88 }
    ],
    "dominant_expression": "neutral",
    "expression_distribution": {
      "neutral": 0.65,
      "happy": 0.25,
      "fear": 0.07,
      "surprise": 0.03
    }
  },
  "anomalies": [
    {
      "time_s": 8.2,
      "type": "long_pause",
      "description": "1.5 s pause coincided with gaze drop and brief fearful expression — may indicate uncertainty on this point; a bridging phrase could help maintain flow.",
      "severity": "medium"
    },
    {
      "time_s": 23.1,
      "type": "vocal_stress",
      "description": "Elevated jitter and reduced HNR detected during discussion of conflict resolution — breathing exercise before challenging topics may help.",
      "severity": "low"
    }
  ],
  "analyzed_at": "2026-10-10T14:33:26.200Z"
}
```

---

## Versioning

- **Current version:** `0.1.0` (hackathon MVP)
- Breaking changes will be logged in `PROGRESS.md` (Log section)
- Part 3 should validate incoming records and handle missing optional fields gracefully
- The `anomalies` array may be empty if no notable patterns are detected

## Dependencies

| Direction | Contract | What Part 2 needs / provides |
|---|---|---|
| **Upstream** | Capture Handoff `[1] → [2]` | Part 2 **needs** per-response audio (WAV/PCM), video frames, and STT word-level timestamps from Part 1 |
| **Downstream** | _(this contract)_ `[2] → [3]` | Part 2 **provides** the `BehavioralSignalRecord` above; Part 3 consumes it for feedback reports and gap analysis |

## Notes for Part 3 (consumer)

1. **Numerical values only.** This contract intentionally provides raw measurements (percentages, Hz, dB, seconds). Part 3 is responsible for turning these into human-readable coaching language.
2. **Anomaly descriptions** are coaching-friendly suggestions from Part 2's temporal-correlation layer. Part 3 may refine, override, or discard them when generating the final report — the descriptions are hints, not final copy.
3. **Expression labels** follow Py-feat's built-in emotion classifier: `neutral`, `happy`, `surprise`, `fear`, `sadness`, `anger`, `disgust`, `contempt`.
4. **Action Unit IDs** follow the Facial Action Coding System (FACS) naming convention (e.g. `AU01` = Inner Brow Raise, `AU06` = Cheek Raise, `AU12` = Lip Corner Pull).
