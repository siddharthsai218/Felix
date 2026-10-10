'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar } from '../../components/Avatar';
import { MediaCapture } from '../../components/MediaCapture';
import { AudioVisualizer } from '../../components/AudioVisualizer';
import { RescueScaffold } from '../../components/RescueScaffold';
import { CoachPanel } from '../../components/CoachPanel';
import { DrillModal } from '../../components/DrillModal';
import { captureEventBus } from '../../lib/event-bus';
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
  const questionCount = parseInt(searchParams.get('questions') || '3', 10);
  const isUnlimited = questionCount <= 0;
  const coachModeEnabled = searchParams.get('coach') !== 'false';

  // State
  const [sessionId, setSessionId] = useState<string>('local-session');
  const [turnState, setTurnState] = useState<TurnState>('idle');
  const [currentQuestionText, setCurrentQuestionText] = useState<string>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState<boolean>(false);
  const [avatarVolume, setAvatarVolume] = useState<number>(0);
  const [learnerTranscript, setLearnerTranscript] = useState<string>('');
  const [partialTranscript, setPartialTranscript] = useState<string>('');
  const [turnLatencyMs, setTurnLatencyMs] = useState<number>(0);
  const [rescueActive, setRescueActive] = useState<boolean>(false);
  const [rescueMessage, setRescueMessage] = useState<string>('');
  const [coachOpen, setCoachOpen] = useState<boolean>(false);
  const [coachHint, setCoachHint] = useState<string | null>(null);
  const [isCoachLoading, setIsCoachLoading] = useState<boolean>(false);
  const [drillModalOpen, setDrillModalOpen] = useState<boolean>(false);
  const [activeDrill, setActiveDrill] = useState<DrillSpec | null>(null);
  const [drillCountdown, setDrillCountdown] = useState<number>(30);
  const [responsesCompleted, setResponsesCompleted] = useState<SessionResponseRecord[]>([]);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);
  const [lastAudioPayload, setLastAudioPayload] = useState<string>('');

  // References
  const wsRef = useRef<WebSocket | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const turnStartTimeRef = useRef<number>(0);
  const currentTimestampsRef = useRef<SttWordTimestamp[]>([]);
  const drillTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fallback preset questions for offline/direct demo resiliency
  const fallbackQuestionsRef = useRef<string[]>([
    `Tell me about a challenging technical project you worked on recently in ${targetRole}. What was your specific role and what was the outcome?`,
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
      };

      utterance.onend = () => {
        setIsAvatarSpeaking(false);
        setTurnState('listening');
      };

      utterance.onerror = (e) => {
        console.warn('Browser TTS utterance error:', e);
        setIsAvatarSpeaking(false);
        setTurnState('listening');
      };

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
        const audio = new Audio();
        audio.src = audioData.startsWith('data:') ? audioData : `data:audio/wav;base64,${audioData}`;
        audio.volume = 1.0;
        setIsAvatarSpeaking(true);

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

  // Silence Timer for Rescue Mode (P1 Hackathon MVP)
  const triggerRescueMode = useCallback(() => {
    setRescueActive(true);
    setTurnState('rescue');

    const promptFallback = `Take a breath. Think about a specific challenge you faced while working as a ${targetRole}. What was the situation and how did you approach it?`;
    setRescueMessage(promptFallback);
    playAudio(promptFallback);
  }, [targetRole, playAudio]);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    silenceTimerRef.current = setTimeout(() => {
      triggerRescueMode();
    }, 5000);
  }, [triggerRescueMode]);

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

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition warning:', event.error);
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

    const finalAnswer = learnerTranscript || partialTranscript || 'I explained my approach and technical solution.';

    setTurnState('processing');
    turnStartTimeRef.current = Date.now();

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
        setTimeout(() => {
          setCurrentQuestionIndex(nextIndex + 1);
          setCurrentQuestionText(nextQ);
          setLearnerTranscript('');
          setPartialTranscript('');
          setTurnState('speaking');
          playAudio(nextQ);
        }, 1200);
      } else {
        setTurnState('complete');
        setTimeout(() => {
          router.push(`/session/report?sessionId=${sessionId}`);
        }, 1500);
      }
    }
  }, [learnerTranscript, partialTranscript, currentQuestionIndex, questionCount, isUnlimited, sessionId, router, playAudio]);

  // Gracefully Finish Interview & View Report at any time
  const handleFinishInterview = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'session:end' } as ClientMessage));
    } else {
      setTurnState('complete');
      setTimeout(() => {
        router.push(`/session/report?sessionId=${sessionId}`);
      }, 1000);
    }
  }, [sessionId, router]);

  // Resilient Local Turn Fallback
  const runLocalSessionFallback = useCallback(() => {
    setTurnState('processing');
    const firstQ = fallbackQuestionsRef.current[0];
    setTimeout(() => {
      setCurrentQuestionText(firstQ);
      setCurrentQuestionIndex(1);
      setTurnState('speaking');
      playAudio(firstQ);
    }, 800);
  }, [playAudio]);

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
        socket.send(
          JSON.stringify({
            type: 'session:start',
            config: {
              targetRole,
              learnerId: 'learner-demo-1',
              questionCount,
              difficulty,
              coachModeEnabled,
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
              break;

            case 'turn:state':
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
              setRescueActive(true);
              setRescueMessage(msg.message);
              playAudio(msg.message);
              break;

            case 'coach:hint':
              setCoachHint(msg.hint);
              setIsCoachLoading(false);
              break;

            case 'response:complete':
              setResponsesCompleted((prev) => [...prev, msg.record]);
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

  // Coach Mode Hint Request
  const handleRequestCoachHint = () => {
    setCoachOpen(true);
    setIsCoachLoading(true);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'coach:request' } as ClientMessage));
    } else {
      setTimeout(() => {
        setCoachHint(
          `Apply the STAR method:\n• Situation: Outline the project context in 1 sentence.\n• Task: State your specific responsibility.\n• Action: Emphasize the core decision or technical fix YOU implemented.\n• Result: Conclude with a measurable metric or uptime percentage.`
        );
        setIsCoachLoading(false);
      }, 600);
    }
  };

  // Micro-Drill Start
  const handleStartDrill = (drillId: string) => {
    setDrillModalOpen(false);
    setTurnState('drill');
    setDrillCountdown(30);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'drill:start', drillId } as ClientMessage));
    }

    drillTimerRef.current = setInterval(() => {
      setDrillCountdown((prev) => {
        if (prev <= 1) {
          if (drillTimerRef.current) clearInterval(drillTimerRef.current);
          handleSubmitResponse();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStreamReady = useCallback((stream: MediaStream) => {
    setMediaStream(stream);
  }, []);

  const handleCaptureError = useCallback((err: string) => {
    setErrorMessage(err);
  }, []);

  return (
    <main
      onClick={() => {
        if (!audioUnlocked) setAudioUnlocked(true);
      }}
      className="h-screen w-screen bg-gray-950 text-white flex flex-col justify-between p-2 sm:p-4 select-none overflow-hidden"
    >
      {/* Google Meet Top Bar */}
      <header className="w-full flex items-center justify-between px-3 py-1.5 z-20">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-sm shadow">
              🎓
            </div>
            <span className="font-bold text-sm tracking-tight text-white hidden sm:inline">
              Felix
            </span>
          </Link>
          <div className="h-4 w-[1px] bg-gray-800" />
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-violet-300">{targetRole}</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400 capitalize">{difficulty}</span>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-3">
          {!audioUnlocked && (
            <button
              onClick={unlockAudioAndPlay}
              className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold animate-pulse shadow-md flex items-center gap-1.5"
            >
              <span>🔊</span>
              <span>Enable Sound</span>
            </button>
          )}

          {/* Latency Tracker */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-900 border border-gray-800 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-gray-400">Latency:</span>
            <span className="font-mono font-bold text-emerald-300">
              {turnLatencyMs ? `${turnLatencyMs}ms` : '< 1.5s'}
            </span>
          </div>

          {/* Question Index Pill */}
          <div className="px-3 py-1 rounded-full bg-violet-600/20 border border-violet-500/30 text-xs font-bold text-violet-300">
            Question {currentQuestionIndex} of {questionCount}
          </div>

          <Link
            href="/session/setup"
            className="text-xs text-gray-400 hover:text-white px-2.5 py-1 rounded-lg bg-gray-900/60 border border-gray-800 transition-colors"
          >
            Leave
          </Link>
        </div>
      </header>

      {/* Main Google Meet Video Stage */}
      <div className="w-full flex-1 relative flex items-center justify-center p-1 sm:p-2 overflow-hidden">
        {/* Large Stage: The Avatar (Pinned Speaker in Google Meet) */}
        <div className="w-full h-full relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gray-900/90 border border-gray-800/80 shadow-2xl flex items-center justify-center">
          <Avatar
            state={turnState}
            isSpeaking={isAvatarSpeaking}
            audioLevel={avatarVolume}
            captionText={turnState === 'speaking' || turnState === 'asking' ? currentQuestionText : undefined}
          />

          {/* Rescue Mode Scaffolding Overlay Banner */}
          <RescueScaffold
            isActive={rescueActive}
            message={rescueMessage}
            onDismiss={() => setRescueActive(false)}
          />

          {/* Drill Mode Countdown Pill (if active) */}
          {turnState === 'drill' && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 px-4 py-2 rounded-2xl bg-purple-950/90 border border-purple-500/50 flex items-center gap-3 shadow-xl backdrop-blur-md">
              <span className="font-bold text-xs text-purple-200">⚡ 30s Micro-Drill Sprint</span>
              <span className="font-mono text-sm font-extrabold text-amber-300">
                00:{drillCountdown.toString().padStart(2, '0')}
              </span>
            </div>
          )}

          {/* Floating Closed Captions / Subtitle Bar (Google Meet Style) */}
          <div className="absolute bottom-4 left-4 right-4 sm:left-12 sm:right-12 z-20 pointer-events-none flex flex-col items-center">
            {/* Question or Speaking Text */}
            {currentQuestionText && (
              <div className="pointer-events-auto max-w-2xl px-4 py-2.5 rounded-2xl bg-gray-950/85 border border-gray-800/80 backdrop-blur-md shadow-2xl text-center mb-2 flex items-center gap-2">
                <p className="text-xs sm:text-sm text-gray-100 font-medium leading-snug">
                  <span className="text-violet-400 font-semibold mr-1.5">Felix:</span>
                  "{currentQuestionText}"
                </p>
                <button
                  onClick={() => playAudio(currentQuestionText)}
                  type="button"
                  title="Replay Audio"
                  className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors flex-shrink-0"
                >
                  🔊
                </button>
              </div>
            )}

            {/* Learner Real-time Transcript */}
            {(learnerTranscript || partialTranscript) && (
              <div className="pointer-events-auto max-w-xl px-4 py-1.5 rounded-xl bg-gray-900/90 border border-gray-800 text-center text-xs text-gray-200 backdrop-blur-sm shadow-lg">
                <span className="text-emerald-400 font-semibold mr-1.5">You:</span>
                <span>{learnerTranscript}</span>{' '}
                <span className="text-violet-400 italic">{partialTranscript}</span>
              </div>
            )}
          </div>

          {/* Self-View Camera: Google Meet Bottom-Right Floating PiP */}
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 w-48 sm:w-60 md:w-72 aspect-video z-30 shadow-2xl transition-all">
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

          {/* Coach Panel Flyout (if opened) */}
          {coachModeEnabled && (
            <div className="absolute top-4 left-4 z-30 max-w-xs">
              <CoachPanel
                isOpen={coachOpen}
                hint={coachHint}
                isLoading={isCoachLoading}
                onRequestHint={handleRequestCoachHint}
                onClose={() => setCoachOpen(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Google Meet Bottom Controls Bar */}
      <footer className="w-full flex items-center justify-between px-3 py-2 z-20">
        {/* Left: Meeting Info & Live Audio Wave */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-xs text-gray-400">
            <span className="font-semibold text-gray-200">{targetRole} Practice</span>
            <span className="text-gray-600 mx-2">|</span>
            <span className="text-gray-400">Turn {currentQuestionIndex}</span>
          </div>
          <div className="w-24 sm:w-32">
            <AudioVisualizer
              stream={mediaStream}
              isActive={turnState === 'listening'}
              onVolumeChange={(vol) => setAvatarVolume(vol)}
            />
          </div>
        </div>

        {/* Center: Google Meet Action Pills */}
        <div className="flex items-center gap-2 sm:gap-3 bg-gray-900/90 border border-gray-800/90 px-4 py-2 rounded-full shadow-2xl backdrop-blur-md">
          {/* Rescue Mode Button */}
          <button
            onClick={triggerRescueMode}
            type="button"
            className="px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold transition-all flex items-center gap-1.5"
            title="Simulate 5s pause or request Rescue scaffolding"
          >
            <span>🛟</span>
            <span className="hidden sm:inline">Rescue Mode</span>
          </button>

          {/* Coach Hint Button */}
          {coachModeEnabled && (
            <button
              onClick={handleRequestCoachHint}
              type="button"
              className="px-3 py-1.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold transition-all flex items-center gap-1.5"
              title="Request STAR coach hint"
            >
              <span>💡</span>
              <span className="hidden sm:inline">Coach Hint</span>
            </button>
          )}

          {/* Micro-Drill Practice Button */}
          <button
            onClick={() => {
              setActiveDrill({
                drillId: 'demo-drill-1',
                sessionId,
                responseIndex: currentQuestionIndex - 1,
                targetLearningOutcome: 'Apply the STAR method to behavioral questions',
                targetCompetency: 'communication',
                gapSeverity: 'high',
                question:
                  'Tell me about a time you had to debug a critical production issue under pressure. Use the STAR method.',
                timeLimitSeconds: 30,
                hints: [
                  'Situation: Set the scene in 1 sentence',
                  'Task: What was your direct responsibility?',
                  'Action: What tools or code changes did YOU make?',
                  'Result: What was the measurable uptime result?',
                ],
              });
              setDrillModalOpen(true);
            }}
            type="button"
            className="px-3 py-1.5 rounded-full bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold transition-all flex items-center gap-1.5"
            title="Start 30s micro-drill"
          >
            <span>⚡</span>
            <span className="hidden sm:inline">Drill</span>
          </button>

          {/* Done Speaking Button (When listening) */}
          {turnState === 'listening' ? (
            <button
              onClick={handleSubmitResponse}
              className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <span>Done Speaking</span>
              <span>→</span>
            </button>
          ) : (
            <div className="px-3 py-1.5 rounded-full bg-gray-800 text-gray-400 text-xs font-medium">
              {turnState === 'speaking' ? 'Felix Speaking…' : 'Processing…'}
            </div>
          )}

          {/* Red End Call Button */}
          <Link
            href="/session/setup"
            className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white text-xs shadow-md shadow-red-500/20 transition-transform hover:scale-105"
            title="Leave call"
          >
            📞
          </Link>
        </div>

        {/* Right: Sound Re-Test / Help */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (currentQuestionText) {
                playAudio(currentQuestionText);
              } else {
                playAudio('Hello! Welcome to your Felix interview practice session.');
              }
            }}
            type="button"
            className="text-xs text-gray-400 hover:text-white px-2.5 py-1 rounded-lg bg-gray-900 border border-gray-800 transition-colors flex items-center gap-1"
            title="Test audio output"
          >
            <span>🔊</span>
            <span className="hidden sm:inline">Test Audio</span>
          </button>
        </div>
      </footer>

      {/* 30s Micro-Drill Modal */}
      <DrillModal
        isOpen={drillModalOpen}
        drill={activeDrill}
        onStartDrill={handleStartDrill}
        onCancel={() => setDrillModalOpen(false)}
      />
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
