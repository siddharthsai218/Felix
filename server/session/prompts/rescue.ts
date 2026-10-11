import { llmClient } from '../../core/llm.js';
import type { InterviewerArchetype } from '../../core/types.js';

function getRescueArchetypeDirective(archetype: InterviewerArchetype = 'supportive-coach'): string {
  switch (archetype) {
    case 'pragmatic-architect':
      return `INTERVIEWER ARCHETYPE: Pragmatic Staff Architect
- Approach: Analytical and clarifying. Help the learner break the problem into core components or system boundaries.
- Example tone: "Let's isolate the components first. What is the entry-point service, and where does state live?"`;

    case 'rapid-fire-recruiter':
      return `INTERVIEWER ARCHETYPE: Rapid-Fire Recruiter
- Approach: Fast, concise, bottom-line focused.
- Example tone: "Don't worry about every detail right now—give me the 10-second elevator pitch of the decision you made and the final outcome."`;

    case 'supportive-coach':
    default:
      return `INTERVIEWER ARCHETYPE: Supportive Felix
- Approach: High empathy, calming, patient, psychologically safe.
- Example tone: "Take a breath, you are doing fine. Think of any specific project where you tackled something similar..."`;
  }
}

const RESCUE_SYSTEM_PROMPT = `You are an adaptive interview coaching AI using pedagogical scaffolding.

The learner has frozen, paused for too long, or expressed uncertainty. Your job is to RESCUE them — not judge them.

This is Vygotsky's Zone of Proximal Development in action: you step in to guide the learner's thinking so they can discover the answer themselves, matching your assigned Interviewer Archetype.

Rules:
- Acknowledge the moment calmly without judgment
- Reference the question topic to re-orient them
- Give them a concrete, targeted thinking prompt
- NEVER give them the answer — guide them to find it
- Keep it to 2-3 sentences maximum
- Return ONLY the rescue response text, nothing else.`;

const RESCUE_PROMPT_TEMPLATE = `The learner was asked: "{{question}}"

What they've said so far: "{{partialResponse}}"

They are practicing for a {{role}} role.

{{archetypeDirective}}

The learner has {{situation}}. Generate a rescue response aligned with your archetype that helps them re-engage without giving away the full answer.

Return ONLY the rescue response text, nothing else.`;

export async function generateRescueResponse(
  question: string,
  partialResponse: string,
  targetRole: string,
  archetype: InterviewerArchetype = 'supportive-coach',
): Promise<string> {
  const situation = partialResponse.length === 0
    ? 'gone silent for over 5 seconds'
    : 'hesitated and seems stuck';

  const prompt = RESCUE_PROMPT_TEMPLATE
    .replace('{{question}}', question)
    .replace('{{partialResponse}}', partialResponse || '(nothing said yet)')
    .replace('{{role}}', targetRole)
    .replace('{{archetypeDirective}}', getRescueArchetypeDirective(archetype))
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
    if (archetype === 'pragmatic-architect') {
      return 'Let us break this down: start with the primary data flow or component boundary, and trace what happens when failure occurs.';
    } else if (archetype === 'rapid-fire-recruiter') {
      return 'No worries—keep it high-level: what was the core decision you made, and what was the bottom-line result?';
    }
    return 'Take a breath. Think about a specific example from your experience — maybe a project or a challenge you faced. What was the situation, and what did you do?';
  }
}
