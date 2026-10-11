import { WebSocket } from 'ws';
import { sessionManager } from './session-manager.js';
import { TurnEngine } from './turn-engine.js';
import type { ClientMessage, ServerMessage } from '../core/types.js';

export function handleWebSocketConnection(ws: WebSocket): void {
  let turnEngine: TurnEngine | null = null;

  ws.on('message', async (data) => {
    try {
      const message: ClientMessage = JSON.parse(data.toString());

      switch (message.type) {
        case 'session:start': {
          const session = sessionManager.create(message.config);
          turnEngine = new TurnEngine(ws, session);

          sendMessage(ws, {
            type: 'session:started',
            sessionId: session.sessionId,
          });

          console.log(`🎬 Session started: ${session.sessionId} (role: ${message.config.targetRole})`);

          // Begin the session
          await turnEngine.startSession();
          break;
        }

        case 'stt:partial': {
          if (turnEngine) {
            turnEngine.handleTranscriptPartial(message.text);
          }
          break;
        }

        case 'stt:final': {
          if (turnEngine) {
            await turnEngine.handleTranscriptFinal(message.text, message.timestamps || []);
          }
          break;
        }

        case 'audio:chunk': {
          // Reserved for future server-side STT streaming
          break;
        }

        case 'audio:end': {
          // Client signals end of speech
          break;
        }

        case 'coach:request': {
          if (turnEngine) {
            await turnEngine.handleCoachRequest();
          }
          break;
        }

        case 'drill:start': {
          if (turnEngine) {
            await turnEngine.handleDrillStart(message.drillId);
          }
          break;
        }

        case 'transcript:append': {
          if (turnEngine && message.line) {
            sessionManager.addLine(turnEngine.getSession().sessionId, message.line);
          }
          break;
        }

        case 'session:end': {
          if (turnEngine) {
            await turnEngine.endSession();
          }
          break;
        }

        default:
          console.warn('Unknown message type:', (message as any).type);
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      sendMessage(ws, {
        type: 'error',
        message: 'Failed to process message. Please try again.',
      });
    }
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected');
    if (turnEngine) {
      turnEngine.endSession().catch(console.error);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
}

function sendMessage(ws: WebSocket, message: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}
