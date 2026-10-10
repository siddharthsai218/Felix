# Session Record Contract — `[1]` → `[3]`

> **Producer:** Part 1 (Live Session & Interface)  
> **Consumer:** Part 3 (Learning Engine & Integrations)  
> **Transport:** REST API endpoint + WebSocket event

## Overview

After each learner response in a live session, Part 1 produces a `SessionResponseRecord`. At session end, Part 1 produces a complete `SessionRecord`. Part 3 consumes these for rubric scoring, gap analysis, and feedback generation.

## Per-Response Record

Emitted after each learner response:

```typescript
interface SessionResponseRecord {
  sessionId: string;
  learnerId: string;
  responseIndex: number;          // 0-based
  questionAsked: string;          // the exact question text
  questionType: 'behavioral' | 'technical' | 'situational' | 'follow-up' | 'drill';
  targetCompetency?: string;      // e.g. "problem-solving", "communication"
  transcript: string;             // full text of learner's response
  timestamps: SttWordTimestamp[]; // word-level timing
  startedAt: string;              // ISO 8601
  endedAt: string;                // ISO 8601
  durationMs: number;
  rescueModeTriggered: boolean;   // true if Rescue Mode activated during this response
  coachModeUsed: boolean;         // true if learner requested Coach Mode hints
  isDrill: boolean;               // true if this was a micro-drill retry
  drillSpec?: DrillSpec;          // present if isDrill === true
}
```

## Complete Session Record

Emitted when the session ends:

```typescript
interface SessionRecord {
  sessionId: string;
  learnerId: string;
  targetRole: string;             // e.g. "Frontend Developer", "Product Manager"
  startedAt: string;              // ISO 8601
  endedAt: string;                // ISO 8601
  totalDurationMs: number;
  responses: SessionResponseRecord[];
  sessionConfig: {
    questionCount: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    coachModeEnabled: boolean;
  };
}
```

## Delivery

### REST Endpoint
- `GET /api/sessions/:sessionId` — returns the full `SessionRecord`
- `GET /api/sessions/:sessionId/responses` — returns all `SessionResponseRecord[]`
- `GET /api/sessions/:sessionId/responses/:index` — returns a single response

### WebSocket Events
- `session:response-complete` — emitted with `SessionResponseRecord` after each response
- `session:complete` — emitted with `SessionRecord` when session ends

## Guarantees

- `sessionId` is a UUID v4, generated at session start
- `learnerId` is stable across sessions for the same user
- Transcripts are final (post-STT processing, not interim partials)
- Timestamps use word-level granularity from AssemblyAI
- Part 3 never joins the live turn — it only consumes completed records
```
