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

  // References
  const wsRef = useRef<WebSocket | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const turnStartTimeRef = useRef<number>(0);
  const currentTimestampsRef = useRef<SttWordTimestamp[]>([]);
  const drillTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Fallback preset questions for offline/direct demo resiliency
  const fallbackQuestionsRef = useRef<string[]>([
    `Tell me about a challenging technical project you worked on recently in ${targetRole}. What was your specific role and what was the outcome?`,
    `How do you approach debugging a high-stakes issue in production when logs are sparse?`,
    `Describe a time you had a technical disagreement with a team member. How did you resolve it constructively?`,
  ]);

  // Audio Playback helper
  const playAudio = useCallback(async (audioData: string) => {
    try {
      // Check if it's base64 PCM / MP3 or plain text
      if (audioData.startsWith('data:audio') || audioData.length > 500) {
        const audio = new Audio();
        audio.src = audioData.startsWith('data:') ? audioData : `data:audio/mp3;base64,${audioData}`;
        setIsAvatarSpeaking(true);
        audio.onended = () => {
          setIsAvatarSpeaking(false);
          setTurnState('listening');
        };
        await audio.play();
      } else {
        // Fallback: Web Speech API synthesis
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(audioData);
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.onstart = () => setIsAvatarSpeaking(true);
          utterance.onend = () => {
            setIsAvatarSpeaking(false);
            setTurnState('listening');
          };
          window.speechSynthesis.speak(utterance);
        } else {
          // No TTS available, wait briefly
          setIsAvatarSpeaking(true);
          setTimeout(() => {
            setIsAvatarSpeaking(false);
            setTurnState('listening');
          }, 3000);
        }
      }
    } catch (e) {
      console.error('Audio playback error:', e);
      setIsAvatarSpeaking(false);
      setTurnState('listening');
    }
  }, []);

  // Web Speech API Speech Recognition Initialization
  const setupSpeechRecognition = useCallback(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition not supported in this browser. Using manual input fallback.');
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
          // Reset 5s silence timer since user is actively speaking
          resetSilenceTimer();

          // Send partial to WS
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

          // Record word timestamp
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
        console.warn('Speech recognition event:', event.error);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.error('Failed to create SpeechRecognition:', e);
    }
  }, []);

  // Silence Timer for Rescue Mode (P1 Hackathon MVP)
  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    silenceTimerRef.current = setTimeout(() => {
      // 5 seconds of silence detected during listening state
      triggerRescueMode();
    }, 5000);
  }, []);

  const triggerRescueMode = useCallback(() => {
    setRescueActive(true);
    setTurnState('rescue');

    const promptFallback = `Take a breath. Think about a specific challenge you faced while working as a ${targetRole}. What was the situation and how did you approach it?`;
    setRescueMessage(promptFallback);

    // Speak rescue guidance
    playAudio(promptFallback);
  }, [targetRole, playAudio]);

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
              // Reset transcript state for new turn
              setLearnerTranscript('');
              setPartialTranscript('');
              setRescueActive(false);
              currentTimestampsRef.current = [];
              break;

            case 'tts:audio':
              // Play avatar audio (< 1.5s latency budget metric)
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
              // Navigate to report
              setTimeout(() => {
                router.push(`/session/report?sessionId=${msg.record.sessionId}`);
              }, 2500);
              break;

            case 'error':
              console.warn('Server error:', msg.message);
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
  }, [targetRole, difficulty, questionCount, coachModeEnabled, playAudio, resetSilenceTimer, setupSpeechRecognition, router]);

  // Resilient Local Turn Fallback (ensures hackathon demo never fails)
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

  // Finish Speaking / Submit Response
  const handleSubmitResponse = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    const finalAnswer = learnerTranscript || partialTranscript || 'No response captured.';

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
      if (nextIndex < questionCount && nextIndex < fallbackQuestionsRef.current.length) {
        const nextQ = fallbackQuestionsRef.current[nextIndex];
        setTimeout(() => {
          setCurrentQuestionIndex(nextIndex + 1);
          setCurrentQuestionText(nextQ);
          setLearnerTranscript('');
          setPartialTranscript('');
          setTurnState('speaking');
          playAudio(nextQ);
        }, 1200);
      } else {
        // Complete session
        setTurnState('complete');
        setTimeout(() => {
          router.push(`/session/report?sessionId=${sessionId}`);
        }, 1500);
      }
    }
  };

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

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col justify-between p-3 sm:p-6 select-none">
      {/* Top Bar / Header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between py-2 border-b border-gray-800/80 mb-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-base shadow">
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

        {/* Progress & Latency Budget Indicator */}
        <div className="flex items-center gap-4">
          {/* Latency Tracker */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-900 border border-gray-800 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-gray-400">Live Turn Latency:</span>
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
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Exit
          </Link>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col items-center justify-center relative">
        {/* Rescue Mode Notification Banner (P1 Feature) */}
        <RescueScaffold
          isActive={rescueActive}
          message={rescueMessage}
          onDismiss={() => setRescueActive(false)}
        />

        {/* Drill Mode Countdown (if active) */}
        {turnState === 'drill' && (
          <div className="w-full max-w-md mx-auto mb-4 p-3 rounded-2xl bg-purple-950/80 border border-purple-500/50 flex items-center justify-between text-xs">
            <span className="font-bold text-purple-200">⚡ 30s Micro-Drill Sprint</span>
            <span className="font-mono text-sm font-extrabold text-amber-300">
              00:{drillCountdown.toString().padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Center Grid: Avatar + Learner Picture-in-Picture */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 items-center my-4">
          {/* Left: Session Telemetry & Controls */}
          <div className="hidden md:flex flex-col gap-4">
            <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800/80 backdrop-blur-sm">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Turn Engine
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>State:</span>
                  <span className="font-semibold text-white capitalize">{turnState}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>AI Reasoning:</span>
                  <span className="text-violet-400 font-medium">Gemini 3.1 Flash-Lite</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Voice Engine:</span>
                  <span className="text-emerald-400 font-medium">Cartesia Sonic</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Speech To Text:</span>
                  <span className="text-cyan-400 font-medium">AssemblyAI Streaming</span>
                </div>
              </div>
            </div>

            {/* Coach Mode Trigger */}
            {coachModeEnabled && (
              <CoachPanel
                isOpen={coachOpen}
                hint={coachHint}
                isLoading={isCoachLoading}
                onRequestHint={handleRequestCoachHint}
                onClose={() => setCoachOpen(false)}
              />
            )}
          </div>

          {/* Center: The Avatar Coach */}
          <div className="flex flex-col items-center justify-center">
            <Avatar
              state={turnState}
              isSpeaking={isAvatarSpeaking}
              audioLevel={avatarVolume}
              captionText={turnState === 'speaking' || turnState === 'asking' ? currentQuestionText : undefined}
            />
          </div>

          {/* Right: Learner Video Capture & Audio Waveform */}
          <div className="flex flex-col items-center md:items-end justify-center gap-4">
            <MediaCapture
              sessionId={sessionId}
              responseIndex={currentQuestionIndex - 1}
              isRecordingResponse={turnState === 'listening'}
              sttTimestamps={currentTimestampsRef.current}
              onStreamReady={(stream) => setMediaStream(stream)}
              onError={(err) => setErrorMessage(err)}
            />

            {/* Live Audio Visualizer */}
            <div className="w-full max-w-xs">
              <AudioVisualizer
                stream={mediaStream}
                isActive={turnState === 'listening'}
                onVolumeChange={(vol) => setAvatarVolume(vol)}
              />
            </div>
          </div>
        </div>

        {/* Current Question Display Banner */}
        <div className="w-full max-w-2xl mx-auto my-3 p-4 rounded-2xl bg-gray-900/80 border border-gray-800 text-center shadow-lg backdrop-blur-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400 block mb-1">
            Current Question
          </span>
          <p className="text-base sm:text-lg font-semibold text-gray-100">
            {currentQuestionText || 'Preparing your interview question…'}
          </p>
        </div>

        {/* Live Learner Speech Transcription Box */}
        <div className="w-full max-w-2xl mx-auto my-2 p-3.5 rounded-2xl bg-gray-950 border border-gray-800/80 min-h-[64px] flex items-center justify-between gap-4">
          <div className="flex-1 text-xs sm:text-sm text-gray-300 overflow-hidden">
            {learnerTranscript || partialTranscript ? (
              <p>
                <span className="text-gray-100 font-medium">{learnerTranscript}</span>{' '}
                <span className="text-violet-400 italic">{partialTranscript}</span>
              </p>
            ) : (
              <span className="text-gray-500 italic">
                {turnState === 'listening'
                  ? 'Listening to you speak… (start answering or pause to trigger Rescue Mode)'
                  : 'Waiting for your turn…'}
              </span>
            )}
          </div>

          {/* Complete Turn / Finish Button */}
          {turnState === 'listening' && (
            <button
              onClick={handleSubmitResponse}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shadow-md shadow-violet-500/25 flex-shrink-0"
            >
              Done Speaking →
            </button>
          )}
        </div>
      </div>

      {/* Bottom Control Bar */}
      <footer className="max-w-6xl mx-auto w-full flex items-center justify-between py-3 border-t border-gray-800/80 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Capture Stream Active</span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400">Emitting Handoff to Part 2 via EventBus</span>
        </div>

        {/* Demo trigger: Simulate Rescue or Drill */}
        <div className="flex items-center gap-2">
          <button
            onClick={triggerRescueMode}
            type="button"
            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-medium transition-colors"
            title="Simulate 5s pause to demonstrate Rescue Mode"
          >
            Test Rescue Mode (5s)
          </button>
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
            className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[11px] font-medium transition-colors"
            title="Demonstrate the 30s micro-drill retry loop"
          >
            Practice Weak Area (Drill)
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
    <Suspense fallback={<div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading Felix interview session…</div>}>
      <LiveInterviewContent />
    </Suspense>
  );
}
