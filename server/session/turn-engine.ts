import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { llmClient } from '../core/llm.js';
import { config } from '../core/config.js';
import { sessionManager, type ActiveSession } from './session-manager.js';
import { generateQuestions } from './prompts/question.js';
import { generateFollowUp } from './prompts/followup.js';
import { generateCoachHint } from './prompts/coach.js';
import { generateRescueResponse } from './prompts/rescue.js';
import { syncBeyondPresenceAgent } from './beyond-presence-sync.js';
import { fetchGithubContext } from './github-service.js';
import type {
  ServerMessage,
  SessionResponseRecord,
  TurnState,
  SttWordTimestamp,
  DrillSpec,
} from '../core/types.js';

// Fallback drill per AGENTS.md § Sequencing
const FALLBACK_DRILL: DrillSpec = {
  drillId: 'fallback-001',
  sessionId: 'current',
  responseIndex: 0,
  targetLearningOutcome: 'Apply the STAR method to behavioral questions',
  targetCompetency: 'communication',
  gapSeverity: 'high',
  question: 'Tell me about a time you had to debug a critical production issue under pressure. What was the situation, what did you do, and what was the result?',
  timeLimitSeconds: 30,
  hints: [
    'Start with the Situation: set the scene briefly',
    'Describe the specific Task you were responsible for',
    'Focus on YOUR Actions — what exactly did you do?',
    'End with the measurable Result',
  ],
};

export class TurnEngine {
  private ws: WebSocket;
  private session: ActiveSession;
  private silenceTimer: NodeJS.Timeout | null = null;
  private currentResponseStart: Date | null = null;
  private currentTranscript: string = '';
  private currentTimestamps: SttWordTimestamp[] = [];
  private rescueTriggered: boolean = false;
  private coachUsed: boolean = false;

  constructor(ws: WebSocket, session: ActiveSession) {
    this.ws = ws;
    this.session = session;
  }

  /**
   * Start the session: generate questions, then ask the first one.
   */
  async startSession(): Promise<void> {
    this.sendMessage({ type: 'turn:state', state: 'processing' });
    sessionManager.updateState(this.session.sessionId, 'processing');

    try {
      const isUnlimited = !this.session.config.questionCount || this.session.config.questionCount <= 0;
      // Generate initial questions: batch of 5 for unlimited, or up to configured count
      const countToGen = isUnlimited ? 5 : Math.min(this.session.config.questionCount, 8);
      const questionContext = {
        githubUrl: this.session.config.githubUrl,
        resumeText: this.session.config.resumeText,
        jobDescription: this.session.config.jobDescription,
      };
      let githubContext = '';
      if (this.session.config.githubUrl?.trim()) {
        try {
          githubContext = await fetchGithubContext(this.session.config.githubUrl.trim());
        } catch (err) {
          console.warn('Failed to pre-fetch GitHub context for avatar sync:', err);
        }
      }

      const questions = await generateQuestions(
        this.session.config.targetRole,
        this.session.config.difficulty,
        countToGen,
        questionContext,
      );
      this.session.questions = questions;

      // Sync Beyond Presence avatar prompt & greeting with role, GitHub projects, and question 1
      syncBeyondPresenceAgent({
        targetRole: this.session.config.targetRole,
        difficulty: this.session.config.difficulty,
        githubContext,
        resumeText: this.session.config.resumeText,
        firstQuestion: questions[0]?.text,
      }).catch((err) => console.warn('Beyond Presence avatar sync error:', err));

      // Ask the first question
      await this.askQuestion(0);
    } catch (error) {
      console.error('Failed to start session:', error);
      this.sendMessage({ type: 'error', message: 'Failed to generate questions. Please try again.' });
    }
  }

  /**
   * Ask a specific question by index. Dynamically generates additional questions if needed.
   */
  async askQuestion(index: number): Promise<void> {
    const isUnlimited = !this.session.config.questionCount || this.session.config.questionCount <= 0;
    if (!isUnlimited && index >= this.session.config.questionCount) {
      // Completed configured number of questions
      await this.endSession();
      return;
    }

    let question = this.session.questions[index];
    if (!question) {
      // Questions ran out: dynamically generate additional questions on the fly
      try {
        const batchSize = isUnlimited ? 3 : Math.min(this.session.config.questionCount - index, 5);
        const additionalQuestions = await generateQuestions(
          this.session.config.targetRole,
          this.session.config.difficulty,
          batchSize,
          {
            githubUrl: this.session.config.githubUrl,
            resumeText: this.session.config.resumeText,
            jobDescription: this.session.config.jobDescription,
          },
        );
        this.session.questions.push(...additionalQuestions);
        question = this.session.questions[index];
      } catch (err) {
        console.error('Failed to generate additional questions dynamically:', err);
      }
    }

    if (!question) {
      // No more questions could be generated — end session gracefully
      await this.endSession();
      return;
    }

    this.sendMessage({ type: 'turn:state', state: 'asking' });
    sessionManager.updateState(this.session.sessionId, 'asking');

    // Send the question text
    this.sendMessage({
      type: 'question:text',
      text: question.text,
      questionIndex: index,
    });

    // Generate TTS for the question
    await this.speakText(question.text);

    // Transition to listening
    this.startListening();
  }

