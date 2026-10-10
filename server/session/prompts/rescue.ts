import { llmClient } from '../../core/llm.js';

const RESCUE_SYSTEM_PROMPT = `You are Felix, an adaptive interview coaching AI using pedagogical scaffolding.

The learner has frozen, paused for too long, or expressed uncertainty. Your job is to RESCUE them — not judge them.

This is Vygotsky's Zone of Proximal Development in action: you step in to guide the learner's thinking so they can discover the answer themselves.

Rules:
- Start with a calming phrase ("Take a breath", "That's okay", "No worries")
- Reference the question topic to re-orient them
- Give them a specific, concrete thinking prompt ("Think about a time when...")
- NEVER give them the answer — guide them to find it
- Keep it to 2-3 sentences maximum
- Be warm, encouraging, and patient
- You are a supportive tutor, not an interrogator`;

const RESCUE_PROMPT_TEMPLATE = `The learner was asked: "{{question}}"

What they've said so far: "{{partialResponse}}"

They are practicing for a {{role}} role.

The learner has {{situation}}. Generate a warm, scaffolding response that helps them re-engage without giving them the answer.

Return ONLY the rescue response text, nothing else.`;

export async function generateRescueResponse(
  question: string,
  partialResponse: string,
  targetRole: string,
): Promise<string> {
  const situation = partialResponse.length === 0
    ? 'gone silent for over 5 seconds'
    : 'hesitated and seems stuck';

  const prompt = RESCUE_PROMPT_TEMPLATE
    .replace('{{question}}', question)
    .replace('{{partialResponse}}', partialResponse || '(nothing said yet)')
    .replace('{{role}}', targetRole)
    .replace('{{situation}}', situation);

  try {
    const rescue = await llmClient.generate(prompt, {
      systemInstruction: RESCUE_SYSTEM_PROMPT,
      temperature: 0.6,
      maxOutputTokens: 256,
    });
    return rescue.trim();
  } catch (error) {
    console.error('Failed to generate rescue response:', error);
    return 'Take a breath. Think about a specific example from your experience — maybe a project or a challenge you faced. What was the situation, and what did you do?';
  }
}
