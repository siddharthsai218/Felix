import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../core/config.js';

// Initialize Gemini client wrapper for Part 3
const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Calls Gemini with fallback models to generate a structured JSON response.
 * @param prompt The prompt including schema instructions.
 * @returns Parsed JSON object of type T.
 */
export async function generateJSON<T>(prompt: string): Promise<T> {
  const candidateModels = [
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-3-flash-preview',
    'gemini-3.8-flash',
    'gemini-2.5-flash-lite',
    'gemini-flash-lite-latest',
  ];

  let lastError: any = null;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      });

      const text = response.response.text();
      return JSON.parse(text) as T;
    } catch (err: any) {
      lastError = err;
      const msg = String(err?.message || '');
      if (
        msg.includes('404') ||
        msg.includes('not found') ||
        msg.includes('Quota exceeded') ||
        msg.includes('429')
      ) {
        console.warn(`[Learning LLM] Model ${modelName} unavailable/throttled, trying fallback...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('All candidate models failed');
}
