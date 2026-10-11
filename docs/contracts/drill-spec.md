# Drill Spec Contract — `[3]` → `[1]`

> **Producer:** Part 3 (Learning Engine & Integrations)  
> **Consumer:** Part 1 (Live Session & Interface)  
> **Transport:** REST API

## Overview

When Part 3's gap engine identifies a weak area, it generates a `DrillSpec`. Part 1 receives this and runs it as an ordinary session turn (same STT → LLM → TTS → avatar pipeline). Part 3 then re-scores the drill response.

## DrillSpec

```typescript
interface DrillSpec {
  drillId: string;               // UUID
  sessionId: string;             // original session where the gap was found
  responseIndex: number;         // which response revealed the gap
  targetLearningOutcome: string; // e.g. "Apply the STAR method to behavioral questions"
  targetCompetency: string;      // e.g. "communication"
  gapSeverity: 'low' | 'medium' | 'high';
  question: string;              // the drill question to ask
  timeLimitSeconds: number;      // typically 30 for micro-drills
  context?: string;              // optional setup/scenario for the question
  hints?: string[];              // optional Coach Mode hints Part 3 provides
  originalQuestion?: string;     // original problem where the mistake occurred
  studentMistake?: string;       // the specific mistake or omission made by the learner
  problemFirstExplanation?: string; // interviewer starts explaining the mistake by the problem first itself, before proceeding to the next part
}
```

## Triggering a Drill

### API Flow
1. Part 3 sends: `POST /api/sessions/:sessionId/drills` with `DrillSpec`
2. Part 1 stores the drill and returns `{ drillId, status: 'ready' }`
3. Frontend fetches pending drills and shows "Practice this weak area" button
4. Learner clicks → Part 1 runs the drill as a normal turn
5. On completion, Part 1 emits `session:response-complete` with `isDrill: true` and the `drillSpec`
6. Part 3 re-scores the drill response

## Demo Fallback

Per AGENTS.md § Sequencing: if the [1+3] drill-retry handshake is broken at demo time, Part 1 runs the fallback:
- Use a preset drill question (hardcoded in Part 1)
- Run as a plain session turn
- Display simplified before/after comparison
- Part 1 owns keeping this fallback path working

```typescript
// Fallback drill (hardcoded in Part 1)
const FALLBACK_DRILL: DrillSpec = {
  drillId: 'fallback-001',
  sessionId: 'current',
  responseIndex: 0,
  targetLearningOutcome: 'Apply the STAR method to behavioral questions',
  targetCompetency: 'communication',
  gapSeverity: 'high',
  question: 'Tell me about a time you had to debug a critical production issue under pressure. What was the situation, what did you do, and what was the result?',
  timeLimitSeconds: 30,
  hints: [
    'Start with the Situation: set the scene briefly',
    'Describe the specific Task you were responsible for',
    'Focus on YOUR Actions — what exactly did you do?',
    'End with the measurable Result'
  ]
};
```

## Guarantees

- Part 1 treats drills identically to normal turns (same pipeline)
- Drill responses are tagged with `isDrill: true` in the session record
- Part 3 handles all scoring logic — Part 1 just runs the turn
```
