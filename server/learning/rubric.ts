import { SessionRecord, SignalRecord, RubricResult } from './types';
import { generateJSON } from './llm-client';
import { RUBRIC_SCORING_PROMPT } from './prompts/rubric-scoring';

/**
 * Evaluates an interview session and generates a rubric score.
 * 
 * @param session - The session record containing transcript and metadata
 * @param signals - The behavioral and audio signals from the session
 * @returns A promise resolving to the fully structured RubricResult
 */
export async function scoreResponse(session: SessionRecord, signals: SignalRecord): Promise<RubricResult> {
  const prompt = `
    ${RUBRIC_SCORING_PROMPT}
    
    Session Record:
    ${JSON.stringify(session, null, 2)}
    
    Signal Record:
    ${JSON.stringify(signals, null, 2)}
  `;

  try {
    const result = await generateJSON<RubricResult>(prompt);
    return result;
  } catch (error) {
    console.error('Failed to generate rubric score:', error);
    throw new Error('Rubric scoring failed');
  }
}
