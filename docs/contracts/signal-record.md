# Signal Record Contract — `[2]` → `[3]`

> **Producer:** Part 2 (Behavioral Telemetry)  
> **Consumer:** Part 3 (Learning Engine & Integrations)  
> **Transport:** REST API endpoint or event bus

## Overview

Part 2 analyzes audio and video from the capture handoff and produces behavioral signal records per response. Part 3 consumes these signals for the feedback report. **Part 3 owns how signals are worded** in feedback (coaching cues, never penalties).

## Per-Response Signal Record

```typescript
interface SignalRecord {
  sessionId: string;
  responseIndex: number;

  // Prosody (Parselmouth + STT timestamps)
  prosody: {
    speakingRateWpm: number;         // words per minute
    pauseSegments: PauseSegment[];   // detected pauses
    pitchMean: number;               // Hz
    pitchStdDev: number;             // Hz
    jitter: number;                  // relative jitter
    shimmer: number;                 // relative shimmer
    fillerCount: number;             // "um", "uh", "like" count
  };

  // Gaze (MediaPipe)
  gaze: {
    cameraFacingPercent: number;     // 0-100, percent of time looking at camera
    gazeDeviations: GazeDeviation[]; // periods of looking away
  };

  // Facial expressions (Py-feat)
  expressions: {
    dominantExpression: string;      // e.g. "neutral", "happy", "confused"
    expressionTimeline: ExpressionSnapshot[];
    actionUnits: ActionUnitSummary[];
  };

  // Metadata
  analyzedAt: string;               // ISO 8601
  confidence: number;               // 0-1, overall confidence in measurements
}

interface PauseSegment {
  startMs: number;
  endMs: number;
  durationMs: number;
}

interface GazeDeviation {
  startMs: number;
  endMs: number;
  direction: 'left' | 'right' | 'up' | 'down';
}

interface ExpressionSnapshot {
  timestampMs: number;
  expression: string;
  confidence: number;
}

interface ActionUnitSummary {
  au: string;          // e.g. "AU12" (smile)
  meanIntensity: number;
  peakIntensity: number;
  peakTimestampMs: number;
}
```

## Delivery

- `POST /api/sessions/:sessionId/signals/:responseIndex` — Part 2 posts signal data
- `GET /api/sessions/:sessionId/signals` — Part 3 reads all signal records
- Event: `signals:response-analyzed` with the `SignalRecord`

## Guarantees

- All timestamps are relative to response start (matching capture-handoff contract)
- Part 2 produces numbers; Part 3 decides how to present them as coaching feedback
- Behavioral signals are NEVER penalties — this is an ethical design principle
- Part 2 may produce partial records if video was unavailable (prosody-only)

> **Note:** This contract skeleton was created by Part 1. Part 2 owns and maintains it going forward.
```
