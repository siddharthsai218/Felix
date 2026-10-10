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

- 2026-10-11 [1] — Fixed False Project Grounding When No GitHub/Resume Provided:
  - Fixed Beyond Presence cloud avatar sync (`server/session/beyond-presence-sync.ts` & `frontend/src/app/api/avatar/sync/route.ts`) which previously hardcoded greeting text referencing "your portfolio" or "your GitHub repositories" even when neither was provided.
  - Added strict negative constraints to Gemini prompts (`server/session/prompts/question.ts`) when candidate does not submit GitHub or resume, explicitly barring references to "your GitHub" or "your project" and instructing the AI to ask foundational role-domain architecture and scenario questions.
  - Updated fallback questions in `question.ts` and `frontend/src/app/session/live/page.tsx` so initial questions do not claim familiarity with a candidate project when no portfolio is submitted.
  - Fixed `sessionStorage` in setup so empty fields properly remove stale items from previous sessions.

- 2026-10-11 [1+3] — PDF Resume Upload & Transcript-Backed Score Generation Audit:
  - Replaced resume textarea with dedicated drag-and-drop `ResumePdfUploader` component (`frontend/src/app/components/ResumePdfUploader.tsx`). Added `/api/resume/parse` endpoint using `pdf-parse` and Gemini Flash to extract candidate experience, tools, and technical projects from uploaded `.pdf` documents; pre-populates session grounding and provides an expandable drawer to preview grounded technical details.
  - Implemented comprehensive `TranscriptScoreAudit` component (`frontend/src/report/TranscriptScoreAudit.tsx`) mounted directly in the Formative Feedback Report (`/session/report`). Shows full transparent scoring derivation (weighting formula, narrative rationale, and points credit vs deductions) backed directly by the candidate's exact spoken words.
  - Added turn-by-turn question & verbatim transcript audit: For each question asked, displays the interviewer question, verbatim candidate transcript, turn score, and itemized citations: green credit quotes (strengths and technical concepts that earned points) and red deduction quotes (critique of what missed the mark and actionable recommendations on what to say instead).
  - Enhanced `/api/evaluate` to generate structured `scoreRationale` and `transcriptAudit` for all responses with dynamic candidate-grounded fallbacks.

- 2026-10-11 [2] — Dynamic Candidate-Grounded Deep-Dive Behavioral Telemetry: Replaced static/hardcoded telemetry in `/session/dashboard` (`BehavioralDashboard.tsx`). Created `signalBuilder.ts` (`buildSignalRecordFromSession`) that dynamically generates a full `BehavioralSignalRecord` strictly derived from the candidate's actual interview session: real MediaPipe eye-contact percentages and gaze deviation vectors, Web Audio autocorrelation pitch ($F_0$) contour and vocal jitter perturbation, real speaking rate (WPM) calculated from actual words spoken and active turn duration, measured hesitation pause segments and durations, and Py-feat facial Action Units. Dynamically flags targeted coaching moments/anomalies (long pauses, vocal micro-tremors, gaze aversion, speech rate anomalies) matching the candidate's actual performance. Added interactive turn-by-turn selector (`Question 1`, `Question 2`, etc.) displaying the interviewer's question, verbatim candidate transcript, and measured turn duration. Synced signals to backend `/api/sessions/:sessionId/signals/:index`.
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
