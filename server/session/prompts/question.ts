import { llmClient } from '../../core/llm.js';
import type { GeneratedQuestion } from '../../core/types.js';

const QUESTION_SYSTEM_PROMPT = `You are Felix, an adaptive interview coaching AI. You generate realistic interview questions for practice sessions.

You are an EDUCATIONAL TOOL, not a hiring screen. Your questions help learners practice and improve.

Rules:
- Generate questions appropriate for the target role and difficulty level
- Mix behavioral, technical, and situational question types
- Each question should target a specific competency
- Questions should be conversational and natural, as a real interviewer would ask them
- Keep questions concise (1-2 sentences)
- For behavioral questions, use "Tell me about a time..." format
- For technical questions, ask about concepts and their application
- For situational questions, present realistic scenarios`;

const QUESTION_PROMPT_TEMPLATE = `Generate {{count}} interview questions for a {{role}} position at {{difficulty}} difficulty level.

Return a JSON array of objects with these fields:
- text: the question text (string)
- type: "behavioral" | "technical" | "situational" (string)
- targetCompetency: the competency being assessed, e.g. "problem-solving", "communication", "technical-knowledge", "leadership", "teamwork" (string)
- difficulty: "{{difficulty}}" (string)
- followUpHints: array of 2-3 possible follow-up angles (string[])

Return ONLY the JSON array. No explanation.`;

export async function generateQuestions(
  targetRole: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  count: number,
): Promise<GeneratedQuestion[]> {
  const effectiveCount = count <= 0 ? 5 : count;
  // Keep individual prompt generation batch <= 10 to ensure fast Gemini latency and reliable JSON
  const batchCount = Math.min(effectiveCount, 10);
  const prompt = QUESTION_PROMPT_TEMPLATE
    .replace(/\{\{count\}\}/g, String(batchCount))
    .replace(/\{\{role\}\}/g, targetRole)
    .replace(/\{\{difficulty\}\}/g, difficulty);

  try {
    const questions = await llmClient.generateJSON<GeneratedQuestion[]>(prompt, {
      systemInstruction: QUESTION_SYSTEM_PROMPT,
      temperature: 0.8, // Some variety in questions
    });

    if (Array.isArray(questions) && questions.length > 0) {
      return questions;
    }
    return getFallbackQuestions(targetRole, difficulty, effectiveCount);
  } catch (error) {
    console.error('Failed to generate questions, using fallback:', error);
    return getFallbackQuestions(targetRole, difficulty, effectiveCount);
  }
}

/**
 * Fallback questions in case the LLM call fails.
 * Comprehensive bank covering multiple competencies that dynamically expands to any count.
 */
function getFallbackQuestions(
  role: string,
  difficulty: string,
  count: number,
): GeneratedQuestion[] {
  const diff = difficulty as 'beginner' | 'intermediate' | 'advanced';
  const baseQuestions: GeneratedQuestion[] = [
    {
      text: `Tell me about a challenging project you worked on recently in ${role}. What was your specific role, and what was the outcome?`,
      type: 'behavioral',
      targetCompetency: 'problem-solving',
      difficulty: diff,
      followUpHints: ['What was the biggest obstacle?', 'How did you measure success?'],
    },
    {
      text: 'How would you explain a complex technical concept or architecture to someone without a technical background?',
      type: 'situational',
      targetCompetency: 'communication',
      difficulty: diff,
      followUpHints: ['Can you give a specific example?', 'What if they still didn\'t understand?'],
    },
    {
      text: 'Describe a time when you had to work with a difficult team member or conflicting project requirements. How did you handle it?',
      type: 'behavioral',
      targetCompetency: 'teamwork',
      difficulty: diff,
      followUpHints: ['What did you learn from it?', 'Would you handle it differently now?'],
    },
    {
      text: 'Walk me through how you approach debugging a high-stakes issue in production when logs are sparse.',
      type: 'technical',
      targetCompetency: 'technical-knowledge',
      difficulty: diff,
      followUpHints: ['What tools do you use?', 'How do you prioritize when multiple issues arise?'],
    },
    {
      text: 'Tell me about a time you had to learn something completely new in a very short timeframe. How did you approach it?',
      type: 'behavioral',
      targetCompetency: 'adaptability',
      difficulty: diff,
      followUpHints: ['What resources did you use?', 'How did you know you had learned enough?'],
    },
    {
      text: 'Can you describe a technical decision or trade-off you made that you later regretted or refactored? What did you learn?',
      type: 'technical',
      targetCompetency: 'system-design',
      difficulty: diff,
      followUpHints: ['What trade-offs were evaluated?', 'How did it affect the team?'],
    },
    {
      text: 'How do you balance high-velocity feature delivery with code quality, test coverage, and tech debt reduction?',
      type: 'situational',
      targetCompetency: 'engineering-practices',
      difficulty: diff,
      followUpHints: ['How do you communicate tech debt to product managers?'],
    },
    {
      text: 'Tell me about a time you took the initiative to improve a team workflow, system reliability, or developer experience without being asked.',
      type: 'behavioral',
      targetCompetency: 'leadership',
      difficulty: diff,
      followUpHints: ['How did you gain team alignment?', 'What was the long-term impact?'],
    },
    {
      text: 'Imagine your service experiences an unexpected spike in latency or error rates. What is your step-by-step triage workflow?',
      type: 'technical',
      targetCompetency: 'troubleshooting',
      difficulty: diff,
      followUpHints: ['Where in the stack do you look first?', 'What metrics do you monitor?'],
    },
    {
      text: 'Describe a situation where a project you owned fell behind schedule. How did you handle scope, stakeholders, and delivery?',
      type: 'situational',
      targetCompetency: 'time-management',
      difficulty: diff,
      followUpHints: ['What trade-offs were made?', 'How was feedback received?'],
    },
    {
      text: 'How do you ensure data integrity, security, and edge-case resilience when building core application workflows?',
      type: 'technical',
      targetCompetency: 'security-design',
      difficulty: diff,
      followUpHints: ['How do you validate inputs?', 'What about authentication boundaries?'],
    },
    {
      text: 'Tell me about a time you received constructive feedback that was difficult to hear. How did you respond and improve?',
      type: 'behavioral',
      targetCompetency: 'growth-mindset',
      difficulty: diff,
      followUpHints: ['Did your daily habits change?', 'How did you follow up?'],
    },
  ];

  if (count <= baseQuestions.length) {
    return baseQuestions.slice(0, count);
  }

  // If count exceeds base question list, scale dynamically by synthesizing variations
  const scaled: GeneratedQuestion[] = [...baseQuestions];
  let cycle = 1;
  while (scaled.length < count) {
    for (const q of baseQuestions) {
      if (scaled.length >= count) break;
      scaled.push({
        ...q,
        text: `Follow-up deep-dive (${cycle + 1}): In the context of ${role}, ${q.text.charAt(0).toLowerCase() + q.text.slice(1)}`,
        targetCompetency: q.targetCompetency,
      });
    }
    cycle++;
  }

  return scaled;
}
