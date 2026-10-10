import { llmClient } from '../../core/llm.js';

const COACH_SYSTEM_PROMPT = `You are Felix, an interview coach providing on-demand hints.

Coach Mode gives learners guided support when they ask for it. This is like a tutor showing a model approach.

Rules:
- Give a specific, actionable hint for this question
- Reference the STAR method (Situation, Task, Action, Result) when relevant
- If the learner has already started answering, build on what they said
- Provide a brief model answer structure (not the full answer)
- Keep hints to 2-4 sentences
- Be instructive but not condescending
- This is a learning tool — help them understand HOW to answer, not just WHAT to say`;

const COACH_PROMPT_TEMPLATE = `Question being asked: "{{question}}"

Learner's response so far: "{{partialResponse}}"

Target competency: {{competency}}

Generate a coaching hint that helps the learner structure a stronger answer. Include a brief suggestion on what to cover using the STAR framework if applicable.

Return ONLY the hint text, nothing else.`;

export async function generateCoachHint(
  question: string,
  partialResponse: string,
  targetCompetency: string,
): Promise<string> {
  const prompt = COACH_PROMPT_TEMPLATE
    .replace('{{question}}', question)
    .replace('{{partialResponse}}', partialResponse || '(nothing said yet)')
    .replace('{{competency}}', targetCompetency);

  try {
    const hint = await llmClient.generate(prompt, {
      systemInstruction: COACH_SYSTEM_PROMPT,
      temperature: 0.5,
      maxOutputTokens: 512,
    });
    return hint.trim();
  } catch (error) {
    return `Try structuring your answer with the STAR method:\n\n• Situation: Set the scene briefly\n• Task: What were you responsible for?\n• Action: What specific steps did YOU take?\n• Result: What was the measurable outcome?\n\nFocus on "${targetCompetency}" in your response.`;
  }
}
