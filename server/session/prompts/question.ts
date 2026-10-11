import { llmClient } from '../../core/llm.js';
import type { GeneratedQuestion, InterviewerArchetype } from '../../core/types.js';
import { fetchGithubContext } from '../github-service.js';

export interface QuestionContext {
  githubUrl?: string;
  resumeText?: string;
  jobDescription?: string;
}

const QUESTION_SYSTEM_PROMPT = `You are an adaptive interview coaching AI. You generate realistic interview questions for practice sessions.

You are an EDUCATIONAL TOOL, not a hiring screen. Your questions help learners practice, demonstrate structured thinking, and improve.

CRITICAL REQUIREMENTS:
1. ARCHETYPE ALIGNMENT: You MUST strictly embody the selected Interviewer Archetype:
   - Supportive Felix: Warm, encouraging, high patience, positive reinforcement, welcoming open-ended reflection and psychological safety.
   - Pragmatic Staff Architect: Rigorous, analytical, direct, probing architectural edge cases, distributed failure states, data consistency, p99 latency, and explicit trade-offs.
   - Rapid-Fire Recruiter: Crisp, fast-paced, executive-focused, testing time management, 30-second elevator pitches, prioritization, and quantified business impact ($ / % / hours saved).
2. ROLE-SPECIFIC GROUNDING: Every question MUST be strictly and explicitly focused on the target role. Never ask questions outside the domain of the selected role.
3. CANDIDATE EXPERIENCE GROUNDING: If the learner provided a GitHub profile/repo or resume text, you MUST directly reference their real projects, architecture decisions, tools, and technical claims in your questions.
4. ABSOLUTE PROHIBITION: NEVER state, say, or imply that you cannot access, view, or find their GitHub profile, repository, code, or external links. NEVER say "I cannot access your GitHub", "I cannot view external links", or "As an AI, I cannot access the internet". You have already reviewed their background and code. Always speak directly and authoritatively as an interviewer who has studied their work.
5. CONVERSATIONAL & NATURAL: Formulate questions as an expert technical interviewer or hiring manager would ask them in a live conversation.
6. VARIETY: Mix technical architecture/implementation, situational problem-solving, and behavioral STAR questions matching the archetype flavor.`;

const QUESTION_PROMPT_TEMPLATE = `Generate {{count}} interview questions for a candidate practicing for the target role: "{{role}}" at {{difficulty}} difficulty level.

INTERVIEWER ARCHETYPE DIRECTIVE:
{{archetypeDirective}}

{{candidateContext}}

STRICT INSTRUCTIONS:
- Embody the "{{archetypeName}}" archetype in every question phrasing.
- Every question MUST be directly relevant to {{role}}.
- If GitHub projects or Resume details are provided above, craft questions that specifically challenge the candidate on those actual projects, libraries, design decisions, and claims!
- NEVER state that you cannot access their profile or links. Treat all candidate context as thoroughly reviewed.
- For behavioral questions, use "Tell me about a time..." format, connecting to their field.
- For technical questions, probe deep architectural trade-offs, debugging, or system design in {{role}}.

Return a JSON array of objects with these fields:
- text: the question text (string)
- type: "behavioral" | "technical" | "situational" (string)
- targetCompetency: the competency being assessed, e.g. "technical-depth", "architecture-tradeoffs", "problem-solving", "communication", "leadership" (string)
- difficulty: "{{difficulty}}" (string)
- followUpHints: array of 2-3 possible follow-up probing angles (string[])

Return ONLY the JSON array. No markdown formatting, no explanation.`;

function getArchetypeDirective(archetype: InterviewerArchetype = 'supportive-coach'): { name: string; directive: string } {
  switch (archetype) {
    case 'pragmatic-architect':
      return {
        name: 'Pragmatic Staff Architect',
        directive:
          'ARCHETYPE: Pragmatic Staff Architect. Zero in on architectural failure states, edge cases, latency bottlenecks, caching invalidation, distributed concurrency, and explicit engineering trade-offs. The questions should challenge the candidate to defend technical designs when infrastructure breaks.',
      };
    case 'rapid-fire-recruiter':
      return {
        name: 'Rapid-Fire Recruiter',
        directive:
          'ARCHETYPE: Rapid-Fire Recruiter. Emphasize crisp executive summaries, time management, 30-to-60 second elevator pitches, prioritization under stress, and quantifiable business outcomes ($ / % metrics, SLA impact). Questions must be sharp and velocity-driven.',
      };
    case 'supportive-coach':
    default:
      return {
        name: 'Supportive Felix',
        directive:
          'ARCHETYPE: Supportive Felix. Provide high reassurance, patience, and positive reinforcement. Phrase questions in an inviting, psychologically safe manner that empowers the candidate to structure their thoughts without anxiety.',
      };
  }
}

