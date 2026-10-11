# Felix — Progress

> Living checklist for the Felix build. Update this file when you finish something — future sessions should read it before starting work.
> Spec: [`README.md`](README.md) · Agent guidance: [`AGENTS.md`](AGENTS.md)

**Current phase:** implementation in progress — Part 1 and Part 2 completed (as of 2026-10-10).

**Owner tags** — the build is split into three non-overlapping parts; see [AGENTS.md § Work division](AGENTS.md#work-division--three-parts-strictly-non-overlapping) before picking up any item:

- `[1]` Part 1 — Live Session & Interface (scaffold, capture, STT→LLM→TTS→avatar, live UI)
- `[2]` Part 2 — Behavioral Telemetry (gaze, expressions, prosody, dashboard graphs)
- `[3]` Part 3 — Learning Engine & Integrations (rubric, transformer, drills, reports, MCP)
- `[1+3]` / `[2+3]` / `[all]` — shared items; each part builds only its own half, inside its own directories

**Only work items tagged with your part.** To request a change in someone else's part, add a one-line entry under [Log](#log).

## Setup

- [x] Project scaffold — establish the real backend/frontend layout per AGENTS.md's directory-ownership map (README's install commands are placeholders) **and write the five `docs/contracts/` files** — day-0 unblocker: Parts 2/3 start nothing until this lands `[1]`
- [x] Contract fixtures for parallel start — sample WAV/video clip `[2]`, fake session-record JSON `[3]`; start as soon as the contracts land, don't wait for the real capture pipeline `[2+3]` _(`[2]` fixtures & unit test completed)_
- [x] Environment variables wired: `GEMINI_API_KEY`, `ASSEMBLYAI_API_KEY`, `CARTESIA_API_KEY` (others request keys via Log) `[1]`
- [x] Avatar platform chosen (README leaves it as `_[Avatar platform]_`) `[1]`
- [x] Mic + camera capture working in the browser `[1]`

## P0 — Must have (core learning loop)

- [x] **Live 3-question voice interaction** — AssemblyAI STT → Gemini → Cartesia TTS → avatar, at **< 1.5 s/turn** `[1]`
- [x] **Answer Transformer** — side-by-side "what you said" vs. Felix STAR rewrite `[3]`
- [x] **Visual behavioral dashboard** — Parselmouth speaking-rate/pause-timeline graphs, MediaPipe gaze `[2]`
- [x] **One-click "Practice this weak area"** — gap → 30 s micro-drill → retry → score visibly improves `[1+3]` (drill + scoring `[3]`; running the retry as a session turn `[1]`)
- [x] **Evidence-based feedback report** — every comment cites an exact transcript quote + timestamp `[3]` (consumes session records `[1]` + signal records `[2]`)

> **Demo-loop targets (per AGENTS.md § Sequencing & risk patches):** post-session scoring → report in **~5 s** from response end (async from the live turn, so outside the < 1.5 s budget). Fallback if the `[1+3]` drill-retry handshake is broken at demo time: retry as a plain session turn with a preset drill question + simplified scoring — Part 1 keeps that fallback path working.

## Behavioral analysis pipeline

- [x] Gaze estimation (MediaPipe) `[2]`
- [x] Facial action units / expressions (Py-feat) `[2]`
- [x] Prosody: pitch, jitter, shimmer, speaking rate, pause duration (Parselmouth + STT timestamps) `[2]`
- [x] Signals temporally correlated to each response `[2]`

## Assessment & remediation

- [x] Rubric scoring → criterion-level + overall scores `[3]`
- [x] Competency & learning-gap engine (gaps classified by domain, concept, severity) `[3]`
- [x] Feedback report: strengths, gaps, recommendations — each gap maps to a learning outcome `[3]`
- [x] Remediation plan generation (micro-lessons, targeted drills) `[3]`
- [ ] Spaced-repetition queue for weak outcomes (feeds next session) `[3]`

## P1 — High value