  /**
   * Ask a drill question.
   */
  async askDrill(drill: DrillSpec): Promise<void> {
    this.sendMessage({ type: 'turn:state', state: 'drill' });
    sessionManager.updateState(this.session.sessionId, 'drill');

    this.sendMessage({
      type: 'question:text',
      text: drill.question,
      questionIndex: -1, // -1 indicates a drill
    });

    await this.speakText(drill.question);
    this.startListening();
  }

  /**
   * Transition to listening state with silence detection.
   */
  private startListening(): void {
    this.sendMessage({ type: 'turn:state', state: 'listening' });
    sessionManager.updateState(this.session.sessionId, 'listening');
    this.currentResponseStart = new Date();
    this.currentTranscript = '';
    this.currentTimestamps = [];
    this.rescueTriggered = false;
    this.coachUsed = false;
    this.startSilenceDetection();
  }

  /**
   * Handle incoming audio transcription (from STT).
   */
  handleTranscriptPartial(text: string): void {
    this.resetSilenceTimer();
    this.sendMessage({ type: 'stt:partial', text });
  }

  /**
   * Handle final transcription for a response.
   */
  async handleTranscriptFinal(text: string, timestamps: SttWordTimestamp[]): Promise<void> {
    this.clearSilenceTimer();
    this.currentTranscript = text;
    this.currentTimestamps = timestamps;

    this.sendMessage({ type: 'stt:final', text, timestamps });

    // Build the response record
    const now = new Date();
    const questionIndex = this.session.currentQuestionIndex;
    const question = this.session.questions[questionIndex];
    const isDrill = this.session.state === 'drill';

    const record: SessionResponseRecord = {
      sessionId: this.session.sessionId,
      learnerId: this.session.config.learnerId,
      responseIndex: questionIndex,
      questionAsked: question?.text || 'Drill question',
      questionType: isDrill ? 'drill' : (question?.type || 'behavioral'),
      targetCompetency: question?.targetCompetency,
      transcript: text,
      timestamps,
      startedAt: this.currentResponseStart?.toISOString() || now.toISOString(),
      endedAt: now.toISOString(),
      durationMs: this.currentResponseStart ? now.getTime() - this.currentResponseStart.getTime() : 0,
      rescueModeTriggered: this.rescueTriggered,
      coachModeUsed: this.coachUsed,
      isDrill,
      drillSpec: isDrill ? (this.session.pendingDrills[0] || FALLBACK_DRILL) : undefined,
    };

    sessionManager.addResponse(this.session.sessionId, record);
    this.sendMessage({ type: 'response:complete', record });

    // Decide what's next: if unlimited or current index < questionCount, keep interviewing
    const isUnlimited = !this.session.config.questionCount || this.session.config.questionCount <= 0;
    if (isUnlimited || this.session.currentQuestionIndex < this.session.config.questionCount) {
      // Check for follow-up
      if (text.length < 50 || this.rescueTriggered) {
        // Short or rescued answer — ask a follow-up
        await this.askFollowUp(question?.text || '', text);
      } else {
        // Move to next question
        await this.askQuestion(this.session.currentQuestionIndex);
      }
    } else {
      // All questions answered
      await this.endSession();
    }
  }

  /**
   * Generate and ask a follow-up question.
   */
  private async askFollowUp(originalQuestion: string, response: string): Promise<void> {
    this.sendMessage({ type: 'turn:state', state: 'processing' });

    try {
      const followUp = await generateFollowUp(
        originalQuestion,
        response,
        this.session.config.targetRole,
      );

      // Replace current question with the follow-up
      if (this.session.currentQuestionIndex <= this.session.questions.length) {
        this.session.questions.splice(this.session.currentQuestionIndex, 0, {
          text: followUp,
          type: 'follow-up',
          targetCompetency: this.session.questions[this.session.currentQuestionIndex - 1]?.targetCompetency || 'communication',
          difficulty: this.session.config.difficulty,
        });
      }

      await this.askQuestion(this.session.currentQuestionIndex);
    } catch (error) {
      console.error('Failed to generate follow-up:', error);
      await this.askQuestion(this.session.currentQuestionIndex);
    }
  }

