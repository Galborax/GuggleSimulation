"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, Building2, BarChart3, AlertTriangle,
  CheckCircle2, Clock, DollarSign, Percent,
} from "lucide-react";
import { IndustryBenchmarkData } from "@/lib/types";
import CitedText from "@/components/CitedText";
import SourceDrawer from "@/components/SourceDrawer";

interface IndustryBenchmarkPanelProps {
  data: IndustryBenchmarkData | null;
  loading: boolean;
}

// ----- Skeleton card -------------------------------------------------------
function SkeletonCard({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 space-y-3"
    >
      <div className="h-4 w-32 rounded bg-white/10 animate-pulse" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-white/8 animate-pulse" />
        <div className="h-3 w-4/5 rounded bg-white/8 animate-pulse" />
        <div className="h-3 w-3/4 rounded bg-white/8 animate-pulse" />
      </div>
    </motion.div>
  );
}

// ----- Metric row ----------------------------------------------------------
function MetricRow({
  icon: Icon, label, value, sources, onCite,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sources: IndustryBenchmarkData["sources"];
  onCite: (id: number) => void;
}) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
      <div className="mt-0.5 rounded-lg bg-white/10 p-1.5">
        <Icon className="h-3.5 w-3.5 text-sky-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/50 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-white/90 leading-snug">
          <CitedText text={value} sources={sources} onCite={onCite} />
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
export default function IndustryBenchmarkPanel({ data, loading }: IndustryBenchmarkPanelProps) {
  const [openCitation, setOpenCitation] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 h-full overflow-y-auto pr-1">
        <div className="mb-2">
          <div className="h-5 w-48 rounded bg-white/10 animate-pulse mb-1" />
          <div className="h-3 w-64 rounded bg-white/8 animate-pulse" />
        </div>
        <SkeletonCard delay={0} />
        <SkeletonCard delay={0.08} />
        <SkeletonCard delay={0.16} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-4">
        <BarChart3 className="h-10 w-10 text-white/20" />
        <p className="text-sm text-white/40">
          Select your industry and location on the left to load the Industry Reality Check.
        </p>
      </div>
    );
  }

  const { industry_averages, competitor_snapshots, macro_trend, sources, cached } = data;
  const citeHandler = (id: number) => setOpenCitation(id);

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
  };

  return (
    <>
      <motion.div
        className="flex flex-col gap-4 h-full overflow-y-auto pr-1 pb-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white/90 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-sky-400" />
              Industry Reality Check
            </h3>
            <p className="text-xs text-white/40 mt-0.5">
              {data.industry.toUpperCase()} · {data.location}
            </p>
          </div>
          {cached && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-sky-400/30 text-sky-400/70 bg-sky-400/10">
              cached
            </span>
          )}
        </div>

        {/* Card A — Industry Averages */}
        <motion.div
          variants={cardVariants}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-sky-950/40 to-white/5 backdrop-blur-sm p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📊</span>
            <h4 className="text-sm font-semibold text-white/80">Industry Averages</h4>
          </div>
          <div className="space-y-0">
            <MetricRow
              icon={DollarSign}
              label="Startup Cost"
              value={industry_averages.startup_cost_range}
              sources={sources}
              onCite={citeHandler}
            />
            <MetricRow
              icon={Percent}
              label="Profit Margin"
              value={industry_averages.profit_margin_range}
              sources={sources}
              onCite={citeHandler}
            />
            <MetricRow
              icon={AlertTriangle}
              label="Year-1 Failure Rate"
              value={industry_averages.year1_failure_rate}
              sources={sources}
              onCite={citeHandler}
            />
            <MetricRow
              icon={Clock}
              label="Break-even Timeline"
              value={industry_averages.break_even_months}
              sources={sources}
              onCite={citeHandler}
            />
          </div>
          {industry_averages.summary && (
            <p className="mt-3 text-xs text-white/50 leading-relaxed border-t border-white/5 pt-3">
              <CitedText text={industry_averages.summary} sources={sources} onCite={citeHandler} />
            </p>
          )}
        </motion.div>

        {/* Card B — Competitor Snapshots */}
        <motion.div
          variants={cardVariants}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-950/40 to-white/5 backdrop-blur-sm p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🏢</span>
            <h4 className="text-sm font-semibold text-white/80">Players to Know</h4>
          </div>
          <div className="space-y-3">
            {competitor_snapshots.map((c, i) => (
              <div
                key={i}
                className="rounded-xl bg-white/5 border border-white/8 p-3 space-y-1"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-white/90">{c.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/20">
                    {c.model_type}
                  </span>
                </div>
                <p className="text-xs text-white/55 leading-relaxed">
                  <CitedText text={c.description} sources={sources} onCite={citeHandler} />
                </p>
                <p className="text-xs font-medium text-violet-300/80 flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  <CitedText text={c.key_stat} sources={sources} onCite={citeHandler} />
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Card C — Macro Trend */}
        <motion.div
          variants={cardVariants}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-950/40 to-white/5 backdrop-blur-sm p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📈</span>
            <h4 className="text-sm font-semibold text-white/80">Macro Trend</h4>
          </div>
          <p className="text-sm font-semibold text-white/85 mb-1">
            {macro_trend.headline}
          </p>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400">
              <CitedText text={macro_trend.growth_rate} sources={sources} onCite={citeHandler} />
            </span>
          </div>
          <p className="text-xs text-white/55 leading-relaxed mb-2">
            <CitedText text={macro_trend.detail} sources={sources} onCite={citeHandler} />
          </p>
          {macro_trend.headwind && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-300/80 leading-relaxed">
                <CitedText text={macro_trend.headwind} sources={sources} onCite={citeHandler} />
              </p>
            </div>
          )}
        </motion.div>

        {/* Sources count pill */}
        {sources.length > 0 && (
          <motion.div variants={cardVariants}>
            <p className="text-xs text-white/30 text-center">
              {sources.length} source{sources.length !== 1 ? "s" : ""} · click{" "}
              <span className="text-sky-400/60">[N]</span> to verify any figure
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Citation Drawer */}
      <SourceDrawer
        sources={sources}
        openId={openCitation}
        onClose={() => setOpenCitation(null)}
      />
    </>
  );
}
