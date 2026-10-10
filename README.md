# 🎓 Felix — Adaptive Interview-Skills Coach

> **Track:** EdTech · **Event:** Techashy Hackathon

**Felix** is an adaptive **interview-skills learning platform** for students and job-seekers. It teaches people *how to interview* through guided practice, formative coaching, and personalized remediation — not by simply grading them.

The interview is the **practice activity**. The **learning** is the point.

> **Positioning (read this before pitching):** Felix is a *career-readiness learning tool*. It is **not** a hiring screen. We coach learners; we do not evaluate candidates for employers.

---

## 📖 Table of Contents

- [Why Felix? (The EdTech Case)](#-why-felix-the-edtech-case)
- [The Learning Loop](#-the-learning-loop)
- [Key Features](#-key-features)
- [Pedagogy & Learning Design](#-pedagogy--learning-design)
- [User Roles](#-user-roles)
- [System Architecture](#-system-architecture)
- [How a Session Works](#-how-a-session-works)
- [The 60-Second Demo](#-the-60-second-demo)
- [Competency & Evaluation Framework](#-competency--evaluation-framework)
- [AI / ML Model Stack](#-ai--ml-model-stack)
- [Functional Requirements](#-functional-requirements)
- [Non-Functional Requirements](#-non-functional-requirements)
- [Data Categories](#-data-categories)
- [Hackathon MVP Priority](#-hackathon-mvp-priority)
- [Pitch Structure](#-pitch-structure-35-minutes)
- [Getting Started](#-getting-started)
- [Roadmap](#-roadmap)
- [Team](#-team)
- [License](#-license)

---

## 🎯 Why Felix? (The EdTech Case)

University career centers have roughly **one counselor for every 500 students**. Most students fail their first interviews not because they lack skill, but because of *delivery* — uncalibrated pacing, lost confidence, and **zero objective feedback they can learn from**.

Traditional mock interviews are **summative**: you're told you did poorly, then left to figure out why. Felix is **formative**: it diagnoses the gap, teaches the concept, assigns targeted practice, and tracks mastery over time.

**Who it's for:** placement cells, bootcamps, first-generation and underserved students who can't afford private career coaching.

**This is EdTech because:**
- ✅ The learner repeats, improves, and *learns* — there is no hiring decision attached
- ✅ Feedback is instructional ("here's the gap, here's the concept, here's how to fix it")
- ✅ Progress is tracked as **learning outcomes mastered**, not as an employability score
- ✅ Educators can assign practice and monitor a cohort's growth

**Felix vs. a screening tool — same engine, inverted purpose:**

| | Screening tool (HR Tech) | **Felix (EdTech)** |
|---|---|---|
| Who it serves | Recruiters filtering candidates | **Students learning to interview** |
| Dashboard | Recruiter view, rankings, cheat detection | **Learner mastery + educator cohort view** |
| Behavioral analysis | Proctoring / flag misconduct | **Coaching cues for self-awareness** |
| End goal | Hire / reject decision | **Learn, practice, improve** |
| Track fit  | ✅ EdTech |

---

## 🔁 The Learning Loop

Felix is built around a pedagogical loop, not a one-shot evaluation:

```
   ┌──────────────────────────────────────────────────────────┐
   │                                                          │
   ▼                                                          │
PRACTICE ──► FORMATIVE ──► DIAGNOSE ──► REMEDIATE ──► REVIEW ─┘
(interview)   COACHING     THE GAP      (micro-       (retrieval
              (hints,      (learning     lessons,      & spaced
              model        outcomes      drills)       repetition)
              answers)     not met)
```

1. **Practice** — a realistic, avatar-led mock interview
2. **Formative coaching** — hints, model answers, and on-the-spot nudges *during* the session
3. **Diagnose** — map weaknesses to specific **learning outcomes** and concepts
4. **Remediate** — auto-generated micro-lessons and targeted drills for each gap
5. **Review** — spaced repetition and mastery checks so skills stick

---

## ✨ Key Features

### 1. 🌟 The "Answer Transformer" (Before vs. After STAR Rewrite)
Traditional mock interviews tell students: *"Your answer lacked structure."* That is not helpful. Felix shows an immediate **side-by-side comparison**:
* **What you said:** *"Yeah so basically we had bugs in our database and it was crashing so I like checked logs and restarted the pod."*
* **The Felix STAR Rewrite:** *"When our database service experienced repeated pod crashes, I analyzed the Prometheus logs, identified an OOMKilled exception, and re-tuned the memory limits to restore 99.9% uptime."*

*Why this wins:* It instantly proves this is an **educational learning tool**, not a scorecard. It literally teaches the candidate the professional vernacular and STAR structure on their exact real-life examples.

### 2. 🌟 "Rescue Mode" (Live Pedagogical Scaffolding)
If the student freezes, pauses for $> 5$ seconds, or says *"Uh, I don't know..."*, the avatar doesn't stare silently like an interrogator. Felix steps in to scaffold the response:
* **Felix:** *"Take a breath. Think about the time you worked with databases—did you ever have to troubleshoot a slow query or fix an error?"*

*Why this wins:* In education, this is called **pedagogical scaffolding (Vygotsky's Zone of Proximal Development)**. Traditional interviewers fail you; a true tutor rescues you and guides you to discover the answer. Judges in the EdTech track will love this distinction.

### 3. The Learning Loop, Live — One-Click Micro-Drill ⭐
When a gap is detected, the report's **"Practice this weak area"** button launches a **30-second targeted micro-drill** on exactly that gap. The learner retries and **watches the score improve in the same session**. This proves Felix is a *learning* tool, not a test.

### 4. Evidence-Based Feedback (not generic comments)
Every piece of feedback cites the **exact transcript line and timestamp** it came from — e.g., *"At 0:45 you said '…', then paused 4 seconds."* Never a vague "you sounded nervous"; always the evidence, then the fix.

### 5. Adaptive Interview Practice (Practice Mode)
Dynamic, JD-specific questioning that adjusts difficulty in real time. Includes a **Coach Mode** with hints and model answers so learners *see how a strong answer is built*.

### 6. Multimodal Behavioral Coaching (not scoring)
Gaze, facial expression, and speech prosody are surfaced as **self-awareness insights** — *"You paused 4 seconds here; that's likely where confidence dropped — try this structure next time."* Never punitive, never a personality judgment.

### 7. Competency & Learning-Gap Engine
Maps performance to explicit **learning outcomes** ("Apply the STAR method", "Explain time complexity") and classifies gaps by **domain, concept, and severity** — the way a tutor flags misunderstood topics.

### 8. Personalized Learning Path & Micro-Drills
Generates a remediation plan: **micro-lessons**, targeted documentation, and **2-minute drills** ("Elevator Pitch Trainer", "Behavioral Curveball"). Weak areas feed the *next* session so practice is personalized.

### 9. Mastery Progression & Spaced Repetition
Tracks outcomes across sessions and resurfaces weak ones on a spaced schedule until mastered — moving learners from *attempt* to *retention*.

### 10. Educator & Cohort Dashboard
Placement cells and bootcamps can assign practice, view a cohort's **competency heatmap**, and spot students who need human help — keeping the instructor in the loop.

### 11. Low-Latency Avatar Interface
A real-time avatar runs the interview with synchronized speech and minimal delay, so practice feels like a real conversation.

### 12. Curriculum & Content Management
An admin/educator module for creating **learning units and question banks** tied to target roles, with optional JD crawling to bootstrap content.

### 13. 🔌 Model Context Protocol (MCP) Extensibility
Felix adopts the open **Model Context Protocol (MCP)** standard across two high-impact integration surfaces:
* **Upstream Context (GitHub & Portfolio MCP):** Securely connects the LLM brain to the student's actual GitHub repositories and project code. Instead of asking generic trivia, Felix dynamically grills the candidate on real architectural decisions from their own projects (*"Why did you choose an LRU cache over LFU in your Go distributed-cache repo?"*).
* **Downstream Integration (LMS & Career Portal MCP):** Connects post-session evaluations directly to university learning systems (Canvas, Google Classroom, Notion) to automatically log rubric mastery scores and assign targeted micro-drills as homework.

---

## 🧑‍🏫 Pedagogy & Learning Design

Felix isn't a quiz — the learning theory is explicit:

| Principle | How Felix applies it |
|---|---|
| **Formative assessment** | Coaching and hints *during* the interview, not just a final grade |
| **Scaffolding & Rescue Mode** | When silence (>5s) or hesitation is detected, Felix steps in to guide the student's thinking (Vygotsky's Zone of Proximal Development) rather than letting them fail |
| **Model Demonstration** | The **Answer Transformer** gives direct side-by-side STAR rewrites of the student's own words so they see what mastery looks like |
| **Learning objectives** | Answers mapped to concrete, per-role competencies |
| **Retrieval practice** | Repeated mock sessions with varied questions |
| **Spaced repetition** | Weak outcomes resurface on a spaced schedule |
| **Mastery-based progression** | Learners advance when outcomes are demonstrated, not on a timer |
| **Actionable feedback** | Every gap gets a concept explanation + a next step |

---

## 👥 User Roles

| Role | Description |
|---|---|
| **Learner (student)** | Practices interviews, receives coaching, follows a personalized learning path |
| **Educator / Mentor** | Assigns practice, monitors cohort competency, intervenes where humans are needed |
| **Administrator** | Manages target roles, learning units, and question banks (incl. crawling) |

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                         FELIX LEARNING SESSION                         │
│                                                                        │
│   ┌────────────┐   ┌──────────────┐   ┌────────────────────────────┐   │
│   │  Avatar    │◄──│  Cartesia    │◄──│  Question Generation &     │   │
│   │ (interview │   │  (TTS)       │   │  Coaching (LLM)            │   │
│   │  + coach)  │   └──────────────┘   └─────────────▲──────────────┘   │
│   └─────┬──────┘ presents questions/hints           │ context +        │
│         ▼                                           │ competency map   │
│   ┌────────────┐   ┌──────────────┐   ┌─────────────┴──────────────┐   │
│   │  Learner   │──►│  AssemblyAI  │──►│  Transcript +              │   │
│   │ (voice +   │   │  (STT)       │   │  Timestamps                │   │
│   │  video)    │   └──────────────┘   └─────────────▲──────────────┘   │
│   └─────┬──────┘                                    │                  │
│         │ video                           ┌─────────┴──────────────┐   │
│         ▼                                 │  UPSTREAM MCP SERVER   │   │
│   ┌───────────────────────────────────┐   │  (GitHub Repos/Projects│   │
│   │   MULTIMODAL BEHAVIORAL COACHING  │   │  & Student Portfolios) │   │
│   │  MediaPipe · Py-feat · Parselmouth│   └────────────────────────┘   │
│   └─────────────────┬─────────────────┘                                │
│                     ▼                                                  │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │     COMPETENCY & LEARNING-GAP ENGINE (rubric → outcomes)       │   │
│   └─────────────────┬──────────────────────────────────────────────┘   │
│                     ▼                                                  │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │    FEEDBACK REPORT + REMEDIATION PLAN + SPACED-REVIEW QUEUE    │   │
│   │    (Answer Transformer · micro-lessons · drills)               │   │
│   └─────────────────┬──────────────────────────────────────────────┘   │
│                     │                                                  │
│                     ├────────────────────────────────────────┐         │
│                     ▼                                        ▼         │
│   ┌──────────────────────────────────┐   ┌─────────────────────────┐   │
│   │ LEARNER & COHORT DASHBOARDS      │   │  DOWNSTREAM MCP SERVER  │   │
│   │ (mastery heatmaps & progression) │   │  (Canvas LMS / Notion)  │   │
│   └──────────────────────────────────┘   └─────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ How a Session Works

1. **Set goal** — learner selects a target role (or an educator assigns one).
2. **Warm-up** — Felix reviews due spaced-repetition items from previous sessions.
3. **Practice** — avatar asks role-specific questions; difficulty adapts in real time.
4. **Coach & Rescue** — hints and model answers on demand (Coach Mode); if hesitation (>5s) is detected, **Rescue Mode** steps in to scaffold the candidate out loud.
5. **Capture** — speech → text with timestamps; camera → gaze + facial signals.
6. **Analyze** — behavioral measurements temporally correlated to each response.
7. **Assess formatively** — responses mapped to learning outcomes via the rubric.
8. **Remediate & Transform** — feedback report featuring the **Answer Transformer** (side-by-side STAR rewrite) + micro-lessons + drills + spaced-review queue.
9. **Repeat** — the next session targets unresolved outcomes.

---

## 🎬 The 60-Second Demo

The demo that wins isn't the interview — it's the **learning loop closing**.

1. **Answer badly on purpose & trigger Rescue Mode:**
   * Pause awkwardly for 5 seconds and mumble.
   * Watch the avatar lean in with active scaffolding: *"Take a breath. Think about the time you worked with databases..."*
2. **Report appears instantly — show the Answer Transformer & Telemetry:**
   * **Multimodal Telemetry:** *"Felix detected a 40% spike in vocal jitter at 0:45 and a 4-second hesitation — this is where confidence dropped."*
   * **The Answer Transformer:** Point out the side-by-side view: *"Here is the student's rambling answer, and here is Felix teaching them the exact STAR phrasing."*
3. **Click "Practice this weak area"** → a **30-second micro-drill** targets exactly that gap.
4. **Retry** → the learner answers again using the STAR framework → **the score visibly improves**.

> If judges see a student get measurably better *during* the demo, Felix stops being "another AI interviewer" and becomes a true learning tool. **This step is the pitch.**

---

## 📊 Competency & Evaluation Framework

Every criterion produces a **score** plus **supporting feedback**, and maps to a **learning outcome** the learner either demonstrates or still needs work on.

| Dimension | Description | Example Learning Outcome |
|---|---|---|
| **Technical Knowledge** | Understanding and application of role-specific concepts | Explain the concept correctly and apply it |
| **Communication** | Effectiveness and organization of verbal communication | Structure an answer so a listener can follow it |
| **Clarity** | Clarity and coherence of responses | State the point first, then support it |
| **Confidence** | Confidence from verbal and behavioral cues | Reduce filler words and hesitation under pressure |
| **Problem Solving** | Ability to analyze and respond to problem-based questions | Break a problem into steps out loud |
| **Relevance** | Alignment with the question and target role | Answer the question asked, for this role |
| **Non-Verbal Communication** | Relevant facial, visual, and behavioral indicators | Maintain comfortable eye contact and pacing |
| **Overall Performance** | Combined assessment based on the defined rubric | — |

The final report summarizes **overall performance, strengths, areas for improvement, and actionable recommendations**.

> ⚠️ **Ethical design principle:** Behavioral signals (gaze, jitter, pause duration) are **coaching cues for self-awareness**, not penalties. Felix flags *patterns to practice*, never personality or neurotype.
>
> **Prepare for the question** — *"Aren't you penalizing students who look away to think? What about neurodivergent learners?"*
> → *"Felix never penalizes behavioral signals. Gaze and vocal patterns are surfaced as self-awareness coaching — the same way a speech coach would say 'you tend to speed up when you're nervous.' The learner decides what to work on, and we state this explicitly in our ethical design principles."*

---

## 🤖 AI / ML Model Stack

For the hackathon, **one fast LLM runs all text reasoning** — this is deliberate and is the biggest de-risking decision in the project.

| Component | Selected Model / Technology | Purpose |
|---|---|---|
| **Core Reasoning — one LLM for everything real-time** | **Gemini 3.1 Flash-Lite** | Question generation, contextual follow-ups, answer scoring, **evidence extraction**, and report synthesis |
| Speech-to-Text | AssemblyAI | Converts learner speech into text (real-time + batch) |
| Text-to-Speech | Cartesia | Produces the coach's spoken responses |
| Gaze Analysis | MediaPipe | Estimates gaze direction and camera-facing behavior |
| Facial Analysis | Py-feat | Detects facial expressions / action units |
| Speech & Prosody Analysis | Parselmouth + STT timestamps | Pitch, jitter, shimmer, speaking rate, pause duration |
| Avatar | Beyond Presence | Visual interview + coach agent |


> **Why one LLM?** Consolidating all text reasoning onto a single fast model (Gemini 3.1 Flash-Lite — free tier, low latency) removes the #1 hackathon risk: too many API keys, rate limits, and points of failure. Splitting into specialized models per task is a **post-hackathon optimization** (see Roadmap), not a demo dependency.

**Modular by design** — each component is independently replaceable, so the pipeline degrades gracefully if any single service is unavailable.

### Free / Open-Source Alternatives (for a zero-cost build)

| Layer | Free alternative |
|---|---|
| STT | Whisper / WhisperX (self-hosted) |
| TTS | Kokoro / Piper / Coqui XTTS (local) |
| LLMs | Llama 3 / Qwen 2.5 / DeepSeek via Ollama or vLLM |
| Avatar | SadTalker / MuseTalk / Wav2Lip (GPU) | Beyond Presence
| Gaze / Facial / Prosody | MediaPipe · Py-feat · Parselmouth (already free & open-source) |

### Model Pinning & Fallback

- **Pin the exact stable endpoint** in the `server/core/` LLM wrapper: `gemini-3.1-flash-lite`. Always use the stable string — the `-preview` variant (`gemini-3.1-flash-lite-preview`) is **shut down** and returns an error.
- **Newer Flash-Lite option:** `gemini-3.5-flash-lite` (stable) is Google's currently recommended Flash-Lite for new projects. It is a drop-in swap via the same key — re-verify the free tier and rate limits before switching, since predictable free-tier access is the whole point of the one-LLM decision.
- **Gemini-native audio as a fallback only:** Google now offers STT (`gemini-3.5-transcribe`, word-level timestamps), TTS (`gemini-3.8-flash-lite-tts`), and a Live API (`gemini-3.8-live`). These overlap with AssemblyAI/Cartesia, so they are **not** part of the pipeline — but they run on the same Google key and are a viable emergency fallback if a paid service's key or rate limit fails at demo time. Note that `gemini-3.1-flash-lite` does **not** support the Live API.
- **Latency rule still applies:** any LLM swap must keep the live turn **< 1.5 s**; validate against the budget before adopting.

---

## ✅ Functional Requirements

**Learner & Session Management**
- Learner profile information required to conduct practice
- Initiation and termination of practice sessions
- Selection or submission of a **target role / learning goal**
- Maintenance of session details and learning history

**Content & Curriculum Management**
- Create and manage target roles and **learning units** via the admin module
- Generate practice questions from the selected role
- Maintain reusable question banks tied to roles
- Generate contextual follow-up questions from learner responses
- Select and sequence questions per the configured flow

**Real-Time Interview Interaction**
- Present questions and coaching hints through the avatar
- Capture spoken responses in real time
- Convert speech to text for processing
- Generate and deliver spoken coach responses
- Synchronize avatar behavior with the interaction
- Maintain a continuous, low-latency conversational flow

**Multimodal Behavioral Coaching**
- Analyze non-verbal behavior during practice
- Estimate gaze direction / camera-facing behavior
- Detect facial expressions / action units
- Analyze speaking rate, pauses, pitch variation, jitter, shimmer
- Correlate measurements to responses and timestamps
- Provide aggregated signals to the assessment module

**Formative Assessment, Feedback & Remediation**
- Evaluate technical knowledge and response quality
- Assess communication and delivery skills
- Score responses against a predefined rubric and map to learning outcomes
- Compute criterion-level scores and an overall score
- Identify strengths and areas for improvement
- Generate micro-lessons, drills, and a remediation plan
- Queue weak outcomes for spaced repetition

**Educator & Administration**
- Secure administrative and educator access
- Cohort competency dashboard and assignment of practice
- Manage target roles, learning units, and question banks
- Retrieve role/curriculum information via crawling (where applicable)

**External Integration & Protocol Standards**
- Integrate with **Haveloc** for demonstration and deployment
- **Model Context Protocol (MCP)** standard implementation:
  - **Upstream GitHub MCP Server:** Reads student repository file trees, commit histories, and code snippets to generate context-specific technical questions.
  - **Downstream LMS MCP Server:** Connects with Canvas LMS, Google Classroom, and Notion to export criterion evaluation rubrics and assign remediation micro-drills.
- Exchange required information between Felix and Haveloc

---

## 🛡️ Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Minimal perceptible latency; speech processing and coach responses within acceptable time; support expected concurrent sessions |
| **Usability** | Clear, inviting learning experience; no specialized technical knowledge required; comprehensible feedback |
| **Reliability** | Preserve session data throughout; component failures shouldn't cause unnecessary data loss; consistent evaluation for the same input and criteria |
| **Security & Privacy** | Protect learner info, transcripts, recordings, and results; restrict admin/educator access; secure inter-service data transmission |
| **Scalability** | Support growth in learners, sessions, and stored data; components scale independently |
| **Maintainability** | Modular architecture; components replaceable/upgradeable without touching unrelated modules |

---

## 🗃️ Data Categories

| Data Category | Description |
|---|---|
| Learner Data | Information required to conduct and manage practice |
| Target Role Data | Role, responsibilities, skills, and role-specific requirements |
| Learning Unit Data | Learning objectives, competencies, and curriculum content |
| Question Data | Pre-generated and dynamically generated questions |
| Response Data | Responses captured during practice |
| Transcript Data | Text generated from spoken responses |
| Behavioral Data | Non-verbal observations and measurements |
| Assessment Data | Criterion-level scores and learning-outcome results |
| Feedback Data | Strengths, weaknesses, and recommendations |
| Learning History | Records and mastery progression across completed sessions |

---

## 🏁 Hackathon MVP Priority

Don't build the whole spec before judging — nail the core learning loop.

| Priority | Feature | Why It Matters |
|---|---|---|
| **P0 — Must Have** | Live 3-question voice interaction | Must run smoothly at **< 1.5 s** latency |
| **P0 — Must Have** | **The Answer Transformer (STAR Rewrite)** | Shows immediate pedagogical value: converts candidate's messy speech into professional phrasing side-by-side |
| **P0 — Must Have** | Visual behavioral dashboard | Parselmouth & MediaPipe graphs (speaking rate, pause timeline, gaze) — the secret sauce |
| **P0 — Must Have** | **One-click "Practice this weak area" retry** | Highest-ROI feature: gap → micro-drill → retry → **visible improvement** |
| **P0 — Must Have** | Evidence-based feedback report | Cites exact transcript quotes + timestamps, not generic LLM comments |
| **P1 — High Value** | **"Rescue Mode" Scaffolding** | Intervenes when silence (>5s) or hesitation occurs, proving it's an active tutor, not a test |
| **P1 — Nice to Have** | Avatar lip-sync | Impressive — never let it block audio if it adds lag |
| **P2 — Cut for Hackathon** | Educator cohort dashboard & JD crawling | Ship 3–4 great pre-loaded roles + a paste-JD box instead |

---

## 🎤 Pitch Structure (3–5 Minutes)

| Slide | Time | Content |
|---|---|---|
| **1 — The Hook** | 30 s | *"Career centers have one counselor for every 500 students. Most students fail their first interviews not for lack of knowledge — but because nobody coached them on delivery, pacing, and confidence. Private coaching costs ₹5,000–₹15,000 per session. Felix makes it free and unlimited."* |
| **2 — Live Demo** ⭐ | 90 s | Answer one question *badly on purpose* (pause 5s to trigger **Rescue Mode** scaffolding) → report appears instantly with **Answer Transformer** (side-by-side STAR comparison) & Parselmouth vocal jitter telemetry → click **"Practice this weak area"** → run the micro-drill → show the score improve. |
| **3 — How It Works** | 30 s | Show the architecture diagram. *"MediaPipe and Parselmouth provide non-verbal telemetry, while the Model Context Protocol (MCP) connects Felix directly to the student's GitHub repos and college LMS. This isn't a wrapper; it's an extensible multimodal learning engine."* |
| **4 — EdTech Impact** | 30 s | *"Educators assign practice to a whole cohort and see a competency heatmap of who needs human help. Each student gets a personalized learning path — not just a score."* |
| **5 — Roadmap + Ask** | 15 s | Spaced repetition, mobile practice mode, exportable reports for placement records. |

**The moment that wins:** during the demo, judges see **Rescue Mode** help a stuck student, the **Answer Transformer** teach them the exact STAR phrasing, and the **micro-drill** show measurable improvement. No other team will demonstrate an actual learning journey live.

---

## 🚀 Getting Started

*(_Fill in with your actual setup — example structure below._)*

### Prerequisites
- Node.js / Python
- API keys: Gemini (single LLM), AssemblyAI (STT), Cartesia (TTS)
- Microphone + camera access for the practice session

### Installation

```bash
git clone <repo-url>
cd felix
# backend
pip install -r requirements.txt   # or: npm install
npm run dev
# frontend (if separate)
cd frontend && npm install && npm run dev
```

### Environment Variables

```env
GEMINI_API_KEY=your_key_here
ASSEMBLYAI_API_KEY=your_key_here
CARTESIA_API_KEY=your_key_here
```

---

## 🗺️ Roadmap

- [ ] Learner progress dashboard (mastery over time)
- [ ] Spaced-repetition scheduler
- [ ] Educator/cohort dashboard with competency heatmap
- [ ] Micro-drill library ("Elevator Pitch Trainer", "Behavioral Curveball")
- [ ] Evidence panel linking every score to its transcript timestamp
- [ ] STAR-method scaffolding during responses
- [ ] Role-specific learning pathways (Frontend @ Google, PM @ Stripe, …)
- [ ] Multi-model decomposition (specialized models per task) for higher accuracy at scale
- [ ] Exportable learning reports (PDF) for placement records
- [ ] Mobile-friendly practice mode
- [ ] Accessibility pass (captions, reduced-motion, neurodiversity-safe defaults)

---

## 👥 Team

*(_Add team member names, roles, and links here._)*

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
