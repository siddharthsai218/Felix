import { llmClient } from '../../core/llm.js';
import type { GeneratedQuestion } from '../../core/types.js';
import { fetchGithubContext } from '../github-service.js';

export interface QuestionContext {
  githubUrl?: string;
  resumeText?: string;
  jobDescription?: string;
}

const QUESTION_SYSTEM_PROMPT = `You are Felix, an adaptive interview coaching AI. You generate realistic interview questions for practice sessions.

You are an EDUCATIONAL TOOL, not a hiring screen. Your questions help learners practice, demonstrate structured thinking, and improve.

CRITICAL REQUIREMENTS:
1. ROLE-SPECIFIC GROUNDING: Every question MUST be strictly and explicitly focused on the target role. Never ask questions outside the domain of the selected role.
2. CANDIDATE EXPERIENCE GROUNDING: If the learner provided a GitHub profile/repo or resume text, you MUST directly reference their real projects, architecture decisions, tools, and technical claims in your questions.
3. CONVERSATIONAL & NATURAL: Formulate questions as an expert technical interviewer or hiring manager would ask them in a live conversation.
4. VARIETY: Mix technical architecture/implementation, situational problem-solving, and behavioral STAR questions.`;

const QUESTION_PROMPT_TEMPLATE = `Generate {{count}} interview questions for a candidate practicing for the target role: "{{role}}" at {{difficulty}} difficulty level.

{{candidateContext}}

STRICT INSTRUCTIONS:
- Every question MUST be directly relevant to {{role}}.
- If GitHub projects or Resume details are provided above, craft questions that specifically challenge the candidate on those actual projects, libraries, design decisions, and claims!
- For behavioral questions, use "Tell me about a time..." format, connecting to their field.
- For technical questions, probe deep architectural trade-offs, debugging, or system design in {{role}}.

Return a JSON array of objects with these fields:
- text: the question text (string)
- type: "behavioral" | "technical" | "situational" (string)
- targetCompetency: the competency being assessed, e.g. "technical-depth", "architecture-tradeoffs", "problem-solving", "communication", "leadership" (string)
- difficulty: "{{difficulty}}" (string)
- followUpHints: array of 2-3 possible follow-up probing angles (string[])

Return ONLY the JSON array. No markdown formatting, no explanation.`;

export async function generateQuestions(
  targetRole: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  count: number,
  context?: QuestionContext,
): Promise<GeneratedQuestion[]> {
  const effectiveCount = count <= 0 ? 5 : count;
  const batchCount = Math.min(effectiveCount, 8);

  // Fetch upstream GitHub MCP/portfolio context if URL is provided
  let githubContext = '';
  if (context?.githubUrl?.trim()) {
    try {
      githubContext = await fetchGithubContext(context.githubUrl.trim());
    } catch (err) {
      console.warn('Failed to fetch GitHub context, proceeding with resume and role:', err);
    }
  }

  let candidateContext = '';
  if (githubContext) {
    candidateContext += `\nCANDIDATE GITHUB PORTFOLIO & REPOSITORIES:\n${githubContext}\n`;
  }
  if (context?.resumeText?.trim()) {
    candidateContext += `\nCANDIDATE RESUME / EXPERIENCE SUMMARY:\n"""\n${context.resumeText.trim().slice(0, 3000)}\n"""\n`;
  }
  if (context?.jobDescription?.trim()) {
    candidateContext += `\nTARGET JOB REQUIREMENTS:\n"""\n${context.jobDescription.trim().slice(0, 1000)}\n"""\n`;
  }

  const prompt = QUESTION_PROMPT_TEMPLATE
    .replace(/\{\{count\}\}/g, String(batchCount))
    .replace(/\{\{role\}\}/g, targetRole)
    .replace(/\{\{difficulty\}\}/g, difficulty)
    .replace(/\{\{candidateContext\}\}/g, candidateContext);

  try {
    const questions = await llmClient.generateJSON<GeneratedQuestion[]>(prompt, {
      systemInstruction: QUESTION_SYSTEM_PROMPT,
      temperature: 0.75,
    });

    if (Array.isArray(questions) && questions.length > 0) {
      return questions;
    }
    return getFallbackQuestions(targetRole, difficulty, effectiveCount, context);
  } catch (error) {
    console.error('Failed to generate LLM questions, using role-specialized fallback:', error);
    return getFallbackQuestions(targetRole, difficulty, effectiveCount, context);
  }
}

