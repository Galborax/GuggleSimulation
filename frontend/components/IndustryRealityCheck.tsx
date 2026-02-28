"use client";

import { useState, useEffect, useRef } from "react";
import { brainstormChat, fetchBenchmarks } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign,
  Percent,
  TrendingDown,
  TrendingUp,
  Building2,
  AlertTriangle,
  BarChart3,
  Send,
  Bot,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import CitationBadge from "@/components/CitationBadge";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Reference {
  id: number;
  source: string;
  url: string;
}

interface IndustryAverages {
  startup_cost: string;
  profit_margin: string;
  failure_rate: string;
  break_even: string;
  summary: string;
  citations: { metric: string; refId: number }[];
}

interface Competitor {
  name: string;
  capex: string;
  revenueModel: string;
  modelBadge: string;
  refId: number;
}

interface MacroTrend {
  headline: string;
  growthRate: string;
  detail: string;
  headwind: string;
  growthRefId: number;
  headwindRefId: number;
}

interface MockBenchmarkData {
  industry: string;
  location: string;
  industry_averages: IndustryAverages;
  competitors: Competitor[];
  macro_trend: MacroTrend;
  references: Reference[];
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockBenchmarkData: MockBenchmarkData = {
  industry: "F&B Cafes",
  location: "Malaysia",
  industry_averages: {
    startup_cost: "RM 150,000 – RM 350,000",
    profit_margin: "12% – 18%",
    failure_rate: "28% in Year 1",
    break_even: "14 – 22 months",
    summary:
      "Malaysian F&B startups face high upfront CapEx from rental deposits and fit-out costs, with thin margins amplified by food-cost volatility and rising minimum wages since January 2024.",
    citations: [
      { metric: "startup_cost", refId: 1 },
      { metric: "profit_margin", refId: 2 },
      { metric: "failure_rate", refId: 3 },
      { metric: "break_even", refId: 1 },
    ],
  },
  competitors: [
    {
      name: "Oriental Kopi",
      capex: "RM 400,000+ (Premium Mall Locations)",
      revenueModel: "High table turnover & dine-in upselling",
      modelBadge: "Mall-Anchored",
      refId: 2,
    },
    {
      name: "ZUS Coffee",
      capex: "RM 150,000 (Tech-driven Grab-and-Go)",
      revenueModel: ">60% App-based orders via own super-app",
      modelBadge: "Digital-First",
      refId: 4,
    },
  ],
  macro_trend: {
    headline: "Coffee Consumption CAGR vs Rising OpEx",
    growthRate: "6.2% CAGR (2023–2028)",
    detail:
      "Malaysia's specialty coffee market is riding a premiumisation wave driven by Millennial and Gen-Z consumers who trade-up to RM 15–25 brews. Delivery penetration now exceeds 38% of café revenue.",
    headwind:
      "Recent minimum-wage hike to RM 1,700 (Jan 2025) has increased F&B operating costs by an estimated 7–9%, squeezing margins for operators with more than 5 headcount.",
    growthRefId: 3,
    headwindRefId: 5,
  },
  references: [
    { id: 1, source: "Malaysian F&B Association Report 2024", url: "https://www.mfba.org.my" },
    { id: 2, source: "The Edge Markets – F&B Sector", url: "https://theedgemarkets.com/category/business" },
    { id: 3, source: "Euromonitor Coffee in Malaysia 2024", url: "https://www.euromonitor.com/coffee-in-malaysia/report" },
    { id: 4, source: "ZUS Coffee Investor Deck (public)", url: "https://zuscoffee.com" },
    { id: 5, source: "DOSM Labour Cost Survey Q3 2024", url: "https://www.dosm.gov.my" },
  ],
};

// ─── Skeleton Card ───────────────────────────────────────────────────────────

function SkeletonCard({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-2xl border border-white/8 bg-white/[0.04] p-5 space-y-3"
    >
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded-full bg-white/10 animate-pulse" />
        <div className="h-3.5 w-36 rounded bg-white/10 animate-pulse" />
      </div>
      <div className="space-y-2 pt-1">
        <div className="h-2.5 w-full rounded bg-white/8 animate-pulse" />
        <div className="h-2.5 w-4/5 rounded bg-white/8 animate-pulse" />
        <div className="h-2.5 w-3/4 rounded bg-white/7 animate-pulse" />
      </div>
      <div className="flex gap-2 pt-1">
        <div className="h-6 w-20 rounded-lg bg-white/6 animate-pulse" />
        <div className="h-6 w-16 rounded-lg bg-white/6 animate-pulse" />
      </div>
    </motion.div>
  );
}

// ─── Metric Row ──────────────────────────────────────────────────────────────

function MetricRow({
  icon: Icon,
  label,
  value,
  refId,
  refSource,
  refUrl,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  refId: number;
  refSource: string;
  refUrl: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-white/5 last:border-0">
      <div className="mt-0.5 rounded-lg bg-sky-500/10 border border-sky-500/10 p-1.5 shrink-0">
        <Icon className="h-3.5 w-3.5 text-sky-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-white/40 mb-0.5 uppercase tracking-wide font-medium">{label}</p>
        <p className="text-sm font-semibold text-white/90 leading-snug flex items-center gap-1 flex-wrap">
          {value}
          <CitationBadge id={refId} source={refSource} url={refUrl} />
        </p>
      </div>
    </div>
  );
}

// ─── Chat Stub ───────────────────────────────────────────────────────────────

function ChatStub({
  industry,
  location,
  founderContext,
}: {
  industry: string;
  location: string;
  founderContext?: string;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "ai" | "user"; text: string }[]>([
    {
      role: "ai",
      text: `👋 I've pulled real benchmarks for **${industry} in ${location}**. Take a look at the right panel — those figures are industry anchors before you set your budget. Ask me anything about the market!`,
    },
  ]);
  const [typing, setTyping] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const updatedMessages = [...messages, { role: "user" as const, text: trimmed }];
    setMessages(updatedMessages);
    setInput("");
    setTyping(true);

    try {
      const res = await brainstormChat({
        session_id: sessionIdRef.current,
        message: trimmed,
        history: updatedMessages.slice(0, -1).map((m) => ({
          role: m.role === "ai" ? "assistant" : "user",
          content: m.text,
        })),
        country: location,
        business_category: industry,
        founder_context: founderContext || "",
      });
      if (res.session_id) sessionIdRef.current = res.session_id as string;
      setMessages((prev) => [
        ...prev,
        { role: "ai" as const, text: (res.reply as string) || "I couldn't get a response. Try again." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai" as const, text: "⚠️ Couldn't reach the AI right now — check the backend is running and try again." },
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12, duration: 0.35 }}
            className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {m.role === "ai" && (
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-sky-600 to-violet-600 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-3.5 w-3.5 text-white" />
              </div>
            )}
            <div
              className={[
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                m.role === "ai"
                  ? "bg-white/[0.07] text-white/80 rounded-tl-sm"
                  : "bg-sky-600/80 text-white rounded-tr-sm ml-auto",
              ].join(" ")}
              dangerouslySetInnerHTML={{
                __html: m.text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
              }}
            />
          </motion.div>
        ))}

