# AGENTS.md
Always read the progress.md whenever the work is being started or when you start to do. Make sure that there will be no conflicts when work is being pulled. Before starting, identify your part in **[Work division]
Also for each work or a part of the work done, make sure to commit in git.
(#work-division--three-parts-strictly-non-overlapping)** below — work only your part.

## Repo state

- Spec-only repository: the entire project is `README.md` — the product/architecture spec for **Felix**, an EdTech interview-coaching platform (Techashy Hackathon, EdTech track). **There is no application code, package manifest, build, test, or CI config yet.**
- The README's "Getting Started" section is an explicitly-marked placeholder (`_Fill in with your actual setup_`). Its commands (`pip install -r requirements.txt`, `npm run dev`, …) are aspirational — do not treat them as working instructions.
- Single branch `main` on `github.com:siddharthsai218/Felix`. Normal `git pull`/commit flow; no PR or release process defined.

## Working on the spec

- `README.md` is the source of truth for architecture, model stack, MVP priorities, and pitch. Prefer its executable claims (tables like "Hackathon MVP Priority" and "AI / ML Model Stack") over any prose you might generate.
- Constraints that must survive any edit:
  - **Positioning:** Felix is a career-readiness *learning tool* (EdTech), never a hiring screen or candidate-ranking tool (HR Tech). Behavioral signals (gaze, jitter, pauses) are coaching cues for self-awareness, **never** penalties or personality judgments.
  - **One LLM:** all real-time text reasoning runs on a single fast model (Gemini Flash-Lite) — this is a deliberate hackathon de-risking decision. Multi-model decomposition is explicitly post-hackathon (Roadmap).
  - **Build order:** nail the core learning loop first; the educator/cohort dashboard and JD crawling are P2 "cut for hackathon" items.
  - **Latency budget:** the live voice interaction must run at **< 1.5 s** (P0 requirement).
  - **MCP scope (per spec):** upstream GitHub/portfolio MCP feeds student code context into question generation; downstream LMS MCP (Canvas/Classroom/Notion) exports rubrics and assigns drills. The spec does not yet define which pipelines go through MCP — keep any addition consistent with the < 1.5 s budget.
- The README maintains a table of contents — update it when adding/removing a top-level `##` section.

## Work division — three parts (strictly non-overlapping)

The build is split into **three parts, one per contributor** (a human or the AI agent driving them). The point of this section is that parallel workers never touch the same work: **a task belongs to exactly one part. If it doesn't belong to your part, don't do it — leave a one-line request in `PROGRESS.md` (Log) for the owning part instead.**

| Part | Tag | Scope in one line |
|---|---|---|
| **Part 1 — Live Session & Interface** | `[1]` | Everything that happens *inside the live turn*: project scaffold, mic/camera capture, STT → LLM → TTS → avatar loop, Rescue/Coach Mode, session UI, the < 1.5 s latency budget |
| **Part 2 — Behavioral Telemetry** | `[2]` | Everything measured *about the learner*: gaze (MediaPipe), facial AUs (Py-feat), prosody (Parselmouth), temporal correlation, the visual behavioral dashboard |
| **Part 3 — Learning Engine & Integrations** | `[3]` | Everything produced *from a response*: rubric scoring, gap engine, Answer Transformer, evidence report, micro-drills, spaced repetition, roles/content, MCP servers, Haveloc |

### Directory ownership (exclusive — only the owner creates/edits files here)

The repo has no code yet. **Part 1's first task is the scaffold, and it must create this layout** so ownership is unambiguous from commit one. (`server/` is language-neutral; note the spec's behavioral stack — MediaPipe, Py-feat, Parselmouth — is Python, so `server/behavioral/` must be able to run Python even if the rest is Node.)

```
frontend/src/app/          [1]  shell, routing, session screens, live controls, route slots
frontend/src/behavioral/   [2]  behavioral dashboard charts/components
frontend/src/report/       [3]  feedback report, Answer Transformer, drill entry
server/core/               [1]  config, .env wiring, single Gemini Flash-Lite client wrapper
server/session/            [1]  turn engine, AssemblyAI STT, Cartesia TTS, avatar, capture
server/session/prompts/    [1]  live-turn prompts: questions, follow-ups, Rescue Mode, Coach Mode
server/behavioral/         [2]  gaze, facial AUs, prosody, signal↔response correlation
server/learning/           [3]  rubric, gap engine, evidence extraction, transformer, drills, spaced rep
server/learning/prompts/   [3]  post-session prompts: scoring, STAR rewrite, report synthesis, drills
mcp/                       [3]  upstream GitHub MCP + downstream LMS MCP servers
content/roles/             [3]  pre-loaded target roles, question banks, paste-JD intake
deploy/                    [3]  Haveloc demo/deployment config
docs/contracts/            producer-owned interface contracts (see below)
README.md · AGENTS.md · PROGRESS.md   shared: edit only your own lines/entries; never reorganize another part's section
```

