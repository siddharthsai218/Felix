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
import type {
  TurnState,
  ServerMessage,
  ClientMessage,
  SessionResponseRecord,
  SessionRecord,
  DrillSpec,
  SttWordTimestamp,
} from '../../lib/types';

function LiveInterviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Session Config from URL
  const targetRole = searchParams.get('role') || 'Software Engineer';
  const difficulty = (searchParams.get('difficulty') as any) || 'intermediate';
  const questionCount = parseInt(searchParams.get('questions') || '0', 10);
  const isUnlimited = questionCount <= 0;
  const coachModeEnabled = searchParams.get('coach') !== 'false';

  const rawGithubParam = searchParams.get('github') || '';
  const initialGithub = rawGithubParam ? decodeURIComponent(rawGithubParam) : '';

  // State
  const [githubUrl, setGithubUrl] = useState<string>(initialGithub);
  const [resumeText, setResumeText] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');

  // Load saved context from sessionStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedGithub = sessionStorage.getItem('felix_session_github') || '';
      const storedResume = sessionStorage.getItem('felix_session_resume') || '';
      const storedJd = sessionStorage.getItem('felix_session_jd') || '';
      if (!githubUrl && storedGithub) setGithubUrl(storedGithub);
      if (storedResume) setResumeText(storedResume);
      if (storedJd) setJobDescription(storedJd);
    }
  }, [githubUrl]);

  const sessionParam = searchParams.get('session');
  const [sessionId, setSessionId] = useState<string>(sessionParam || `felix-${Date.now()}`);
  const [turnState, setTurnState] = useState<TurnState>('idle');
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

  // Fallback preset questions for offline/direct demo resiliency
  const fallbackQuestionsRef = useRef<string[]>([
    `To begin, as a ${targetRole}, how do you typically approach designing scalable, resilient systems and handling unexpected production failure modes?`,
    `How do you approach debugging a high-stakes issue in production when telemetry or logs are sparse?`,
    `Describe a time you had a technical disagreement with a team member. How did you resolve it constructively?`,
    `Can you walk me through a major system architecture decision you made? What trade-offs did you consider?`,
    `Tell me about a time you had to quickly pick up an unfamiliar technology or framework to deliver on a critical deadline.`,
    `How do you prioritize tech debt reduction, code quality, and testing against urgent product feature demands?`,
    `Imagine your application experiences an unexpected latency spike under heavy user load. What is your diagnostic plan?`,
    `Describe a project where you took leadership or proactive initiative to improve the team's developer workflow.`,
    `Tell me about a time you received difficult constructive feedback. How did you process and apply it?`,
    `How would you explain a complex architectural choice or database schema to a non-technical product manager?`,
    `Describe a situation where a release fell behind schedule. How did you communicate and align expectations?`,
    `How do you evaluate and implement security and input validation considerations in your applications?`,
  ]);

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
        speechUtteranceRef.current = null;
      };

      utterance.onerror = (e) => {
        console.warn('Browser TTS utterance error:', e);
        setIsAvatarSpeaking(false);
        setTurnState('listening');
        speechUtteranceRef.current = null;
      };

      setTurnState('speaking');
      setIsAvatarSpeaking(true);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Browser TTS failed:', err);
      setIsAvatarSpeaking(false);
      setTurnState('listening');
    }
  }, []);

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
        };

        audio.onended = () => {
          setIsAvatarSpeaking(false);
          setTurnState('listening');
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
      recognition.lang = 'en-US';

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
          setPartialTranscript(interim);
          resetSilenceTimer();

          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({ type: 'stt:partial', text: interim } as ClientMessage)
            );
          }
        }

        if (final) {
          setLearnerTranscript((prev) => (prev ? `${prev} ${final}` : final));
          setPartialTranscript('');
          resetSilenceTimer();

          const now = Date.now();
          currentTimestampsRef.current.push({
            text: final.trim(),
            start: Math.max(0, now - turnStartTimeRef.current - 1000),
            end: now - turnStartTimeRef.current,
            confidence: 0.95,
          });
        }
      };

      recognition.onend = () => {
        // Automatically restart speech recognition while in listening state to prevent dropped words
        if (turnStateRef.current === 'listening') {
          try {
            recognition.start();
          } catch (e) {
            // Already active or restarting
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('Speech recognition warning:', event.error);
        }
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.error('Failed to create SpeechRecognition:', e);
    }
  }, [resetSilenceTimer]);

  // Finish Speaking / Submit Response
  const handleSubmitResponse = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    const rawAnswer = (learnerTranscript || partialTranscript || '').trim();
    const finalAnswer = rawAnswer || '[No verbal response captured during turn]';

    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      } catch (e) {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Retrieve active question BEFORE resetting
    const currentQ =
      activeQuestionRef.current ||
      currentQuestionText ||
      fallbackQuestionsRef.current[Math.max(0, currentQuestionIndex - 1)] ||
      'Technical interview question';

    setTurnState('processing');
    turnStateRef.current = 'processing';
    setCurrentQuestionText('');
    const now = Date.now();
    const actualDurationMs = turnStartTimeRef.current > 0 ? Math.max(3000, now - turnStartTimeRef.current) : 30000;
    const turnStartIso = turnStartTimeRef.current > 0 ? new Date(turnStartTimeRef.current).toISOString() : new Date(now - actualDurationMs).toISOString();
    turnStartTimeRef.current = now;

    const currentLearner = (typeof window !== 'undefined' && (sessionStorage.getItem('felix_learner_name') || localStorage.getItem('felix_learner_name'))) || 'Siddharth';
    const newRecord: SessionResponseRecord = {
      sessionId,
      learnerId: currentLearner,
      responseIndex: currentQuestionIndex - 1,
      questionAsked: currentQ,
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
        stored.push(newRecord);
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
  }, [learnerTranscript, partialTranscript, currentQuestionIndex, questionCount, isUnlimited, sessionId, router, playAudio, currentQuestionText, turnState, elapsedSeconds]);

  // Gracefully Finish Interview & View Report at any time
  const handleFinishInterview = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('felix_session_duration_seconds', elapsedSeconds.toString());
    }

    // If the learner has spoken in the current turn, preserve it for the report
    const rawAnswer = (learnerTranscript || partialTranscript || '').trim();
    if (rawAnswer) {
      const currentQ =
        activeQuestionRef.current ||
        currentQuestionText ||
        fallbackQuestionsRef.current[Math.max(0, currentQuestionIndex - 1)] ||
        'Technical interview question';
      const now = Date.now();
      const actualDurationMs = turnStartTimeRef.current > 0 ? Math.max(3000, now - turnStartTimeRef.current) : 25000;
      const turnStartIso = turnStartTimeRef.current > 0 ? new Date(turnStartTimeRef.current).toISOString() : new Date(now - actualDurationMs).toISOString();
      const currentLearner = (typeof window !== 'undefined' && (sessionStorage.getItem('felix_learner_name') || localStorage.getItem('felix_learner_name'))) || 'Siddharth';
      const record: SessionResponseRecord = {
        sessionId,
        learnerId: currentLearner,
        responseIndex: currentQuestionIndex - 1,
        questionAsked: currentQ,
        questionType: 'behavioral',
        transcript: rawAnswer,
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
          const stored = JSON.parse(sessionStorage.getItem('felix_session_responses') || '[]');
          stored.push(record);
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
    const effectiveGithub = githubUrl || (typeof window !== 'undefined' ? sessionStorage.getItem('felix_session_github') || '' : '');
    const effectiveResume = resumeText || (typeof window !== 'undefined' ? sessionStorage.getItem('felix_session_resume') || '' : '');

    let firstQ = fallbackQuestionsRef.current[0];
    if (effectiveGithub || effectiveResume) {
      firstQ = `In the technical work on your ${effectiveGithub ? 'GitHub profile' : 'resume'}, can you walk me through the most challenging architectural decision you made for ${targetRole}? What trade-offs were involved?`;
    } else {
      firstQ = `To begin, as a ${targetRole}, how do you typically approach designing scalable, resilient systems and handling unexpected production failure modes?`;
    }

    setTimeout(() => {
      activeQuestionRef.current = firstQ;
      setCurrentQuestionText(firstQ);
      setCurrentQuestionIndex(1);
      playAudio(firstQ);
    }, 800);
  }, [playAudio, githubUrl, resumeText, targetRole]);

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
              questionCount,
              difficulty,
              coachModeEnabled,
              githubUrl: activeGithub,
              resumeText: activeResume,
              jobDescription: activeJd,
            },
          } as ClientMessage)
        );
      };

      socket.onmessage = (event) => {
        try {
          const msg: ServerMessage = JSON.parse(event.data);

          switch (msg.type) {
            case 'session:started':
              setSessionId(msg.sessionId);
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('felix_session_responses', '[]');
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
              setRescueActive(false);
              currentTimestampsRef.current = [];
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
              setTimeout(() => {
                router.push(`/session/report?sessionId=${msg.record.sessionId}`);
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
  }, []);

  const handleCaptureError = useCallback((err: string) => {
    setErrorMessage(err);
  }, []);

  return (
    <main
      onClick={() => {
        if (!audioUnlocked) unlockAudioAndPlay();
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
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/50 text-[10px] font-mono text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>{targetRole} • LIVE REHEARSAL</span>
          </div>
          {githubUrl && (
            <div className="hidden md:flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700/80 text-[10px] font-mono text-slate-300">
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

          {/* Question Index Pill */}
          <div className="px-3 py-1 rounded-full bg-violet-600/20 border border-violet-500/30 text-xs font-mono font-bold text-violet-300">
            {isUnlimited ? `Prompt 0${currentQuestionIndex}` : `Prompt 0${currentQuestionIndex} / 0${questionCount}`}
          </div>

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
          />

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
              <span>Done Speaking</span>
              <span>→</span>
            </button>
          ) : (
            <div className="px-4 py-2 rounded-full bg-slate-800/80 text-slate-400 text-xs font-mono font-medium border border-slate-700/60">
              {turnState === 'speaking' ? 'Interviewer Speaking…' : 'Synthesizing Prompt…'}
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
