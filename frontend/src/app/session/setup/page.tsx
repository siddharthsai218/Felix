'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ResumePdfUploader } from '../../components/ResumePdfUploader';
import {
  type InterviewerArchetype,
  INTERVIEWER_ARCHETYPES,
} from '../../lib/types';

interface PresetRole {
  id: string;
  name: string;
  icon: string;
  description: string;
  competencies: string[];
}

const PRESET_ROLES: PresetRole[] = [
  {
    id: 'frontend-architect',
    name: 'Senior Systems & Frontend Architect',
    icon: '💻',
    description: 'React, Next.js, Concurrency, State Machines, Web Performance & DOM',
    competencies: ['UI Architecture', 'Web Performance', 'State Management', 'STAR Structure'],
  },
  {
    id: 'backend-dev',
    name: 'Distributed Systems & Backend Engineer',
    icon: '⚙️',
    description: 'APIs, Distributed Systems, Concurrency, Databases & High Availability',
    competencies: ['System Design', 'Data Modeling', 'Concurrency', 'STAR Structure'],
  },
  {
    id: 'fullstack-dev',
    name: 'Full-Stack Lead Engineer',
    icon: '🔧',
    description: 'End-to-end web apps, API architecture, Database schemas & Deployment',
    competencies: ['Full-Stack Fluency', 'API Design', 'DevOps Basics', 'Communication'],
  },
  {
    id: 'ml-engineer',
    name: 'Machine Learning Platform Engineer',
    icon: '🧠',
    description: 'PyTorch, Model Training, Inference Optimization, Pipelines & Metrics',
    competencies: ['Model Architecture', 'Data Pipelines', 'Inference Latency', 'Evaluation'],
  },
  {
    id: 'devops-engineer',
    name: 'Cloud & Infrastructure SRE Architect',
    icon: '☁️',
    description: 'Kubernetes, Docker, CI/CD pipelines, AWS/GCP, Terraform & Reliability',
    competencies: ['Infrastructure as Code', 'Observability', 'Security', 'CI/CD'],
  },
  {
    id: 'product-manager',
    name: 'Technical Product Manager',
    icon: '📋',
    description: 'Product strategy, Feature scoping, Metrics, Stakeholders & User Empathy',
    competencies: ['Metric Framing', 'User Empathy', 'Conflict Resolution', 'Leadership'],
  },
];

const DIFFICULTIES = [
  {
    id: 'beginner',
    label: 'Standard',
    desc: 'Foundational concepts, encouraging pace, gentle coaching nudges',
    color: 'from-emerald-400 to-green-500',
    border: 'border-emerald-500/30',
  },
  {
    id: 'intermediate',
    label: 'Staff L6',
    desc: 'Standard mock interview rigor with follow-up probing and trade-offs',
    color: 'from-cyan-400 to-blue-500',
    border: 'border-cyan-500/30',
  },
  {
    id: 'advanced',
    label: 'Principal / Fellow',
    desc: 'High rigor with architectural edge cases, incident leadership, and ambiguity',
    color: 'from-violet-400 to-rose-500',
    border: 'border-violet-500/30',
  },
] as const;

