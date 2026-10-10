# Felix — Progress

> Living checklist for the Felix build. Update this file when you finish something — future sessions should read it before starting work.
> Spec: [`README.md`](README.md) · Agent guidance: [`AGENTS.md`](AGENTS.md)

**Current phase:** spec only — no application code in the repo yet (as of 2026-10-10).

**Owner tags** — the build is split into three non-overlapping parts; see [AGENTS.md § Work division](AGENTS.md#work-division--three-parts-strictly-non-overlapping) before picking up any item:

- `[1]` Part 1 — Live Session & Interface (scaffold, capture, STT→LLM→TTS→avatar, live UI)
- `[2]` Part 2 — Behavioral Telemetry (gaze, expressions, prosody, dashboard graphs)
- `[3]` Part 3 — Learning Engine & Integrations (rubric, transformer, drills, reports, MCP)
- `[1+3]` / `[2+3]` / `[all]` — shared items; each part builds only its own half, inside its own directories

**Only work items tagged with your part.** To request a change in someone else's part, add a one-line entry under [Log](#log).

## Setup

- [ ] Project scaffold — establish the real backend/frontend layout per AGENTS.md's directory-ownership map (README's install commands are placeholders) **and write the five `docs/contracts/` files** — day-0 unblocker: Parts 2/3 start nothing until this lands `[1]`
- [ ] Contract fixtures for parallel start — sample WAV/video clip `[2]`, fake session-record JSON `[3]`; start as soon as the contracts land, don't wait for the real capture pipeline `[2+3]`
- [ ] Environment variables wired: `GEMINI_API_KEY`, `ASSEMBLYAI_API_KEY`, `CARTESIA_API_KEY` (others request keys via Log) `[1]`
- [ ] Avatar platform chosen (README leaves it as `_[Avatar platform]_`) `[1]`
- [ ] Mic + camera capture working in the browser `[1]`

## P0 — Must have (core learning loop)

- [ ] **Live 3-question voice interaction** — AssemblyAI STT → Gemini → Cartesia TTS → avatar, at **< 1.5 s/turn** `[1]`
- [ ] **Answer Transformer** — side-by-side "what you said" vs. Felix STAR rewrite `[3]`
- [ ] **Visual behavioral dashboard** — Parselmouth speaking-rate/pause-timeline graphs, MediaPipe gaze `[2]`
- [ ] **One-click "Practice this weak area"** — gap → 30 s micro-drill → retry → score visibly improves `[1+3]` (drill + scoring `[3]`; running the retry as a session turn `[1]`)
- [ ] **Evidence-based feedback report** — every comment cites an exact transcript quote + timestamp `[3]` (consumes session records `[1]` + signal records `[2]`)

> **Demo-loop targets (per AGENTS.md § Sequencing & risk patches):** post-session scoring → report in **~5 s** from response end (async from the live turn, so outside the < 1.5 s budget). Fallback if the `[1+3]` drill-retry handshake is broken at demo time: retry as a plain session turn with a preset drill question + simplified scoring — Part 1 keeps that fallback path working.

## Behavioral analysis pipeline

- [ ] Gaze estimation (MediaPipe) `[2]`
- [ ] Facial action units / expressions (Py-feat) `[2]`
- [ ] Prosody: pitch, jitter, shimmer, speaking rate, pause duration (Parselmouth + STT timestamps) `[2]`
- [ ] Signals temporally correlated to each response `[2]`

## Assessment & remediation

- [ ] Rubric scoring → criterion-level + overall scores `[3]`
- [ ] Competency & learning-gap engine (gaps classified by domain, concept, severity) `[3]`
- [ ] Feedback report: strengths, gaps, recommendations — each gap maps to a learning outcome `[3]`
- [ ] Remediation plan generation (micro-lessons, targeted drills) `[3]`
- [ ] Spaced-repetition queue for weak outcomes (feeds next session) `[3]`

## P1 — High value

- [ ] **Rescue Mode** — silence > 5 s or hesitation → avatar scaffolds the learner out loud `[1]`
- [ ] Coach Mode — hints and model answers on demand `[1]`
- [ ] Avatar lip-sync (only if it doesn't add lag to the audio loop) `[1]`

## P2 — Cut for hackathon

- [ ] Educator cohort dashboard + JD crawling — **fallback: ship 3–4 pre-loaded roles + a paste-JD box** `[3]`
- [ ] Curriculum/content admin module `[3]`

## Integrations

> **Do last.** Per AGENTS.md § Sequencing & risk patches, nothing in the 60-second demo depends on these items — drop them before any P0/P1 item if time runs short.

- [ ] Haveloc (demonstration & deployment) `[3]`
- [ ] Upstream GitHub/portfolio MCP — feed student repo context into question generation `[3]`
- [ ] Downstream LMS MCP — Canvas / Google Classroom / Notion rubric export + drill assignment `[3]`

## 60-second demo checklist (acceptance test for the loop — integration point, run together)

- [ ] Pause 5 s → Rescue Mode scaffolds `[1]`
- [ ] Report shows Answer Transformer + vocal-jitter telemetry `[2+3]`
- [ ] "Practice this weak area" → 30 s micro-drill `[3]`
- [ ] Retry → score visibly improves `[1+3]`

## Roadmap (post-hackathon)

Tracked in [`README.md` § Roadmap](README.md) — learner progress dashboard, spaced-repetition scheduler, micro-drill library, evidence panel, multi-model decomposition, PDF exports, mobile mode, accessibility pass. Part mapping for roadmap items is in [AGENTS.md § Work division](AGENTS.md#work-division--three-parts-strictly-non-overlapping) (rule 6).

## Log

- 2026-10-10 — Patched the work division with four sequencing/risk addenda (day-0 scaffold+contracts unblocker, fixture-based parallel start for `[2]`/`[3]`, Part 3 learns-before-integrates ordering, ~5 s post-session scoring target + drill-retry demo fallback). Added to AGENTS.md § Sequencing & risk patches; checklist updated here (Setup, P0 note, Integrations note).
- 2026-10-10 — Divided the build into three non-overlapping parts (Live Session `[1]` / Behavioral Telemetry `[2]` / Learning Engine `[3]`); documented in AGENTS.md and tagged every checklist item here. Previous entries below.
- 2026-10-10 — Pulled spec updates (Answer Transformer, Rescue Mode, MCP). Created `AGENTS.md` and `PROGRESS.md`. No code yet.
