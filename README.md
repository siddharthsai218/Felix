# 🎓 Felix — Adaptive Interview-Skills Coach

> **Track:** EdTech · **Event:** Techashy Hackathon

**Felix** is an adaptive, multimodal interview-skills coaching platform designed for students and early-career engineers. It transforms high-stakes technical interview practice into an active learning experience through real-time pedagogical scaffolding, bias-mitigated behavioral telemetry, and instant remediation micro-drills.

The interview is the **practice activity**. The **learning** is the objective.

> **Positioning:** Felix is a career-readiness *learning tool*, not a hiring screen or candidate-ranking gatekeeper. Behavioral signals (gaze, prosody, cadence) are formative coaching cues for self-awareness—never penalties or personality judgments.

---

## 📖 Table of Contents

- [The EdTech Case: Formative vs. Evaluative](#-the-edtech-case-formative-vs-evaluative)
- [The Active Learning Loop](#-the-active-learning-loop)
- [Core Architectural Innovations](#-core-architectural-innovations)
  - [1. Multimodal Cross-Attention Gating (VAD + Gaze Fusion)](#1-multimodal-cross-attention-gating-vad--gaze-fusion)
  - [2. Self-Referential Adaptive Baseline Normalizer](#2-self-referential-adaptive-baseline-normalizer)
- [Key Features](#-key-features)
  - [Configurable Interviewer Archetypes](#configurable-interviewer-archetypes)
  - [Artifact Grounding: GitHub Repositories & Resume Ingestion](#artifact-grounding-github-repositories--resume-ingestion)
  - [The Answer Transformer (STAR Structural Rewrite)](#the-answer-transformer-star-structural-rewrite)
  - [Problem-First 30-Second Micro-Drills](#problem-first-30-second-micro-drills)
  - [IndexedDB Synchronized Video Replay Vault](#indexeddb-synchronized-video-replay-vault)
  - [Longitudinal Learner Progression Tracking](#longitudinal-learner-progression-tracking)
  - [Automated PDF Diagnostic Report Export](#automated-pdf-diagnostic-report-export)
- [Pedagogical Design Framework](#-pedagogical-design-framework)
- [System Architecture](#-system-architecture)
- [AI / ML Model Stack](#-ai--ml-model-stack)
- [Ethical Design & Bias Mitigation Guardrails](#-ethical-design--bias-mitigation-guardrails)
- [Hackathon MVP Priorities & Deliverables](#-hackathon-mvp-priorities--deliverables)
- [Getting Started](#-getting-started)
- [License](#-license)

---

## 🎯 The EdTech Case: Formative vs. Evaluative

Most university career centers operate with high student-to-counselor ratios (often exceeding 1:500). Students stumble in technical and behavioral interviews not due to raw incompetence, but delivery friction: cognitive freezing, uncalibrated pacing, and lack of structured communication frameworks (STAR).

Standard commercial mock interview platforms are **evaluative and punitive**: they grade candidates against rigid global constants, flag natural pauses as "disengagement," and reject applicants without explaining *how* to improve.

**Felix is formative and pedagogical:** it diagnoses specific conceptual gaps, teaches the underlying architecture, scaffolds students in real time when they freeze, and provides immediate 30-second micro-sprints to build mastery.

| Dimension | Standard Screening Tools (HR Tech) | Felix (EdTech Coach) |
|---|---|---|
| **Primary Goal** | Filter and eliminate candidates | Accelerate delivery and architectural mastery |
| **Gaze Evaluation** | Punishes looking away as "dishonesty / distraction" | Differentiates thoughtful reflection (**Cognitive Search**) from disengagement |
| **Prosody & Tone** | Evaluates against rigid global pitch/jitter thresholds | Calibrates to candidate's personal vocal floor ($F_0$) in the first 15 seconds |
| **Silence Response** | Docking points / premature turn termination | **Rescue Mode:** Vygotsky scaffolding stepping stones |
| **Feedback Model** | Summative score (e.g., "68% / 100") | Verbatim vs. STAR rewrite + 1-click targeted micro-drills |
| **Data Privacy** | Recruiter telemetry surveillance | Private, local-first IndexedDB video & session vaults |

---

## 🔁 The Active Learning Loop

Felix implements an active, closed-loop pedagogical cycle:

```
   ┌────────────────────────────────────────────────────────────────────────┐
   │                                                                        │
   ▼                                                                        │
PRACTICE ──────► FORMATIVE ──────► DIAGNOSE ──────► REMEDIATE ─────► PROGRESSION
(Turn Loop with   SCAFFOLDING       THE GAP          (Problem-First    (Longitudinal
 Avatar Persona)  (Rescue Mode &    (Verbatim vs.     30s Micro-        Mastery Delta
                   Coach Hints)      STAR Rewrite)     Drills)          Across Turns)
```

1. **Practice:** Multi-turn conversational practice grounded in real GitHub repositories and resume projects.
2. **Formative Scaffolding:** Real-time intervention during silent cognitive blocks ($>5$s) using stepping-stone prompts.
3. **Diagnose the Gap:** Verbatim transcript breakdown citing timestamps, filler ratios, and structural omissions.
4. **Remediate:** Problem-first mistake dissection followed by an isolated 30-second practice sprint.
5. **Progression:** Longitudinal tracking comparing current performance against prior rehearsals ($\Delta \text{Mastery}$).

---

## 🔬 Core Architectural Innovations

To address the fundamental limitations and biases inherent in standard computer vision and acoustic models, Felix introduces two core architectural improvements:

### 1. Multimodal Cross-Attention Gating (VAD + Gaze Fusion)

* **The Problem:** Standalone gaze estimation models (e.g., standard MediaPipe Iris Mesh) treat all off-axis gaze vectors identically. When a software engineer pauses to mentally trace an architecture diagram or recall an algorithm, they naturally look away or downward. Off-the-shelf models falsely penalize this as "distraction" or "low confidence."
* **Our Architectural Solution:** We engineered a cross-attention gating layer in the client telemetry pipeline fusing Web Audio energy Voice Activity Detection (VAD) with MediaPipe iris vector tracking:

$$\text{Engagement State} = \begin{cases} 
\text{Cognitive Search (Reflective Thinking)}, & \text{if } \text{RMS}_{\text{audio}} < 0.022 \land \text{Gaze}_{\text{off-axis}} \\
\text{Direct Eye Contact}, & \text{if } \text{Gaze}_{\text{center}} \\
\text{Averted Gaze While Speaking}, & \text{if } \text{RMS}_{\text{audio}} \ge 0.022 \land \text{Gaze}_{\text{off-axis}}
\end{cases}$$

* **Result:** When candidates pause in silent thought, the model identifies **`🧠 Cognitive Search`**, sustaining an **85% engagement rating** and **90% composure score**, preventing false behavioral penalties.

### 2. Self-Referential Adaptive Baseline Normalizer

* **The Problem:** Off-the-shelf acoustic prosody algorithms use static global thresholds (`jitter > 2.0%`, `pitch std < 9 Hz`) that introduce severe bias against naturally deep baritone voices, non-native accents, and deliberate speaking cadences.
* **Our Architectural Solution:** We implemented an adaptive 15-second self-referential digital signal processing (DSP) calibration phase directly in the Web Audio Autocorrelation loop:
  1. During the opening turn, Felix samples the candidate's pitch distribution and computes their individual fundamental frequency floor ($\mu_{F_0}$) and resting perturbation variance ($J_{\text{baseline}}$).
  2. Subsequent prosody evaluations measure **differential perturbation**:
     $$\Delta J = J_{\text{computed}} - J_{\text{baseline}} + 0.85$$
  3. Pitch standard deviation is dynamically normalized by the candidate's personal $F_0$ floor:
     $$\sigma_{\text{norm}}(F_0) = \frac{\sigma(F_0)}{\mu_{F_0} \times 0.1}$$
* **Result:** Eliminates accent and vocal register bias, ensuring feedback reflects genuine emotional stability and clarity rather than acoustic anatomy.

---

## ✨ Key Features:

### Configurable Interviewer Archetypes
Candidates can rehearse against three distinct coaching personas tailored to specific interview styles:
* 🤝 **Supportive Felix:** Warmth, psychological safety, positive reinforcement, and step-by-step STAR scaffolding.
* 📐 **Pragmatic Staff Architect:** Rigorous probe into distributed systems edge cases, concurrency bottlenecks, failure modes, p99 latencies, and architectural trade-offs.
* ⚡ **Rapid-Fire Recruiter:** High-tempo executive evaluation focusing on 30–60s elevator summaries, bottom-line business ROI, and concise communication.

### Artifact Grounding: GitHub Repositories & Resume Ingestion
Felix does not ask generic trivia. It grounds questions in the candidate's actual engineering output:
* **GitHub Integration:** Scrapes candidate public repositories, architecture READMEs, languages, and commit contexts to ask questions challenging their real implementation decisions.
* **PDF Resume Parser:** Ingests candidate resumes directly in-browser and extracts technical stacks, impact metrics, and project ownership.

### The Answer Transformer (STAR Structural Rewrite)
Provides an immediate side-by-side diagnostic transformation of the candidate's spoken response:
* **Verbatim Response:** Highlights filler phrases, conversational fluff, and unquantified statements.
* **Felix STAR Rewrite:** Restructures the learner's own narrative into structured **Situation**, **Task**, **Action**, and measurable **Result** statements.

### Problem-First 30-Second Micro-Drills
When the diagnostic engine flags an underdeveloped competency:
1. Felix dissects the candidate's exact mistake on that specific problem first.
2. Launches an isolated 30-second practice sprint with real-time countdown timer.
3. Automatically evaluates the retry and boosts candidate mastery in history.

### IndexedDB Synchronized Video Replay Vault
Recorded video responses are captured per turn and stored client-side in an isolated IndexedDB database (`felix_video_vault_v1`). Learners can watch their synchronized video playback side-by-side with verbatim dialogue in the dialogue history modal without exceeding browser memory limits.

### Longitudinal Learner Progression Tracking
Tracks historical rehearsal records across multiple sessions for each profile. Computes exact score improvements ($\Delta \text{Mastery}$), trend classifications (`Improved`, `Steady`, `Needs Calibration`), and formative commentary on areas leveled up.

### Automated PDF Diagnostic Report Export
One-click client-side vector PDF generation compiling:
* Overall diagnostic scores and rubric mastery bars.
* Verbatim transcript audit with turn-by-turn justifications.
* Side-by-side Answer Transformer rewrites.
* Calibrated behavioral telemetry baselines.

---

## 🧑‍🏫 Pedagogical Design Framework

| Educational Concept | Pedagogical Foundation | Implementation in Felix |
|---|---|---|
| **Formative Scaffolding** | Vygotsky’s Zone of Proximal Development (ZPD) | Real-time verbal rescue mode and stepping-stone prompts when students freeze. |
| **Model Demonstration** | Bandura’s Observational Learning | The Answer Transformer models high-impact STAR structure using the student's own project context. |
| **Deliberate Practice** | Ericsson’s Peak Performance Model | 30-second isolated micro-drills targeting a single identified gap rather than full 45-minute re-runs. |
| **Longitudinal Feedback** | Black & Wiliam’s Assessment for Learning | Quantified $\Delta \text{Mastery}$ tracking demonstrating measurable growth between rehearsals. |

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              FELIX SYSTEM ARCHITECTURE                                 │
│                                                                                        │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │                        CLIENT LAYER (Next.js 14 App Router)                    │   │
│   │                                                                                │   │
│   │   ┌───────────────────────┐   ┌───────────────────────┐   ┌────────────────┐   │   │
│   │   │ Beyond Presence Video │   │   Live Telemetry HUD  │   │  MediaCapture  │   │   │
│   │   │  Avatar Stream Engine │   │   • VAD-Gaze Gate     │   │  • Mic + Cam   │   │   │
│   │   │  (Active Archetype)   │   │   • DSP F₀ Baseline   │   │  • Web Audio   │   │   │
│   │   └───────────────────────┘   └───────────────────────┘   └────────┬───────┘   │   │
│   └────────────────────────────────────────────────────────────────────┼───────────┘   │
│                                                                        │               │
│               WebSocket Real-Time Event Stream (Turn Transitions)      │ AV Streams    │
│                                      ▼                                 ▼               │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │                       BACKEND SERVER (Node.js + Express)                       │   │
│   │                                                                                │   │
│   │   ┌───────────────────────┐   ┌───────────────────────┐   ┌────────────────┐   │   │
│   │   │ WebSocket Turn Engine │   │  Beyond Presence Sync │   │ GitHub Service │   │   │
│   │   │ • Turn State Machine  │   │  • Agent Prompt Sync  │   │ • Repo Scraping│   │   │
│   │   │ • Rescue Scaffolding  │   │  • Spoken Greeting    │   │ • README Parse │   │   │
│   │   └───────────┬───────────┘   └───────────────────────┘   └────────────────┘   │   │
│   │               ▼                                                                │   │
│   │   ┌────────────────────────────────────────────────────────────────────────┐   │   │
│   │   │       Single Gemini Flash-Lite Reasoning Client (`server/core/llm.ts`) │   │   │
│   │   │       • Live Turn Reasoning (< 1.5s latency budget)                    │   │   │
│   │   │       • Evidence-Grounded Rubric Evaluation & STAR Transformation      │   │   │
│   │   └────────────────────────────────────────────────────────────────────────┘   │   │
│   └────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                        │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │                        PERSISTENCE & STORAGE ARCHITECTURE                      │   │
│   │                                                                                │   │
│   │   ┌───────────────────────┐   ┌───────────────────────┐   ┌────────────────┐   │   │
│   │   │ IndexedDB Video Vault │   │ Historical Store      │   │ PDF Exporter   │   │   │
│   │   │ (Turn WebM Blobs)     │   │ (Transcripts & Scores)│   │ (jsPDF Vector) │   │   │
│   │   └───────────────────────┘   └───────────────────────┘   └────────────────┘   │   │
│   └────────────────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🤖 AI / ML Model Stack

| Component | Architecture / Model | Function | Latency Profile |
|---|---|---|---|
| **Core Reasoning** | **Gemini Flash-Lite** | Real-time question generation, follow-up probes, Rescue scaffolding, and rubric evaluation | Sub-second ($< 800\text{ ms}$) |
| **Conversational Avatar** | Beyond Presence Agent API | Photorealistic interactive interviewer video stream with synchronized lip-sync | Real-time WebRTC stream |
| **Speech-to-Text** | AssemblyAI Streaming / Web Speech API | Word-level timestamped transcription with interim partials | Streaming real-time |
| **Neural TTS** | Cartesia Sonic (`sonic-3.6`) / Web Speech | Ultra-low-latency neural speech generation | Streaming ($< 150\text{ ms}$) |
| **Acoustic Prosody** | Web Audio Autocorrelation DSP | Real-time fundamental frequency ($F_0$), cycle perturbation jitter, RMS energy VAD | Zero network latency (In-browser) |
| **Computer Vision** | MediaPipe Face Mesh & Iris Tracking | 468 landmark facial mesh and normalized iris vector computation | 60 FPS client execution |

---

## 🛡️ Ethical Design & Bias Mitigation Guardrails

* **Zero Evaluative Penalties for Non-Verbal Signals:** Telemetry metrics are strictly visualized as self-awareness reflection cues. They are never factored into competency scores as deductions.
* **Neurodivergent & Cultural Inclusivity:** Candidates are never penalized for avoiding direct eye contact while formulating complex thoughts; the **VAD-gated Cognitive Search filter** actively protects composure ratings during reflection.
* **Accent Neutrality via Delta Normalization:** By measuring vocal tremor relative to the candidate's calibrated baseline rather than a static acoustic standard, speakers of all accents and registers receive fair, unbiased assessment.

---

## 🏁 Hackathon MVP Priorities & Deliverables

| Deliverable | Status | Scope |
|---|---|---|
| **Live Voice Turn Loop** | ✅ Completed | Low-latency voice loop ($< 1.5\text{s}$) with live avatar |
| **Model Architecture Upgrade** | ✅ Completed | Self-referential $F_0$ DSP baseline + VAD-gated cognitive search |
| **Configurable Archetypes** | ✅ Completed | Supportive Felix, Pragmatic Staff Architect, Rapid-Fire Recruiter |
| **GitHub & Resume Grounding**| ✅ Completed | Public repo parsing + PDF resume ingestion into prompt context |
| **Answer Transformer** | ✅ Completed | Side-by-side verbatim response vs. STAR structured rewrite |
| **Problem-First Micro-Drills**| ✅ Completed | 30-second targeted practice sprint with mistake explanation |
| **Synchronized Video Vault** | ✅ Completed | Local-first IndexedDB video recording and replay per turn |
| **Longitudinal Progression** | ✅ Completed | Historical rehearsal tracker with $\Delta \text{Mastery}$ growth indicators |
| **PDF Diagnostic Report** | ✅ Completed | Downloadable vector PDF summary with rubric and evidence audit |

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18+ (tested on v20 and v22)
* Modern browser with webcam and microphone permissions (Chrome, Edge, Brave recommended)

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/siddharthsai218/Felix.git
   cd Felix
   ```

2. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Populate your API keys in .env and frontend/.env.local:
   # GEMINI_API_KEY=...
   # BEYOND_PRESENCE_API_KEY=...
   # NEXT_PUBLIC_BEYOND_PRESENCE_AGENT_ID=...
   ```

3. **Install Dependencies:**
   ```bash
   npm install
   cd server && npm install
   cd ../frontend && npm install
   cd ..
   ```

4. **Launch Application:**
   ```bash
   npm run dev
   ```
   * **Frontend Application:** [http://localhost:3000](http://localhost:3000)
   * **Backend REST API:** [http://localhost:3001](http://localhost:3001)
   * **WebSocket Turn Server:** `ws://localhost:3002`

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