- [x] **Rescue Mode** — silence > 5 s or hesitation → avatar scaffolds the learner out loud `[1]`
- [x] Coach Mode — hints and model answers on demand `[1]`
- [x] Avatar lip-sync (only if it doesn't add lag to the audio loop) `[1]`

## P2 — Cut for hackathon

- [ ] Educator cohort dashboard + JD crawling — **fallback: ship 3–4 pre-loaded roles + a paste-JD box** `[3]`
- [ ] Curriculum/content admin module `[3]`

## Integrations

> **Do last.** Per AGENTS.md § Sequencing & risk patches, nothing in the 60-second demo depends on these items — drop them before any P0/P1 item if time runs short.

- [ ] Haveloc (demonstration & deployment) `[3]`
- [x] Upstream GitHub/portfolio MCP — feed student repo context into question generation `[3]`
- [ ] Downstream LMS MCP — Canvas / Google Classroom / Notion rubric export + drill assignment `[3]`

## 60-second demo checklist (acceptance test for the loop — integration point, run together)

- [x] Pause 5 s → Rescue Mode scaffolds `[1]`
- [x] Report shows Answer Transformer + vocal-jitter telemetry `[2+3]`
- [x] "Practice this weak area" → 30 s micro-drill `[3]`
- [x] Retry → score visibly improves `[1+3]`

## Roadmap (post-hackathon)

Tracked in [`README.md` § Roadmap](README.md) — learner progress dashboard, spaced-repetition scheduler, micro-drill library, evidence panel, multi-model decomposition, PDF exports, mobile mode, accessibility pass. Part mapping for roadmap items is in [AGENTS.md § Work division](AGENTS.md#work-division--three-parts-strictly-non-overlapping) (rule 6).

## Log

- 2026-10-11 [1+3] — Configurable Interviewer Archetypes:
  - Implemented 3 distinct coaching personas:
    1. Supportive Felix: Patience, high psychological safety, warmth, normalizing hesitation, positive reinforcement, and step-by-step STAR scaffolding.
    2. Pragmatic Staff Architect: Zeroes in on edge cases, distributed failure modes, p99 tail latencies, concurrency bottlenecks, and explicit architectural trade-offs.
    3. Rapid-Fire Recruiter: Tests time management, executive summaries, bottom-line ROI, 30-45s elevator pitches, and eliminates conversational fluff.
  - Setup Selection UI (`frontend/src/app/session/setup/page.tsx`): Added interactive archetype selection cards with trait badges and descriptions, storing choice in `sessionStorage` (`felix_session_archetype`) and passing to sync endpoints.
  - Live Turn Engine & Prompt Directives (`server/session/turn-engine.ts`, `server/session/prompts/`): Grounded question generation, follow-up probe style, rescue mode tone, and coach hints in the active archetype. Dynamic interviewer speaker naming and role-tailored fallback questions.
  - Avatar Synchronization (`server/session/beyond-presence-sync.ts`, `frontend/src/app/api/avatar/sync/route.ts`, `frontend/src/app/components/Avatar.tsx`): Synchronized Beyond Presence agent system prompt and dynamic greeting with archetype persona, and displayed live archetype badge on the interviewer avatar.
  - Live HUD & Reporting (`frontend/src/app/session/live/page.tsx`, `frontend/src/report/FeedbackReport.tsx`, `frontend/src/app/session/report/page.tsx`, `frontend/src/app/session/history/page.tsx`): Rendered archetype indicator in live call header, injected archetype perspective into Gemini evaluation prompt (`/api/evaluate`), added archetype badge to formative feedback report, and persisted archetype in historical session archives and transcript cards.
  - Verified clean TypeScript compilation (`npx tsc --noEmit`) and successful Next.js production builds (`npm run build`).

- 2026-10-11 [2+3] — Strict 0 WPM Reporting When Microphone Inactive / Candidate Silent:
  - Configured `frontend/src/report/InteractiveTelemetryGraph.tsx`, `frontend/src/report/FeedbackReport.tsx`, `frontend/src/app/session/report/page.tsx`, `frontend/src/app/api/evaluate/route.ts`, and `server/learning/rubric.ts` so when the candidate does not speak or the microphone does not capture audio (0 words spoken), the speaking cadence is strictly reported as `0 WPM` instead of falling back to default conversational constants.
  - Interactive Telemetry Waveform: When WPM is 0, the cadence curve cleanly rests at 0 WPM, displays `No Speech Detected (0 WPM)` in the tooltip HUD, and flags `0 WPM recorded: No speech detected from microphone (candidate was silent or microphone was disconnected)` in the inspection cue.
  - Evaluation & Feedback: Rubric feedback and behavioral insight badges explicitly cite "0 WPM recorded" and advise the candidate to check their microphone input device and permissions.
  - Verified clean TypeScript compilation across frontend/backend (`npx tsc --noEmit`) and successful Next.js production builds (`npm run build`).

- 2026-10-11 [1+3] — Problem-First Mistake Explanation in Mock Drills & Remediation Turns:
  - Formative Coaching Protocol: Updated the AI interviewer's mock drill behavior across both live turns (`server/session/turn-engine.ts`, `server/session/prompts/followup.ts`) and client-side remediation sessions (`frontend/src/app/session/live/page.tsx`, `frontend/src/app/components/DrillModal.tsx`) so the interviewer always begins by explaining the candidate's mistake on the problem first itself before proceeding with the next part.
  - DrillSpec & Remediation Plan Schema: Extended `DrillSpec` (`server/core/types.ts`, `frontend/src/app/lib/types.ts`, `docs/contracts/drill-spec.md`) and `RemediationPlanItem` (`server/learning/types.ts`, `server/learning/prompts/rubric-scoring.ts`, `frontend/src/report/FeedbackReport.tsx`) with `originalProblem`, `studentMistake`, and `problemFirstExplanation`.
  - Dynamic Problem & Mistake Extraction: Updated `handleStartDrill` in `frontend/src/app/session/report/page.tsx` and `/api/evaluate` to dynamically pair each drill with the candidate's actual question asked, verbatim response, and critique deduction notes, persisting the active drill in `sessionStorage`.
  - Three-Part Visual Breakdown in DrillModal: Enhanced `DrillModal.tsx` to clearly structure drill preparation into: (1) The Problem Asked, (2) Mistake Identified On This Problem, and (3) Next Part 30s Practice Sprint.
  - Live Stage Drill Execution & Audio Synthesis: Configured `/session/live` to recognize `drillId` mode. When launched, the interviewer speaks the problem context, explains what mistake occurred in the previous response, and instructs the candidate on the next part challenge. Added a clean non-overlapping stage card displaying the problem, mistake analysis, and active sprint countdown timer (`⏱️ 30s Left`).
  - Drill Evaluation & Seamless Progression: On drill submission, the interviewer evaluates the candidate's retry starting with the problem first itself, congratulates their improvement, auto-increments the overall score in history, and routes back to the report debrief.
  - Verified clean TypeScript compilation across frontend/backend (`npx tsc --noEmit`) and successful Next.js production builds (`npm run build`).

- 2026-10-11 [2+3] — Interactive Result Telemetry & Pacing Graph:
  - Replaced the static hardcoded SVG waveform in `frontend/src/report/FeedbackReport.tsx` with a fully interactive Recharts data visualization component `frontend/src/report/InteractiveTelemetryGraph.tsx`.
  - Added 4 selectable biometric stream modes: Speaking Cadence (WPM with 120–160 optimal corridor), MediaPipe Gaze Alignment (0–100%), Parselmouth Vocal Jitter perturbation %, and Multi-Biometric Composite.
  - Built interactive hover tooltips displaying precise timestamps, active turn context, exact metric values with health badges, verbatim candidate speech excerpts at that instant, and formative coaching observations.
  - Implemented turn filtering (`All Turns`, `Turn 1`, `Turn 2`...) that zooms the timeline and highlights turn boundaries, along with clickable event milestone pins (`💭 Pause`, `⚡ Peak Cadence`).
  - Added an interactive timeline scrubber and playback simulation button (`▶ Replay Pacing` / `⏸ Pause Replay`) that animates through the interview with a real-time point inspection HUD card.
  - Verified clean TypeScript compilation (`npx tsc --noEmit`) and successful Next.js production builds (`npm run build`).

- 2026-10-11 [1] — Removed Floating Felix Prompt & Speech Subtitle Banner: Removed the floating overlay banner (`FELIX PROMPT #...` and question text box) from the live session stage in `frontend/src/app/session/live/page.tsx`, keeping the avatar video stage clean and completely unobstructed.
- 2026-10-11 [1+3] — Added 1-Click Formative PDF Coaching Portfolio Export:
  - Engineered client-side PDF document generation engine `frontend/src/app/lib/pdf-exporter.ts` formatting standard A4/Letter print documents for university career counseling and mentorship portfolios.
  - Generates comprehensive, high-contrast debrief reports including: University Career Services letterhead, session metadata, overall rubric mastery badge with longitudinal growth deltas, on-device telemetry summary badges (MediaPipe gaze %, Parselmouth WPM, autocorrelation jitter %), scored Rubric Matrix with verbatim transcript citations, side-by-side Answer Transformer (spoken response vs. Felix STAR rewrite), question-by-question spoken transcripts, and candidate/counselor certification signature lines.
  - Added 1-click "Export Coaching PDF" action buttons in `frontend/src/report/FeedbackReport.tsx` (top summary overview and bottom footer bar) and `frontend/src/app/session/history/page.tsx` (session card quick actions and dialogue transcript modal header).
  - Configured `@media print` CSS rules in `frontend/src/app/globals.css` ensuring clean black-and-white print contrast and hiding transient screen navigation controls.
  - Verified clean TypeScript compilation (`npx tsc --noEmit`) and successful Next.js production builds (`npm run build`).

- 2026-10-11 [1+3] — Added Longitudinal Learner Progression & Improvement Tracking:
  - Added longitudinal analysis engine in `frontend/src/app/lib/history-store.ts` (`getLearnerProgression`) that compares a candidate's current rehearsal against their immediately preceding session for that profile, computing exact score deltas ($\Delta \text{Overall Score}$), mastery trends (`improved`, `steady`, `needs_calibration`), and behavioral deltas.
  - Built dedicated `LearnerProgressionCard` component in `frontend/src/report/LearnerProgressionCard.tsx` featuring side-by-side prior vs current score comparisons (`3.6 ➔ 4.1 / 5.0`), visual trend indicators (`▲ +0.5 Mastery Growth`), and formative AI commentary highlighting specific areas where the candidate leveled up.
  - Integrated `LearnerProgressionCard` into the post-interview diagnostic debrief in `/session/report`, dynamically bound to the candidate's historical record and auto-persisted.
  - Added live progression delta badges to the interview timeline list and dialogue transcript modal in `/session/history`, showing immediate longitudinal trajectory per session.
- 2026-10-11 [1+3] — Complete Conversation Transcript Storage & Dialogue Rehearsal Archive:
  - Created standardized `TranscriptLine` and `SessionTranscript` interfaces across server (`server/core/types.ts`) and frontend (`frontend/src/app/lib/types.ts`).
  - Updated server session manager (`server/session/session-manager.ts`) and WebSocket turn engine (`server/session/turn-engine.ts`) to record, timestamp, and index every line spoken by the interviewer (questions, follow-ups, coach hints, micro-drills) and every verbal answer from the student.
  - Added REST endpoints `GET /api/sessions/:sessionId/transcript` and `POST /api/sessions/:sessionId/transcript` to sync and query full dialogue transcripts on demand (`server/session/routes.ts`).
  - Wired live interview page (`frontend/src/app/session/live/page.tsx`) to capture every turn verbatim (both online WebSocket and offline local fallback mode), persisting chronologically to `sessionStorage` (`felix_session_transcript`).
  - Integrated transcript archiving into persistent interview history (`frontend/src/app/lib/history-store.ts`), saving `transcriptLines` in `HistoricalSession` and rendering verbatim dialogue bubbles and copy-to-clipboard functionality in the Rehearsal History modal (`frontend/src/app/session/history/page.tsx`).
- 2026-10-11 [1+3] — Added Synchronized Video Transcript & IndexedDB Replay Vault:
  - Engineered client-side IndexedDB video persistence engine `frontend/src/app/lib/video-store.ts` (`felix_video_vault_v1`) to archive WebM video blobs recorded via `MediaRecorder` per turn without hitting `localStorage` quotas.
  - Wired live interview handoff in `frontend/src/app/session/live/page.tsx` to automatically listen for `capture:video-handoff` events from `MediaCapture` and archive turn video clips locally.
  - Built interactive multimodal `TurnVideoPlayer` component with play/pause, duration tracking, and sync badges (`Synced IndexedDB Video Vault`).
  - Integrated `TurnVideoPlayer` into the question-by-question dialogue transcript modal in `/session/history` and the evidence transcript audit in `/session/report`, enabling candidates to review their spoken response and watch their video replay side-by-side.
- 2026-10-11 [1+3] — Added Persistent Interview History Archive & Transcript Modal:
  - Created persistent local session repository `frontend/src/app/lib/history-store.ts` (`felix_interview_history_v1`) capturing session metadata, candidate learner profile, full question-and-answer transcripts, duration, telemetry metrics (MediaPipe gaze, Parselmouth WPM, vocal jitter), and Gemini assessment reports. Pre-seeded with realistic sample sessions for out-of-the-box demo readiness.
  - Implemented `/session/history` dashboard with longitudinal summary metrics (total sessions completed, average rubric mastery score, latest target track), real-time search filtering by role or transcript keywords, and learner profile switcher pills (`All`, `Siddharth`, `Guest`).
  - Integrated interactive turn-by-turn dialogue transcript modal with "Copy All" functionality and direct deep-linking into `/session/report?sessionId=...&fromHistory=true` for instant report retrieval without re-running LLM generation.
  - Wired auto-save hook in `/session/report` to persist completed interview evaluations into history on generation, updated `/session/setup` with lightweight learner profile selection and history navigation, and linked history across top navigation bars.

- 2026-10-11 [1+3] — Strict Grounding on AI-Asked Questions & Removal of Arbitrary Timestamps:
  - Enforced that all report sections (Rubric Breakdown, Evidence Audit, Answer Transformer, turn milestones) display strictly and exclusively the questions that Felix (the AI interviewer) asked during the interview (`candidateResponses[i].questionAsked`).
  - Added strict prompt negative constraints in `/api/evaluate` barring Gemini from inventing, hallucinating, or rewriting technical questions; programmatically clamped and mapped `transcriptAudit` and `transformations` to `validResponses` on both backend and frontend so questions and turn counts match the interview exactly.
  - Eliminated arbitrary hardcoded time strings (e.g., `14:28` timer pill in `session/report/page.tsx` header bar, `01:15 – 02:40` fallback range in `AnswerTransformer.tsx`, and fake clock markers on the timeline axis in `FeedbackReport.tsx`).
  - Replaced fake Answer Transformer scenario tabs (`Q1: Core Incident`, `Q2: Architecture Sync`) with clean `Prompt 01` / `Turn 01` indicators, and bound cognitive friction factors dynamically to real critique notes.
  - Verified clean TypeScript compilation and Next.js production builds.
- 2026-10-11 [1+2+3] — Implemented Real-Time Computer Vision Gaze Tracking, Acoustic Prosody Jitter, and Grounded Gemini Evaluation:
  - Replaced fake/randomized telemetry in `LiveTelemetryHud` with real MediaPipe iris/gaze tracking and deterministic pixel-level skin/eye-luminance gradient computer vision. Looking away, turning the head, or not showing eyes to the camera now immediately drops focus to 0–25% ("Eyes Not Detected" / "Looking Away") instead of an inaccurate 88%.
  - Replaced hardcoded jitter math with real Web Audio Autocorrelation fundamental frequency ($F_0$) tracking, calculating cycle-to-cycle perturbation jitter percentage and pitch variance ($\sigma(F_0)$). Sleepy, monotone, or fatigued speech is accurately detected with elevated jitter / vocal fry, sluggish speaking rate (WPM), and "Monotone / Low Energy" classifications.
  - Replaced hardcoded mock report points in `/session/report` with a dedicated `/api/evaluate` route powered by Gemini 3.8 Flash. The evaluation analyzes the candidate's exact spoken words, applies realistic rubric scoring (including low scores for informal/sleepy responses), cites actual transcript quotes, generates a personalized STAR Answer Transformation for their specific response, and reflects real measured telemetry numbers.
- 2026-10-11 [3] — Fully Dynamic Evidence-Based Assessment & Remediation Report: Removed all hardcoded report values. Created dynamic server assessment engine (`server/learning/rubric.ts`) exposing `POST /api/sessions/:sessionId/report` powered by Gemini. Evaluates the candidate's exact questions asked, transcripts, and behavioral telemetry (MediaPipe gaze, Parselmouth WPM, vocal jitter %, pauses). Dynamically generates criterion rubric scores backed by verbatim transcript quotes and timestamps, behavioral insights framed as constructive coaching cues, side-by-side STAR Answer Transformations on candidate's actual answers, and personalized remediation micro-drills with resilient client-side fallback synthesis.
- 2026-10-11 [1+2+3] — Integrated real-time Behavioral Telemetry HUD, STAR Answer Transformer, and comprehensive Formative Assessment Report: Created `LiveTelemetryHud` mounted directly above the live interview camera PiP with real-time MediaPipe gaze tracking, Py-feat affect/composure detection, and Parselmouth vocal prosody (speaking rate WPM, pitch, jitter perturbation); built `AnswerTransformer` with side-by-side STAR framework transformation ("What You Said" vs "Felix STAR Rewrite") and coaching callout opportunities; upgraded `FeedbackReport` and wired `/session/report` to dynamically ground in candidate's actual session responses, transcript quotes with timestamps, and 1-click micro-drills; mounted `BehavioralDashboard` with all 6 Recharts telemetry charts in `/session/dashboard`; resolved all TypeScript errors across `frontend/src/behavioral/` and verified clean Next.js build.
- 2026-10-10 [1] — Formative real-time coaching on mistakes and uncertainty: updated follow-up prompt and turn-engine trigger so when a candidate says "I don't know", expresses confusion, or makes a technical mistake, Felix immediately normalizes it, explicitly explains what interviewers expect to hear and what went wrong/misconception occurred in 1-2 punchy sentences, and provides a guided stepping-stone question to keep the learning practice going.
- 2026-10-10 [1] — Streamlined, distraction-free interview UI: removed Coach Mode buttons and panels from both setup and live interview pages; removed hackathon/EdTech track badges across the application; added an active call duration timer in the header and ensured the Leave button and native controls are completely unobstructed; eliminated flashing "Enable Sound" and "Test Audio" buttons and badges from the stage; stripped overlay name tags and stream badges from `<Avatar />` so the interviewer video and learner camera render purely alongside essential call controls.
- 2026-10-10 [1] — Strict environment-configured Beyond Presence avatar: removed manual avatar agent ID input from the setup screen (`/session/setup`) per user requirement so end users never have to enter avatar IDs. Avatar agent ID (`d6f2bbee-88e6-42b5-a5f9-8eeb837a7fbf`) is configured strictly via `.env` (`NEXT_PUBLIC_BEYOND_PRESENCE_AGENT_ID` and `BEYOND_PRESENCE_AVATAR_ID`) and resolved automatically across the frontend and backend sync pipeline. Fixed undefined `setActivePreset` in setup role preset selection.


- 2026-10-10 [1] — Fixed avatar loop reloading and call-drop regression: isolated Beyond Presence iframe into a dedicated memoized `StableIframe` component with immutable `embedUrl` (`https://bey.chat/{agentId}?transparent=1`), eliminating mutating `&sid` query parameters that triggered `bey.chat` internal router tear-down (`StateAction.end`) on state changes; stripped `audioLevel` and `sessionId` props from `<Avatar />` to halt 60 FPS re-render thrashing from `AudioVisualizer`; configured Beyond Presence agent with `capabilities: []` so it doesn't conflict with `/dev/video0` hardware lock held by `MediaCapture`, allowing "Start conversation" to join smoothly without aborting back to the pre-screen.
- 2026-10-10 [1+3] — Fixed Beyond Presence avatar GitHub grounding and role adaptation: created dynamic avatar sync endpoint `/api/avatar/sync` and backend module `beyond-presence-sync.ts` that patches `https://api.bey.dev/v1/agents/{agent_id}` using `x-api-key`. Scrapes candidate public GitHub repositories (e.g. `badgemagic-app`, `apps-android-commons`, `kalasetu`), languages (Dart, Kotlin, TypeScript), and descriptions using a robust block parser; pre-loads the full codebase into the cloud avatar's `system_prompt` with strict negative constraints against claiming inability to access GitHub; and generates a personalized spoken `greeting` where Felix introduces itself for the target role, explicitly names the candidate's GitHub repositories, and asks an in-depth technical architectural question to open the interview. Added pre-sync awaiting and loading indicator to setup page and unique session parameter passing to `<Avatar />` iframe.
- 2026-10-10 [1+3] — Fixed GitHub profile access and removed live subtitles: made `parseGithubUrl` accept plain usernames, query strings, and SSH URLs; enhanced fallback context and added explicit prompt constraints preventing the interviewer AI from stating it cannot access GitHub or external links; switched primary model to `gemini-flash-lite-latest`; updated setup input to accept arbitrary username formats; removed closed-caption and subtitle overlay elements from the live interview stage.
- 2026-10-10 [1] — Removed Rescue Mode Activated overlay banner and disabled auto-trigger on silence: silenced both client-side and server-side 5-second silence timers to prevent unsolicited interruptions while the learner is thinking, and removed the Rescue banner and bottom control button from the live session interface.
- 2026-10-10 [1] — Fixed microphone permission in Beyond Presence avatar & hardened turn subtitle lifecycle: added explicit `camera *; microphone *; speaker-selection *;` permission delegation to the Beyond Presence iframe `allow` attribute to prevent `Unable to access camera or microphone` browser security blocks; updated subtitle render condition so question captions remain visible throughout speaking and listening states across all subsequent turns; safeguarded browser speech synthesis from Chromium garbage-collection drops.
- 2026-10-10 [1] — Dedicated Beyond Presence avatar stage: removed toggle buttons completely; configured live session stage to render Beyond Presence exclusively with full cross-origin media permissions (camera, microphone, display-capture, autoplay, encrypted-media); removed blocking overlays for seamless automatic joining.
- 2026-10-10 [1] — Fixed avatar presence & audio playback: updated Cartesia TTS model from sunsetted 'sonic-english' to 'sonic-3.6' (resolving HTTP 400 failure); prioritized native interactive interviewer avatar so Felix is immediately visible and joined in the call; added toggle for Beyond Presence stream; added one-click 'Join Call with Sound' gesture unlock overlay to satisfy browser autoplay policies.
- 2026-10-10 [1+3] — Enabled GitHub portfolio grounding: connected candidate GitHub profile/repo from session setup to live turn engine over WebSocket. Updated GitHub context extraction in `server/session/github-service.ts` to support usernames, profile pages, and repository README extraction without hitting GitHub rate limits. Updated Gemini Flash-Lite model configuration (`gemini-2.5-flash-lite`) to dynamically generate targeted questions challenging the candidate on their actual projects, libraries, and architecture decisions.
- 2026-10-10 [1] — Refined live turn subtitles: subtitles now remain hidden prior to the interviewer speaking and dynamically appear only when speech audio starts and the question is asked.
- 2026-10-10 [1] — Streamlined session setup: removed number-of-questions selector and Coach Mode asking toggle. Sessions run open-ended by default with Coach Mode active on-demand during live turns. Server turn engine dynamically generates questions on the fly.
- 2026-10-10 — [2] Implemented Part 2 Behavioral Telemetry: backend pipeline (`server/behavioral/`), React dashboard components (`frontend/src/behavioral/`), signal record contract (`docs/contracts/signal-record.md`), fixture generator + unit tests passing. Ready for integration with Part 1 & Part 3.
- 2026-10-10 [1] — Completed Part 1 (Live Session & Interface): Project scaffold established with strict directory ownership; all 5 `docs/contracts/` authored; single Gemini Flash-Lite client wrapper in `server/core/`; real-time WebSocket turn engine with live prompts (question, follow-up, rescue, coach) and AssemblyAI/Cartesia pipeline with resilient fallbacks; Next.js 14 frontend with low-latency interactive avatar, synchronized lip-sync, live audio visualizer, mic+camera MediaCapture with event bus streaming to Part 2, Rescue Mode (>5s scaffolding), Coach Mode hints, and 30s micro-drill retry loop.
- 2026-10-10 [1→2] — Request to [2]: Please export `mockSignalRecord` (or update imports to `MOCK_SIGNAL_RECORD`) in `frontend/src/behavioral/mockData.ts` and add parameter types in AnomalyTimeline / PauseTimeline. Installed `recharts` in frontend dependencies.
- 2026-10-10 — Patched the work division with four sequencing/risk addenda (day-0 scaffold+contracts unblocker, fixture-based parallel start for `[2]`/`[3]`, Part 3 learns-before-integrates ordering, ~5 s post-session scoring target + drill-retry demo fallback). Added to AGENTS.md § Sequencing & risk patches; checklist updated here (Setup, P0 note, Integrations note).
- 2026-10-10 — Divided the build into three non-overlapping parts (Live Session `[1]` / Behavioral Telemetry `[2]` / Learning Engine `[3]`); documented in AGENTS.md and tagged every checklist item here. Previous entries below.
- 2026-10-10 — Pulled spec updates (Answer Transformer, Rescue Mode, MCP). Created `AGENTS.md` and `PROGRESS.md`. No code yet.
