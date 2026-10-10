import { Router } from 'express';
import { sessionManager } from './session-manager.js';
import type { DrillSpec } from '../core/types.js';

export const sessionRouter = Router();

// GET /api/sessions — list active sessions
sessionRouter.get('/', (_req, res) => {
  const sessions = sessionManager.listActive().map(s => ({
    sessionId: s.sessionId,
    targetRole: s.config.targetRole,
    state: s.state,
    questionCount: s.config.questionCount,
    responsesCompleted: s.responses.length,
    startedAt: s.startedAt.toISOString(),
  }));
  res.json(sessions);
});

// GET /api/sessions/:sessionId — get full session record
sessionRouter.get('/:sessionId', (req, res) => {
  const record = sessionManager.toSessionRecord(req.params.sessionId);
  if (!record) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json(record);
});

// GET /api/sessions/:sessionId/responses — get all responses
sessionRouter.get('/:sessionId/responses', (req, res) => {
  const session = sessionManager.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json(session.responses);
});

// GET /api/sessions/:sessionId/responses/:index — get a single response
sessionRouter.get('/:sessionId/responses/:index', (req, res) => {
  const session = sessionManager.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  const index = parseInt(req.params.index, 10);
  const response = session.responses[index];
  if (!response) {
    return res.status(404).json({ error: 'Response not found' });
  }
  res.json(response);
});

// POST /api/sessions/:sessionId/drills — Part 3 posts a drill
sessionRouter.post('/:sessionId/drills', (req, res) => {
  const session = sessionManager.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  const drill: DrillSpec = req.body;
  sessionManager.addDrill(session.sessionId, drill);
  res.json({ drillId: drill.drillId, status: 'ready' });
});

// GET /api/sessions/:sessionId/drills — get pending drills
sessionRouter.get('/:sessionId/drills', (req, res) => {
  const session = sessionManager.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json(session.pendingDrills);
});

// POST /api/sessions/:sessionId/signals/:responseIndex — Part 2 posts signal data
// (This endpoint is consumed by Part 2 via the signal-record contract)
sessionRouter.post('/:sessionId/signals/:responseIndex', (req, res) => {
  // Store signals alongside the session for Part 3 to consume
  const session = sessionManager.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  // For hackathon MVP, we just store the raw signal data
  // Part 3 will read it via GET
  const responseIndex = parseInt(req.params.responseIndex, 10);
  (session as any).signals = (session as any).signals || {};
  (session as any).signals[responseIndex] = req.body;
  res.json({ status: 'stored' });
});

// GET /api/sessions/:sessionId/signals — Part 3 reads all signal records
sessionRouter.get('/:sessionId/signals', (req, res) => {
  const session = sessionManager.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json((session as any).signals || {});
});

// POST /api/sessions/:sessionId/evaluate — Part 3 evaluates candidate transcript
sessionRouter.post('/:sessionId/evaluate', async (req, res) => {
  try {
    const { llmClient } = await import('../core/llm.js');
    const { roleTitle = 'Software Engineer', responses = [], telemetry = {} } = req.body;
    
    const prompt = `You are Felix, an EdTech interview coaching AI evaluating a candidate for ${roleTitle}.
Candidate Spoken Responses:
${JSON.stringify(responses, null, 2)}
Telemetry:
${JSON.stringify(telemetry, null, 2)}

Provide an honest formative evaluation in JSON format:
{
  "overallScore": number (1.0 to 5.0),
  "rubricScores": [
    { "criterion": string, "score": number, "feedback": string, "quotes": [{ "text": string, "time": string }] }
  ],
  "behavioralInsights": [
    { "icon": string, "title": string, "text": string, "metric": string, "status": "optimal" | "attention" }
  ],
  "transformations": [
    {
      "questionAsked": string,
      "originalTranscript": string,
      "critiqueNotes": string[],
      "starRewrite": { "situation": string, "task": string, "action": string, "result": string },
      "competency": string,
      "scoreImprovement": string
    }
  ]
}`;

    const result = await llmClient.generateJSON(prompt);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Evaluation failed' });
  }
});
