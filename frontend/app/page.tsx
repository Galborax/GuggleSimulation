"use client";
import { useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  BarChart2,
  TrendingUp,
  Users,
  AlertTriangle,
  Zap,
  ChevronRight,
  Shield,
  ExternalLink,
  Menu,
  X,
  Activity,
  DollarSign,
  Target,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Scroll-reveal wrapper
───────────────────────────────────────────── */
function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Infinitely-scrolling marquee
───────────────────────────────────────────── */
const DATA_SOURCES = [
  "Alpha Vantage",
  "NewsAPI",
  "Federal Reserve Economic Data (FRED)",
  "DOSM Malaysia",
  "Gemini 2.5 Flash Lite",
  "World Bank Open Data",
  "IMF DataMapper",
  "SEC EDGAR",
];

function Marquee() {
  const doubled = [...DATA_SOURCES, ...DATA_SOURCES];
  return (
    <div className="relative overflow-hidden py-4 group">
      {/* fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-950 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-950 to-transparent z-10" />
      <motion.div
        className="flex gap-12 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((src, i) => (
          <span
            key={i}
            className="text-slate-500 text-sm font-medium tracking-wide uppercase select-none"
          >
            {src}
            <span className="mx-6 text-slate-700">·</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Floating dashboard mockup
───────────────────────────────────────────── */
function DashboardMockup() {
  return (
    <motion.div
      className="relative mx-auto w-full max-w-2xl"
      initial={{ opacity: 0, y: 40, rotateX: 12 }}
      animate={{ opacity: 1, y: 0, rotateX: 6 }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
      style={{ perspective: 1200 }}
    >
      {/* ambient glow */}
      <div className="absolute inset-0 rounded-3xl blur-3xl bg-emerald-500/10 scale-110 -z-10" />

      {/* main card */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* title bar */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-800 bg-slate-950/60">
          <span className="w-3 h-3 rounded-full bg-rose-500/70" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
          <span className="ml-3 text-xs text-slate-500 font-mono">GuggleSimulation — Strategy Hub</span>
        </div>

        <div className="p-5 grid grid-cols-2 gap-4">
          {/* viability score */}
          <motion.div
            className="col-span-1 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4"
            animate={{ borderColor: ["rgba(16,185,129,0.3)", "rgba(16,185,129,0.6)", "rgba(16,185,129,0.3)"] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400 font-medium">Viability Score</span>
            </div>
            <p className="text-3xl font-bold text-emerald-400">82<span className="text-lg text-slate-500">/100</span></p>
            <p className="text-xs text-emerald-600 mt-1">↑ Strong foundation</p>
          </motion.div>

          {/* cash runway */}
          <div className="col-span-1 rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-400 font-medium">Cash Runway</span>
            </div>
            <p className="text-3xl font-bold text-cyan-400">16<span className="text-lg text-slate-500"> mo</span></p>
            <p className="text-xs text-slate-500 mt-1">At current burn rate</p>
          </div>

          {/* mini chart placeholder */}
          <div className="col-span-2 rounded-xl border border-slate-700/50 bg-slate-800/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-400 font-medium">Monthly Revenue Projection</span>
              </div>
              <span className="text-xs text-emerald-400 font-semibold">+34% MoM</span>
            </div>
            <div className="flex items-end gap-1 h-14">
              {[22, 30, 28, 42, 38, 55, 50, 68, 63, 80, 75, 95].map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-sm bg-gradient-to-t from-emerald-600 to-emerald-400"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.6 + i * 0.05, duration: 0.4, ease: "easeOut" }}
                  style={{ height: `${h}%`, transformOrigin: "bottom" }}
                />
              ))}
            </div>
          </div>

          {/* risk badge */}
          <div className="col-span-1 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Market Risk</p>
              <p className="text-sm font-semibold text-amber-400">Medium</p>
            </div>
          </div>

          {/* board verdict */}
          <div className="col-span-1 rounded-xl border border-purple-500/25 bg-purple-500/5 p-3 flex items-center gap-3">
            <Users className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Board Verdict</p>
              <p className="text-sm font-semibold text-purple-400">Proceed ✓</p>
            </div>
          </div>
        </div>
      </div>

      {/* floating citation pill */}
      <motion.div
        className="absolute -bottom-4 -right-4 flex items-center gap-2 rounded-full border border-slate-600/60 bg-slate-800/90 backdrop-blur px-4 py-2 shadow-xl text-xs text-slate-300"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Shield className="w-3.5 h-3.5 text-emerald-400" />
        Verified data · No hallucinations
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Bento feature cards
───────────────────────────────────────────── */
const FEATURES = [
  {
    wide: true,
    icon: BarChart2,
    color: "emerald",
    title: "Industry Reality Check",
    desc: "Don't start blind. Instantly pull verified financial benchmarks and competitor data for your specific industry.",
  },
  {
    wide: false,
    icon: TrendingUp,
    color: "cyan",
    title: "Interactive Runway",
    desc: "Drag-and-drop hiring and marketing events to instantly calculate your cash burn rate.",
  },
  {
    wide: false,
    icon: Users,
    color: "purple",
    title: "The Advisory Panel",
    desc: "Pitch your idea to a multi-agent AI Board. Let the Skeptic and Visionary debate your blind spots.",
  },
  {
    wide: true,
    icon: AlertTriangle,
    color: "amber",
    title: "Chaos Engine & Resilience",
    desc: "What if supply costs jump 20%? Trigger localized Black Swan events to see if your business survives.",
  },
];

const colorMap: Record<string, string> = {
  emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/50",
  cyan:    "text-cyan-400    bg-cyan-500/10    border-cyan-500/20    hover:border-cyan-500/50",
  purple:  "text-purple-400  bg-purple-500/10  border-purple-500/20  hover:border-purple-500/50",
  amber:   "text-amber-400   bg-amber-500/10   border-amber-500/20   hover:border-amber-500/50",
};
const iconBg: Record<string, string> = {
  emerald: "bg-emerald-500/15",
  cyan:    "bg-cyan-500/15",
  purple:  "bg-purple-500/15",
  amber:   "bg-amber-500/15",
};

/* ─────────────────────────────────────────────
   Citation mockup
───────────────────────────────────────────── */
function CitationMockup() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block max-w-lg text-left text-slate-300 leading-relaxed text-sm md:text-base">
      <p>
        The F&B sector in Southeast Asia has a median gross margin of{" "}
        <span className="text-slate-200 font-medium">62.4%</span>, yet most
        founders underestimate operating costs by up to{" "}
        <span className="text-slate-200 font-medium">40%</span> in their first
        year.{" "}
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/40 transition-colors align-middle"
        >
          1
        </button>
      </p>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 top-full mt-3 z-20 w-80 rounded-xl border border-slate-700 bg-slate-800/95 backdrop-blur-sm p-4 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <ExternalLink className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-200 mb-1">
                  Source [1] — World Bank SME Finance Report
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  "SMEs in emerging markets consistently underestimate fixed and variable operating costs during initial projections…"
                </p>
                <p className="mt-2 text-xs text-emerald-400 font-medium">worldbank.org · 2024</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 80], ["rgba(2,6,23,0)", "rgba(2,6,23,0.85)"]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 overflow-x-hidden">

      {/* ── ambient background blobs ── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute top-1/2 -right-60 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-purple-500/4 blur-[120px]" />
      </div>

      {/* ════════════════════════════════════════
          1.  STICKY NAVBAR
      ════════════════════════════════════════ */}
      <motion.nav
        style={{ backgroundColor: navBg as unknown as string }}
        className="fixed top-0 inset-x-0 z-50 backdrop-blur-md border-b border-slate-800/60"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 rounded-lg bg-emerald-400/30 blur-md group-hover:bg-emerald-400/50 transition-colors" />
              <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-slate-950" />
              </div>
            </div>
            <span className="text-sm font-bold tracking-tight text-white">
              Guggle<span className="text-emerald-400">Simulation</span>
            </span>
          </Link>

          {/* right CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/incubator"
              className="relative group text-sm font-semibold px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20">
              <span className="relative z-10">Start Simulating — Free</span>
            </Link>
          </div>

          {/* mobile hamburger */}
          <button className="md:hidden p-2 text-slate-400 hover:text-white" onClick={() => setMobileMenuOpen((v) => !v)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-slate-800/60 bg-slate-950/95 backdrop-blur-md"
            >
              <div className="px-6 py-4 flex flex-col gap-4">
                <Link href="/incubator"
                  className="text-sm font-semibold text-center py-2 rounded-lg bg-emerald-500 text-slate-950">
                  Start Simulating — Free
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ════════════════════════════════════════
          2.  HERO SECTION
      ════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-6">
        {/* radial emerald glow behind headline */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10">
          <div className="w-[600px] h-[400px] bg-emerald-500/8 rounded-full blur-[100px]" />
        </div>

        <FadeUp className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-4 py-1.5 text-xs text-emerald-400 font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            AI-Powered · Real-Time Market Data · Zero Guesswork
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
            <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              Stop Guessing.
            </span>
            <br />
            <span className="text-slate-100">Start Simulating.</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Bridge the reality gap. Stress-test your startup idea against hyper-local market data,
            real-world costs, and AI-driven market chaos{" "}
            <span className="text-slate-200 font-medium">before you spend a single dollar.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/incubator">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="relative group flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-base shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-shadow"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Zap className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Launch the Simulator</span>
                <ChevronRight className="w-4 h-4 relative z-10" />
              </motion.button>
            </Link>

          </div>
        </FadeUp>

        {/* dashboard mockup */}
        <div className="mt-20 w-full max-w-2xl px-4">
          <DashboardMockup />
        </div>
      </section>

      {/* ════════════════════════════════════════
          3.  SOCIAL PROOF MARQUEE
      ════════════════════════════════════════ */}
      <section className="py-8 border-y border-slate-800/60">
        <p className="text-center text-xs text-slate-600 uppercase tracking-widest font-semibold mb-4">
          Data transparently sourced from
        </p>
        <Marquee />
      </section>

      {/* ════════════════════════════════════════
          4.  BENTO FEATURE GRID
      ════════════════════════════════════════ */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-100 mb-4">
              Your complete Founder&apos;s Toolkit.
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Four engines working in concert. Each one built to expose a different way your business could fail — so you can fix it before launch.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              const classes = colorMap[f.color];
              const ibg = iconBg[f.color];
              return (
                <FadeUp key={f.title} delay={i * 0.08} className={f.wide ? "md:col-span-2" : ""}>
                  <motion.div
                    whileHover={{ y: -3 }}
                    className={`rounded-2xl border bg-slate-900/60 backdrop-blur p-7 transition-all duration-300 cursor-default ${classes}`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${ibg}`}>
                      <Icon className={`w-5 h-5 ${classes.split(" ")[0]}`} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-100 mb-2">{f.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-prose">{f.desc}</p>
                  </motion.div>
                </FadeUp>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          5.  TRUST LAYER — CITATION ENGINE
      ════════════════════════════════════════ */}
      <section className="py-24 px-6 border-t border-slate-800/60">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* copy */}
            <FadeUp>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 text-xs text-emerald-400 font-medium mb-6">
                <Shield className="w-3 h-3" />
                Transparency Engine
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 mb-5">
                No AI Hallucinations.{" "}
                <br />
                <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                  100% Verifiable Data.
                </span>
              </h2>
              <p className="text-slate-400 leading-relaxed">
                Every insight GuggleSimulation surfaces is backed by a real, clickable source.
                We fetch live data from government databases, financial APIs, and verified news feeds.
                No fabricated statistics. No black-box numbers. Just evidence you can audit.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Inline [1] citation badges on every key fact",
                  "Source drawer with live URL + publication date",
                  "Data freshness indicator on all benchmarks",
                ].map((text) => (
                  <li key={text} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
            </FadeUp>

            {/* citation mockup */}
            <FadeUp delay={0.15}>
              <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-xl p-8 shadow-2xl">
                <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-5">
                  Sample Insight
                </div>
                <CitationMockup />
                <p className="mt-4 text-xs text-slate-600 italic">
                  ↑ Click the [1] badge to reveal the verified source
                </p>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          6.  BOTTOM CTA
      ════════════════════════════════════════ */}
      <section className="py-32 px-6 border-t border-slate-800/60 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-[700px] h-[400px] bg-emerald-500/6 rounded-full blur-[120px]" />
        </div>
        <FadeUp className="relative z-10 text-center max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-100 mb-6">
            Ready to survive{" "}
            <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
              the market?
            </span>
          </h2>
          <p className="text-slate-400 text-lg mb-10">
            Join founders who stress-test their ideas before betting their savings on them.
          </p>
          <Link href="/incubator">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="relative inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-lg shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-shadow"
            >
              <Zap className="w-5 h-5" />
              Build My Executive Blueprint
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </FadeUp>
      </section>



    </div>
  );
}