export async function generateQuestions(
  targetRole: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  count: number,
  context?: QuestionContext,
  archetype: InterviewerArchetype = 'supportive-coach',
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

  const hasGithub = Boolean(githubContext);
  const hasResume = Boolean(context?.resumeText?.trim());

  let candidateContext = '';
  if (hasGithub) {
    candidateContext += `\nCANDIDATE GITHUB PORTFOLIO & REPOSITORIES:\n${githubContext}\n`;
  }
  if (hasResume) {
    candidateContext += `\nCANDIDATE RESUME / EXPERIENCE SUMMARY:\n"""\n${context?.resumeText?.trim().slice(0, 3000)}\n"""\n`;
  }
  if (context?.jobDescription?.trim()) {
    candidateContext += `\nTARGET JOB REQUIREMENTS:\n"""\n${context.jobDescription.trim().slice(0, 1000)}\n"""\n`;
  }
  if (!hasGithub && !hasResume) {
    candidateContext += `\nCANDIDATE CONTEXT: The candidate has NOT submitted an external GitHub profile or resume.\nCRITICAL CONSTRAINT: DO NOT refer to "your GitHub", "your repository", "your resume", or "your project". Do NOT pretend you have seen a codebase they did not provide. Ask domain-specific engineering questions for "${targetRole}" (system architecture principles, state management, databases, concurrency, and behavioral teamwork scenarios).\n`;
  }

  const archInfo = getArchetypeDirective(archetype);

  const prompt = QUESTION_PROMPT_TEMPLATE
    .replace(/\{\{count\}\}/g, String(batchCount))
    .replace(/\{\{role\}\}/g, targetRole)
    .replace(/\{\{difficulty\}\}/g, difficulty)
    .replace(/\{\{archetypeDirective\}\}/g, archInfo.directive)
    .replace(/\{\{archetypeName\}\}/g, archInfo.name)
    .replace(/\{\{candidateContext\}\}/g, candidateContext);

  try {
    const questions = await llmClient.generateJSON<GeneratedQuestion[]>(prompt, {
      systemInstruction: QUESTION_SYSTEM_PROMPT,
      temperature: archetype === 'rapid-fire-recruiter' ? 0.7 : 0.75,
    });

    if (Array.isArray(questions) && questions.length > 0) {
      return questions;
    }
    return getFallbackQuestions(targetRole, difficulty, effectiveCount, context, archetype);
  } catch (error) {
    console.error('Failed to generate LLM questions, using role-specialized fallback:', error);
    return getFallbackQuestions(targetRole, difficulty, effectiveCount, context, archetype);
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
  archetype: InterviewerArchetype = 'supportive-coach',
): GeneratedQuestion[] {
  const diff = difficulty as 'beginner' | 'intermediate' | 'advanced';
  const hasGithub = Boolean(context?.githubUrl?.trim());
  const hasResume = Boolean(context?.resumeText?.trim());

  const baseQuestions: GeneratedQuestion[] = [];

  if (archetype === 'pragmatic-architect') {
    // Pragmatic Staff Architect: Edge cases, failure modes, consistency, p99 latency & trade-offs
    if (hasGithub || hasResume) {
      baseQuestions.push({
        text: `Looking at the architectural choices in your ${hasGithub ? 'GitHub repositories' : 'resume projects'}, what were the most critical failure states and edge cases you had to guard against for ${role}? How did you handle fallback mechanisms?`,
        type: 'technical',
        targetCompetency: 'architecture-tradeoffs',
        difficulty: diff,
        followUpHints: ['What happens if network partitions occur?', 'How did you verify p99 latency under load?'],
      });
    } else {
      baseQuestions.push({
        text: `When architecting a distributed system as a ${role}, how do you systematically design for partial network partitions, cache stampedes, and cascading failovers? Walk me through your concrete trade-offs.`,
        type: 'technical',
        targetCompetency: 'architecture-tradeoffs',
        difficulty: diff,
        followUpHints: ['How do you ensure data consistency?', 'Where are your single points of failure?'],
      });
    }

    baseQuestions.push(
      {
        text: `In a high-throughput production environment for ${role}, describe how you identify and mitigate p99 tail latency spikes and lock contention.`,
        type: 'technical',
        targetCompetency: 'system-design',
        difficulty: diff,
        followUpHints: ['How do you isolate noisy neighbors?', 'What profiling instrumentation do you rely on?'],
      },
      {
        text: `Tell me about an architectural decision you made in ${role} that you later realized was a sub-optimal trade-off. How did the edge case manifest, and how did you refactor it?`,
        type: 'situational',
        targetCompetency: 'technical-depth',
        difficulty: diff,
        followUpHints: ['What early warning signs did you miss?', 'What metrics proved the refactor worked?'],
      },
      {
        text: `When upstream dependencies experience degraded SLA or sudden 500 error surges, what defensive patterns (circuit breakers, dead-letter queues, backpressure) do you enforce in ${role}?`,
        type: 'technical',
        targetCompetency: 'troubleshooting',
        difficulty: diff,
        followUpHints: ['How do you prevent downstream cascade?', 'How is telemetry emitted?'],
      },
      {
        text: `Walk me through a scenario where a database migration or schema evolution had to occur under continuous live traffic with zero downtime for ${role}. What was your failure recovery plan?`,
        type: 'technical',
        targetCompetency: 'engineering-practices',
        difficulty: diff,
        followUpHints: ['How did you handle dual-write consistency?', 'How did you orchestrate rollback?'],
      },
    );
  } else if (archetype === 'rapid-fire-recruiter') {
    // Rapid-Fire Recruiter: Time management, executive summaries, elevator pitches & quantified ROI
    if (hasGithub || hasResume) {
      baseQuestions.push({
        text: `In 60 seconds, give me the executive elevator pitch of the single most impactful project from your ${hasGithub ? 'GitHub work' : 'resume'}. What was the bottom-line business or technical ROI?`,
        type: 'situational',
        targetCompetency: 'communication',
        difficulty: diff,
        followUpHints: ['What were the exact metrics?', 'What timeline did you deliver within?'],
      });
    } else {
      baseQuestions.push({
        text: `In 60 seconds, give me your executive pitch as a ${role}: what is your engineering core strength, and what is the biggest measurable impact you delivered on your last team?`,
        type: 'behavioral',
        targetCompetency: 'communication',
        difficulty: diff,
        followUpHints: ['What percentage improvement did you drive?', 'How did leadership measure success?'],
      });
    }

    baseQuestions.push(
      {
        text: `Tell me about a high-velocity sprint in ${role} where you had to ship under aggressive deadlines with competing requirements. How did you prioritize what to cut?`,
        type: 'situational',
        targetCompetency: 'problem-solving',
        difficulty: diff,
        followUpHints: ['How did you manage stakeholder expectations?', 'What was the delivery outcome?'],
      },
      {
        text: `Walk me through a conflict you resolved with another engineer or product manager regarding technical direction in ${role}. Give me the situation, your direct action, and the result.`,
        type: 'behavioral',
        targetCompetency: 'leadership',
        difficulty: diff,
        followUpHints: ['Did you meet the delivery deadline?', 'What was the relationship outcome?'],
      },
      {
        text: `If you have only 2 minutes to brief an executive VP on a severe production blocker in ${role}, how do you structure that summary to enable immediate decision-making?`,
        type: 'situational',
        targetCompetency: 'communication',
        difficulty: diff,
        followUpHints: ['What key data points do you include?', 'How do you avoid unnecessary jargon?'],
      },
      {
        text: `Tell me about a time you optimized a process or pipeline in ${role} that saved engineering hours or infrastructure budget. What were the tangible numbers?`,
        type: 'behavioral',
        targetCompetency: 'engineering-practices',
        difficulty: diff,
        followUpHints: ['What was the dollar or hour savings?', 'How quickly was it adopted across teams?'],
      },
    );
  } else {
    // Supportive Felix: Warm, encouraging, high psychological safety, structured reflection
    if (hasGithub || hasResume) {
      baseQuestions.push({
        text: `I'm excited to hear about your experience! Looking at the projects on your ${hasGithub ? 'GitHub profile' : 'resume'}, can you walk me through an accomplishment you're proud of for ${role}? What was your thought process?`,
        type: 'technical',
        targetCompetency: 'architecture-tradeoffs',
        difficulty: diff,
        followUpHints: ['What did you enjoy most about that challenge?', 'What did that project teach you?'],
      });
    } else {
      baseQuestions.push({
        text: `To kick off our conversation, as a ${role}, how do you typically approach architecting scalable, resilient systems, and what principles guide your decision-making?`,
        type: 'technical',
        targetCompetency: 'technical-depth',
        difficulty: diff,
        followUpHints: ['What was the biggest technical bottleneck?', 'How do you measure success?'],
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
        text: `Describe a scenario in your work as a ${role} where requirements were ambiguous or conflicting. How did you collaborate with your team to find the best path forward?`,
        type: 'situational',
        targetCompetency: 'communication',
        difficulty: diff,
        followUpHints: ['How did you prioritize competing features?', 'How did you communicate trade-offs?'],
      },
      {
        text: `Walk me through your step-by-step triage workflow when an unexpected high-severity incident occurs in a ${role} workflow.`,
        type: 'technical',
        targetCompetency: 'troubleshooting',
        difficulty: diff,
        followUpHints: ['Where in the stack do you start looking?', 'How do you keep calm under pressure?'],
      },
      {
        text: `Tell me about a time in ${role} where you identified technical debt or an area to improve. How did you propose and work through the refactor?`,
        type: 'behavioral',
        targetCompetency: 'engineering-practices',
        difficulty: diff,
        followUpHints: ['How did it help the team?', 'What did you learn from the experience?'],
      },
    );
  }

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
