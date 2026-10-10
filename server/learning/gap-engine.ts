import { RubricResult, GapAnalysis, LearningGap } from './types.js';
import { generateJSON } from './llm-client.js';
import { GAP_ANALYSIS_PROMPT } from './prompts/gap-analysis.js';

/**
 * Analyzes the rubric result to identify competencies and learning gaps.
 * 
 * @param rubricResult - The evaluated rubric results
 * @param role - The target role and its competencies
 * @returns A promise resolving to a GapAnalysis object
 */
export async function analyzeGaps(
  rubricResult: RubricResult,
  role: { title: string; competencies: string[] }
): Promise<GapAnalysis> {
  const prompt = `
    ${GAP_ANALYSIS_PROMPT}
    
    Rubric Result:
    ${JSON.stringify(rubricResult, null, 2)}
    
    Role Context:
    ${JSON.stringify(role, null, 2)}
  `;

  try {
    const analysis = await generateJSON<GapAnalysis>(prompt);
    return analysis;
  } catch (error) {
    console.error('Failed to analyze gaps:', error);
    throw new Error('Gap analysis failed');
  }
}

/**
 * Prioritizes learning gaps based on severity and domain.
 * Sorts by severity (high > medium > low), then by domain.
 * 
 * @param gaps - An array of identified learning gaps
 * @returns A sorted array of learning gaps
 */
export function prioritizeGaps(gaps: LearningGap[]): LearningGap[] {
  const severityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const domainWeight: Record<string, number> = { technical: 3, communication: 2, behavioral: 1 };

  return [...gaps].sort((a, b) => {
    const weightA = severityWeight[a.severity.toLowerCase()] || 0;
    const weightB = severityWeight[b.severity.toLowerCase()] || 0;
    
    if (weightA !== weightB) {
      return weightB - weightA; // Sort high to low
    }

    const domA = domainWeight[a.domain.toLowerCase()] || 0;
    const domB = domainWeight[b.domain.toLowerCase()] || 0;
    
    return domB - domA; // Sort high to low within same severity
  });
}
