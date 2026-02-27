"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSession, generateRealityDashboard, getFinancialAnatomy, updateProfile } from "@/lib/api";
import { useProfileStore } from "@/lib/store";
import type { OnboardingSession, BusinessRealityDashboard, SourceDocument, FinancialAnatomyData } from "@/lib/types";
import FinancialAnatomyEngine from "@/components/FinancialAnatomyEngine";
import {
  DollarSign, Clock, TrendingUp, BarChart2, Target,
  Zap, MapPin, Users2, ChevronRight, RefreshCw, Database, CircleHelp, Pencil, Check, X,
} from "lucide-react";
import CitedText from "@/components/CitedText";
import SourceDrawer from "@/components/SourceDrawer";
import Link from "next/link";
import { toast } from "sonner";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

// ── Competitiveness Gauge ─────────────────────────────────────────────────────
const GAUGE_LEVELS = ["Low", "Medium", "High", "Saturated"] as const;
const GAUGE_COLORS: Record<string, { bar: string; text: string; bg: string; label: string }> = {
  Low:       { bar: "bg-emerald-500",  text: "text-emerald-400",  bg: "bg-emerald-900/20 border-emerald-500/30",  label: "🌊 Blue Ocean" },
  Medium:    { bar: "bg-yellow-500",   text: "text-yellow-400",   bg: "bg-yellow-900/20 border-yellow-500/30",   label: "🌤 Growing Market" },
  High:      { bar: "bg-orange-500",   text: "text-orange-400",   bg: "bg-orange-900/20 border-orange-500/30",   label: "🔥 Competitive" },
  Saturated: { bar: "bg-red-500",      text: "text-red-400",      bg: "bg-red-900/20 border-red-500/30",         label: "🔴 Red Ocean" },
};

function CompetitivenessGauge({ level }: { level: string }) {
  const idx = GAUGE_LEVELS.indexOf(level as typeof GAUGE_LEVELS[number]);
  const pct = ((idx + 1) / GAUGE_LEVELS.length) * 100;
  const c = GAUGE_COLORS[level] ?? GAUGE_COLORS.Medium;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">Blue Ocean</span>
        <span className={`text-xs font-bold ${c.text}`}>{c.label}</span>
        <span className="text-xs text-gray-400">Red Ocean</span>
      </div>
      <div className="relative h-3 rounded-full bg-white/10 overflow-hidden">
        <div className="absolute inset-0 flex">
          <div className="flex-1 bg-emerald-500/30 rounded-l-full" />
          <div className="flex-1 bg-yellow-500/30" />
          <div className="flex-1 bg-orange-500/30" />
          <div className="flex-1 bg-red-500/30 rounded-r-full" />
        </div>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`absolute inset-y-0 left-0 rounded-full ${c.bar} opacity-90`}
        />
        <motion.div
          initial={{ left: "0%" }}
          animate={{ left: `calc(${pct}% - 6px)` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute top-1/2 -translate-y-1/2 h-5 w-3 rounded-full bg-white shadow-lg border-2 border-white/60"
        />
      </div>
    </div>
  );
}

