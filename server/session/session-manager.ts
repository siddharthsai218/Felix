import { v4 as uuidv4 } from 'uuid';
import type {
  SessionConfig,
  SessionRecord,
  SessionResponseRecord,
  TranscriptLine,
  TurnState,
  GeneratedQuestion,
  DrillSpec,
} from '../core/types.js';

export interface ActiveSession {
  sessionId: string;
  config: SessionConfig;
  state: TurnState;
  questions: GeneratedQuestion[];
  responses: SessionResponseRecord[];
  transcript: TranscriptLine[];
  currentQuestionIndex: number;
  startedAt: Date;
  pendingDrills: DrillSpec[];
  silenceTimerStart: number | null; // for Rescue Mode
}

/**
 * In-memory session store.
 * For the hackathon we don't need persistence — sessions live for the demo.
 */
class SessionManager {
  private sessions: Map<string, ActiveSession> = new Map();

  create(config: SessionConfig): ActiveSession {
    const sessionId = uuidv4();
    const session: ActiveSession = {
      sessionId,
      config,
      state: 'idle',
      questions: [],
      responses: [],
      transcript: [],
      currentQuestionIndex: 0,
      startedAt: new Date(),
      pendingDrills: [],
      silenceTimerStart: null,
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  get(sessionId: string): ActiveSession | undefined {
    return this.sessions.get(sessionId);
  }

  updateState(sessionId: string, state: TurnState): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.state = state;
    }
  }

  addResponse(sessionId: string, response: SessionResponseRecord): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.responses.push(response);
      session.currentQuestionIndex++;
    }
  }

  addDrill(sessionId: string, drill: DrillSpec): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.pendingDrills.push(drill);
    }
  }

  getNextDrill(sessionId: string): DrillSpec | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      return session.pendingDrills.shift();
    }
    return undefined;
  }

  addLine(sessionId: string, line: Omit<TranscriptLine, 'id'> | TranscriptLine): TranscriptLine {
    const session = this.sessions.get(sessionId);
    const fullLine: TranscriptLine = {
      id: 'id' in line && line.id ? line.id : uuidv4(),
      ...line,
    };
    if (session) {
      session.transcript.push(fullLine);
    }
    return fullLine;
  }

  getTranscript(sessionId: string): TranscriptLine[] {
    const session = this.sessions.get(sessionId);
    return session ? session.transcript : [];
  }

  toSessionRecord(sessionId: string): SessionRecord | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    return {
      sessionId: session.sessionId,
      learnerId: session.config.learnerId,
      targetRole: session.config.targetRole,
      startedAt: session.startedAt.toISOString(),
      endedAt: new Date().toISOString(),
      totalDurationMs: Date.now() - session.startedAt.getTime(),
      responses: session.responses,
      transcript: session.transcript,
      sessionConfig: {
        questionCount: session.config.questionCount,
        difficulty: session.config.difficulty,
        coachModeEnabled: session.config.coachModeEnabled,
      },
    };
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  listActive(): ActiveSession[] {
    return Array.from(this.sessions.values());
  }
}

export const sessionManager = new SessionManager();
