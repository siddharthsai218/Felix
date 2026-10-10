# LLM Client Contract — `[1]` → `[1]` + `[3]`

> **Producer:** Part 1 (Live Session & Interface)  
> **Consumers:** Part 1 (live prompts) + Part 3 (post-session prompts)  
> **Location:** `server/core/llm.ts`

## Overview

One Gemini Flash-Lite wrapper serves ALL text reasoning in Felix. This is a deliberate hackathon de-risking decision. Part 1 owns the wrapper; Part 3 imports and calls it with its own prompts.

## API

```typescript
import { GenerativeModel } from '@google/generative-ai';

interface LlmOptions {
  temperature?: number;       // default 0.7
  maxOutputTokens?: number;   // default 2048
  topP?: number;              // default 0.95
  topK?: number;              // default 40
  systemInstruction?: string; // system prompt
}

interface LlmClient {
  /**
   * Generate a complete response (non-streaming).
   * Use for post-session scoring, report generation, etc.
   */
  generate(prompt: string, options?: LlmOptions): Promise<string>;

  /**
   * Generate a streaming response.
   * Use for live-turn responses where latency matters.
   * Yields text chunks as they arrive.
   */
  generateStream(prompt: string, options?: LlmOptions): AsyncIterable<string>;

  /**
   * Generate with structured output (JSON mode).
   * Use for scoring, gap analysis, drill generation.
   */
  generateJSON<T>(prompt: string, options?: LlmOptions): Promise<T>;

  /**
   * Get the underlying Generative AI model instance.
   * Escape hatch for advanced use cases.
   */
  getModel(): GenerativeModel;
}

// Usage:
import { llmClient } from '../core/llm.js';
const response = await llmClient.generate('...', { temperature: 0.3 });
```

## Configuration

- Model: `gemini-2.0-flash-lite` (or latest Flash-Lite available)
- API key: `process.env.GEMINI_API_KEY`
- Default safety settings: standard (no custom overrides for hackathon)

## Prompt Ownership

| Prompt | Owner | Location |
|--------|-------|----------|
| Question generation | Part 1 | `server/session/prompts/question.ts` |
| Follow-up generation | Part 1 | `server/session/prompts/followup.ts` |
| Rescue Mode scaffolding | Part 1 | `server/session/prompts/rescue.ts` |
| Coach Mode hints | Part 1 | `server/session/prompts/coach.ts` |
| Rubric scoring | Part 3 | `server/learning/prompts/scoring.ts` |
| STAR rewrite | Part 3 | `server/learning/prompts/transformer.ts` |
| Gap analysis | Part 3 | `server/learning/prompts/gaps.ts` |
| Report synthesis | Part 3 | `server/learning/prompts/report.ts` |
| Drill generation | Part 3 | `server/learning/prompts/drills.ts` |

## Guarantees

- Single model instance — never instantiate a second
- Thread-safe: multiple concurrent callers are fine (API handles it)
- No rate limiting in the wrapper — rely on Gemini's own limits
- Part 3 MUST use `import { llmClient } from '../core/llm.js'` — never create its own client
```