// ── Vital Sign Card ────────────────────────────────────────────────────────────
function VitalCard({
  icon, label, value, sub, color, delay, explanation, onCite,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
  delay: number;
  explanation?: {
    how_deduced: string;
    citation_ids: number[];
  };
  onCite: (id: number) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 p-5"
    >
      <div className="flex items-center justify-between gap-2 text-gray-400 text-xs">
        <div className="flex items-center gap-2">{icon}{label}</div>
        <ValueExplain explanation={explanation} onCite={onCite} />
      </div>
      <div className={`text-3xl font-extrabold tracking-tight ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
    </motion.div>
  );
}

function ValueExplain({
  explanation,
  onCite,
}: {
  explanation?: { how_deduced: string; citation_ids: number[] };
  onCite: (id: number) => void;
}) {
  if (!explanation) return null;

  const citationIds = Array.from(new Set(explanation.citation_ids || []));

  return (
    <div className="relative group inline-flex">
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-white/8 text-gray-400 hover:bg-indigo-500/20 hover:border-indigo-400/40 hover:text-indigo-300 transition-colors"
        title="View source"
      >
        <CircleHelp className="h-3.5 w-3.5" />
      </button>

      {/* Hover tooltip — appears above on hover */}
      <div className="pointer-events-none group-hover:pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute right-0 bottom-full mb-2 z-30 w-72 rounded-xl border border-white/20 bg-gray-950 shadow-2xl">
        <div className="p-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Source &amp; Method</p>
          <p className="text-xs leading-relaxed text-gray-100">{explanation.how_deduced}</p>
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {citationIds.length > 0 ? (
              citationIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onCite(id)}
                  className="pointer-events-auto rounded-full border border-indigo-500/50 bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-200 hover:bg-indigo-500/40 transition-colors"
                  title={`Open source [${id}]`}
                >
                  [{id}]
                </button>
              ))
            ) : (
              <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                AI estimate · no direct source
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [session, setSession] = useState<OnboardingSession | null>(null);
  const [dashboard, setDashboard] = useState<BusinessRealityDashboard | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [ideaNameInput, setIdeaNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingDash, setLoadingDash] = useState(false);
  const [anatomy, setAnatomy] = useState<FinancialAnatomyData | null>(null);
  const [loadingAnatomy, setLoadingAnatomy] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<number | null>(null);
  const { activeSessionId } = useProfileStore();

  useEffect(() => {
    const sid = activeSessionId;
    if (sid) {
      getSession(sid)
        .then((s) => {
          const sess = s as OnboardingSession & { reality_dashboard?: BusinessRealityDashboard };
          setSession(sess);
          setIdeaNameInput(sess.business_name || "");
          if (sess.reality_dashboard) setDashboard(sess.reality_dashboard);
        })
        .catch(() => {})
        .finally(() => setLoadingSession(false));
    } else {
      setLoadingSession(false);
    }
  // Re-run whenever the active profile changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId]);

  const generateDash = useCallback(async () => {
    const sid = activeSessionId;
    if (!sid) return;
    setLoadingDash(true);
    try {
      const data = await generateRealityDashboard(sid);
      setDashboard(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDash(false);
    }
  }, []);

  const generateAnatomy = useCallback(async () => {
    if (!session || !activeSessionId) return;
    setLoadingAnatomy(true);
    try {
      const data = await getFinancialAnatomy({
        session_id: activeSessionId,
        business_name:        session.business_name        ?? "",
        business_category:    session.business_category    ?? "retail",
        business_description: session.business_description ?? "",
        country:              session.country               ?? "Malaysia",
      });
      setAnatomy(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAnatomy(false);
    }
  }, [session, activeSessionId]);

  const saveIdeaName = useCallback(async () => {
    if (!session || !activeSessionId) return;
    const trimmed = ideaNameInput.trim();
    if (!trimmed) {
      toast.error("Idea name cannot be empty");
      return;
    }

    setSavingName(true);
    try {
      await updateProfile(activeSessionId, { business_name: trimmed });
      const refreshed = await getSession(activeSessionId);
      const sess = refreshed as OnboardingSession;
      setSession(sess);
      setIdeaNameInput(sess.business_name || trimmed);
      setIsEditingName(false);
      toast.success("Idea name updated");
    } catch {
      toast.error("Failed to update idea name");
    } finally {
      setSavingName(false);
    }
  }, [session, activeSessionId, ideaNameInput]);

  const cancelEditName = useCallback(() => {
    setIdeaNameInput(session?.business_name || "");
    setIsEditingName(false);
  }, [session]);

  if (loadingSession) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <div className="text-center"><div className="text-3xl mb-2 animate-pulse">🔄</div>Loading your Strategy Hub...</div>
    </div>
  );

  if (!session) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <div className="text-center">
        <div className="text-3xl mb-2">🏠</div>
        <p className="text-lg font-semibold text-white mb-2">No session found</p>
        <Link href="/" className="text-indigo-400 hover:underline text-sm">← Complete onboarding first</Link>
      </div>
    </div>
  );

  const viabilityColor = (s: number) =>
    s >= 70 ? "text-emerald-400" : s >= 50 ? "text-yellow-400" : "text-red-400";
  const viabilityBg = (s: number) =>
    s >= 70 ? "border-emerald-500/40 bg-emerald-900/20" : s >= 50 ? "border-yellow-500/40 bg-yellow-900/20" : "border-red-500/40 bg-red-900/20";
  const breakEvenMonth = dashboard?.time_to_break_even_months ?? null;
  const sources: SourceDocument[] = dashboard?.sources ?? [];
  const metricExplainers = {
    viability_score: dashboard?.value_explanations?.viability_score ?? {
      how_deduced: "Estimated from burn pressure, runway resilience, market competitiveness, and execution complexity.",
      citation_ids: [],
    },
    startup_cost: dashboard?.value_explanations?.startup_cost ?? {
      how_deduced: "Estimated from setup requirements, talent costs, regulatory overhead, and launch runway assumptions.",
      citation_ids: [],
    },
    time_to_break_even_months: dashboard?.value_explanations?.time_to_break_even_months ?? {
      how_deduced: "Estimated by projecting monthly net cash trend and identifying the first sustainably profitable month.",
      citation_ids: [],
    },
    year_1_revenue: dashboard?.value_explanations?.year_1_revenue ?? {
      how_deduced: "Estimated from expected demand ramp and pricing assumptions over the first 12 operating months.",
      citation_ids: [],
    },
    profit_margin_percentage: dashboard?.value_explanations?.profit_margin_percentage ?? {
      how_deduced: "Estimated using category margin benchmarks adjusted for local cost structures and early-stage efficiency.",
      citation_ids: [],
    },
  };
  const verifiedCount = sources.filter((s) => s.verified).length;
  const estimatedCount = sources.length - verifiedCount;

  return (
  <>
    <div className="space-y-5 p-6 pb-8">
      {/* ── Header ── */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-full text-center">
          {isEditingName ? (
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Input
                value={ideaNameInput}
                onChange={(e) => setIdeaNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void saveIdeaName();
                  if (e.key === "Escape") cancelEditName();
                }}
                className="h-10 w-[320px] max-w-[80vw] bg-white/5 border-white/20 text-white"
                disabled={savingName}
                autoFocus
              />
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9"
                onClick={() => void saveIdeaName()}
                disabled={savingName || !ideaNameInput.trim()}
                title="Save idea name"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9"
                onClick={cancelEditName}
                disabled={savingName}
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-3xl font-bold text-white">{session.business_name || "Your Startup"}</h1>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-gray-400 hover:text-white shrink-0"
                onClick={() => setIsEditingName(true)}
                title="Edit idea name"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          )}
          <p className="text-gray-400 mt-1 text-center">{session.business_category} · {session.country}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={generateDash}
            disabled={loadingDash}
            className="gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingDash ? "animate-spin" : ""}`} />
            {loadingDash ? "Analyzing…" : dashboard ? "Refresh" : "Generate Reality Check"}
          </Button>
          <Link
            href={`/timeline?session=${session.session_id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white text-sm font-medium transition-colors"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Runway Simulator
          </Link>
        </div>
      </div>
      {/* Sources bar */}
      {sources.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-3 rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 cursor-pointer hover:bg-white/8 transition-colors"
          onClick={() => setSelectedCitation(sources[0]?.id ?? null)}
          title="Click to explore real-time data sources"
        >
          <Database className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className="text-xs text-gray-400">Live data sources:</span>
          {verifiedCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
              ✓ {verifiedCount} verified
            </span>
          )}
          {estimatedCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300">
              ~ {estimatedCount} AI estimated
            </span>
          )}
          <span className="text-[10px] text-gray-500 ml-auto">Click [N] in text to inspect source →</span>
        </div>
      )}
      {/* ── Prompt if no dashboard yet ── */}
      {!dashboard && !loadingDash && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-indigo-500/30 bg-indigo-900/20 p-8 text-center space-y-4"
        >
          <div className="text-5xl">📊</div>
          <h2 className="text-xl font-bold text-white">Instant Reality Check</h2>
          <p className="text-gray-400 max-w-md mx-auto text-sm">
            Get your Viability Score, break-even timeline, startup cost estimate, competitive landscape,
            and a 12-month cash-flow projection — all in one view.
          </p>
          <Button onClick={generateDash} disabled={loadingDash} size="lg">
            <Zap className="h-4 w-4 mr-2" />
            Generate My Strategy Hub →
          </Button>
        </motion.div>
      )}

      {loadingDash && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center space-y-4">
          <div className="text-4xl animate-pulse">🧠</div>
          <p className="text-white font-semibold">AI is crunching your numbers…</p>
          <p className="text-gray-400 text-sm">Analyzing market data, competition, and your financials.</p>
        </div>
      )}

      {dashboard && (
        <div className="space-y-4">

          {/* ── BENTO ROW 1: Vital Signs strip ─────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* Viability score — compact inline cell */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className={`flex flex-col justify-between rounded-2xl border p-4 ${viabilityBg(dashboard.viability_score)}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Viability</p>
                <ValueExplain explanation={metricExplainers.viability_score} onCite={setSelectedCitation} />
              </div>
              <div className={`text-5xl font-black leading-none my-2 ${viabilityColor(dashboard.viability_score)}`}>
                {dashboard.viability_score}
              </div>
              <div>
                <p className="text-[10px] text-gray-600 mb-1">/100 score</p>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${dashboard.viability_score}%` }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    className={`h-1.5 rounded-full ${
                      dashboard.viability_score >= 70 ? "bg-emerald-500" :
                      dashboard.viability_score >= 50 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                  />
                </div>
              </div>
            </motion.div>

            <VitalCard delay={0.1} icon={<DollarSign className="h-4 w-4" />}
              label="Est. Startup Cost" color="text-yellow-400"
              value={`$${dashboard.startup_cost.toLocaleString()}`}
              sub="Initial capital needed"
              explanation={metricExplainers.startup_cost}
              onCite={setSelectedCitation} />
            <VitalCard delay={0.15} icon={<Clock className="h-4 w-4" />}
              label="Break-Even" color="text-indigo-400"
              value={`Month ${dashboard.time_to_break_even_months}`}
              sub="First profitable month"
              explanation={metricExplainers.time_to_break_even_months}
              onCite={setSelectedCitation} />
            <VitalCard delay={0.2} icon={<TrendingUp className="h-4 w-4" />}
              label="Year 1 Revenue" color="text-emerald-400"
              value={`$${dashboard.year_1_revenue.toLocaleString()}`}
              sub="Projected 12-month total"
              explanation={metricExplainers.year_1_revenue}
              onCite={setSelectedCitation} />
            <VitalCard delay={0.25} icon={<BarChart2 className="h-4 w-4" />}
              label="Profit Margin" color="text-sky-400"
              value={`${dashboard.profit_margin_percentage.toFixed(1)}%`}
              sub="Industry-standard"
              explanation={metricExplainers.profit_margin_percentage}
              onCite={setSelectedCitation} />
          </div>

          {/* ── BENTO ROW 2: Chart hero + Market intel ───────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Cash Flow Chart — 2/3 */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-300">
                  💰 12-Month Cash Flow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={dashboard.cash_flow_timeline}
                      margin={{ top: 10, right: 16, left: 0, bottom: 8 }}
                    >
                      <defs>
                        <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0f" />
                      <XAxis dataKey="month" stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 11 }}
                        label={{ value: "Month", position: "insideBottom", offset: -2, fill: "#6b7280", fontSize: 11 }} />
                      <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 11 }}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={52} />
                      <Tooltip
                        contentStyle={{ background: "#111827", border: "1px solid #374151", color: "#fff", borderRadius: 8 }}
                        formatter={(v: unknown) => [`$${Number(v).toLocaleString()}`, "Cash in Bank"]}
                        labelFormatter={(l) => `Month ${l}`}
                      />
                      {breakEvenMonth && (
                        <ReferenceLine x={breakEvenMonth} stroke="#a78bfa" strokeDasharray="4 3"
                          label={{ value: "Break-Even", position: "top", fill: "#a78bfa", fontSize: 11 }} />
                      )}
                      <Area type="monotone" dataKey="net_cash" stroke="#6366f1" strokeWidth={2.5}
                        fill="url(#cashGrad)" dot={false} activeDot={{ r: 5, fill: "#818cf8" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-600 text-center mt-2">
                  Dashed line = break-even at Month {dashboard.time_to_break_even_months}.
                </p>
              </CardContent>
            </Card>

            {/* Market Intel — 1/3 */}
            <Card className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-gray-300">
                  <Target className="h-4 w-4 text-orange-400" /> Market Intel
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 flex-1">
                <CompetitivenessGauge level={dashboard.competitiveness_level} />

                {/* Competitiveness insight blurb */}
                {{
                  Low:       <p className="text-[11px] leading-relaxed text-emerald-300/90 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">🌊 Blue ocean — strong first-mover advantage with room for multiple winners. Focus on speed.</p>,
                  Medium:    <p className="text-[11px] leading-relaxed text-yellow-200/90 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">⚖️ Moderate competition — differentiation and customer retention are your edge here.</p>,
                  High:      <p className="text-[11px] leading-relaxed text-orange-300/90 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2">🔥 Crowded market — unit economics and sharp brand positioning will make or break you.</p>,
                  Saturated: <p className="text-[11px] leading-relaxed text-red-300/90 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">🦈 Red ocean — a disruptive angle or hyper-niche focus is essential to survive entry.</p>,
                }[dashboard.competitiveness_level] ?? null}

                {/* Top competitors */}
                <div>
                  <p className="text-[10px] text-gray-500 mb-2 font-semibold uppercase tracking-wide flex items-center gap-1.5">
                    <Users2 className="h-3 w-3" /> Top Competitors
                  </p>
                  <div className="space-y-1.5">
                    {dashboard.top_competitors.map((c, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="flex items-start gap-2 rounded-lg bg-white/4 border border-white/8 px-2.5 py-1.5 text-xs text-gray-200">
                        <span className="shrink-0 mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500/20 text-orange-300 text-[9px] font-bold border border-orange-500/30">
                          {i + 1}
                        </span>
                        <CitedText text={c} sources={sources} onCite={setSelectedCitation} />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Market size (from onboarding analysis if available) */}
                {(session as (OnboardingSession & { analysis_result?: { market_size_estimate?: string } }) | null)?.analysis_result?.market_size_estimate && (
                  <div className="mt-auto pt-1 border-t border-white/8">
                    <p className="text-[10px] text-gray-500 mb-1 font-semibold uppercase tracking-wide">Market Size</p>
                    <p className="text-[11px] leading-relaxed text-gray-300">
                      {(session as (OnboardingSession & { analysis_result?: { market_size_estimate?: string } }) | null)?.analysis_result?.market_size_estimate}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Financial Anatomy Engine ──────────────────────────────────── */}
          {anatomy ? (
            <FinancialAnatomyEngine data={anatomy} />
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-dashed border-white/15 bg-white/3 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-white">🏗️ Financial Anatomy Engine</p>
                <p className="text-xs text-gray-500 mt-0.5">CapEx · OpEx · COGS breakdown with hyper-local citations</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={generateAnatomy}
                disabled={loadingAnatomy}
                className="shrink-0"
              >
                {loadingAnatomy ? "Generating…" : "Generate"}
              </Button>
            </div>
          )}

          {/* ── BENTO ROW 3: Deployment Zones + Quick actions ─────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-gray-300">
                  <MapPin className="h-4 w-4 text-indigo-400" /> Optimal Deployment Zones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dashboard.suitable_areas.map((area, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 rounded-xl bg-indigo-900/20 border border-indigo-500/20 p-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600/30 text-indigo-300 text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-xs text-gray-200">
                      <CitedText text={area} sources={sources} onCite={setSelectedCitation} />
                    </span>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Quick action links */}
            <div className="flex flex-col gap-3">
              {[
                {
                  href: activeSessionId ? `/debate?session=${activeSessionId}` : "/debate",
                  emoji: "🎯", title: "Advisory Panel",
                  desc: "Get 360° AI mentor feedback on this business model.",
                  color: "border-indigo-500/30 bg-indigo-900/20 hover:bg-indigo-900/40",
                },
                {
                  href: activeSessionId ? `/scenario?session=${activeSessionId}` : "/scenario",
                  emoji: "🛡️", title: "Resilience Test",
                  desc: `Simulate a disruption to your ${dashboard.profit_margin_percentage.toFixed(0)}% margin.`,
                  color: "border-orange-500/30 bg-orange-900/20 hover:bg-orange-900/40",
                },
                {
                  href: activeSessionId ? `/synthesis?session=${activeSessionId}` : "/synthesis",
                  emoji: "📋", title: "Executive Blueprint",
                  desc: "Export investor-ready summary with exact next steps.",
                  color: "border-emerald-500/30 bg-emerald-900/20 hover:bg-emerald-900/40",
                },
              ].map(({ href, emoji, title, desc, color }, i) => (
                <motion.div key={href} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 + 0.2 }} className="flex-1">
                  <Link href={href} className={`flex items-center gap-3 rounded-xl border p-3.5 transition-all duration-200 ${color} group h-full`}>
                    <span className="text-xl shrink-0">{emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white text-xs">{title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 group-hover:text-gray-400 transition-colors leading-snug">{desc}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-600 group-hover:text-white ml-auto shrink-0 transition-colors" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>

    {/* Source Drawer — page-level */}
    <SourceDrawer
      sources={sources}
      openId={selectedCitation}
      onClose={() => setSelectedCitation(null)}
    />
  </>
  );
}
