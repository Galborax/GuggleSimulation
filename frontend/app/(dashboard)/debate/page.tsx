/**
 * Advisory Panel — Triptych Command Center Layout
 *
 * ┌─────────────┬──────────────────────────┬─────────────────────┐
 * │  Agent      │                          │   The Process       │
 * │  Roster     │    DebateArena (live)     │   (step guide)      │
 * │  (profiles) │                          │                     │
 * └─────────────┴──────────────────────────┴─────────────────────┘
 */

import DebateArena from "@/components/DebateArena";

const AGENTS = [
  {
    emoji: "🚀",
    name: "Marcus Tan",
    role: "Visionary Investor",
    color: "indigo",
    stance: "Pro-Growth",
    desc: "Champions bold moves. Looks for 10x potential, network effects, and category-defining opportunities.",
  },
  {
    emoji: "🔍",
    name: "Diana Lim",
    role: "Skeptic Analyst",
    color: "red",
    stance: "Devil's Advocate",
    desc: "Stress-tests every assumption. Identifies fatal flaws, unit-economics gaps, and execution risks.",
  },
  {
    emoji: "📊",
    name: "Ryan Chen",
    role: "Market Expert",
    color: "emerald",
    stance: "Data-Driven",
    desc: "Benchmarks against real market trends, comparable exits, and competitor power dynamics.",
  },
  {
    emoji: "⚖️",
    name: "Victoria Wong",
    role: "Final Arbiter",
    color: "purple",
    stance: "Neutral Judge",
    desc: "Weighs all arguments, delivers the verdict, and prescribes the exact next action.",
  },
];

const PROCESS_STEPS = [
  { step: "01", title: "Submit a decision", desc: "Type the strategy you need 360° feedback on." },
  { step: "02", title: "Panel debates", desc: "3 agents argue from Bull, Bear, and Market angles simultaneously." },
  { step: "03", title: "Judge weighs in", desc: "Victoria delivers Proceed / Pause / Reject + confidence score." },
  { step: "04", title: "Debrief any point", desc: "Click any risk or opportunity bullet to drill deeper 1-on-1 with the agent." },
  { step: "05", title: "Apply to Runway", desc: "Agent suggestions can patch your Financial Timeline in one click." },
];

const AGENT_BORDER: Record<string, string> = {
  indigo: "border-indigo-500/25 bg-indigo-950/30",
  red:    "border-red-500/25 bg-red-950/30",
  emerald:"border-emerald-500/25 bg-emerald-950/30",
  purple: "border-purple-500/25 bg-purple-950/30",
};

export default function DebatePage() {
  return (
    <div className="flex h-[calc(100dvh-3.5rem)] overflow-hidden">

      {/* ── Left: Agent Roster ─────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 border-r border-white/[0.07] p-4 space-y-3 overflow-y-auto">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 px-1 mb-4">
          Your Panel
        </p>

        {AGENTS.map((a) => (
          <div
            key={a.name}
            className={`rounded-xl border p-3 space-y-1.5 ${AGENT_BORDER[a.color]}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg leading-none">{a.emoji}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white leading-tight truncate">{a.name}</p>
                <p className="text-[10px] text-gray-500 leading-tight">{a.role}</p>
              </div>
            </div>
            <span
              className={`inline-block text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full
                ${a.color === "indigo"  ? "bg-indigo-700/40 text-indigo-300"  : ""}
                ${a.color === "red"     ? "bg-red-700/40 text-red-300"        : ""}
                ${a.color === "emerald" ? "bg-emerald-700/40 text-emerald-300": ""}
                ${a.color === "purple"  ? "bg-purple-700/40 text-purple-300"  : ""}
              `}
            >
              {a.stance}
            </span>
            <p className="text-[10px] text-gray-600 leading-relaxed">{a.desc}</p>
          </div>
        ))}
      </aside>

      {/* ── Center: Live Debate ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 min-w-0">
        <div className="max-w-2xl mx-auto space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Advisory Panel</h1>
            <p className="text-gray-500 text-sm mt-1">
              Submit your business decision for a structured multi-perspective analysis.
            </p>
          </div>
          <DebateArena />
        </div>
      </div>

      {/* ── Right: Process Guide ────────────────────────────────────────── */}
      <aside className="w-52 shrink-0 border-l border-white/[0.07] p-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 px-1 mb-4">
          How it works
        </p>

        {PROCESS_STEPS.map(({ step, title, desc }) => (
          <div key={step} className="flex gap-2.5 py-2">
            <div className="h-6 w-6 rounded-full bg-indigo-950 border border-indigo-800/60 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[9px] font-bold text-indigo-400">{step}</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-300 leading-tight">{title}</p>
              <p className="text-[10px] text-gray-600 leading-relaxed mt-0.5">{desc}</p>
            </div>
          </div>
        ))}

        {/* Debrief hint */}
        <div className="mt-4 p-3 rounded-xl bg-indigo-900/20 border border-indigo-500/20">
          <p className="text-[10px] font-semibold text-indigo-300 mb-1">💡 Pro tip</p>
          <p className="text-[10px] text-gray-500 leading-relaxed">
            After the verdict, hover any risk or opportunity bullet — they&apos;re clickable for 1-on-1 deep-dive.
          </p>
        </div>
      </aside>

    </div>
  );
}
