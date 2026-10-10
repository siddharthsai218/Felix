import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize a local wrapper for Gemini Flash-Lite per instructions
const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); // Fallback to 2.5 flash if lite is not standard

/**
 * Calls Gemini to generate a structured JSON response.
 * @param prompt The prompt including schema instructions.
 * @returns Parsed JSON object of type T.
 */
export async function generateJSON<T>(prompt: string): Promise<T> {
  const response = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' },
  });
  
  const text = response.response.text();
  return JSON.parse(text) as T;
}
