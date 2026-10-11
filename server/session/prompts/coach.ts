import { llmClient } from '../../core/llm.js';
import type { InterviewerArchetype } from '../../core/types.js';

function getCoachArchetypeDirective(archetype: InterviewerArchetype = 'supportive-coach'): string {
  switch (archetype) {
    case 'pragmatic-architect':
      return `INTERVIEWER ARCHETYPE: Pragmatic Staff Architect
- Coach Focus: Guide the candidate to highlight distributed failure states, boundary conditions, edge cases, and explicit trade-off justifications.`;

    case 'rapid-fire-recruiter':
      return `INTERVIEWER ARCHETYPE: Rapid-Fire Recruiter
- Coach Focus: Guide the candidate to keep their answer under 60 seconds, cut conversational fluff, and prioritize quantifiable business metrics ($ / % / timeline).`;

    case 'supportive-coach':
    default:
      return `INTERVIEWER ARCHETYPE: Supportive Felix
- Coach Focus: Provide supportive, structured STAR scaffolding that builds confidence and eases interview anxiety.`;
  }
}

const COACH_SYSTEM_PROMPT = `You are an interview coach providing on-demand hints.

Coach Mode gives learners guided support when they ask for it. This is like a tutor showing a model approach aligned with the current interview archetype.

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

{{archetypeDirective}}

Generate a coaching hint that helps the learner structure a stronger answer. Include a brief suggestion on what to cover using the STAR framework if applicable.

Return ONLY the hint text, nothing else.`;

export async function generateCoachHint(
  question: string,
  partialResponse: string,
  targetCompetency: string,
  archetype: InterviewerArchetype = 'supportive-coach',
): Promise<string> {
  const prompt = COACH_PROMPT_TEMPLATE
    .replace('{{question}}', question)
    .replace('{{partialResponse}}', partialResponse || '(nothing said yet)')
    .replace('{{competency}}', targetCompetency)
    .replace('{{archetypeDirective}}', getCoachArchetypeDirective(archetype));

  try {
    const hint = await llmClient.generate(prompt, {
      systemInstruction: COACH_SYSTEM_PROMPT,
      temperature: 0.5,
      maxOutputTokens: 512,
    });
    return hint.trim();
  } catch (error) {
    if (archetype === 'pragmatic-architect') {
      return `Focus on system resilience:\n\n• Specify your components and data persistence\n• Address the failure state or concurrency trade-off\n• Quantify your p99 latency or availability impact\n\nShowcase your "${targetCompetency}".`;
    } else if (archetype === 'rapid-fire-recruiter') {
      return `Aim for a punchy 45-second executive summary:\n\n• 1 sentence on the challenge\n• 2 sentences on YOUR actions\n• 1 sentence on the measurable metric impact\n\nHighlight "${targetCompetency}" with zero fluff.`;
    }
    return `Try structuring your answer with the STAR method:\n\n• Situation: Set the scene briefly\n• Task: What were you responsible for?\n• Action: What specific steps did YOU take?\n• Result: What was the measurable outcome?\n\nFocus on "${targetCompetency}" in your response.`;
  }
}
