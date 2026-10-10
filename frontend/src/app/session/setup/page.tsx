'use client';

import React, { useState } from 'react';
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
    id: 'frontend-dev',
    name: 'Frontend Developer',
    icon: '💻',
    description: 'React, TypeScript, Web Performance, State Management & Accessibility',
    competencies: ['Technical Breadth', 'UI Architecture', 'Debugging', 'STAR Structure'],
  },
  {
    id: 'backend-dev',
    name: 'Backend Developer',
    icon: '⚙️',
    description: 'APIs, Distributed Systems, Microservices, Databases & Reliability',
    competencies: ['System Design', 'Concurrency', 'Data Modeling', 'STAR Structure'],
  },
  {
    id: 'fullstack-dev',
    name: 'Full-Stack Developer',
    icon: '🔧',
    description: 'End-to-end product engineering, Architecture tradeoffs & CI/CD',
    competencies: ['Full-Stack Fluency', 'API Design', 'DevOps', 'Communication'],
  },
  {
    id: 'product-manager',
    name: 'Product Manager',
    icon: '📋',
    description: 'Product strategy, Feature prioritization, Metrics & Stakeholders',
    competencies: ['User Empathy', 'Metric Framing', 'Conflict Resolution', 'Leadership'],
  },
];

const DIFFICULTIES = [
  {
    id: 'beginner',
    label: 'Beginner',
    desc: 'Foundational concepts, encouraging pace, gentle coaching nudges',
    color: 'from-emerald-400 to-green-500',
    border: 'border-emerald-500/30',
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    desc: 'Standard mock interview caliber with follow-up probing',
    color: 'from-blue-400 to-indigo-500',
    border: 'border-indigo-500/30',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    desc: 'Senior rigor with architectural edge cases and behavioral curveballs',
    color: 'from-purple-400 to-rose-500',
    border: 'border-rose-500/30',
  },
] as const;

