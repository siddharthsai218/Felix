import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col justify-between selection:bg-violet-500 selection:text-white">
      {/* Navigation */}
      <header className="max-w-6xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-gray-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-violet-500/30">
            🎓
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
              Felix
            </span>
            <span className="text-[11px] text-gray-500 block -mt-0.5">Adaptive Interview-Skills Coach</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-block text-xs text-gray-400 bg-gray-900 border border-gray-800 px-3.5 py-1.5 rounded-full">
            Techashy Hackathon · EdTech Track
          </span>
          <Link
            href="/session/setup"
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white shadow-md shadow-violet-500/25 transition-all"
          >
            Start Practice
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto w-full px-6 py-16 sm:py-24 text-center">
        {/* Track Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          Formative Interview Coaching · Not a Hiring Screen
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-6 leading-tight">
          Master Your Delivery,{' '}
          <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            Not Just Your Answers.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          The interview is the <span className="text-gray-200 font-semibold">practice activity</span>. The <span className="text-violet-300 font-semibold">learning</span> is the point. Experience real-time avatar practice, pedagogical Rescue Mode, and side-by-side Answer Transformation.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/session/setup"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-violet-500/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <span>Launch Mock Interview</span>
            <span>→</span>
          </Link>
          <Link
            href="/session/report?sessionId=demo-sample"
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-gray-900/80 hover:bg-gray-800 border border-gray-800 text-gray-300 font-medium text-sm transition-colors"
          >
            View Sample Assessment Report
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800/80 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-xl mb-3">
              🛟
            </div>
            <h3 className="font-bold text-sm text-white mb-1.5">Live Rescue Mode</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Freeze up for &gt;5 seconds? Felix uses Vygotsky&apos;s Zone of Proximal Development to scaffold your thinking out loud instead of letting you fail.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800/80 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl mb-3">
              🌟
            </div>
            <h3 className="font-bold text-sm text-white mb-1.5">The Answer Transformer</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Immediate side-by-side comparison: your verbatim speech translated into a professional STAR framework rewrite with concrete metrics.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800/80 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl mb-3">
              ⚡
            </div>
            <h3 className="font-bold text-sm text-white mb-1.5">One-Click Micro-Drill</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Target detected weaknesses immediately. Launch a 30-second sprint, retry the question, and watch your competency score improve in the same session.
            </p>
          </div>
        </div>
      </section>

      {/* EdTech Manifesto Strip */}
      <section className="max-w-4xl mx-auto w-full px-6 mb-12">
        <div className="p-5 rounded-2xl bg-violet-950/30 border border-violet-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌱</span>
            <p className="text-xs text-violet-200">
              <span className="font-bold">Felix vs. Screening Tools:</span> Traditional mock interviews are summative tests. Felix is formative education — behavioral signals are self-awareness cues, never proctoring penalties.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full px-6 py-6 border-t border-gray-900 text-center text-xs text-gray-600">
        Felix — Adaptive Interview-Skills Coach · Techashy Hackathon
      </footer>
    </main>
  );
}