export default function SessionSetupPage() {
  const router = useRouter();

  const [roleTitle, setRoleTitle] = useState<string>('Senior Systems & Frontend Architect');
  const [learnerName, setLearnerName] = useState<string>('Siddharth');
  const [githubUrl, setGithubUrl] = useState<string>('');
  const [resumeText, setResumeText] = useState<string>('');
  const [resumeFileName, setResumeFileName] = useState<string>('');
  const [pasteJd, setPasteJd] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [archetype, setArchetype] = useState<InterviewerArchetype>('supportive-coach');
  const [coachModeEnabled, setCoachModeEnabled] = useState<boolean>(true);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  // Restore saved setup from previous practice if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRole = sessionStorage.getItem('felix_session_role');
      const savedGithub = sessionStorage.getItem('felix_session_github');
      const savedResume = sessionStorage.getItem('felix_session_resume');
      const savedResumeFile = sessionStorage.getItem('felix_session_resume_filename');
      const savedJd = sessionStorage.getItem('felix_session_jd');
      const savedLearner = localStorage.getItem('felix_learner_name') || sessionStorage.getItem('felix_learner_name');
      const savedArchetype = sessionStorage.getItem('felix_session_archetype') as InterviewerArchetype;

      if (savedRole) setRoleTitle(savedRole);
      if (savedGithub) setGithubUrl(savedGithub);
      if (savedResume) setResumeText(savedResume);
      if (savedResumeFile) setResumeFileName(savedResumeFile);
      if (savedJd) setPasteJd(savedJd);
      if (savedLearner) setLearnerName(savedLearner);
      if (savedArchetype && INTERVIEWER_ARCHETYPES[savedArchetype]) {
        setArchetype(savedArchetype);
      }
    }
  }, []);

  const handleSelectPreset = (preset: PresetRole) => {
    setRoleTitle(preset.name);
  };

  const handleStartSession = async () => {
    if (isStarting) return;
    setIsStarting(true);
    setSyncStatus('Configuring Beyond Presence Avatar with your role...');
    const finalRole = roleTitle.trim() || 'Senior Systems & Frontend Architect';
    const finalLearner = learnerName.trim() || 'Siddharth';

    // Store in sessionStorage to handle large resumes and GitHub context cleanly
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('felix_session_role', finalRole);
      sessionStorage.setItem('felix_session_archetype', archetype);
      if (githubUrl.trim()) {
        sessionStorage.setItem('felix_session_github', githubUrl.trim());
      } else {
        sessionStorage.removeItem('felix_session_github');
      }

      if (resumeText.trim()) {
        sessionStorage.setItem('felix_session_resume', resumeText.trim());
        sessionStorage.setItem('felix_session_resume_filename', resumeFileName.trim());
      } else {
        sessionStorage.removeItem('felix_session_resume');
        sessionStorage.removeItem('felix_session_resume_filename');
      }

      if (pasteJd.trim()) {
        sessionStorage.setItem('felix_session_jd', pasteJd.trim());
      } else {
        sessionStorage.removeItem('felix_session_jd');
      }

      sessionStorage.setItem('felix_learner_name', finalLearner);
      localStorage.setItem('felix_learner_name', finalLearner);
    }

    try {
      if (githubUrl.trim()) {
        setSyncStatus(`Analyzing GitHub @${githubUrl.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '')} & configuring avatar...`);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch('/api/avatar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: finalRole,
          difficulty,
          archetype,
          githubUrl: githubUrl.trim(),
          resumeText: resumeText.trim(),
          jobDescription: pasteJd.trim(),
        }),
        signal: controller.signal,
      }).catch((e) => {
        console.warn('Avatar sync timeout or error:', e);
        return null;
      });

      clearTimeout(timeoutId);
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        console.log('Avatar successfully synced:', data);
        if (data && data.greeting) {
          sessionStorage.setItem('felix_avatar_greeting', data.greeting);
          // Extract the concrete question part
          let qPart = data.greeting;
          if (qPart.includes(': ')) {
            const split = qPart.split(': ');
            qPart = split.slice(1).join(': ');
          } else if (qPart.includes('?')) {
            const lastSentences = qPart.split(/(?<=[.?!])\s+/);
            const questionSentence = lastSentences.find((s: string) => s.includes('?')) || lastSentences[lastSentences.length - 1];
            if (questionSentence) qPart = questionSentence;
          }
          sessionStorage.setItem('felix_opening_question', qPart.trim());
        }
      }
    } catch (err) {
      console.warn('Avatar sync failed, proceeding to session:', err);
    }

    const sessionId = `felix-${Date.now()}`;
    const params = new URLSearchParams({
      role: finalRole,
      difficulty,
      archetype,
      questions: '0', // 0 = continuous adaptive learning loop
      coach: coachModeEnabled.toString(),
      ...(githubUrl.trim() ? { github: encodeURIComponent(githubUrl.trim()) } : {}),
      session: sessionId,
    });

    router.push(`/session/live?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-[#070b12] text-white flex flex-col justify-between selection:bg-violet-500/30">
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* TOP NAV BAR                                                               */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <header className="w-full bg-[#090d16] border-b border-slate-800/80 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-violet-500/20">
              F
            </div>
            <span className="font-extrabold text-sm tracking-wider uppercase text-white font-mono">
              FELIX AI
            </span>
          </Link>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
              CONFIG SUITE v2.4
            </span>
            <Link
              href="/session/history"
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <span>📜</span>
              <span>History</span>
            </Link>
            <Link
              href="/session/report"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Previous Report
            </Link>
          </div>
        </div>

        {/* Sub-Header Banner Strip */}
        <div className="border-t border-slate-800/60 bg-[#06090f]/80 px-4 sm:px-6 py-1.5 text-[11px] font-mono flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-2">
            <span>🛡️</span>
            <span>Adaptive Technical Interview & Behavioral Rehearsal Suite</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold hidden sm:inline-block">READY FOR DEPLOYMENT</span>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MAIN FORM BODY                                                            */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-cyan-400 text-xs font-mono">⚡</span>
            <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-cyan-400">
              SESSION INITIALIZATION
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Configure Your Technical Rehearsal
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Felix generates high-rigor, role-specific prompts grounded in your public GitHub codebase, system architecture trade-offs, and resume accomplishments.
          </p>
        </div>

        {/* Learner Profile Selector (Lightweight Profile Management) */}
        <div className="p-4 rounded-xl bg-[#0d131f] border border-slate-800/90 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-sm text-violet-300">
              👤
            </div>
            <div>
              <label className="text-xs font-mono font-bold text-slate-200 block">
                Learner Profile
              </label>
              <span className="text-[11px] text-slate-400">
                Sessions are tagged & filtered under this name in Interview History
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={learnerName}
              onChange={(e) => setLearnerName(e.target.value)}
              placeholder="e.g. Siddharth"
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all w-36 sm:w-44"
            />
            <Link
              href="/session/history"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 border border-slate-700 transition-colors shrink-0"
            >
              Past Sessions 📜
            </Link>
          </div>
        </div>

        {/* 1. Target Role Field */}
        <section className="p-6 rounded-2xl bg-[#0d131f] border border-slate-800/90 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-violet-400 flex items-center gap-2">
              <span>🎯</span>
              <span>1. Target Role & Specialty</span>
            </label>
            <span className="text-[10px] font-mono text-slate-400">Prompts calibrated to this engineering bar</span>
          </div>

          {/* Role Direct Text Input */}
          <div>
            <input
              type="text"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="e.g. Senior Systems & Frontend Architect, Distributed Systems Engineer..."
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-medium placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-sans"
            />
          </div>

          {/* Quick Preset Selector Buttons */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-mono text-slate-400 block font-semibold">
              Or pick an established staff-level track:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {PRESET_ROLES.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3 rounded-xl text-left border transition-all flex items-start gap-2.5 ${
                    roleTitle.toLowerCase() === preset.name.toLowerCase()
                      ? 'border-violet-500 bg-violet-600/20 text-white ring-1 ring-violet-500 shadow-md shadow-violet-500/20'
                      : 'border-slate-800/90 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <span className="text-lg shrink-0 mt-0.5">{preset.icon}</span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold block truncate text-slate-200">{preset.name}</span>
                    <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{preset.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 2. Candidate Portfolio & GitHub Grounding */}
        <section className="p-6 rounded-2xl bg-[#0d131f] border border-slate-800/90 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <span>🐙</span>
              <span>2. Codebase Grounding (Upstream MCP)</span>
            </label>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">Live GitHub Scraper Active</span>
          </div>

          <div className="space-y-4">
            {/* GitHub URL Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <span>GitHub Profile or Repository URL</span>
              </label>
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="e.g. username, github.com/username, or specific repo"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Felix reads your public repositories, dependencies, and commit architectures to grill you on your <strong>actual code</strong> instead of generic LeetCode trivia.
              </span>
            </div>

            {/* Resume PDF Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span>📄</span>
                  <span>Resume (PDF Upload)</span>
                </div>
                <span className="text-[10px] text-violet-400 font-medium">PDF File Recommended</span>
              </label>
              <ResumePdfUploader
                initialFileName={resumeFileName}
                initialExtractedText={resumeText}
                onParsed={(data) => {
                  setResumeText(data.extractedText);
                  setResumeFileName(data.fileName);
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('felix_session_resume', data.extractedText);
                    sessionStorage.setItem('felix_session_resume_filename', data.fileName);
                  }
                }}
                onRemove={() => {
                  setResumeText('');
                  setResumeFileName('');
                  if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('felix_session_resume');
                    sessionStorage.removeItem('felix_session_resume_filename');
                  }
                }}
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Upload your PDF resume. Felix reads your real projects, tools, and technical experience from the PDF to challenge you on your actual architecture.
              </span>
            </div>

            {/* Target Job Description (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <span>💼</span>
                <span>Target Job Description (Optional)</span>
              </label>
              <textarea
                rows={3}
                value={pasteJd}
                onChange={(e) => setPasteJd(e.target.value)}
                placeholder="Paste key requirements, preferred tech stack, or JD details..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all resize-y"
              />
            </div>
          </div>
        </section>

        {/* 3. Interviewer Archetype & Coaching Persona */}
        <section className="p-6 rounded-2xl bg-[#0d131f] border border-slate-800/90 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-violet-400">
              3. Interviewer Archetype & Persona Style
            </label>
            <span className="text-[11px] font-mono text-slate-400">
              Select the coaching dynamic & interviewing style
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(Object.values(INTERVIEWER_ARCHETYPES)).map((arch) => {
              const isSelected = archetype === arch.id;
              return (
                <button
                  key={arch.id}
                  type="button"
                  onClick={() => setArchetype(arch.id)}
                  className={`relative p-5 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 group ${
                    isSelected
                      ? `${arch.borderClass} bg-slate-900 ring-2 ring-violet-500/80 shadow-xl shadow-violet-500/20`
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950/90'
                  }`}
                >
                  {/* Active selection badge */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-violet-600/30 border border-violet-500/60 text-[9px] font-mono font-bold text-violet-300">
                      SELECTED
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="text-2xl">{arch.icon}</span>
                      <div>
                        <h3 className={`text-sm font-extrabold font-mono bg-gradient-to-r ${arch.color} bg-clip-text text-transparent`}>
                          {arch.name}
                        </h3>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {arch.shortName}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-slate-200 mb-1">
                      "{arch.tagline}"
                    </p>

                    <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                      {arch.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/60">
                    {arch.traits.map((trait, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. Difficulty Rigor */}
        <section className="p-6 rounded-2xl bg-[#0d131f] border border-slate-800/90 shadow-xl space-y-4">
          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-violet-400 pb-2 border-b border-slate-800/80">
            4. Evaluation Rigor & Curveball Probing
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDifficulty(d.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  difficulty === d.id
                    ? `${d.border} bg-slate-900 ring-2 ring-violet-500/80 shadow-lg shadow-violet-500/20`
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className={`text-sm font-extrabold bg-gradient-to-r ${d.color} bg-clip-text text-transparent mb-1 font-mono`}>
                  {d.label}
                </div>
                <p className="text-xs text-slate-400 leading-snug">{d.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Launch Button */}
        <div>
          <button
            type="button"
            disabled={isStarting}
            onClick={handleStartSession}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold font-mono text-sm sm:text-base shadow-xl shadow-violet-500/25 transition-all hover:scale-[1.008] active:scale-[0.99] flex items-center justify-center gap-3 disabled:opacity-80 disabled:cursor-wait"
          >
            {isStarting ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="truncate max-w-[90%]">{syncStatus || 'Configuring AI Interviewer...'}</span>
              </>
            ) : (
              <>
                <span>Launch Live Engineering Rehearsal</span>
                <span className="text-lg">→</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Footer Notice */}
      <footer className="max-w-4xl mx-auto w-full text-center text-[11px] font-mono text-slate-500 py-6 border-t border-slate-900">
        ENGINEERING REHEARSAL SUITE • ADAPTIVE INTERVIEW-SKILLS COACH
      </footer>
    </main>
  );
}