export default function SessionSetupPage() {
  const router = useRouter();

  const [selectedRoleId, setSelectedRoleId] = useState<string>('frontend-dev');
  const [customRole, setCustomRole] = useState<string>('');
  const [pasteJd, setPasteJd] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [coachModeEnabled, setCoachModeEnabled] = useState<boolean>(true);

  const getEffectiveRole = () => {
    if (isCustomMode) {
      if (customRole.trim()) return customRole.trim();
      if (pasteJd.trim()) return 'Job Description Candidate';
      return 'Software Engineer';
    }
    const found = PRESET_ROLES.find((r) => r.id === selectedRoleId);
    return found ? found.name : 'Software Engineer';
  };

  const handleStartSession = () => {
    const role = getEffectiveRole();
    const params = new URLSearchParams({
      role,
      difficulty,
      questions: '0',
      coach: coachModeEnabled.toString(),
      ...(pasteJd.trim() ? { jd: encodeURIComponent(pasteJd.trim().slice(0, 500)) } : {}),
    });

    router.push(`/session/live?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col justify-between p-4 sm:p-8">
      {/* Top Navbar */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-4 border-b border-gray-800/80 mb-8">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-violet-500/30">
            🎓
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight group-hover:text-violet-400 transition-colors">
              Felix
            </h1>
            <p className="text-[11px] text-gray-500">Adaptive Interview-Skills Coach</p>
          </div>
        </Link>
        <span className="text-xs text-gray-400 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-full">
          EdTech Hackathon MVP
        </span>
      </header>

      {/* Main Form Body */}
      <div className="max-w-3xl mx-auto w-full flex-1">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight mb-2">
            Configure Your Practice Session
          </h2>
          <p className="text-sm text-gray-400">
            Felix customizes real-time questions, pedagogical scaffolding, and feedback to your target role.
          </p>
        </div>

        {/* 1. Target Role Selection */}
        <section className="mb-8">
          <label className="block text-sm font-semibold uppercase tracking-wider text-violet-400 mb-3">
            1. Select Target Role
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {PRESET_ROLES.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => {
                  setSelectedRoleId(role.id);
                  setIsCustomMode(false);
                }}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  !isCustomMode && selectedRoleId === role.id
                    ? 'border-violet-500 bg-violet-600/10 shadow-lg shadow-violet-500/10 ring-1 ring-violet-500'
                    : 'border-gray-800/80 bg-gray-900/60 hover:border-gray-700 hover:bg-gray-900'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{role.icon}</span>
                  {!isCustomMode && selectedRoleId === role.id && (
                    <span className="w-2 h-2 rounded-full bg-violet-400" />
                  )}
                </div>
                <h3 className="font-bold text-sm text-white mb-1">{role.name}</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-3">{role.description}</p>
                <div className="flex flex-wrap gap-1">
                  {role.competencies.map((comp, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-gray-800/80 text-gray-400 border border-gray-700/50"
                    >
                      {comp}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* Custom Role or Paste JD box (Fallback per spec) */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isCustomMode
                ? 'border-violet-500 bg-violet-600/10 ring-1 ring-violet-500'
                : 'border-gray-800 bg-gray-900/40 hover:border-gray-700'
            }`}
          >
            <button
              type="button"
              onClick={() => setIsCustomMode(!isCustomMode)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">📋</span>
                <div>
                  <h4 className="font-semibold text-sm">Paste Job Description or Custom Role</h4>
                  <p className="text-xs text-gray-400">Target a specific company posting or niche tech stack</p>
                </div>
              </div>
              <span className="text-xs text-violet-400 font-medium">
                {isCustomMode ? 'Collapse' : 'Customize'}
              </span>
            </button>

            {isCustomMode && (
              <div className="mt-4 space-y-3 pt-3 border-t border-gray-800/80">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Role Title
                  </label>
                  <input
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="e.g. Distributed Systems Engineer @ Stripe"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Job Description (Optional Paste)
                  </label>
                  <textarea
                    rows={3}
                    value={pasteJd}
                    onChange={(e) => setPasteJd(e.target.value)}
                    placeholder="Paste requirements, tech stack, or qualifications..."
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 2. Difficulty Level */}
        <section className="mb-8">
          <label className="block text-sm font-semibold uppercase tracking-wider text-violet-400 mb-3">
            2. Difficulty Rigor
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDifficulty(d.id)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  difficulty === d.id
                    ? `${d.border} bg-gray-900 ring-2 ring-violet-500/80`
                    : 'border-gray-800/80 bg-gray-900/50 hover:border-gray-700'
                }`}
              >
                <div className={`text-sm font-extrabold bg-gradient-to-r ${d.color} bg-clip-text text-transparent mb-1`}>
                  {d.label}
                </div>
                <p className="text-xs text-gray-400 leading-snug">{d.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* 3. Session Controls */}
        <section className="mb-10 max-w-2xl mx-auto w-full">
          {/* Coach mode toggle */}
          <div className="p-4 rounded-2xl border border-gray-800/80 bg-gray-900/50 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-semibold text-sm">Coach Mode Hints</h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-bold">
                  STAR
                </span>
              </div>
              <p className="text-xs text-gray-400">On-demand formative coaching hints during live turns</p>
            </div>
            <button
              type="button"
              onClick={() => setCoachModeEnabled(!coachModeEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                coachModeEnabled ? 'bg-violet-600' : 'bg-gray-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  coachModeEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </section>

        {/* Start Button */}
        <div className="mb-12">
          <button
            type="button"
            onClick={handleStartSession}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-violet-500/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3"
          >
            <span>Launch Live Interview Practice Session</span>
            <span className="text-lg">→</span>
          </button>
        </div>
      </div>

      {/* Footer Notice */}
      <footer className="max-w-3xl mx-auto w-full text-center text-xs text-gray-500 pt-6 border-t border-gray-900">
        Felix is an EdTech career-readiness learning tool. All behavioral cues are formative coaching cues for self-awareness, never penalties.
      </footer>
    </main>
  );
}
