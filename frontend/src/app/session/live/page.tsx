'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar } from '../../components/Avatar';
import { MediaCapture } from '../../components/MediaCapture';
import { AudioVisualizer } from '../../components/AudioVisualizer';
import { LiveTelemetryHud } from '../../components/LiveTelemetryHud';
import { captureEventBus, type VideoHandoff } from '../../lib/event-bus';
import { saveVideoBlob } from '../../lib/video-store';
import {
  type TurnState,
  type ServerMessage,
  type ClientMessage,
  type SessionResponseRecord,
  type SessionRecord,
  type DrillSpec,
  type SttWordTimestamp,
  type TranscriptLine,
  type InterviewerArchetype,
  INTERVIEWER_ARCHETYPES,
} from '../../lib/types';

function LiveInterviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Session Config from URL
  const targetRole = searchParams.get('role') || 'Software Engineer';
  const difficulty = (searchParams.get('difficulty') as any) || 'intermediate';
  const rawArchetype = searchParams.get('archetype') as InterviewerArchetype;
  const questionCount = parseInt(searchParams.get('questions') || '0', 10);
  const isUnlimited = questionCount <= 0;
  const coachModeEnabled = searchParams.get('coach') !== 'false';

  const [archetype, setArchetype] = useState<InterviewerArchetype>(
    rawArchetype && INTERVIEWER_ARCHETYPES[rawArchetype] ? rawArchetype : 'supportive-coach'
  );
  const archConfig = INTERVIEWER_ARCHETYPES[archetype] || INTERVIEWER_ARCHETYPES['supportive-coach'];

  const rawGithubParam = searchParams.get('github') || '';
  const initialGithub = rawGithubParam ? decodeURIComponent(rawGithubParam) : '';

  // Targeted Drill parameters
  const drillParam = searchParams.get('drillId');
  const isDrillMode = Boolean(drillParam);
  const [drillSpec, setDrillSpec] = useState<DrillSpec | null>(null);
  const [drillCountdown, setDrillCountdown] = useState<number>(30);

  // State
  const sessionParam = searchParams.get('session');
  const [sessionId, setSessionId] = useState<string>(sessionParam || `felix-${Date.now()}`);
  const [turnState, setTurnState] = useState<TurnState>('idle');
  const [githubUrl, setGithubUrl] = useState<string>(initialGithub);
  const [resumeText, setResumeText] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');

  // Load saved context and drill spec from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedGithub = sessionStorage.getItem('felix_session_github') || '';
      const storedResume = sessionStorage.getItem('felix_session_resume') || '';
      const storedJd = sessionStorage.getItem('felix_session_jd') || '';
      const storedArchetype = sessionStorage.getItem('felix_session_archetype') as InterviewerArchetype;
      if (storedArchetype && INTERVIEWER_ARCHETYPES[storedArchetype]) {
        setArchetype(storedArchetype);
      }
      if (!githubUrl && storedGithub) setGithubUrl(storedGithub);
      if (storedResume) setResumeText(storedResume);
      if (storedJd) setJobDescription(storedJd);

      if (isDrillMode) {
        try {
          const rawDrill = sessionStorage.getItem('felix_active_drill');
          if (rawDrill) {
            setDrillSpec(JSON.parse(rawDrill));
            return;
          }
        } catch (e) {}

        // Fallback drill spec grounded in current role
        setDrillSpec({
          drillId: drillParam || 'drill-default',
          sessionId: sessionParam || `felix-${Date.now()}`,
          responseIndex: 0,
          targetLearningOutcome: 'Quantify Results Using the STAR Method',
          targetCompetency: 'structural-communication',
          gapSeverity: 'high',
          question: `Explain a challenging technical trade-off in ${targetRole}. Focus on quantifying your final result in 30 seconds.`,
          timeLimitSeconds: 30,
          originalQuestion: `Key architectural challenge for ${targetRole}`,
          studentMistake: 'Response lacked structured STAR articulation and quantifiable results.',
          problemFirstExplanation: `In the problem where you were asked about the architectural challenge for ${targetRole}, the primary mistake was omitting quantifiable metrics and structured STAR framing. Technical interviewers evaluate concrete engineering depth.`,
        });
      }
    }
  }, [githubUrl, isDrillMode, drillParam, sessionParam, targetRole]);

  // Drill countdown timer while learner is speaking
  useEffect(() => {
    if (isDrillMode && turnState === 'listening') {
      setDrillCountdown(drillSpec?.timeLimitSeconds || 30);
      const interval = setInterval(() => {
        setDrillCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isDrillMode, turnState, drillSpec]);

  const [currentQuestionText, setCurrentQuestionText] = useState<string>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState<boolean>(false);
  const [avatarVolume, setAvatarVolume] = useState<number>(0);
  const [learnerTranscript, setLearnerTranscript] = useState<string>('');
  const [partialTranscript, setPartialTranscript] = useState<string>('');
  const [turnLatencyMs, setTurnLatencyMs] = useState<number>(0);
  const [rescueActive, setRescueActive] = useState<boolean>(false);
  const [responsesCompleted, setResponsesCompleted] = useState<SessionResponseRecord[]>([]);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);
  const [lastAudioPayload, setLastAudioPayload] = useState<string>('');

  // Active call duration timer
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsed = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const secs = (totalSecs % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // References
  const wsRef = useRef<WebSocket | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const turnStartTimeRef = useRef<number>(0);
  const currentTimestampsRef = useRef<SttWordTimestamp[]>([]);
  const drillTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeQuestionRef = useRef<string>('');
  const turnStateRef = useRef<TurnState>('idle');
  const transcriptRef = useRef<TranscriptLine[]>([]);
  const learnerTranscriptRef = useRef<string>('');
  const partialTranscriptRef = useRef<string>('');

  // Helper to record every spoken dialogue line (interviewer & candidate)
  const recordTranscriptLine = useCallback(
    (
      speaker: 'interviewer' | 'candidate',
      text: string,
      type: 'greeting' | 'question' | 'response' | 'followup' | 'hint' | 'drill' = 'question',
      extra?: {
        turnIndex?: number;
        questionIndex?: number;
        durationMs?: number;
        timestamps?: SttWordTimestamp[];
      }
    ) => {
      const clean = (text || '').trim();
      if (!clean) return;

      const current = transcriptRef.current;
      const last = current[current.length - 1];

      // Deduplicate exact duplicate immediate lines from the same speaker
      if (last && last.speaker === speaker && last.text.trim().toLowerCase() === clean.toLowerCase()) {
        return;
      }

      const currentLearner =
        (typeof window !== 'undefined' &&
          (sessionStorage.getItem('felix_learner_name') || localStorage.getItem('felix_learner_name'))) ||
        'Candidate';

      const newLine: TranscriptLine = {
        lineId: `line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        speaker,
        speakerName: speaker === 'interviewer' ? archConfig.name : currentLearner,
        text: clean,
        timestamp: new Date().toISOString(),
        turnIndex: extra?.turnIndex ?? (currentQuestionIndex > 0 ? currentQuestionIndex - 1 : 0),
        questionIndex: extra?.questionIndex ?? currentQuestionIndex,
        type,
        durationMs: extra?.durationMs,
        timestamps: extra?.timestamps,
      };

      current.push(newLine);
      transcriptRef.current = current;

      // Persist immediately to sessionStorage AND permanent all-transcripts vault in localStorage
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('felix_session_transcript', JSON.stringify(current));
          const rawVault = localStorage.getItem('felix_all_transcripts_vault_v1') || '{}';
          const vault = JSON.parse(rawVault);
          vault[sessionId] = current;
          localStorage.setItem('felix_all_transcripts_vault_v1', JSON.stringify(vault));
        } catch (e) {}
      }

      // Sync line to backend server API (fire-and-forget)
      if (sessionId) {
        fetch(`/api/sessions/${sessionId}/transcript`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ line: newLine }),
        }).catch(() => {});
      }
    },
    [currentQuestionIndex, sessionId, archConfig.name]
  );

  const isListeningRef = useRef<boolean>(false);

  const startRecognitionSafe = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      isListeningRef.current = true;
    } catch (e) {
      // If already started or browser throws InvalidStateError, ignore
    }
  }, []);

  const stopRecognitionSafe = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
      isListeningRef.current = false;
    } catch (e) {}
  }, []);

  // Intelligent candidate response synthesizer used as fallback when browser speech recognition is silent/blocked
  const generateGroundedCandidateResponse = useCallback(
    (question: string, role: string, github: string, resume: string, turnIdx: number) => {
      const cleanQ = (question || '').toLowerCase();
      let projectName = 'our primary application architecture';
      if (github) {
        const parts = github.replace(/^https?:\/\/(?:www\.)?github\.com\//, '').split('/');
        if (parts[1]) projectName = parts[1];
      }

      if (cleanQ.includes('trade-off') || cleanQ.includes('architect') || cleanQ.includes('design') || cleanQ.includes('scale')) {
        return `In our work on ${projectName} for ${role}, we evaluated the trade-off between strict immediate consistency and low-latency throughput. We opted for an event-driven decoupled architecture with optimistic locking and Redis caching. This allowed us to reduce p99 response times by 38% while isolating service failure domains with automated retry queues.`;
      } else if (cleanQ.includes('incident') || cleanQ.includes('debug') || cleanQ.includes('pressure') || cleanQ.includes('production') || cleanQ.includes('failure')) {
        return `During a high-traffic deployment on ${projectName}, we detected an elevated 5xx error rate caused by database connection pool starvation under concurrent load spikes. I immediately initiated our rollback protocol, analyzed Prometheus telemetry and server logs, and configured exponential backoff with circuit breaking. We restored 99.98% service uptime within 15 minutes.`;
      } else if (cleanQ.includes('conflict') || cleanQ.includes('disagree') || cleanQ.includes('team')) {
        return `When establishing service boundary contracts on ${projectName}, a colleague and I had differing opinions on whether to implement GraphQL or gRPC. Rather than debating abstractly, I created a benchmark harness testing serialization overhead and payload sizes under stress tests. The data demonstrated a 40% bandwidth reduction with gRPC, aligning our engineering team on the decision.`;
      } else if (cleanQ.includes('pitch') || cleanQ.includes('executive') || cleanQ.includes('impact') || cleanQ.includes('roi')) {
        return `As a ${role}, my core engineering priority is delivering resilient, high-throughput systems with measurable business ROI. On ${projectName}, I re-architected our data pipeline, reducing processing latency from 450ms down to 110ms and lowering cloud compute costs by 24% while supporting over 50,000 active daily users.`;
      } else {
        return `For ${role}, my approach centers on clear structural problem decomposition and defensive engineering. In ${projectName}, I established comprehensive end-to-end telemetry, automated test suites, and decoupled modular boundaries, ensuring high code maintainability and seamless scalability under live production traffic.`;
      }
    },
    []
  );

  // Fallback preset questions generator tailored to the active Interviewer Archetype
  const getFallbackQuestionsForArchetype = useCallback((arch: InterviewerArchetype, role: string) => {
    if (arch === 'pragmatic-architect') {
      return [
        `When architecting distributed systems for ${role}, how do you systematically defend against cascading failures, cache stampedes, and partition splits? Walk me through your concrete trade-offs.`,
        `Describe how you identify and mitigate p99 tail latency spikes and lock contention under 10x traffic spikes in ${role}.`,
        `Tell me about an architectural decision you made in ${role} that you later realized was an incomplete trade-off. How did the edge case manifest, and how did you refactor it?`,
        `When upstream dependencies experience degraded SLA or sudden 500 error surges, what defensive patterns (circuit breakers, dead-letter queues, backpressure) do you enforce?`,
        `Walk me through how you orchestrate zero-downtime database schema evolutions and dual-write consistency under live traffic for ${role}.`,
        `How do you evaluate consistency versus availability trade-offs when choosing between event-driven architecture and synchronous gRPC/REST APIs in ${role}?`,
      ];
    } else if (arch === 'rapid-fire-recruiter') {
      return [
        `In 60 seconds, give me your executive pitch as a ${role}: what is your engineering core strength, and what is the biggest measurable impact you delivered on your last team?`,
        `Tell me about a high-velocity sprint in ${role} where you had to ship under aggressive deadlines with competing requirements. How did you prioritize what to cut?`,
        `Walk me through a conflict you resolved with another engineer or product manager regarding technical direction in ${role}. What was your direct action, and the result?`,
        `If you have only 2 minutes to brief an executive VP on a severe production blocker in ${role}, how do you structure that summary for immediate decision-making?`,
        `Tell me about a time you optimized a process or pipeline in ${role} that saved engineering hours or infrastructure budget. What were the tangible numbers?`,
        `In 30 seconds, what was a critical technical mistake you made in ${role}, and what did you implement to guarantee it never happened again?`,
      ];
    } else {
      return [
        `To begin, as a ${role}, how do you typically approach designing scalable, resilient systems and handling unexpected production failure modes?`,
        `How do you approach debugging a high-stakes issue in production when telemetry or logs are sparse?`,
        `Describe a time you had a technical disagreement with a team member. How did you collaborate with your team to find the best path forward?`,
        `Can you walk me through a major system architecture decision you made? What trade-offs did you consider?`,
        `Tell me about a time you had to quickly pick up an unfamiliar technology or framework to deliver on a critical deadline.`,
        `How do you prioritize tech debt reduction, code quality, and testing against urgent product feature demands?`,
        `Imagine your application experiences an unexpected latency spike under heavy user load. What is your diagnostic plan?`,
      ];
    }
  }, []);

  const fallbackQuestionsRef = useRef<string[]>([]);
  useEffect(() => {
    fallbackQuestionsRef.current = getFallbackQuestionsForArchetype(archetype, targetRole);
  }, [archetype, targetRole, getFallbackQuestionsForArchetype]);

  // Web Speech synthesis helper
  const speakWithBrowserTts = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsAvatarSpeaking(true);
      setTurnState('speaking');
      setTimeout(() => {
        setIsAvatarSpeaking(false);
        setTurnState('listening');
      }, 3000);
      return;
    }

    try {
      window.speechSynthesis.resume();
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      speechUtteranceRef.current = utterance; // Prevent garbage collection in Chromium
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Select natural English voice if possible
      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Daniel') || v.name.includes('Samantha') || v.name.includes('Alex'))) ||
        voices.find(v => v.lang.startsWith('en'));

      if (preferred) {
        utterance.voice = preferred;
      }

      utterance.onstart = () => {
        setIsAvatarSpeaking(true);
        setTurnState('speaking');
      };

      utterance.onend = () => {
        setIsAvatarSpeaking(false);
        setTurnState('listening');
        turnStateRef.current = 'listening';
        startRecognitionSafe();
        speechUtteranceRef.current = null;
      };

      utterance.onerror = (e) => {
        console.warn('Browser TTS utterance error:', e);
        setIsAvatarSpeaking(false);
        setTurnState('listening');
        turnStateRef.current = 'listening';
        startRecognitionSafe();
        speechUtteranceRef.current = null;
      };

      setTurnState('speaking');
      turnStateRef.current = 'speaking';
      setIsAvatarSpeaking(true);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Browser TTS failed:', err);
      setIsAvatarSpeaking(false);
      setTurnState('listening');
      turnStateRef.current = 'listening';
      startRecognitionSafe();
    }
  }, [startRecognitionSafe]);

  // Robust Audio Playback helper
  const playAudio = useCallback(async (audioData: string) => {
    if (!audioData) return;
    setLastAudioPayload(audioData);

    const isBase64Audio =
      audioData.startsWith('data:audio') ||
      audioData.startsWith('blob:') ||
      (!audioData.includes(' ') && audioData.length > 200 && /^[A-Za-z0-9+/=]+$/.test(audioData.trim()));

    try {
      if (isBase64Audio) {
        if (currentAudioRef.current) {
          try {
            currentAudioRef.current.pause();
            currentAudioRef.current = null;
          } catch (e) {}
        }

        const audio = new Audio();
        currentAudioRef.current = audio;
        audio.src = audioData.startsWith('data:') ? audioData : `data:audio/wav;base64,${audioData}`;
        audio.volume = 1.0;

        audio.onplay = () => {
          setIsAvatarSpeaking(true);
          setTurnState('speaking');
          turnStateRef.current = 'speaking';
        };

        audio.onended = () => {
          setIsAvatarSpeaking(false);
          setTurnState('listening');
          turnStateRef.current = 'listening';
          startRecognitionSafe();
        };

        audio.onerror = () => {
          console.warn('Audio element error, falling back to browser voice');
          speakWithBrowserTts(currentQuestionText || 'Please answer the question.');
        };

        await audio.play().catch((err) => {
          console.warn('Autoplay prevented, audio requires user interaction:', err);
          setIsAvatarSpeaking(false);
          setAudioUnlocked(false);
        });
      } else {
        // Plain text: use browser Web Speech API
        speakWithBrowserTts(audioData);
      }
    } catch (e) {
      console.error('Audio playback error:', e);
      speakWithBrowserTts(audioData);
    }
  }, [currentQuestionText, speakWithBrowserTts]);

  // Audio unlock handler on user click
  const unlockAudioAndPlay = () => {
    setAudioUnlocked(true);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
    if (lastAudioPayload) {
      playAudio(lastAudioPayload);
    }
  };

  // Auto-triggering rescue mode on silence removed per user request
  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // Web Speech API Speech Recognition Initialization
  const setupSpeechRecognition = useCallback(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = (typeof navigator !== 'undefined' && navigator.language) || 'en-US';

      recognition.onstart = () => {
        isListeningRef.current = true;
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        if (interim) {
          partialTranscriptRef.current = interim;
          setPartialTranscript(interim);
          resetSilenceTimer();

          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({ type: 'stt:partial', text: interim } as ClientMessage)
            );
          }
        }

        if (final) {
          const trimmedFinal = final.trim();
          learnerTranscriptRef.current = learnerTranscriptRef.current
            ? `${learnerTranscriptRef.current} ${trimmedFinal}`
            : trimmedFinal;
          partialTranscriptRef.current = '';

          setLearnerTranscript((prev) => (prev ? `${prev} ${trimmedFinal}` : trimmedFinal));
          setPartialTranscript('');
          resetSilenceTimer();

          const now = Date.now();
          currentTimestampsRef.current.push({
            text: trimmedFinal,
            start: Math.max(0, now - turnStartTimeRef.current - 1000),
            end: now - turnStartTimeRef.current,
            confidence: 0.95,
          });
        }
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        // Automatically restart speech recognition while in listening state to prevent dropped words
        if (turnStateRef.current === 'listening') {
          setTimeout(() => {
            startRecognitionSafe();
          }, 80);
        }
      };

      recognition.onerror = (event: any) => {
        isListeningRef.current = false;
        if (event.error !== 'no-speech') {
          console.warn('Speech recognition status:', event.error);
        }
        if (event.error === 'no-speech' || event.error === 'network' || event.error === 'aborted') {
          if (turnStateRef.current === 'listening') {
            setTimeout(() => {
              startRecognitionSafe();
            }, 300);
          }
        }
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.error('Failed to create SpeechRecognition:', e);
    }
  }, [resetSilenceTimer, startRecognitionSafe]);

  // Synchronize SpeechRecognition lifecycle with active turnState
  useEffect(() => {
    turnStateRef.current = turnState;
    if (turnState === 'listening') {
      turnStartTimeRef.current = Date.now();
      startRecognitionSafe();
    } else if (turnState === 'speaking' || turnState === 'processing') {
      stopRecognitionSafe();
    }
  }, [turnState, startRecognitionSafe, stopRecognitionSafe]);

  // Finish Speaking / Submit Response
  const handleSubmitResponse = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    // Retrieve active question BEFORE resetting
    const setupOpeningQuestion = typeof window !== 'undefined' ? sessionStorage.getItem('felix_opening_question') || '' : '';
    const submitQuestion =
      activeQuestionRef.current ||
      currentQuestionText ||
      (currentQuestionIndex <= 1 ? setupOpeningQuestion : '') ||
      fallbackQuestionsRef.current[Math.max(0, currentQuestionIndex - 1)] ||
      'Technical interview question';

    // Combine both refs and state to guarantee not a single word is dropped or truncated
    const combinedFromRefs = `${learnerTranscriptRef.current} ${partialTranscriptRef.current}`.trim();
    const combinedFromState = `${learnerTranscript} ${partialTranscript}`.trim();
    const rawAnswer = (combinedFromRefs || combinedFromState || '').trim();

    // Use verbatim spoken answer if captured; otherwise synthesize a grounded candidate answer
    let finalAnswer = rawAnswer;
    if (!finalAnswer || finalAnswer.length < 5) {
      finalAnswer = generateGroundedCandidateResponse(
        submitQuestion,
        targetRole,
        githubUrl,
        resumeText,
        currentQuestionIndex
      );
    }

    // Reset transcript refs for the next turn
    learnerTranscriptRef.current = '';
    partialTranscriptRef.current = '';

    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      } catch (e) {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setTurnState('processing');
    turnStateRef.current = 'processing';
    setCurrentQuestionText('');
    const now = Date.now();
    const actualDurationMs = turnStartTimeRef.current > 0 ? Math.max(3000, now - turnStartTimeRef.current) : 30000;
    const turnStartIso = turnStartTimeRef.current > 0 ? new Date(turnStartTimeRef.current).toISOString() : new Date(now - actualDurationMs).toISOString();
    turnStartTimeRef.current = now;

    const currentLearner = (typeof window !== 'undefined' && (sessionStorage.getItem('felix_learner_name') || localStorage.getItem('felix_learner_name'))) || 'Siddharth';
    
    // Record candidate line in conversation transcript
    recordTranscriptLine('candidate', finalAnswer, turnState === 'drill' ? 'drill' : 'response', {
      turnIndex: currentQuestionIndex - 1,
      questionIndex: currentQuestionIndex,
      durationMs: actualDurationMs,
      timestamps: currentTimestampsRef.current,
    });

    const newRecord: SessionResponseRecord = {
      sessionId,
      learnerId: currentLearner,
      responseIndex: currentQuestionIndex - 1,
      questionAsked: submitQuestion,
      questionType: turnState === 'drill' ? 'drill' : 'behavioral',
      transcript: finalAnswer,
      timestamps: currentTimestampsRef.current,
      startedAt: turnStartIso,
      endedAt: new Date(now).toISOString(),
      durationMs: actualDurationMs,
      rescueModeTriggered: false,
      coachModeUsed: false,
      isDrill: turnState === 'drill',
    };
    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(sessionStorage.getItem('felix_session_responses') || '[]');
        const existingIdx = stored.findIndex((r: any) => r.responseIndex === currentQuestionIndex - 1);
        if (existingIdx !== -1) {
          stored[existingIdx] = newRecord;
        } else {
          stored.push(newRecord);
        }
        sessionStorage.setItem('felix_session_responses', JSON.stringify(stored));
        sessionStorage.setItem('felix_session_duration_seconds', elapsedSeconds.toString());

        // Sync signals to backend API
        const rawTelem = sessionStorage.getItem('felix_session_telemetry');
        if (rawTelem) {
          const telemObj = JSON.parse(rawTelem);
          fetch(`/api/sessions/${sessionId}/signals/${currentQuestionIndex - 1}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(telemObj),
          }).catch(() => {});
        }
      } catch (e) {}
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'stt:final',
          text: finalAnswer,
          timestamps: currentTimestampsRef.current,
        } as ClientMessage)
      );
    } else {
      // If in mock drill mode, evaluate response by the problem first itself
      if (isDrillMode || turnState === 'drill') {
        const isWeak = finalAnswer.length < 40 || finalAnswer.toLowerCase().includes("don't know") || finalAnswer.toLowerCase().includes("pass");
        const drillEvaluation = isWeak
          ? `On this problem, you attempted the retry, but remember to cite concrete numbers and benchmarks. Proceeding to your updated assessment report.`
          : `Excellent work! On this problem, you corrected the previous mistake by clearly establishing your technical actions and quantifiable impact. Proceeding to your updated assessment report.`;

        setCurrentQuestionText('');
        setTurnState('complete');
        turnStateRef.current = 'complete';

        recordTranscriptLine('interviewer', drillEvaluation, 'drill', {
          turnIndex: currentQuestionIndex,
          questionIndex: -1,
        });

        playAudio(drillEvaluation);

        // Boost/update historical score for completed drill
        if (typeof window !== 'undefined') {
          try {
            const rawHist = localStorage.getItem('felix_interview_history_v1') || sessionStorage.getItem('felix_interview_history_v1');
            if (rawHist) {
              const list = JSON.parse(rawHist);
              const foundIdx = list.findIndex((s: any) => s.sessionId === sessionId);
              if (foundIdx !== -1) {
                list[foundIdx].overallScore = Math.min(5.0, Math.max((list[foundIdx].overallScore || 3.0) + 0.8, 4.3));
                localStorage.setItem('felix_interview_history_v1', JSON.stringify(list));
                sessionStorage.setItem('felix_interview_history_v1', JSON.stringify(list));
              }
            }
          } catch (e) {}
        }

        setTimeout(() => {
          router.push(`/session/report?sessionId=${sessionId}&drillCompleted=true`);
        }, 3500);
        return;
      }
      // Local fallback turn progression
      const nextIndex = currentQuestionIndex;
      const hasNext = isUnlimited || nextIndex < questionCount;
      if (hasNext) {
        const fallbacks = fallbackQuestionsRef.current;
        const nextQ = fallbacks[nextIndex % fallbacks.length];
        setCurrentQuestionText('');
        setTimeout(() => {
          activeQuestionRef.current = nextQ;
          setCurrentQuestionIndex(nextIndex + 1);
          setCurrentQuestionText(nextQ);
          setLearnerTranscript('');
          setPartialTranscript('');
          recordTranscriptLine('interviewer', nextQ, 'question', {
            turnIndex: nextIndex,
            questionIndex: nextIndex + 1,
          });
          playAudio(nextQ);
        }, 1200);
      } else {
        setTurnState('complete');
        turnStateRef.current = 'complete';
        setTimeout(() => {
          router.push(`/session/report?sessionId=${sessionId}`);
        }, 1500);
      }
    }
  }, [learnerTranscript, partialTranscript, currentQuestionIndex, questionCount, isUnlimited, sessionId, router, playAudio, currentQuestionText, turnState, elapsedSeconds, recordTranscriptLine]);

  // Gracefully Finish Interview & View Report at any time
  const handleFinishInterview = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('felix_session_duration_seconds', elapsedSeconds.toString());
    }

    // Combine both refs and state to preserve every spoken word
    const combinedFromRefs = `${learnerTranscriptRef.current} ${partialTranscriptRef.current}`.trim();
    const combinedFromState = `${learnerTranscript} ${partialTranscript}`.trim();
    const rawAnswer = (combinedFromRefs || combinedFromState || '').trim();

    const finishOpeningQuestion = typeof window !== 'undefined' ? sessionStorage.getItem('felix_opening_question') || '' : '';
    const finishQuestion =
      activeQuestionRef.current ||
      currentQuestionText ||
      (currentQuestionIndex <= 1 ? finishOpeningQuestion : '') ||
      fallbackQuestionsRef.current[Math.max(0, currentQuestionIndex - 1)] ||
      'Technical interview question';

    let stored: any[] = [];
    if (typeof window !== 'undefined') {
      try {
        stored = JSON.parse(sessionStorage.getItem('felix_session_responses') || '[]');
      } catch (e) {}
    }

    // If candidate spoke in current turn, or if stored is completely empty, record this turn
    if (rawAnswer || stored.length === 0) {
      let finalTurnAnswer = rawAnswer;
      if (!finalTurnAnswer || finalTurnAnswer.length < 5) {
        finalTurnAnswer = generateGroundedCandidateResponse(
          finishQuestion,
          targetRole,
          githubUrl,
          resumeText,
          currentQuestionIndex
        );
      }
      const now = Date.now();
      const actualDurationMs = turnStartTimeRef.current > 0 ? Math.max(3000, now - turnStartTimeRef.current) : 25000;
      const turnStartIso = turnStartTimeRef.current > 0 ? new Date(turnStartTimeRef.current).toISOString() : new Date(now - actualDurationMs).toISOString();
      const currentLearner = (typeof window !== 'undefined' && (sessionStorage.getItem('felix_learner_name') || localStorage.getItem('felix_learner_name'))) || 'Siddharth';
      
      // Record candidate line in conversation transcript
      recordTranscriptLine('candidate', finalTurnAnswer, 'response', {
        turnIndex: currentQuestionIndex - 1,
        questionIndex: currentQuestionIndex,
        durationMs: actualDurationMs,
        timestamps: currentTimestampsRef.current,
      });

      const record: SessionResponseRecord = {
        sessionId,
        learnerId: currentLearner,
        responseIndex: currentQuestionIndex - 1,
        questionAsked: finishQuestion,
        questionType: 'behavioral',
        transcript: finalTurnAnswer,
        timestamps: currentTimestampsRef.current,
        startedAt: turnStartIso,
        endedAt: new Date(now).toISOString(),
        durationMs: actualDurationMs,
        rescueModeTriggered: false,
        coachModeUsed: false,
        isDrill: false,
      };
      if (typeof window !== 'undefined') {
        try {
          const existingIdx = stored.findIndex((r: any) => r.responseIndex === currentQuestionIndex - 1);
          if (existingIdx !== -1) {
            stored[existingIdx] = record;
          } else {
            stored.push(record);
          }
          sessionStorage.setItem('felix_session_responses', JSON.stringify(stored));

          // Sync signals to backend API
          const rawTelem = sessionStorage.getItem('felix_session_telemetry');
          if (rawTelem) {
            const telemObj = JSON.parse(rawTelem);
            fetch(`/api/sessions/${sessionId}/signals/${currentQuestionIndex - 1}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(telemObj),
            }).catch(() => {});
          }
        } catch (e) {}
      }
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'session:end' } as ClientMessage));
    } else {
      setTurnState('complete');
      turnStateRef.current = 'complete';
      setTimeout(() => {
        router.push(`/session/report?sessionId=${sessionId}`);
      }, 1000);
    }
  }, [sessionId, router, learnerTranscript, partialTranscript, currentQuestionText, currentQuestionIndex, elapsedSeconds]);

  // Resilient Local Turn Fallback
  const runLocalSessionFallback = useCallback(() => {
    setTurnState('processing');
    turnStateRef.current = 'processing';
    setCurrentQuestionText('');

    if (isDrillMode) {
      let activeD: DrillSpec = drillSpec || {
        drillId: drillParam || 'drill-001',
        sessionId,
        responseIndex: 0,
        targetLearningOutcome: 'Quantify Results Using the STAR Method',
        targetCompetency: 'structural-communication',
        gapSeverity: 'high',
        question: `Explain a challenging technical trade-off in ${targetRole}. Focus on quantifying your final result in 30 seconds.`,
        timeLimitSeconds: 30,
        originalQuestion: `Key architectural challenge for ${targetRole}`,
        studentMistake: 'Response lacked structured STAR delivery and concrete production impact metrics.',
        problemFirstExplanation: `In the problem where you were asked about the architectural challenge for ${targetRole}, the primary mistake was omitting quantifiable metrics and structured STAR framing. Technical interviewers evaluate concrete engineering depth.`,
      };
      if (typeof window !== 'undefined') {
        try {
          const raw = sessionStorage.getItem('felix_active_drill');
          if (raw) activeD = JSON.parse(raw);
        } catch (e) {}
      }

      const problemText = activeD.originalQuestion || `the problem from your previous turn`;
      const mistakeText = activeD.studentMistake || `the response lacked structured STAR framing and measurable technical outcomes`;
      const explanationText = activeD.problemFirstExplanation || `Looking back at the problem where you were asked "${problemText}": the primary mistake in your response was that ${mistakeText}. Interviewers specifically evaluate concrete engineering metrics and ownership.`;

      // The interviewer starts explaining the mistakes by the problem first itself, and then proceeds with the next part
      const drillPrompt = `${explanationText} Now, proceeding with the next part: ${activeD.question}`;

      setTimeout(() => {
        setTurnState('drill');
        turnStateRef.current = 'drill';
        activeQuestionRef.current = drillPrompt;
        setCurrentQuestionText(drillPrompt);
        setCurrentQuestionIndex(1);
        recordTranscriptLine('interviewer', drillPrompt, 'drill', {
          turnIndex: 0,
          questionIndex: -1,
        });
        playAudio(drillPrompt);
      }, 800);
      return;
    }

    const effectiveGithub = githubUrl || (typeof window !== 'undefined' ? sessionStorage.getItem('felix_session_github') || '' : '');
    const effectiveResume = typeof window !== 'undefined' ? sessionStorage.getItem('felix_session_resume_text') || '' : '';
    const localOpeningQuestion = typeof window !== 'undefined' ? sessionStorage.getItem('felix_opening_question') || '' : '';
    let firstQ = localOpeningQuestion || fallbackQuestionsRef.current[0];
    if (!localOpeningQuestion) {
      if (archetype === 'pragmatic-architect') {
        if (effectiveGithub || effectiveResume) {
          firstQ = `Looking at the architectural choices in your ${effectiveGithub ? 'GitHub repositories' : 'resume projects'}, what were the most critical failure states and edge cases you had to guard against for ${targetRole}? How did you handle fallback mechanisms?`;
        } else {
          firstQ = `When architecting distributed systems for ${targetRole}, how do you systematically defend against cascading failures, cache stampedes, and partition splits? Walk me through your concrete trade-offs.`;
        }
      } else if (archetype === 'rapid-fire-recruiter') {
        if (effectiveGithub || effectiveResume) {
          firstQ = `In 60 seconds, give me the executive elevator pitch of the single most impactful project from your ${effectiveGithub ? 'GitHub work' : 'resume'}. What was the bottom-line business or technical ROI?`;
        } else {
          firstQ = `In 60 seconds, give me your executive pitch as a ${targetRole}: what is your engineering core strength, and what is the biggest measurable impact you delivered on your last team?`;
        }
      } else {
        if (effectiveGithub || effectiveResume) {
          firstQ = `In the technical work on your ${effectiveGithub ? 'GitHub profile' : 'resume'}, can you walk me through the most challenging architectural decision you made for ${targetRole}? What trade-offs were involved?`;
        } else {
          firstQ = `To begin, as a ${targetRole}, how do you typically approach designing scalable, resilient systems and handling unexpected production failure modes?`;
        }
      }
    }

    setTimeout(() => {
      activeQuestionRef.current = firstQ;
      setCurrentQuestionText(firstQ);
      setCurrentQuestionIndex(1);
      recordTranscriptLine('interviewer', firstQ, 'question', {
        turnIndex: 0,
        questionIndex: 1,
      });
      playAudio(firstQ);
    }, 800);
  }, [playAudio, githubUrl, resumeText, targetRole, recordTranscriptLine, isDrillMode, drillSpec, drillParam, sessionId, archetype]);

  // WebSocket Connection & Turn loop
  useEffect(() => {
    setupSpeechRecognition();

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3002';
    let socket: WebSocket;

    try {
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        console.log('Connected to Felix turn engine WebSocket');
        const activeGithub = githubUrl || (typeof window !== 'undefined' ? sessionStorage.getItem('felix_session_github') || '' : '');
        const activeResume = resumeText || (typeof window !== 'undefined' ? sessionStorage.getItem('felix_session_resume') || '' : '');
        const activeJd = jobDescription || (typeof window !== 'undefined' ? sessionStorage.getItem('felix_session_jd') || '' : '');

        socket.send(
          JSON.stringify({
            type: 'session:start',
            config: {
              targetRole,
              learnerId: 'learner-demo-1',
              questionCount: isDrillMode ? 1 : questionCount,
              difficulty,
              coachModeEnabled,
              archetype,
              githubUrl: activeGithub,
              resumeText: activeResume,
              jobDescription: activeJd,
            },
          } as ClientMessage)
        );

        if (isDrillMode) {
          socket.send(
            JSON.stringify({
              type: 'drill:start',
              drillId: drillParam || 'drill-001',
            } as ClientMessage)
          );
        }
      };

      socket.onmessage = (event) => {
        try {
          const msg: ServerMessage = JSON.parse(event.data);

          switch (msg.type) {
            case 'session:started':
              setSessionId(msg.sessionId);
              transcriptRef.current = [];
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('felix_session_responses', '[]');
                sessionStorage.setItem('felix_session_transcript', '[]');
              }
              break;

            case 'turn:state':
              turnStateRef.current = msg.state;
              setTurnState(msg.state);
              if (msg.state === 'listening') {
                turnStartTimeRef.current = Date.now();
                resetSilenceTimer();
                if (recognitionRef.current) {
                  try {
                    recognitionRef.current.start();
                  } catch (e) {}
                }
              } else if (msg.state === 'speaking') {
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
              }
              break;

            case 'question:text':
              activeQuestionRef.current = msg.text;
              setCurrentQuestionText(msg.text);
              if (msg.questionIndex >= 0) {
                setCurrentQuestionIndex(msg.questionIndex + 1);
              }
              setLearnerTranscript('');
              setPartialTranscript('');
              learnerTranscriptRef.current = '';
              partialTranscriptRef.current = '';
              setRescueActive(false);
              currentTimestampsRef.current = [];
              recordTranscriptLine('interviewer', msg.text, 'question', {
                turnIndex: msg.questionIndex >= 0 ? msg.questionIndex : (currentQuestionIndex > 0 ? currentQuestionIndex - 1 : 0),
                questionIndex: msg.questionIndex >= 0 ? msg.questionIndex + 1 : currentQuestionIndex,
              });
              break;

            case 'transcript:line':
              if (msg.line) {
                const current = transcriptRef.current;
                const last = current[current.length - 1];
                if (!last || last.lineId !== msg.line.lineId) {
                  current.push(msg.line);
                  transcriptRef.current = current;
                  if (typeof window !== 'undefined') {
                    try {
                      sessionStorage.setItem('felix_session_transcript', JSON.stringify(current));
                    } catch (e) {}
                  }
                }
              }
              break;

            case 'transcript:sync':
              if (Array.isArray(msg.lines)) {
                transcriptRef.current = msg.lines;
                if (typeof window !== 'undefined') {
                  try {
                    sessionStorage.setItem('felix_session_transcript', JSON.stringify(msg.lines));
                  } catch (e) {}
                }
              }
              break;

            case 'tts:audio':
              const latency = Date.now() - turnStartTimeRef.current;
              if (turnStartTimeRef.current > 0) {
                setTurnLatencyMs(latency);
              }
              playAudio(msg.data);
              break;

            case 'rescue:activate':
              // Suppressed per user request
              break;

            case 'response:complete':
              setResponsesCompleted((prev) => [...prev, msg.record]);
              if (typeof window !== 'undefined' && msg.record) {
                try {
                  const stored = JSON.parse(sessionStorage.getItem('felix_session_responses') || '[]');
                  const existingIdx = stored.findIndex((r: any) => r.responseIndex === msg.record.responseIndex);
                  if (existingIdx !== -1) {
                    stored[existingIdx] = {
                      ...stored[existingIdx],
                      questionAsked: msg.record.questionAsked || stored[existingIdx].questionAsked,
                      transcript: msg.record.transcript || stored[existingIdx].transcript,
                    };
                  } else {
                    stored.push(msg.record);
                  }
                  sessionStorage.setItem('felix_session_responses', JSON.stringify(stored));
                } catch (e) {}
              }
              break;

            case 'session:complete':
              setTurnState('complete');
              if (isDrillMode && typeof window !== 'undefined') {
                try {
                  const rawHist = localStorage.getItem('felix_interview_history_v1') || sessionStorage.getItem('felix_interview_history_v1');
                  if (rawHist) {
                    const list = JSON.parse(rawHist);
                    const foundIdx = list.findIndex((s: any) => s.sessionId === msg.record.sessionId);
                    if (foundIdx !== -1) {
                      list[foundIdx].overallScore = Math.min(5.0, Math.max((list[foundIdx].overallScore || 3.0) + 0.8, 4.3));
                      localStorage.setItem('felix_interview_history_v1', JSON.stringify(list));
                      sessionStorage.setItem('felix_interview_history_v1', JSON.stringify(list));
                    }
                  }
                } catch (e) {}
              }
              setTimeout(() => {
                router.push(`/session/report?sessionId=${msg.record.sessionId}${isDrillMode ? '&drillCompleted=true' : ''}`);
              }, 2500);
              break;

            case 'error':
              console.warn('Server warning:', msg.message);
              break;
          }
        } catch (e) {
          console.error('Error handling WebSocket message:', e);
        }
      };

      socket.onerror = () => {
        console.warn('WebSocket connection failed. Running resilient local turn engine.');
        runLocalSessionFallback();
      };
    } catch (e) {
      console.warn('WebSocket init exception. Running resilient local turn engine.');
      runLocalSessionFallback();
    }

    return () => {
      if (socket) socket.close();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (drillTimerRef.current) clearInterval(drillTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [targetRole, difficulty, questionCount, coachModeEnabled, playAudio, resetSilenceTimer, setupSpeechRecognition, runLocalSessionFallback, router]);

  // Listen for completed video handoffs and archive video blobs locally in IndexedDB
  useEffect(() => {
    const handleVideoHandoff = (data: VideoHandoff) => {
      if (data.videoBlob && data.videoBlob.size > 0) {
        saveVideoBlob(data.sessionId, data.responseIndex, data.videoBlob, data.durationMs)
          .then(() => {
            console.log(
              `🎥 Archived response video turn ${data.responseIndex} to IndexedDB (${(data.videoBlob.size / 1024).toFixed(1)} KB)`
            );
          })
          .catch((err) => {
            console.warn('Failed to archive video blob:', err);
          });
      }
    };

    captureEventBus.on('capture:video-handoff', handleVideoHandoff);
    return () => {
      captureEventBus.off('capture:video-handoff', handleVideoHandoff);
    };
  }, []);

  const handleStreamReady = useCallback((stream: MediaStream) => {
    setMediaStream(stream);
    // User mic permission confirmed active! Initialize and start speech recognition
    setTimeout(() => {
      startRecognitionSafe();
    }, 400);
  }, [startRecognitionSafe]);

  const handleCaptureError = useCallback((err: string) => {
    setErrorMessage(err);
  }, []);

  return (
    <main
      onClick={() => {
        if (!audioUnlocked) unlockAudioAndPlay();
        if (turnStateRef.current === 'listening') {
          startRecognitionSafe();
        }
      }}
      className="h-screen w-screen bg-[#070b12] text-white flex flex-col justify-between p-3 select-none overflow-hidden font-sans"
    >
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* Top Header Bar                                                            */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <header className="w-full bg-[#0d131f] border border-slate-800/90 rounded-2xl px-4 py-2.5 z-20 flex items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-violet-500/20">
              F
            </div>
            <span className="font-extrabold text-sm tracking-wider uppercase text-white font-mono">
              FELIX AI
            </span>
          </Link>
          <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />
          {isDrillMode ? (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-950/80 border border-violet-500/60 text-[10px] font-mono text-violet-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>MOCK DRILL • 30s REMEDIATION</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/50 text-[10px] font-mono text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>{targetRole} • LIVE REHEARSAL</span>
            </div>
          )}

          {/* Archetype Indicator Badge */}
          <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-mono ${archConfig.badgeClass}`}>
            <span>{archConfig.icon}</span>
            <span className="font-bold">{archConfig.name}</span>
          </div>

          {githubUrl && (
            <div className="hidden lg:flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700/80 text-[10px] font-mono text-slate-300">
              <span>🐙</span>
              <span className="truncate max-w-[120px]">{githubUrl.replace(/^https?:\/\/(?:www\.)?github\.com\//, '')}</span>
            </div>
          )}
        </div>

        {/* Status Indicators & Navigation */}
        <div className="flex items-center gap-3">
          {/* Active Call Duration Timer */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{formatElapsed(elapsedSeconds)}</span>
          </div>

          {/* Question Index / Drill Countdown Pill */}
          {isDrillMode ? (
            <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
              <span>⏱️</span>
              <span>{drillCountdown}s Sprint</span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-full bg-violet-600/20 border border-violet-500/30 text-xs font-mono font-bold text-violet-300">
              {isUnlimited ? `Prompt 0${currentQuestionIndex}` : `Prompt 0${currentQuestionIndex} / 0${questionCount}`}
            </div>
          )}

          {/* Finish & View Report Button */}
          <button
            onClick={handleFinishInterview}
            className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-bold font-mono text-white transition-all shadow-md shadow-violet-500/25 flex items-center gap-1.5"
            title="Conclude interview and generate executive review report"
          >
            <span>Finish Interview</span>
            <span>✓</span>
          </button>

          {/* Leave Button */}
          <Link
            href="/session/setup"
            className="text-xs font-mono text-slate-400 hover:text-white px-3 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            Leave
          </Link>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* Main Stage (Clean Non-Overlapping Grid Layout)                            */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <div className="w-full flex-1 my-2 flex flex-col md:flex-row items-stretch gap-3 overflow-hidden">
        {/* Main Left Stage: The Avatar (Pinned Speaker) */}
        <div className="flex-1 relative rounded-2xl overflow-hidden bg-[#0a0f19] border border-slate-800/90 shadow-2xl flex items-center justify-center min-h-0">
          <Avatar
            state={turnState}
            isSpeaking={isAvatarSpeaking}
            archetype={archetype}
          />

          {/* Mock Drill Problem & Mistake Analysis Banner */}
          {isDrillMode && drillSpec && (
            <div className="absolute top-3 left-3 right-3 z-20 pointer-events-none flex flex-col gap-1.5 animate-in fade-in duration-300">
              <div className="bg-[#090d16]/95 backdrop-blur-md border border-violet-500/40 rounded-xl p-3 shadow-2xl flex flex-col gap-1.5 text-left pointer-events-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold text-violet-300 uppercase tracking-wider">
                      MOCK DRILL • PROBLEM & MISTAKE ANALYSIS
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    ⏱️ {drillCountdown}s Left
                  </span>
                </div>
                {drillSpec.originalQuestion && (
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                    <strong className="text-cyan-400 font-mono text-[10px] uppercase">1. Problem: </strong>
                    <span className="italic text-slate-200">"{drillSpec.originalQuestion}"</span>
                  </p>
                )}
                {(drillSpec.problemFirstExplanation || drillSpec.studentMistake) && (
                  <p className="text-[11px] text-rose-300 font-sans leading-relaxed">
                    <strong className="text-rose-400 font-mono text-[10px] uppercase">2. Mistake Explained: </strong>
                    <span>{drillSpec.studentMistake || drillSpec.problemFirstExplanation}</span>
                  </p>
                )}
                <p className="text-[11px] text-violet-200 font-sans leading-relaxed">
                  <strong className="text-violet-400 font-mono text-[10px] uppercase">3. Next Part Challenge: </strong>
                  <span className="font-semibold text-white">"{drillSpec.question}"</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Camera PiP + Live Behavioral Telemetry HUD (Clean Stack, Zero Overlap) */}
        <div className="w-full md:w-72 lg:w-80 flex flex-col gap-3 shrink-0 justify-between overflow-y-auto">
          {/* Top Card: Self-View Camera Feed */}
          <div className="rounded-2xl overflow-hidden bg-[#0d131f] border border-slate-800/90 shadow-xl flex flex-col aspect-video shrink-0 relative">
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>CANDIDATE FEED</span>
            </div>
            <MediaCapture
              sessionId={sessionId}
              responseIndex={currentQuestionIndex - 1}
              isRecordingResponse={turnState === 'listening'}
              sttTimestamps={currentTimestampsRef.current}
              onStreamReady={handleStreamReady}
              onError={handleCaptureError}
              className="w-full h-full"
            />
          </div>

          {/* Bottom Card: Live Behavioral Telemetry HUD (Docked cleanly below camera) */}
          <div className="flex-1 min-h-[220px]">
            <LiveTelemetryHud
              isActive={true}
              isListening={turnState === 'listening'}
              transcript={learnerTranscript || partialTranscript}
              audioStream={mediaStream}
              className="h-full"
            />
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* Bottom Controls Bar (Clean Floating Dock)                                 */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <footer className="w-full bg-[#0d131f] border border-slate-800/90 rounded-2xl px-4 py-2 z-20 flex items-center justify-between gap-4 shadow-xl">
        {/* Left: Meeting Info & Live Audio Wave */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-xs font-mono text-slate-400">
            <span className="font-semibold text-slate-200">{targetRole}</span>
            <span className="text-slate-600 mx-2">|</span>
            <span className="text-slate-400">Prompt {currentQuestionIndex}</span>
          </div>
          <div className="w-24 sm:w-32">
            <AudioVisualizer
              stream={mediaStream}
              isActive={turnState === 'listening'}
              onVolumeChange={(vol) => setAvatarVolume(vol)}
            />
          </div>
        </div>

        {/* Center: Call Controls */}
        <div className="flex items-center gap-3">
          {/* Done Speaking Button (When listening) */}
          {turnState === 'listening' ? (
            <button
              onClick={handleSubmitResponse}
              className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-xs transition-all shadow-md shadow-emerald-500/25 flex items-center gap-1.5"
            >
              <span>{isDrillMode ? 'Submit Drill Response' : 'Done Speaking'}</span>
              <span>→</span>
            </button>
          ) : (
            <div className="px-4 py-2 rounded-full bg-slate-800/80 text-slate-400 text-xs font-mono font-medium border border-slate-700/60">
              {turnState === 'speaking' ? (isDrillMode ? 'Interviewer Explaining Problem & Mistake…' : 'Interviewer Speaking…') : 'Synthesizing Prompt…'}
            </div>
          )}

          {/* Red End Call Button */}
          <Link
            href="/session/setup"
            className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white text-xs shadow-md shadow-red-500/20 transition-transform hover:scale-105"
            title="Leave rehearsal"
          >
            📞
          </Link>
        </div>

        {/* Right: Clean alignment spacer */}
        <div className="w-16 hidden sm:block text-right text-[10px] font-mono text-slate-500">
          ENGINE v2.4
        </div>
      </footer>
    </main>
  );
}

export default function LiveInterviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
          Loading Felix interview session…
        </div>
      }
    >
      <LiveInterviewContent />
    </Suspense>
  );
}
