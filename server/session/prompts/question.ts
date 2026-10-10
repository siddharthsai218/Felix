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
  const prompt = QUESTION_PROMPT_TEMPLATE
    .replace(/\{\{count\}\}/g, String(count))
    .replace(/\{\{role\}\}/g, targetRole)
    .replace(/\{\{difficulty\}\}/g, difficulty);

  try {
    const questions = await llmClient.generateJSON<GeneratedQuestion[]>(prompt, {
      systemInstruction: QUESTION_SYSTEM_PROMPT,
      temperature: 0.8,  // Some variety in questions
    });
    return questions;
  } catch (error) {
    console.error('Failed to generate questions, using fallback:', error);
    return getFallbackQuestions(targetRole, difficulty, count);
  }
}

/**
 * Fallback questions in case the LLM call fails.
 * Ensures the demo never breaks.
 */
function getFallbackQuestions(
  _role: string,
  difficulty: string,
  count: number,
): GeneratedQuestion[] {
  const fallbacks: GeneratedQuestion[] = [
    {
      text: 'Tell me about a challenging project you worked on recently. What was your role, and what was the outcome?',
      type: 'behavioral',
      targetCompetency: 'problem-solving',
      difficulty: difficulty as any,
      followUpHints: ['What was the biggest obstacle?', 'How did you measure success?'],
    },
    {
      text: 'How would you explain a complex technical concept to someone without a technical background?',
      type: 'situational',
      targetCompetency: 'communication',
      difficulty: difficulty as any,
      followUpHints: ['Can you give a specific example?', 'What if they still didn\'t understand?'],
    },
    {
      text: 'Describe a time when you had to work with a difficult team member. How did you handle it?',
      type: 'behavioral',
      targetCompetency: 'teamwork',
      difficulty: difficulty as any,
      followUpHints: ['What did you learn from it?', 'Would you handle it differently now?'],
    },
    {
      text: 'Walk me through how you approach debugging a complex issue in production.',
      type: 'technical',
      targetCompetency: 'technical-knowledge',
      difficulty: difficulty as any,
      followUpHints: ['What tools do you use?', 'How do you prioritize when multiple issues arise?'],
    },
    {
      text: 'Tell me about a time you had to learn something completely new in a short timeframe. How did you approach it?',
      type: 'behavioral',
      targetCompetency: 'problem-solving',
      difficulty: difficulty as any,
      followUpHints: ['What resources did you use?', 'How did you know you had learned enough?'],
    },
  ];

  return fallbacks.slice(0, count);
}