  /**
   * Handle Coach Mode request.
   */
  async handleCoachRequest(): Promise<void> {
    this.coachUsed = true;
    const questionIndex = this.session.currentQuestionIndex;
    const question = this.session.questions[questionIndex];

    if (!question) {
      this.sendMessage({ type: 'coach:hint', hint: 'Try using the STAR method: Situation, Task, Action, Result.' });
      return;
    }

    try {
      const hint = await generateCoachHint(
        question.text,
        this.currentTranscript,
        question.targetCompetency,
      );
      this.sendMessage({ type: 'coach:hint', hint });
    } catch (error) {
      console.error('Failed to generate coach hint:', error);
      this.sendMessage({ type: 'coach:hint', hint: 'Try using the STAR method: Situation, Task, Action, Result.' });
    }
  }

  /**
   * Handle drill start request.
   */
  async handleDrillStart(drillId: string): Promise<void> {
    let drill: DrillSpec | undefined;

    // Check pending drills
    const session = this.session;
    const pending = session.pendingDrills.find(d => d.drillId === drillId);
    if (pending) {
      drill = pending;
      session.pendingDrills = session.pendingDrills.filter(d => d.drillId !== drillId);
    } else {
      // Use fallback drill
      drill = { ...FALLBACK_DRILL, drillId, sessionId: session.sessionId };
    }

    await this.askDrill(drill);
  }

  /**
   * Silence detection — triggers Rescue Mode after 5 seconds.
   */
  private startSilenceDetection(): void {
    // Automatic rescue mode on silence disabled per user request
    this.clearSilenceTimer();
  }

  private resetSilenceTimer(): void {
    this.clearSilenceTimer();
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    this.session.silenceTimerStart = null;
  }

  /**
   * Rescue Mode: scaffold the learner when they freeze.
   */
  private async triggerRescueMode(): Promise<void> {
    this.rescueTriggered = true;
    this.sendMessage({ type: 'turn:state', state: 'rescue' });
    sessionManager.updateState(this.session.sessionId, 'rescue');

    const questionIndex = this.session.currentQuestionIndex;
    const question = this.session.questions[questionIndex];

    try {
      const rescueMessage = await generateRescueResponse(
        question?.text || 'Tell me about your experience.',
        this.currentTranscript,
        this.session.config.targetRole,
      );

      this.sendMessage({ type: 'rescue:activate', message: rescueMessage });

      // Speak the rescue message
      await this.speakText(rescueMessage);

      // Return to listening
      this.startListening();
    } catch (error) {
      console.error('Failed to generate rescue response:', error);
      const fallback = 'Take a breath. Think about a specific example from your experience. What was the situation, and what did you do?';
      this.sendMessage({ type: 'rescue:activate', message: fallback });
      await this.speakText(fallback);
      this.startListening();
    }
  }

  /**
   * Generate TTS audio and send to client.
   * Uses Cartesia API for text-to-speech.
   */
  private async speakText(text: string): Promise<void> {
    this.sendMessage({ type: 'turn:state', state: 'speaking' });

    try {
      // For the hackathon MVP, we send text chunks to the frontend
      // and let the browser's Web Speech API handle TTS as a fallback
      // if Cartesia is not configured.
      if (!config.cartesiaApiKey) {
        // Fallback: send text for browser TTS
        this.sendMessage({
          type: 'tts:audio',
          data: text, // Frontend will use SpeechSynthesis API
          isLast: true,
        });
        return;
      }

      // Cartesia TTS API call
      const response = await fetch('https://api.cartesia.ai/tts/bytes', {
        method: 'POST',
        headers: {
          'X-API-Key': config.cartesiaApiKey,
          'Cartesia-Version': '2024-06-10',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: text,
          model_id: 'sonic-3.6',
          voice: {
            mode: 'id',
            id: 'a0e99841-438c-4a64-b679-ae501e7d6091', // Professional male voice
          },
          output_format: {
            container: 'wav',
            encoding: 'pcm_s16le',
            sample_rate: 24000,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Cartesia TTS error: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const base64Audio = Buffer.from(audioBuffer).toString('base64');

      this.sendMessage({
        type: 'tts:audio',
        data: `data:audio/wav;base64,${base64Audio}`,
        isLast: true,
      });
    } catch (error) {
      console.error('TTS error, falling back to text:', error);
      this.sendMessage({
        type: 'tts:audio',
        data: text,
        isLast: true,
      });
    }
  }

  /**
   * End the session and produce the final record.
   */
  async endSession(): Promise<void> {
    this.clearSilenceTimer();
    this.sendMessage({ type: 'turn:state', state: 'complete' });
    sessionManager.updateState(this.session.sessionId, 'complete');

    const record = sessionManager.toSessionRecord(this.session.sessionId);
    if (record) {
      this.sendMessage({ type: 'session:complete', record });
    }
  }

  /**
   * Send a typed WebSocket message.
   */
  private sendMessage(message: ServerMessage): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}