Cross-part **reading/importing** (consuming another part's API or exported component) is fine; **editing** another part's files is not.

### Interfaces between parts (the only coupling allowed)

Each contract lives in `docs/contracts/`, is written and maintained by the **producing** part, and consumers adapt to it (change requests go to `PROGRESS.md` Log).

1. **Capture handoff `[1]` → `[2]`** — Part 1 owns the microphone and camera devices and hands Part 2: per-response audio, video frames, and STT word-level timestamps. Part 2 never touches capture devices, permissions, or the camera UI.
2. **Session record `[1]` → `[3]`** — per response: question asked, transcript + timestamps, session/learner id. Part 3 never joins the live loop.
3. **Signal record `[2]` → `[3]`** — per response JSON: speaking rate, pause segments, pitch/jitter/shimmer, gaze and expression stats — all timestamped. Part 2 measures numbers; **Part 3 owns how they are worded** in feedback (coaching cues, never penalties).
4. **Drill / retry `[3]` → `[1]`** — Part 3 produces a `DrillSpec` (question, target learning outcome); Part 1 runs it as an ordinary session turn; Part 3 re-scores it.
5. **LLM client `[1]` → `[1]` + `[3]`** — one Gemini Flash-Lite wrapper in `server/core/`, used by both prompt owners. Live prompts live in `server/session/prompts/` (`[1]`), post-session prompts in `server/learning/prompts/` (`[3]`). No second model anywhere.

### Rules that keep the parts from overlapping

1. **Stay in your directories.** If a fix requires editing another part's file, don't — log a one-line request in `PROGRESS.md`. Sole exception: adding your part's entry at a registration point Part 1 explicitly defines (route slot, menu, registry) — note it in the Log.
2. **Stay in your checklist items.** Every `PROGRESS.md` item is tagged `[1]`, `[2]`, `[3]`, `[1+3]`, or `[all]`. Work only tags that include your part. `[all]` items are integration/acceptance tests — verify them together, but implement each part of them only inside your own directories.
3. **Latency is Part 1's budget.** The live turn stays **< 1.5 s**. Parts `[2]` and `[3]` must never add synchronous work to the live path — behavioral analysis and scoring run after the turn/session (async or post-session).
4. **Never build another part's feature "to help."** Two implementations of one feature is exactly the confusion this division exists to prevent.
5. **Environment keys:** Part 1 owns `.env` / `.env.example` wiring. Other parts request their keys through the Log rather than editing env files directly.
6. Roadmap (post-hackathon) mapping, for when you get there: dashboards, drills library, exports, spaced-repetition scheduler, evidence panel, role pathways → `[3]`; live-session extras (STAR scaffolding mid-response, mobile mode, accessibility pass, multi-model decomposition of the LLM client) → `[1]`.

All spec constraints in [Working on the spec](#working-on-the-spec) apply to all three parts.

### Sequencing & risk patches (agreed 2026-10-10)

Four addenda to the division, agreed before any code exists:

1. **Day 0 — scaffold + contracts first.** Part 1's very first task is the scaffold *and* the five `docs/contracts/` files. Parts 2 and 3 start nothing until this lands — keep it a running skeleton, not features.
2. **Build against fixtures.** As soon as the contracts exist, Parts 2/3 may build and test against fixture data (sample WAV/video clip for `[2]`, fake session-record JSON for `[3]`) without waiting for the real capture/STT pipeline. Fixture files live in the consuming part's own directory.
3. **Part 3 ordering — learning loop before integrations.** P0 learning items (rubric → gap engine → Answer Transformer → evidence report → drills) come first; the two MCP servers and Haveloc are last and droppable if time runs short. Nothing in the 60-second demo depends on the downstream LMS MCP.
4. **Demo-loop resilience.** "Report appears instantly" is now an explicit target: Part 3's post-session scoring aims for **~5 s from response end to report** (async from the live turn, so still outside the < 1.5 s budget). If the `[1+3]` drill-retry handshake is broken at demo time, the fallback is: retry runs as a plain session turn with a preset drill question and simplified scoring — Part 1 owns keeping that fallback path working.

## Environment notes

- The user-level instruction to prefix shell commands with `rtk` does not apply here: `rtk` is not installed in this environment (fails with `command not found`). Use plain commands.
