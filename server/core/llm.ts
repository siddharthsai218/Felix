import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';
import { config } from './config.js';

export interface LlmOptions {
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
  systemInstruction?: string;
}

class LlmClient {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({
      model: config.geminiModel,
    });
  }

  private getModelInstance(modelName: string, systemInstruction?: string): GenerativeModel {
    return systemInstruction
      ? this.genAI.getGenerativeModel({ model: modelName, systemInstruction })
      : this.genAI.getGenerativeModel({ model: modelName });
  }

  /**
   * Generate a complete response (non-streaming) with automatic model fallback.
   * Use for post-session scoring, report generation, etc.
   */
  async generate(prompt: string, options: LlmOptions = {}): Promise<string> {
    const generationConfig = this.buildConfig(options);
    const candidateModels = [
      config.geminiModel,
      'gemini-flash-lite-latest',
      'gemini-flash-latest',
      'gemini-2.5-flash',
    ];

    let lastError: any = null;
    for (const modelName of candidateModels) {
      try {
        const model = this.getModelInstance(modelName, options.systemInstruction);
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig,
        });
        return result.response.text();
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || '');
        if (msg.includes('404') || msg.includes('not found') || msg.includes('models/')) {
          console.warn(`Model ${modelName} not available, trying next fallback...`);
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  /**
   * Generate a streaming response with automatic model fallback.
   * Use for live-turn responses where latency matters.
   * Yields text chunks as they arrive.
   */
  async *generateStream(prompt: string, options: LlmOptions = {}): AsyncIterable<string> {
    const generationConfig = this.buildConfig(options);
    const candidateModels = [
      config.geminiModel,
      'gemini-flash-lite-latest',
      'gemini-flash-latest',
      'gemini-2.5-flash',
    ];

    for (const modelName of candidateModels) {
      try {
        const model = this.getModelInstance(modelName, options.systemInstruction);
        const result = await model.generateContentStream({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig,
        });

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            yield text;
          }
        }
        return;
      } catch (err: any) {
        const msg = String(err?.message || '');
        if (msg.includes('404') || msg.includes('not found')) {
          console.warn(`Model ${modelName} not available for streaming, trying fallback...`);
          continue;
        }
        throw err;
      }
    }
  }

  /**
   * Generate with structured output (JSON mode).
   * Use for scoring, gap analysis, drill generation.
   */
  async generateJSON<T>(prompt: string, options: LlmOptions = {}): Promise<T> {
    const jsonPrompt = prompt + '\n\nRespond with valid JSON only. No markdown, no code fences, no explanation.';
    const response = await this.generate(jsonPrompt, {
      ...options,
      temperature: options.temperature ?? 0.3,  // Lower temp for structured output
    });

    // Strip any markdown code fences if present
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    return JSON.parse(cleaned) as T;
  }

  /**
   * Get the underlying Generative AI model instance.
   */
  getModel(): GenerativeModel {
    return this.model;
  }

  private buildConfig(options: LlmOptions): GenerationConfig {
    return {
      temperature: options.temperature ?? config.defaultTemperature,
      maxOutputTokens: options.maxOutputTokens ?? config.defaultMaxTokens,
      topP: options.topP ?? 0.95,
      topK: options.topK ?? 40,
    };
  }
}

// Singleton instance — one LLM for the entire application
export const llmClient = new LlmClient();
