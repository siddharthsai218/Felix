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
    id: 'frontend-dev',
    name: 'Frontend Developer',
    icon: '💻',
    description: 'React, Next.js, TypeScript, State Management, Web Performance & DOM',
    competencies: ['UI Architecture', 'Web Performance', 'State Management', 'STAR Structure'],
  },
  {
    id: 'backend-dev',
    name: 'Backend Developer',
    icon: '⚙️',
    description: 'APIs, Distributed Systems, Concurrency, Databases & High Availability',
    competencies: ['System Design', 'Data Modeling', 'Concurrency', 'STAR Structure'],
  },
  {
    id: 'fullstack-dev',
    name: 'Full-Stack Developer',
    icon: '🔧',
    description: 'End-to-end web apps, API architecture, Database schemas & Deployment',
    competencies: ['Full-Stack Fluency', 'API Design', 'DevOps Basics', 'Communication'],
  },
  {
    id: 'ml-engineer',
    name: 'Machine Learning Engineer',
    icon: '🧠',
    description: 'PyTorch, Model Training, Inference Optimization, Pipelines & Metrics',
    competencies: ['Model Architecture', 'Data Pipelines', 'Inference Latency', 'Evaluation'],
  },
  {
    id: 'devops-engineer',
    name: 'DevOps / Cloud Engineer',
    icon: '☁️',
    description: 'Kubernetes, Docker, CI/CD pipelines, AWS/GCP, Terraform & Reliability',
    competencies: ['Infrastructure as Code', 'Observability', 'Security', 'CI/CD'],
  },
  {
    id: 'product-manager',
    name: 'Product Manager',
    icon: '📋',
    description: 'Product strategy, Feature scoping, Metrics, Stakeholders & User Empathy',
    competencies: ['Metric Framing', 'User Empathy', 'Conflict Resolution', 'Leadership'],
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
    desc: 'Standard mock interview rigor with follow-up probing',
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

  const [roleTitle, setRoleTitle] = useState<string>('Software Engineer');
  const [githubUrl, setGithubUrl] = useState<string>('');
  const [resumeText, setResumeText] = useState<string>('');
  const [pasteJd, setPasteJd] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [coachModeEnabled, setCoachModeEnabled] = useState<boolean>(true);
  const [activePreset, setActivePreset] = useState<string | null>(null);

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
    setActivePreset(preset.id);
  };

  const handleStartSession = () => {
    const finalRole = roleTitle.trim() || 'Software Engineer';

    // Store in sessionStorage to handle large resumes and GitHub context cleanly
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('felix_session_role', finalRole);
      sessionStorage.setItem('felix_session_github', githubUrl.trim());
      sessionStorage.setItem('felix_session_resume', resumeText.trim());
      sessionStorage.setItem('felix_session_jd', pasteJd.trim());
    }

    const params = new URLSearchParams({
      role: finalRole,
      difficulty,
      questions: '0', // 0 = continuous adaptive learning loop
      coach: coachModeEnabled.toString(),
      ...(githubUrl.trim() ? { github: encodeURIComponent(githubUrl.trim()) } : {}),
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
          EdTech Hackathon
        </span>
      </header>

      {/* Main Form Body */}
      <div className="max-w-3xl mx-auto w-full flex-1">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight mb-2">
            Configure Your Practice Session
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Felix generates role-specific interview questions grounded in your selected field, your GitHub code, and your resume.
          </p>
        </div>

        {/* 1. Target Role Field */}
        <section className="mb-8 p-6 rounded-2xl bg-gray-900/60 border border-gray-800 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold uppercase tracking-wider text-violet-400 flex items-center gap-2">
              <span>🎯</span>
              <span>1. Target Role</span>
            </label>
            <span className="text-[11px] text-gray-400">Questions are strictly limited to this field</span>
          </div>

          {/* Role Direct Text Input */}
          <div className="mb-4">
            <input
              type="text"
              value={roleTitle}
              onChange={(e) => {
                setRoleTitle(e.target.value);
                setActivePreset(null);
              }}
              placeholder="e.g. Distributed Systems Engineer, Data Scientist, iOS Developer..."
              className="w-full px-4 py-3 rounded-xl bg-gray-950 border border-gray-800 text-base text-white font-medium placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
            />
          </div>

          {/* Quick Preset Selector Buttons */}
          <div>
            <span className="text-xs text-gray-400 block mb-2 font-medium">
              Or pick a popular role preset:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_ROLES.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-3 py-2 rounded-xl text-left text-xs font-medium border transition-all flex items-center gap-2 ${
                    roleTitle.toLowerCase() === preset.name.toLowerCase()
                      ? 'border-violet-500 bg-violet-600/20 text-white ring-1 ring-violet-500'
                      : 'border-gray-800 bg-gray-950/60 text-gray-300 hover:border-gray-700 hover:bg-gray-900'
                  }`}
                >
                  <span className="text-base">{preset.icon}</span>
                  <span className="truncate">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 2. Candidate Portfolio & Resume Intake */}
        <section className="mb-8 p-6 rounded-2xl bg-gray-900/60 border border-gray-800 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold uppercase tracking-wider text-violet-400 flex items-center gap-2">
              <span>📁</span>
              <span>2. Candidate Portfolio & Resume Context</span>
            </label>
            <span className="text-[11px] text-emerald-400 font-medium">Upstream MCP Intake</span>
          </div>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Felix inspects your public GitHub code and resume to grill you on your <strong>actual architectural decisions and projects</strong> instead of generic trivia.
          </p>

          <div className="space-y-4">
            {/* GitHub URL Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
                <span>🐙</span>
                <span>GitHub Profile or Repository URL</span>
              </label>
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="e.g. username, github.com/username, or repository URL"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-mono"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Enter your GitHub username or profile URL. Felix reads your public repositories and projects to ground your interview questions.
              </span>
            </div>

            {/* Resume / Experience Summary Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
                <span>📄</span>
                <span>Resume / Experience Summary</span>
              </label>
              <textarea
                rows={4}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume text, key project bullet points, tools used, or previous work experience..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all resize-y"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Felix will ask behavioral and technical questions referencing your specific accomplishments and tools.
              </span>
            </div>

            {/* Target Job Description (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
                <span>💼</span>
                <span>Target Job Description (Optional)</span>
              </label>
              <textarea
                rows={3}
                value={pasteJd}
                onChange={(e) => setPasteJd(e.target.value)}
                placeholder="Paste requirements or qualifications from a company job listing to align the questions..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all resize-y"
              />
            </div>
          </div>
        </section>

        {/* 3. Difficulty Level */}
        <section className="mb-8">
          <label className="block text-sm font-semibold uppercase tracking-wider text-violet-400 mb-3">
            3. Difficulty Rigor
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

        {/* 4. Coach Mode Toggle */}
        <section className="mb-10 max-w-2xl mx-auto w-full">
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
            <span>Launch Live Interview for {roleTitle || 'Selected Role'}</span>
            <span className="text-lg">→</span>
          </button>
        </div>
      </div>

      {/* Footer Notice */}
      <footer className="max-w-3xl mx-auto w-full text-center text-xs text-gray-500 pt-6 border-t border-gray-900">
        Felix is an EdTech career-readiness learning tool. All questions adapt directly to your chosen role, portfolio, and resume.
      </footer>
    </main>
  );
}
