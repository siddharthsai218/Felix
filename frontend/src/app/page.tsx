import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#070b12] text-white flex flex-col justify-between selection:bg-violet-500/30">
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* Top Header Bar                                                            */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <header className="w-full bg-[#090d16] border-b border-slate-800/80 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-violet-500/20">
                F
              </div>
              <span className="font-extrabold text-sm tracking-wider uppercase text-white font-mono">
                FELIX AI
              </span>
            </Link>

            <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/50 text-[10px] font-mono text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>ENGINEERING REHEARSAL SUITE v2.4</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/session/report?sessionId=FLX-98219"
              className="text-xs font-mono text-slate-400 hover:text-white transition-colors hidden sm:inline-block"
            >
              Demo Assessment
            </Link>
            <Link
              href="/session/setup"
              className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-mono font-bold text-white shadow-md shadow-violet-500/25 transition-all"
            >
              Start Rehearsal →
            </Link>
          </div>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* Hero Section                                                              */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-16 sm:py-24 text-center space-y-6">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300 text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Formative Closed-Loop Interview Coaching • Not a Proctoring Screen</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Master Your Architectural Delivery,{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">
            Not Just Your Trivia.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          The interview is the <strong className="text-slate-200">practice activity</strong>; the closed-loop skill elevation is the point. Experience real-time avatar probing, live acoustic jitter tracking, and the executive Answer Transformer.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/session/setup"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:from-violet-500 hover:to-indigo-500 text-white font-mono font-bold text-sm shadow-xl shadow-violet-500/25 transition-all hover:scale-[1.01]"
          >
            Launch Engineering Rehearsal →
          </Link>
          <Link
            href="/session/report?sessionId=FLX-98219"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono text-xs transition-colors"
          >
            View Sample Assessment Report
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-12">
          {/* Feature 1 */}
          <div className="p-5 rounded-2xl bg-[#0d131f] border border-slate-800/90 shadow-xl space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-lg text-cyan-400 font-mono">
              🐙
            </div>
            <h3 className="font-bold text-sm text-white font-mono">GitHub Upstream Grounding</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Felix reads your actual public code and architecture to cross-examine you on your real commits, state machines, and concurrency trade-offs.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-5 rounded-2xl bg-[#0d131f] border border-slate-800/90 shadow-xl space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-lg text-violet-400 font-mono">
              ⚡
            </div>
            <h3 className="font-bold text-sm text-white font-mono">The Answer Transformer</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Immediate side-by-side translation: your unstructured verbatim speech rewritten into an executive-ready STAR pitch with quantifiable metrics.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-5 rounded-2xl bg-[#0d131f] border border-slate-800/90 shadow-xl space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-lg text-emerald-400 font-mono">
              〰️
            </div>
            <h3 className="font-bold text-sm text-white font-mono">Multimodal Biometrics</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time normalized autocorrelation vocal jitter tracking and MediaPipe eye contact alignment—coaching self-awareness, never penalizing.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Bar */}
      <footer className="w-full bg-[#090d16] border-t border-slate-800/80 py-4 px-6 text-center text-[11px] font-mono text-slate-500">
        ENGINEERING REHEARSAL SUITE v2.4.1-rc • SECURE COGNITIVE LINK ACTIVE
      </footer>
    </main>
  );
}
