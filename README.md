# 🎓 Felix — Adaptive Interview-Skills Coach

> **Track:** EdTech · **Event:** Techashy Hackathon

**Felix** is an adaptive interview-skills learning platform for students and job-seekers. It teaches learners *how to interview* through guided practice, formative coaching, and personalized remediation — rather than simple summative grading.

The interview is the **practice activity**. The **learning** is the objective.

> **Positioning:** Felix is a career-readiness learning tool. It is not a hiring screen or candidate ranking tool. It coaches learners; it does not evaluate candidates for employers.

---

## 📖 Table of Contents

- [The EdTech Case](#-the-edtech-case)
- [The Learning Loop](#-the-learning-loop)
- [Key Features](#-key-features)
- [Pedagogy & Learning Design](#-pedagogy--learning-design)
- [User Roles](#-user-roles)
- [System Architecture](#-system-architecture)
- [How a Session Works](#-how-a-session-works)
- [Competency & Evaluation Framework](#-competency--evaluation-framework)
- [Ethical Design Principles](#-ethical-design-principles)
- [AI / ML Model Stack](#-ai--ml-model-stack)
- [Functional Requirements](#-functional-requirements)
- [Non-Functional Requirements](#-non-functional-requirements)
- [Data Categories](#-data-categories)
- [Hackathon MVP Priority](#-hackathon-mvp-priority)
- [Getting Started](#-getting-started)
- [Roadmap](#-roadmap)
- [Team](#-team)
- [License](#-license)

---

## 🎯 The EdTech Case

University career centers face significant counselor-to-student ratios (often exceeding 1:500). Most students stumble in early interviews not due to technical incompetence, but delivery friction: uncalibrated pacing, nervousness, and lack of actionable, objective feedback.

Traditional mock interviews are **summative**: candidates receive a score and arbitrary critique without remediation. Felix is **formative**: it diagnoses specific learning gaps, teaches the underlying concept, assigns targeted micro-drills, and tracks mastery progression over time.

### Felix vs. Screening Tools

| Dimension | Screening Tools (HR Tech) | Felix (EdTech) |
|---|---|---|
| **Audience** | Recruiters filtering applicants | Students mastering delivery |
| **Interface** | Recruiter proctoring & cheat detection | Formative mastery dashboard |
| **Behavioral Signals** | Flagging misconduct / penalties | Self-awareness coaching cues |
| **Outcome** | Hire / reject decision | Learn, practice, remediate |

---

## 🔁 The Learning Loop

Felix implements an active pedagogical loop:

```
   ┌──────────────────────────────────────────────────────────┐
   │                                                          │
   ▼                                                          │
PRACTICE ──► FORMATIVE ──► DIAGNOSE ──► REMEDIATE ──► REVIEW ─┘
(interview)   COACHING     THE GAP      (micro-       (retrieval
              (hints,      (learning     drills)       & spaced
              model        outcomes)                   repetition)
              answers)
```

1. **Practice:** Adaptive interview simulation led by a real-time conversational AI avatar.
2. **Formative Coaching:** In-turn hints, model structures, and real-time scaffolding.
3. **Diagnose:** Automatic mapping of weaknesses to granular learning outcomes.
4. **Remediate:** Immediate 30-second targeted micro-drills and STAR re-structuring.
5. **Review:** Spaced repetition queue targeting unmastered outcomes across sessions.

---

## ✨ Key Features

### 1. The Answer Transformer (Verbatim vs. STAR Rewrite)
Side-by-side comparative analysis of candidate delivery:
- **Verbatim Response:** Identifies filler words, rambling syntax, and unquantified statements.
- **Felix STAR Rewrite:** Restructures the learner's own example into Situation, Task, Action, and measurable Result with professional phrasing.

### 2. Live Rescue Mode (Pedagogical Scaffolding)
If a learner pauses for $> 5$ seconds or demonstrates hesitation, the interview avatar actively intervenes with contextual scaffolding (Vygotsky's Zone of Proximal Development) rather than remaining silent:
> *"Take a breath. Consider the database bottlenecks you observed in that project — what triggered the issue and what did you inspect first?"*

### 3. One-Click Remediation Drills
Identified gaps include a direct action: launching a 30-second targeted micro-drill on that specific competency. The learner retries immediately and verifies score improvement.

### 4. Evidence-Based Feedback
Every assessment comment directly references exact transcript lines and timestamps (e.g., *"At 0:45 you paused 4 seconds after mentioning memory allocation"*).

### 5. Multimodal Behavioral Coaching
Non-verbal signals (gaze stability, speaking rate, pitch variation, vocal jitter) are extracted via computer vision and acoustic models to provide delivery self-awareness.

### 6. Model Context Protocol (MCP) Integration
- **Upstream Context (GitHub & Portfolio MCP):** Reads candidate repository structure, commit logs, and code snippets to generate authentic technical questions on their actual projects.
- **Downstream LMS Integration (LMS MCP):** Connects evaluations to educational systems (Canvas, Google Classroom, Notion) to record mastery scores and assign practice.

---

## 🧑‍🏫 Pedagogy & Learning Design

| Educational Principle | Implementation in Felix |
|---|---|
| **Formative Assessment** | Real-time coaching cues rather than post-facto rejection |
| **Zone of Proximal Development** | Rescue Mode scaffolding when candidate experiences cognitive block |
| **Model Demonstration** | Side-by-side STAR Answer Transformation using candidate's own content |
| **Retrieval Practice** | Variable questioning across practice sessions |
| **Spaced Repetition** | Weak learning outcomes resurface on an automated interval |
| **Actionable Feedback** | Explicit citations of timestamped speech paired with specific fixes |

---

## 👥 User Roles

- **Learner:** Practices live sessions, uses Coach Mode hints, reviews Answer Transformations, and completes remediation drills.
- **Educator / Mentor:** Assigns role tracks, reviews cohort competency heatmaps, and tracks progression.
- **Administrator:** Manages question banks, role templates, and LMS integration points.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                         FELIX LEARNING PLATFORM                        │
│                                                                        │
│   ┌────────────┐   ┌──────────────┐   ┌────────────────────────────┐   │
│   │  Avatar    │◄──│  Cartesia    │◄──│  Gemini Flash-Lite Engine  │   │
│   │  Interface │   │  (TTS - WAV) │   │  (Live Reasoning & Prompts)│   │
│   └─────┬──────┘   └──────────────┘   └─────────────▲──────────────┘   │
│         ▼                                           │                  │
│   ┌────────────┐   ┌──────────────┐                 │                  │
│   │  Learner   │──►│ AssemblyAI / │─────────────────┘                  │
│   │  (AV Feed) │   │ Web Speech   │                                    │
│   └─────┬──────┘   └──────────────┘                                    │
│         │                                                              │
│         ▼ EventBus (~5 fps video + audio blobs)                        │
│   ┌───────────────────────────────────┐   ┌────────────────────────┐   │
│   │  BEHAVIORAL TELEMETRY PIPELINE    │   │  UPSTREAM MCP SERVER   │   │
│   │  MediaPipe · Py-feat · Parselmouth│   │  (GitHub Repos/Context)│   │
│   └─────────────────┬─────────────────┘   └────────────────────────┘   │
│                     ▼                                                  │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │               COMPETENCY & LEARNING-GAP ENGINE                 │   │
│   │            (Rubric Evaluation → Learning Outcomes)             │   │
│   └─────────────────┬──────────────────────────────────────────────┘   │
│                     ▼                                                  │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │    FEEDBACK REPORT + ANSWER TRANSFORMER + MICRO-DRILL RETRY    │   │
│   └─────────────────┬──────────────────────────────────────────────┘   │
│                     ▼                                                  │
│   ┌──────────────────────────────────┐   ┌─────────────────────────┐   │
│   │ COHORT MASTERY DASHBOARDS        │   │  DOWNSTREAM LMS MCP     │   │
│   └──────────────────────────────────┘   └─────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ How a Session Works

1. **Setup:** Learner selects target role and difficulty rigor (or pastes custom job description).
2. **Interview Turn Loop:**
   - Avatar generates role-tailored question.
   - Learner speaks response while camera and microphone streams run.
   - Real-time STT transcribes speech with word timestamps.
   - If silence $> 5$ s occurs, **Rescue Mode** automatically provides verbal scaffolding.
   - Learner can request on-demand **Coach Mode** hints.
3. **Turn Completion:** Response is packaged into a `SessionResponseRecord` and handed to the behavioral and learning pipelines.
4. **Formative Assessment:**
   - Answer Transformer produces verbatim vs. STAR rewrite comparison.
   - Behavioral dashboard surfaces delivery metrics (jitter, speaking rate, gaze).
   - One-click micro-drill button triggers a 30-second targeted sprint on identified gaps.

---

## 📊 Competency & Evaluation Framework

| Dimension | Scope | Learning Outcome Target |
|---|---|---|
| **Technical Knowledge** | Role-specific concepts and reasoning | Explain concepts accurately with architecture context |
| **Communication** | Organization and logical flow | Structure responses using STAR format |
| **Clarity** | Directness and brevity | Formulate clear opening statements; eliminate rambling |
| **Confidence** | Delivery stability and filler frequency | Maintain consistent pacing and minimize filler utterances |
| **Problem Solving** | Analytical decomposition | Break complex scenarios into sequential actions |
| **Relevance** | Alignment to role and prompt | Directly address question constraints |
| **Non-Verbal** | Gaze orientation and vocal pacing | Maintain natural camera engagement and steady cadence |

---

## 🛡️ Ethical Design Principles

Behavioral measurements (gaze direction, vocal jitter, pause durations) are exclusively framed as **self-awareness coaching cues**. Felix adheres to strict ethical guardrails:
- Behavioral telemetry is **never** used to penalize, score down, or judge candidate character.
- Signals are presented as reflective observations (e.g., *"Speaking rate accelerated to 180 WPM during the technical explanation — pacing exercises may help comfort level"*).
- The platform supports neurodivergent and diverse communication styles by focusing on structured content mastery rather than rigid behavioral conformity.

---

## 🤖 AI / ML Model Stack

| Component | Technology | Purpose |
|---|---|---|
| **Core Reasoning** | **Gemini 2.0 Flash-Lite / Flash** | Question generation, follow-ups, Rescue Mode, and evaluation |
| **Speech-to-Text** | AssemblyAI Streaming / Web Speech API | Real-time voice transcription with word-level timestamps |
| **Text-to-Speech** | Cartesia Sonic (`sonic-english`) / Web Speech | Ultra-low latency neural speech synthesis (`< 1.5s` total turn) |
| **Gaze Estimation** | MediaPipe Face Mesh | Camera-facing percentage and direction tracking |
| **Facial Analysis** | Py-feat | Facial Action Units (AUs) and emotion distribution |
| **Prosody Analysis**| Parselmouth (Praat) | Fundamental frequency (F0), vocal jitter, shimmer, pause segments |
| **Avatar** | SVG/Canvas Real-time Digital Human | Synchronized lip-sync and expressive state rendering |

### Model Pinning & Fallbacks
- LLM client runs automatic model fallback across `gemini-2.0-flash-lite` → `gemini-2.0-flash` → `gemini-1.5-flash`.
- In environments without external API keys, client gracefully switches to browser Web Speech API for voice synthesis and transcription.

---

## 🏁 Hackathon MVP Priority

| Priority | Feature | Scope |
|---|---|---|
| **P0 — Core Loop** | Live Voice Turn Loop | AssemblyAI / Web Speech → Gemini → Cartesia (`< 1.5s` latency) |
| **P0 — Core Loop** | Answer Transformer | Side-by-side verbatim vs. STAR rewrite comparison |
| **P0 — Core Loop** | Behavioral Dashboard | Parselmouth prosody graphs + MediaPipe gaze tracking |
| **P0 — Core Loop** | Micro-Drill Retry | One-click 30s sprint targeting detected weakness |
| **P0 — Core Loop** | Evidence Feedback | Timestamped transcript citations for all observations |
| **P1 — High Value** | Rescue Mode | Automatic scaffolding on $> 5$ s silence |
| **P1 — High Value** | Coach Mode | On-demand STAR hints |
| **P1 — High Value** | Avatar Lip-Sync | Low-latency audio-reactive mouth modulation |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on v22)
- Python 3.10+ (for behavioral telemetry)
- API Keys (optional for local testing; defaults to browser Web Speech API):
  - `GEMINI_API_KEY` ([Google AI Studio](https://aistudio.google.com/app/apikey))
  - `ASSEMBLYAI_API_KEY` ([AssemblyAI Dashboard](https://www.assemblyai.com))
  - `CARTESIA_API_KEY` ([Cartesia Play](https://play.cartesia.ai))

### Setup & Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/siddharthsai218/Felix.git
   cd Felix
   ```

2. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Add your API keys to .env
   ```

3. **Install Dependencies:**
   ```bash
   npm install
   cd server && npm install
   cd ../frontend && npm install
   ```

4. **Launch Application:**
   From the repository root:
   ```bash
   npm run dev
   ```
   - **Frontend:** [http://localhost:3000](http://localhost:3000)
   - **Backend Server:** [http://localhost:3001](http://localhost:3001)
   - **WebSocket Server:** `ws://localhost:3002`

---

## 🗺️ Roadmap

- [ ] Multi-turn progressive learning journeys with cumulative skill tracking.
- [ ] Automated spaced-repetition scheduler with email/calendar notification hooks.
- [ ] Upstream GitHub MCP server for direct project repository analysis.
- [ ] Downstream LMS MCP server for Canvas and Notion assignment export.
- [ ] Exportable PDF evaluation summaries for placement cell documentation.
- [ ] Mobile responsive practice interface.

---

## 👥 Team

- Techashy Hackathon — EdTech Track

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
