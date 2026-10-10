import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { config, validateConfig } from './config.js';
import { handleWebSocketConnection } from '../session/ws-handler.js';
import { sessionRouter } from '../session/routes.js';

// Validate environment
validateConfig();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'felix-server',
    timestamp: new Date().toISOString(),
  });
});

// REST routes
app.use('/api/sessions', sessionRouter);

// AssemblyAI Realtime Token endpoint for direct low-latency browser streaming
app.get('/api/stt-token', async (_req, res) => {
  try {
    if (!config.assemblyAiApiKey) {
      return res.status(200).json({ token: null, fallback: 'webspeech' });
    }
    const response = await fetch('https://api.assemblyai.com/v2/realtime/token', {
      method: 'POST',
      headers: {
        'authorization': config.assemblyAiApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ expires_in: 3600 }),
    });
    if (!response.ok) {
      return res.status(200).json({ token: null, fallback: 'webspeech' });
    }
    const data = (await response.json()) as { token: string };
    res.json({ token: data.token, fallback: null });
  } catch (error) {
    res.status(200).json({ token: null, fallback: 'webspeech' });
  }
});

// HTTP server
const httpServer = createServer(app);

// WebSocket server for real-time session communication
const wss = new WebSocketServer({ port: config.wsPort });

wss.on('connection', (ws) => {
  console.log('🔌 WebSocket client connected');
  handleWebSocketConnection(ws);
});

wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

// Start HTTP server
httpServer.listen(config.port, () => {
  console.log(`
  🎓 Felix Server
  ────────────────────────────────
  HTTP API:    http://localhost:${config.port}
  WebSocket:   ws://localhost:${config.wsPort}
  Environment: ${config.nodeEnv}
  LLM Model:   ${config.geminiModel}
  ────────────────────────────────
  `);
});

export { app, httpServer, wss };