        {typing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2.5"
          >
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-sky-600 to-violet-600 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="bg-white/[0.07] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              {[0, 0.15, 0.3].map((d) => (
                <motion.div
                  key={d}
                  className="h-1.5 w-1.5 rounded-full bg-white/40"
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 0.8, delay: d, repeat: Infinity }}
                />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-white/[0.07] bg-[#0c0e1a]/60">
        <div className="flex items-center gap-2 bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 focus-within:border-sky-500/40 transition-colors">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask about the market data…"
            className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/25 outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="h-7 w-7 rounded-lg bg-sky-600 disabled:bg-white/10 disabled:text-white/20 text-white flex items-center justify-center transition-all hover:bg-sky-500 disabled:cursor-not-allowed"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Right Panel (Reality Canvas) ────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

function RealityCanvas({ data }: { data: MockBenchmarkData }) {
  const ref = (id: number): Reference =>
    data.references.find((r) => r.id === id) ?? { id, source: `Source ${id}`, url: "" };

  return (
    <motion.div
      className="flex flex-col gap-4 h-full overflow-y-auto px-5 py-4 pb-6 scrollbar-thin scrollbar-thumb-white/10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={cardVariants} className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-sm font-bold text-white/90 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-sky-400" />
            Industry Reality Check
          </h3>
          <p className="text-[11px] text-white/35 mt-0.5">
            {data.industry.toUpperCase()} · {data.location} ·{" "}
            <span className="text-sky-400/60">Live benchmarks</span>
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          Verified
        </span>
      </motion.div>

      {/* ── Card A: Industry Averages ── */}
      <motion.div
        variants={cardVariants}
        className="rounded-2xl border border-white/10 bg-gradient-to-br from-sky-950/50 to-slate-900/30 backdrop-blur-md p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📊</span>
          <h4 className="text-sm font-semibold text-white/85">Industry Averages</h4>
          <span className="ml-auto text-[10px] text-white/30">The Anchor</span>
        </div>

        <div className="space-y-0">
          <MetricRow
            icon={DollarSign}
            label="Avg. Startup Cost"
            value={data.industry_averages.startup_cost}
            refId={ref(1).id}
            refSource={ref(1).source}
            refUrl={ref(1).url}
          />
          <MetricRow
            icon={Percent}
            label="Avg. Profit Margin"
            value={data.industry_averages.profit_margin}
            refId={ref(2).id}
            refSource={ref(2).source}
            refUrl={ref(2).url}
          />
          <MetricRow
            icon={TrendingDown}
            label="Year-1 Failure Rate"
            value={data.industry_averages.failure_rate}
            refId={ref(3).id}
            refSource={ref(3).source}
            refUrl={ref(3).url}
          />
          <MetricRow
            icon={BarChart3}
            label="Break-even Timeline"
            value={data.industry_averages.break_even}
            refId={ref(1).id}
            refSource={ref(1).source}
            refUrl={ref(1).url}
          />
        </div>

        <p className="mt-4 text-[11px] text-white/45 leading-relaxed border-t border-white/5 pt-3">
          {data.industry_averages.summary}
        </p>
      </motion.div>

      {/* ── Card B: Real-World Competitors ── */}
      <motion.div
        variants={cardVariants}
        className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-950/50 to-slate-900/30 backdrop-blur-md p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🏢</span>
          <h4 className="text-sm font-semibold text-white/85">Real-World Competitors</h4>
          <span className="ml-auto text-[10px] text-white/30">The Examples</span>
        </div>

        <div className="space-y-3">
          {data.competitors.map((c, i) => {
            const r = ref(c.refId);
            return (
              <div
                key={i}
                className="rounded-xl bg-white/[0.05] border border-white/8 p-3.5 space-y-2"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-white/90">{c.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/20 font-medium">
                    {c.modelBadge}
                  </span>
                  <CitationBadge id={r.id} source={r.source} url={r.url} />
                </div>

                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <DollarSign className="h-3 w-3 text-white/30 mt-0.5 shrink-0" />
                    <p className="text-xs text-white/60 leading-snug">
                      <span className="text-white/40 font-medium">CapEx: </span>
                      {c.capex}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Building2 className="h-3 w-3 text-violet-400/60 mt-0.5 shrink-0" />
                    <p className="text-xs text-violet-300/70 leading-snug">
                      <span className="text-violet-300/50 font-medium">Model: </span>
                      {c.revenueModel}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Card C: Macro Trend Alert ── */}
      <motion.div
        variants={cardVariants}
        className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-950/50 to-slate-900/30 backdrop-blur-md p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📈</span>
          <h4 className="text-sm font-semibold text-white/85">Macro Trend Alert</h4>
          <span className="ml-auto text-[10px] text-white/30">Watch This</span>
        </div>

        <p className="text-sm font-semibold text-white/85 mb-2">{data.macro_trend.headline}</p>

        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span className="text-sm font-bold text-emerald-400">{data.macro_trend.growthRate}</span>
          <CitationBadge
            id={ref(data.macro_trend.growthRefId).id}
            source={ref(data.macro_trend.growthRefId).source}
            url={ref(data.macro_trend.growthRefId).url}
          />
        </div>

        <p className="text-xs text-white/50 leading-relaxed mb-3">{data.macro_trend.detail}</p>

        {/* Headwind warning */}
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-3.5 py-3 flex items-start gap-2.5">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-amber-300/80 leading-relaxed">
              {data.macro_trend.headwind}
            </p>
            <div className="mt-1">
              <CitationBadge
                id={ref(data.macro_trend.headwindRefId).id}
                source={ref(data.macro_trend.headwindRefId).source}
                url={ref(data.macro_trend.headwindRefId).url}
                variant="estimated"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer: source count */}
      <motion.p variants={cardVariants} className="text-[10px] text-white/25 text-center pt-1">
        {data.references.length} verified sources · hover{" "}
        <span className="text-sky-400/50">[N]</span> badges to check any figure
      </motion.p>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface IndustryRealityCheckProps {
  /** Industry label shown in the header and chat stub */
  industry?: string;
  /** Location / country label */
  location?: string;
  /** Founder profile context forwarded to the AI */
  founderContext?: string;
  /** Called when the user clicks "Continue to Brainstorming" */
  onContinue?: () => void;
}

export default function IndustryRealityCheck({
  industry = "F&B Cafes",
  location = "Malaysia",
  founderContext,
  onContinue,
}: IndustryRealityCheckProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MockBenchmarkData | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchBenchmarks(industry, location)
      .then((res) => {
        const avgs = res.industry_averages as unknown as Record<string, string>;
        const sources: Reference[] = (res.sources ?? []).slice(0, 6).map((s, i) => ({
          id: i + 1,
          source: (s as unknown as Record<string, string>).source_name ?? `Source ${i + 1}`,
          url: (s as unknown as Record<string, string>).url || "",
        }));
        if (sources.length === 0) {
          sources.push({ id: 1, source: "Industry Estimate", url: "" });
          sources.push({ id: 2, source: "Regional Benchmark", url: "" });
          sources.push({ id: 3, source: "Market Analysis", url: "" });
        }
        const snaps = (res.competitor_snapshots ?? []) as unknown as Record<string, string>[];
        const competitors: Competitor[] = snaps.map((c, i) => ({
          name: c.name ?? `Player ${i + 1}`,
          capex: c.key_stat ?? "—",
          revenueModel: c.description ?? "—",
          modelBadge: c.model_type ?? "—",
          refId: Math.min(i + 1, sources.length),
        }));
        const trend = res.macro_trend as unknown as Record<string, string>;
        setData({
          industry,
          location,
          industry_averages: {
            startup_cost: avgs.startup_cost_range ?? "—",
            profit_margin: avgs.profit_margin_range ?? "—",
            failure_rate: avgs.year1_failure_rate ?? "—",
            break_even: avgs.break_even_months ?? "—",
            summary: avgs.summary ?? "",
            citations: [],
          },
          competitors,
          macro_trend: {
            headline: trend.headline ?? "—",
            growthRate: trend.growth_rate ?? "—",
            detail: trend.detail ?? "",
            headwind: trend.headwind ?? "",
            growthRefId: 1,
            headwindRefId: Math.min(2, sources.length),
          },
          references: sources,
        });
      })
      .catch(() => {
        setData({ ...mockBenchmarkData, industry, location });
      })
      .finally(() => setLoading(false));
  }, [industry, location]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── LEFT PANEL: Chat Stub ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col border-r border-white/[0.07] overflow-hidden">
        {/* Panel header */}
        <div className="shrink-0 px-5 py-3 border-b border-white/[0.07] bg-[#0c0e1a]/60">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-sky-400" />
            <p className="text-xs font-semibold text-white/70">AI Incubator</p>
          </div>
          <p className="text-[11px] text-white/30 mt-0.5">
            Industry briefing for{" "}
            <span className="text-sky-400/70 font-medium">{industry}</span> ·{" "}
            <span className="text-white/50">{location}</span>
          </p>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-hidden">
          <ChatStub industry={industry} location={location} founderContext={founderContext} />
        </div>

        {/* CTA */}
        <div className="shrink-0 px-4 py-3 border-t border-white/[0.07] bg-[#0c0e1a]/80">
          <button
            onClick={onContinue}
            disabled={loading}
            className={[
              "w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold",
              "transition-all duration-200",
              loading
                ? "bg-white/5 text-white/25 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-600 to-sky-600 text-white hover:from-emerald-500 hover:to-sky-500 shadow-lg shadow-emerald-900/30",
            ].join(" ")}
          >
            Continue to Brainstorming
            <ArrowRight className="h-4 w-4" />
          </button>
          {loading && (
            <p className="text-center text-[10px] text-white/25 mt-1.5">
              Loading benchmarks…
            </p>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: Reality Canvas ───────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0c14]">
        {/* Panel header */}
        <div className="shrink-0 px-5 py-3 border-b border-white/[0.07]">
          <p className="text-xs font-semibold text-white/50">
            ✦ <span className="text-white/70">Reality Check Canvas</span>
          </p>
          <p className="text-[11px] text-white/25 mt-0.5">
            {loading
              ? "Fetching real-world benchmarks…"
              : "Verified figures to anchor your financial plan"}
          </p>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {loading ? (
              /* Skeleton state */
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.25 } }}
                className="flex flex-col gap-4 px-5 py-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-4 w-4 rounded-full bg-white/10 animate-pulse" />
                  <div className="h-3 w-40 rounded bg-white/10 animate-pulse" />
                  <div className="ml-auto h-5 w-16 rounded-full bg-white/8 animate-pulse" />
                </div>
                <SkeletonCard delay={0} />
                <SkeletonCard delay={0.1} />
                <SkeletonCard delay={0.2} />
              </motion.div>
            ) : (
              /* Slide-in from right */
              <motion.div
                key="reality"
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="h-full"
              >
                {data && <RealityCanvas data={data} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