/**
 * Fallback questions strictly tailored to the specified role and candidate context.
 */
function getFallbackQuestions(
  role: string,
  difficulty: string,
  count: number,
  context?: QuestionContext,
): GeneratedQuestion[] {
  const diff = difficulty as 'beginner' | 'intermediate' | 'advanced';
  const hasGithub = Boolean(context?.githubUrl?.trim());
  const hasResume = Boolean(context?.resumeText?.trim());

  const baseQuestions: GeneratedQuestion[] = [];

  // Ground question 1 in candidate's project or GitHub if provided
  if (hasGithub || hasResume) {
    baseQuestions.push({
      text: `In the projects listed on your ${hasGithub ? 'GitHub profile' : 'resume'}, can you walk me through the most technically demanding architectural decision you made for ${role}? What trade-offs were involved?`,
      type: 'technical',
      targetCompetency: 'architecture-tradeoffs',
      difficulty: diff,
      followUpHints: ['Why did you choose that particular tech stack?', 'How did it scale under load?'],
    });
  } else {
    baseQuestions.push({
      text: `Can you walk me through a challenging production project you built as a ${role}? What was your specific architectural contribution and the outcome?`,
      type: 'behavioral',
      targetCompetency: 'technical-depth',
      difficulty: diff,
      followUpHints: ['What was the biggest technical bottleneck?', 'How did you measure success?'],
    });
  }

  baseQuestions.push(
    {
      text: `When designing a scalable solution in ${role}, how do you evaluate performance bottlenecks and optimize latency under heavy traffic?`,
      type: 'technical',
      targetCompetency: 'system-design',
      difficulty: diff,
      followUpHints: ['What profiling or monitoring tools do you use?', 'How do you prevent regressions?'],
    },
    {
      text: `Describe a scenario in your work as a ${role} where requirements were ambiguous or conflicting. How did you align technical execution with stakeholder needs?`,
      type: 'situational',
      targetCompetency: 'communication',
      difficulty: diff,
      followUpHints: ['How did you prioritize competing features?', 'How did you communicate trade-offs?'],
    },
    {
      text: `Walk me through your step-by-step triage workflow when an unexpected high-severity incident or defect occurs in a ${role} workflow.`,
      type: 'technical',
      targetCompetency: 'troubleshooting',
      difficulty: diff,
      followUpHints: ['Where in the stack do you start looking?', 'How do you communicate during an outage?'],
    },
    {
      text: `Tell me about a time in ${role} where you identified significant technical debt or inefficiency. How did you advocate for and implement the refactor?`,
      type: 'behavioral',
      targetCompetency: 'engineering-practices',
      difficulty: diff,
      followUpHints: ['How did you measure the return on investment?', 'Did it affect deployment velocity?'],
    },
  );

  if (count <= baseQuestions.length) {
    return baseQuestions.slice(0, count);
  }

  const scaled: GeneratedQuestion[] = [...baseQuestions];
  let cycle = 1;
  while (scaled.length < count) {
    for (const q of baseQuestions) {
      if (scaled.length >= count) break;
      scaled.push({
        ...q,
        text: `Follow-up deep-dive (${cycle + 1}) for ${role}: ${q.text.charAt(0).toLowerCase() + q.text.slice(1)}`,
        targetCompetency: q.targetCompetency,
      });
    }
    cycle++;
  }

  return scaled;
}
