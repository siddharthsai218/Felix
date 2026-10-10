'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  const [githubUrl, setGithubUrl] = useState<string>('');
  const [resumeText, setResumeText] = useState<string>('');
  const [pasteJd, setPasteJd] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [coachModeEnabled, setCoachModeEnabled] = useState<boolean>(true);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  // Restore saved setup from previous practice if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRole = sessionStorage.getItem('felix_session_role');
      const savedGithub = sessionStorage.getItem('felix_session_github');
      const savedResume = sessionStorage.getItem('felix_session_resume');
      const savedJd = sessionStorage.getItem('felix_session_jd');

      if (savedRole) setRoleTitle(savedRole);
      if (savedGithub) setGithubUrl(savedGithub);
      if (savedResume) setResumeText(savedResume);
      if (savedJd) setPasteJd(savedJd);
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

    // Store in sessionStorage to handle large resumes and GitHub context cleanly
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('felix_session_role', finalRole);
      sessionStorage.setItem('felix_session_github', githubUrl.trim());
      sessionStorage.setItem('felix_session_resume', resumeText.trim());
      sessionStorage.setItem('felix_session_jd', pasteJd.trim());
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
      }
    } catch (err) {
      console.warn('Avatar sync failed, proceeding to session:', err);
    }

    const sessionId = `felix-${Date.now()}`;
    const params = new URLSearchParams({
      role: finalRole,
      difficulty,
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

            {/* Resume / Experience Summary Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <span>📄</span>
                <span>Resume / Experience Summary (Optional)</span>
              </label>
              <textarea
                rows={3}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste key accomplishments, systems built, or previous leadership experience..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all resize-y"
              />
            </div>
          </div>
        </section>

        {/* 3. Difficulty Rigor */}
        <section className="p-6 rounded-2xl bg-[#0d131f] border border-slate-800/90 shadow-xl space-y-4">
          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-violet-400 pb-2 border-b border-slate-800/80">
            3. Evaluation Rigor & Curveball Probing
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
