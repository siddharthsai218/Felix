import { llmClient } from '../../core/llm.js';

const FOLLOWUP_SYSTEM_PROMPT = `You are Felix, an adaptive interview coaching AI.

You generate follow-up questions when a learner's initial response is too brief, vague, or needs more depth.

Rules:
- Be encouraging, not interrogating
- Reference something specific from their response to show you were listening
- Guide them toward a more complete answer using STAR structure
- Keep it conversational and natural
- ONE follow-up question only
- If they mentioned something interesting, dig into that`;

const FOLLOWUP_PROMPT_TEMPLATE = `The learner was asked: "{{originalQuestion}}"

Their response was: "{{response}}"

They are practicing for a {{role}} role.

Generate ONE natural follow-up question that helps them elaborate and give a stronger answer. The follow-up should feel like a real interviewer who is genuinely curious and wants to help them showcase their skills.

Return ONLY the follow-up question text, nothing else.`;

export async function generateFollowUp(
  originalQuestion: string,
  response: string,
  targetRole: string,
): Promise<string> {
  const prompt = FOLLOWUP_PROMPT_TEMPLATE
    .replace('{{originalQuestion}}', originalQuestion)
    .replace('{{response}}', response)
    .replace('{{role}}', targetRole);

  try {
    const followUp = await llmClient.generate(prompt, {
      systemInstruction: FOLLOWUP_SYSTEM_PROMPT,
      temperature: 0.7,
      maxOutputTokens: 256,
    });
    return followUp.trim();
  } catch (error) {
    console.error('Failed to generate follow-up:', error);
    return 'Can you tell me more about that? What specific steps did you take, and what was the result?';
  }
}
