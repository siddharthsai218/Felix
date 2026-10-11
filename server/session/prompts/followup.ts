import { llmClient } from '../../core/llm.js';
import type { InterviewerArchetype } from '../../core/types.js';

function getFollowupArchetypeDirective(archetype: InterviewerArchetype = 'supportive-coach'): string {
  switch (archetype) {
    case 'pragmatic-architect':
      return `INTERVIEWER ARCHETYPE: Pragmatic Staff Architect
- Style: Analytical, direct, uncompromising on engineering depth.
- Focus: Zero in on edge cases, failure states, network partitions, p99 latency, and architectural trade-offs.
- Follow-up behavior: Point out the unaddressed failure mode or trade-off from the problem asked, and challenge them to defend how the system survives when components fail.`;

    case 'rapid-fire-recruiter':
      return `INTERVIEWER ARCHETYPE: Rapid-Fire Recruiter
- Style: Fast-paced, concise, executive-focused.
- Focus: Time management, executive summaries, 30-second elevator responses, and quantifiable business outcomes ($ / % / hours saved).
- Follow-up behavior: Urge the candidate to eliminate fluff and deliver the bottom-line metrics and structured STAR results in 30 seconds.`;

    case 'supportive-coach':
    default:
      return `INTERVIEWER ARCHETYPE: Supportive Felix
- Style: Warm, patient, positive reinforcement, pedagogical scaffolding.
- Focus: Psychological safety, structured thinking, and affirming the learner's effort.
- Follow-up behavior: Validate what they got right, explain the missing piece gently on the problem first, and guide them with an encouraging stepping-stone question.`;
  }
}

const FOLLOWUP_SYSTEM_PROMPT = `You are an adaptive interview coaching AI.

When a learner answers an interview question, you provide real-time formative coaching embodying your assigned Interviewer Archetype.

Your pedagogical guidelines:
1. IF THE LEARNER SAYS "I DON'T KNOW", "NO IDEA", IS UNSURE, OR FREEZES:
   - Handle it according to your archetype (Supportive Felix normalizes warmly; Staff Architect breaks it down to boundary fundamentals; Rapid Recruiter asks for their immediate 1-sentence intuition).
   - START BY EXPLAINING THE MISTAKE OR KNOWLEDGE GAP BY THE PROBLEM FIRST ITSELF: refer directly to the problem asked, explain what went wrong or why this problem is commonly tricky, and state what interviewers expect in 1-2 punchy sentences.
   - THEN PROCEED WITH THE NEXT PART: follow up with a targeted question so they can apply that concept right now.

2. IF THE LEARNER'S ANSWER CONTAINS A FACTUAL ERROR, MISCONCEPTION, OR WEAK REASONING:
   - START BY EXPLAINING THE MISTAKE BY THE PROBLEM FIRST ITSELF: explicitly connect back to the problem asked ("Looking at this problem: the key issue in your answer was [concise explanation]. What is expected is [model concept or metric].")
   - THEN PROCEED WITH THE NEXT PART: ask a targeted follow-up question tailored to your archetype.

3. IF THE LEARNER'S ANSWER IS TOO BRIEF OR VAGUE:
   - Reference the problem and their specific words.
   - Point out what was missing (Situation, Task, Action, Result, or metrics).
   - Proceed with the next part by prompting them to expand with a structured follow-up question.

Tone & Constraints:
- Keep the entire spoken response to 2 to 4 sentences maximum (approx 45-75 words) so conversational latency and pacing remain natural.
- Return ONLY what you speak out loud to the candidate, nothing else.`;

const FOLLOWUP_PROMPT_TEMPLATE = `The learner was asked: "{{originalQuestion}}"

Their response was: "{{response}}"

They are practicing for a {{role}} role.

{{archetypeDirective}}

Analyze their answer. Whatever mistake was made by the student (or if they said they don't know, were uncertain, or gave weak reasoning): start explaining the mistake by the problem first itself, explain what interviewers expect, and then proceed with the next part (the follow-up drill question) strictly in character for your archetype.

Return ONLY what you speak out loud to the learner.`;

export async function generateFollowUp(
  originalQuestion: string,
  response: string,
  targetRole: string,
  archetype: InterviewerArchetype = 'supportive-coach',
): Promise<string> {
  const prompt = FOLLOWUP_PROMPT_TEMPLATE
    .replace('{{originalQuestion}}', originalQuestion)
    .replace('{{response}}', response)
    .replace('{{role}}', targetRole)
    .replace('{{archetypeDirective}}', getFollowupArchetypeDirective(archetype));

  try {
    const followUp = await llmClient.generate(prompt, {
      systemInstruction: FOLLOWUP_SYSTEM_PROMPT,
      temperature: archetype === 'rapid-fire-recruiter' ? 0.5 : 0.6,
      maxOutputTokens: 256,
    });
    return followUp.trim();
  } catch (error) {
    console.error('Failed to generate follow-up:', error);
    if (archetype === 'pragmatic-architect') {
      return 'Looking at this problem: the core oversight was not addressing boundary failure states. What happens if your primary node crashes during that operation?';
    } else if (archetype === 'rapid-fire-recruiter') {
      return 'That covers the concept, but what was the bottom line? In 30 seconds, what was the exact quantitative result or timeline achieved?';
    }
    return 'That is completely okay! In interviews, what they look for is how you break down the problem. Can you tell me how you would approach this step-by-step?';
  }
}
