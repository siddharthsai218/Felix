import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  // API Keys
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  assemblyAiApiKey: process.env.ASSEMBLYAI_API_KEY || '',
  cartesiaApiKey: process.env.CARTESIA_API_KEY || '',
  beyondPresenceApiKey: process.env.BEYOND_PRESENCE_API_KEY || '',
  beyondPresenceAvatarId: process.env.NEXT_PUBLIC_BEYOND_PRESENCE_AGENT_ID || process.env.BEYOND_PRESENCE_AVATAR_ID || '',

  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  wsPort: parseInt(process.env.WS_PORT || '3002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Session defaults
  defaultQuestionCount: 3,
  rescueModeTimeoutMs: 5000,    // 5 seconds of silence triggers Rescue Mode
  drillTimeLimitSeconds: 30,
  maxTurnLatencyMs: 1500,       // < 1.5s latency budget (P0)

  // LLM
  geminiModel: 'gemini-2.5-flash-lite',
  defaultTemperature: 0.7,
  defaultMaxTokens: 2048,
} as const;

// Validate required keys at startup
export function validateConfig(): void {
  const required = [
    ['GEMINI_API_KEY', config.geminiApiKey],
  ] as const;

  const missing = required.filter(([, value]) => !value);
  if (missing.length > 0) {
    console.warn(
      `⚠️  Missing required environment variables: ${missing.map(([key]) => key).join(', ')}\n` +
      `   Copy .env.example to .env and fill in your API keys.`
    );
  }
}
