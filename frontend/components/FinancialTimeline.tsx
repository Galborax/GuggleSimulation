"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useProfileStore } from "@/lib/store";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { AlertTriangle, Info, RotateCcw, TrendingDown, TrendingUp, Wallet, Clock, RefreshCw, ExternalLink, Maximize2, X, CircleHelp } from "lucide-react";
import type { AdjustableTimeline, InteractiveVariable, TimelineCitation, ComputedMonthPoint } from "@/lib/types";

// ─── Sub-components ──────────────────────────────────────────────────────────

function CitationBadge({ id, references }: { id: number; references: TimelineCitation[] }) {
  const ref = references.find((r) => r.id === id);
  if (!ref) return null;
  return (
    <span className="relative group inline-block align-middle ml-1">
      <span className="text-[10px] font-bold bg-emerald-900/80 text-emerald-300 border border-emerald-700 rounded px-1 cursor-default select-none">
        [{id}]
      </span>
      <div className="absolute bottom-5 left-0 z-50 w-64 bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-xs shadow-2xl
                      opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150">
        <div className="font-semibold text-emerald-400 mb-1">{ref.source_name}</div>
        <div className="text-gray-400 italic mb-1.5">"{ref.snippet}"</div>
        {ref.url && ref.url !== "" && (
          <a href={ref.url} target="_blank" rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 flex items-center gap-1 truncate pointer-events-auto">
            <ExternalLink size={10} /> {ref.url.replace(/^https?:\/\//, "").split("/")[0]}
          </a>
        )}
      </div>
    </span>
  );
}

function WarningBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-1.5 mt-1.5 px-2 py-1.5 rounded bg-amber-950/60 border border-amber-700/50 text-amber-300 text-[11px]">
      <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-400" />
      <span>{message}</span>
    </div>
  );
}

function ValueExplainPopover({
  title,
  explanation,
  citationIds,
  references,
}: {
  title?: string;
  explanation: string;
  citationIds?: number[];
  references?: TimelineCitation[];
}) {
  const [open, setOpen] = useState(false);
  const ids = Array.from(new Set((citationIds ?? []).filter((id) => Number.isFinite(id))));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="How this value was deduced"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/20 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
      >
        <CircleHelp size={11} />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-72 rounded-xl border border-white/15 bg-gray-900/95 p-3 shadow-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-300">{title ?? "How deduced"}</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-200">{explanation}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {ids.length > 0 ? ids.map((id) => {
              const ref = references?.find((r) => r.id === id);
              return (
                <span
                  key={id}
                  title={ref ? `${ref.source_name}: ${ref.snippet}` : `Reference [${id}]`}
                  className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-200"
                >
                  [{id}]
                </span>
              );
            }) : (
              <span className="rounded-full border border-amber-500/40 bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                Model estimate
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR", maximumFractionDigits: 0 }).format(n);

const fmtK = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `RM ${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `RM ${(n / 1_000).toFixed(0)}k`;
  return `RM ${n}`;
};

// ─── Custom Chart Tooltip ─────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as ComputedMonthPoint;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs shadow-2xl min-w-[160px]">
      <div className="font-bold text-white mb-1.5">{label}</div>
      <div className="space-y-0.5">
        <div className="flex justify-between gap-3">
          <span className="text-gray-400">Cash Balance</span>
          <span className={d.cash < 0 ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
            {fmtK(d.cash)}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-gray-400">Monthly In</span>
          <span className="text-emerald-300">+{fmtK(d.inflow)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-gray-400">Monthly Out</span>
          <span className="text-red-300">−{fmtK(d.outflow)}</span>
        </div>
        <div className="flex justify-between gap-3 border-t border-gray-700 pt-1 mt-1">
          <span className="text-gray-400">Net</span>
          <span className={d.inflow - d.outflow >= 0 ? "text-emerald-300" : "text-red-300"}>
            {d.inflow - d.outflow >= 0 ? "+" : "−"}{fmtK(Math.abs(d.inflow - d.outflow))}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Variable Slider ──────────────────────────────────────────────────────────

function VariableSlider({
  variable,
  value,
  references,
  onChange,
}: {
  variable: InteractiveVariable;
  value: number;
  references: TimelineCitation[];
  onChange: (id: string, value: number) => void;
}) {
  const pct = ((value - variable.min_value) / (variable.max_value - variable.min_value)) * 100;
  const isRevenue = variable.impact_type === "revenue_driver" || variable.impact_type === "unit_revenue";
  const isWarning = variable.warning_threshold !== null &&
    (isRevenue ? value < variable.warning_threshold : value > variable.warning_threshold);

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-base">{variable.emoji}</span>
          <span className="text-xs font-medium text-gray-200 truncate">{variable.name}</span>
          <CitationBadge id={variable.citation_id} references={references} />
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <span className={`text-xs font-bold tabular-nums ${isRevenue ? "text-emerald-300" : "text-red-300"}`}>
            {fmt(value)}
          </span>
          <ValueExplainPopover
            title="How deduced"
            explanation={
              variable.warning_message
                ? variable.warning_message
                : `${variable.name} is calibrated from observed market ranges and source-backed bounds for this category.`
            }
            citationIds={[variable.citation_id]}
            references={references}
          />
        </div>
      </div>

      {/* Track */}
      <div className="relative h-5 flex items-center">
        <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isRevenue ? "bg-emerald-500" : isWarning ? "bg-amber-500" : "bg-indigo-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          min={variable.min_value}
          max={variable.max_value}
          step={Math.max(50, Math.round((variable.max_value - variable.min_value) / 100))}
          value={value}
          onChange={(e) => onChange(variable.id, parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-5"
        />
        {/* Thumb */}
        <div
          className={`absolute h-4 w-4 rounded-full border-2 shadow-lg transition-all pointer-events-none
            ${isRevenue ? "bg-emerald-500 border-emerald-300" : isWarning ? "bg-amber-500 border-amber-300" : "bg-indigo-500 border-indigo-300"}`}
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
        <span>{fmtK(variable.min_value)}</span>
        <span>{fmtK(variable.max_value)}</span>
      </div>

      {isWarning && variable.warning_message && (
        <WarningBanner message={variable.warning_message} />
      )}
    </div>
  );
}

// ─── Action Block (draggable card) ───────────────────────────────────────────

function ActionBlock({
  variable,
  value,
  references,
  isDragging,
  isPlaced,
  onDragStart,
  onValueChange,
}: {
  variable: InteractiveVariable;
  value: number;
  references: TimelineCitation[];
  isDragging: boolean;
  isPlaced: boolean;
  onDragStart: (id: string) => void;
  onValueChange: (id: string, v: number) => void;
}) {
  const colorClass =
    variable.impact_type === "one_time_cost"
      ? "border-orange-700/60 bg-orange-950/40 hover:border-orange-500"
      : variable.impact_type === "revenue_driver"
      ? "border-emerald-700/60 bg-emerald-950/40 hover:border-emerald-500"
      : "border-purple-700/60 bg-purple-950/40 hover:border-purple-500";

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart(variable.id);
      }}
      className={`relative flex flex-col gap-1 rounded-xl border px-2.5 py-2 cursor-grab select-none transition-all
        ${colorClass}
        ${isDragging ? "opacity-40 scale-95" : "opacity-100"}
        ${isPlaced ? "ring-1 ring-indigo-400/50" : ""}
        hover:shadow-lg active:cursor-grabbing w-40 shrink-0`}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-xl leading-none">{variable.emoji}</span>
        <span className="text-xs font-semibold text-white leading-tight">{variable.name}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-bold text-gray-300 tabular-nums">{fmt(value)}</span>
        <span className="text-[10px] text-gray-500">{variable.unit.split("/")[1] ? `/${variable.unit.split("/")[1]}` : ""}</span>
        <CitationBadge id={variable.citation_id} references={references} />
        <ValueExplainPopover
          title="How deduced"
          explanation={
            variable.warning_message
              ? variable.warning_message
              : `${variable.name} uses source-backed assumptions for local market conditions and operating costs.`
          }
          citationIds={[variable.citation_id]}
          references={references}
        />
      </div>
      <div className="text-[9px] text-gray-500 capitalize">
        {variable.impact_type.replace(/_/g, " ")}
        {isPlaced && <span className="text-indigo-400 ml-1">• placed</span>}
      </div>
      {/* Mini slider on block */}
      <input
        type="range"
        min={variable.min_value}
        max={variable.max_value}
        step={Math.max(50, Math.round((variable.max_value - variable.min_value) / 100))}
        value={value}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => { e.stopPropagation(); onValueChange(variable.id, parseFloat(e.target.value)); }}
        className="w-full h-1 accent-indigo-400 cursor-pointer touch-none"
      />
    </div>
  );
}

// ─── Month Drop Slot ──────────────────────────────────────────────────────────

function MonthSlot({
  month,
  placedBlocks,
  allBlocks,
  isDragTarget,
  onDragOver,
  onDrop,
  onRemove,
}: {
  month: number;
  placedBlocks: Record<string, number | null>;
  allBlocks: InteractiveVariable[];
  isDragTarget: boolean;
  onDragOver: (e: React.DragEvent, month: number) => void;
  onDrop: (e: React.DragEvent, month: number) => void;
  onRemove: (id: string) => void;
}) {
  const placed = allBlocks.filter((b) => placedBlocks[b.id] === month);
  return (
    <div
      onDragOver={(e) => onDragOver(e, month)}
      onDrop={(e) => onDrop(e, month)}
      className={`relative flex-shrink-0 w-14 min-h-16 flex flex-col items-center gap-0.5 rounded-lg border transition-all
        ${isDragTarget
          ? "border-indigo-400 bg-indigo-900/40 scale-105 shadow-lg shadow-indigo-500/20"
          : placed.length > 0
          ? "border-gray-600 bg-gray-800/60"
          : "border-gray-700/50 bg-gray-900/30 border-dashed"
        }`}
    >
      <span className="text-[10px] text-gray-500 font-medium pt-1">M{month}</span>
      {placed.map((b) => (
        <button
          key={b.id}
          title={`${b.name} — click to remove`}
          onClick={() => onRemove(b.id)}
          className="text-base leading-none hover:scale-110 transition-transform"
        >
          {b.emoji}
        </button>
      ))}
      {placed.length === 0 && isDragTarget && (
        <span className="text-indigo-400 text-lg">+</span>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  data: AdjustableTimeline;
  onRegenerate?: () => void;
}

export default function FinancialTimeline({ data, onRegenerate }: Props) {
  // Slider values (id → current value)
  const [values, setValues] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    [...data.core_variables, ...data.action_blocks].forEach((v) => {
      map[v.id] = v.default_value;
    });
    return map;
  });

  // Consume any pending timeline patch queued from the Post-Debate Debrief drawer
  const { pendingTimelinePatch, setPendingTimelinePatch } = useProfileStore();
  useEffect(() => {
    if (!pendingTimelinePatch) return;
    const { variable_id, label, new_value } = pendingTimelinePatch;
    setValues((prev) => {
      if (!(variable_id in prev)) {
        return prev;
      }
      return { ...prev, [variable_id]: new_value };
    });
    toast.success(`Applied: ${label} → RM ${new_value.toLocaleString()}`, {
      description: "Suggested by your advisory panel during debrief.",
      duration: 4000,
    });
    setPendingTimelinePatch(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Placed blocks (id → month number, or null/undefined = in tray)
  const [placedBlocks, setPlacedBlocks] = useState<Record<string, number | null>>({});

  // Currently dragged block id
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Drop target highlight
  const [dropTargetMonth, setDropTargetMonth] = useState<number | null>(null);

  const setValue = useCallback((id: string, val: number) => {
    setValues((prev) => ({ ...prev, [id]: val }));
  }, []);

  const placeBlock = useCallback((id: string, month: number | null) => {
    setPlacedBlocks((prev) => ({ ...prev, [id]: month }));
  }, []);

  const resetAll = () => {
    setValues(
      Object.fromEntries([...data.core_variables, ...data.action_blocks].map((v) => [v.id, v.default_value]))
    );
    setPlacedBlocks({});
  };

  // ── Compute timeline ──────────────────────────────────────────────────────
  const timelineData = useMemo((): ComputedMonthPoint[] => {
    let cash = data.starting_capital;
    return Array.from({ length: data.months }, (_, i) => {
      const m = i + 1;
      let inflow = 0;
      let outflow = 0;

      // Core variables
      for (const v of data.core_variables) {
        const val = values[v.id] ?? v.default_value;
        if (v.impact_type === "revenue_driver" || v.impact_type === "unit_revenue") inflow += val;
        else if (v.impact_type === "monthly_cost") outflow += val;
      }

      // Action blocks
      for (const block of data.action_blocks) {
        const placed = placedBlocks[block.id];
        if (placed == null) continue;
        const val = values[block.id] ?? block.default_value;

        if (block.impact_type === "one_time_cost" && placed === m) {
          outflow += val;
        } else if (block.impact_type === "monthly_cost" && placed <= m) {
          outflow += val; // recurring from placed month onwards
        } else if ((block.impact_type === "revenue_driver" || block.impact_type === "unit_revenue") && placed <= m) {
          inflow += val;
        }
      }

      cash = cash + inflow - outflow;
      return {
        month: m,
        label: m % 3 === 1 ? `M${m}` : "",
        cash: Math.round(cash),
        inflow: Math.round(inflow),
        outflow: Math.round(outflow),
        isCritical: cash < 0,
      };
    });
  }, [values, placedBlocks, data]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const runway = useMemo(() => {
    const idx = timelineData.findIndex((p) => p.cash < 0);
    return idx === -1 ? `>${data.months}` : `${timelineData[idx].month - 1}`;
  }, [timelineData, data.months]);

  const lastCash = timelineData[timelineData.length - 1]?.cash ?? data.starting_capital;
  const netMonthly = (timelineData[0]?.inflow ?? 0) - (timelineData[0]?.outflow ?? 0);
  const activeCitationIds = useMemo(() => {
    const ids = new Set<number>();
    for (const v of data.core_variables) {
      if (Number.isFinite(v.citation_id)) ids.add(v.citation_id);
    }
    for (const b of data.action_blocks) {
      if (placedBlocks[b.id] != null && Number.isFinite(b.citation_id)) ids.add(b.citation_id);
    }
    return Array.from(ids);
  }, [data.core_variables, data.action_blocks, placedBlocks]);

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent, month: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTargetMonth(month);
  };

  const handleDrop = (e: React.DragEvent, month: number) => {
    e.preventDefault();
    if (draggingId) {
      placeBlock(draggingId, month);
      setDraggingId(null);
      setDropTargetMonth(null);
    }
  };

  const handleTrayDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggingId) {
      placeBlock(draggingId, null);
      setDraggingId(null);
      setDropTargetMonth(null);
    }
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTargetMonth(null);
  };

  // colour based on runway
  const runwayNum = parseInt(String(runway));
  const runwayColor = isNaN(runwayNum) ? "text-emerald-400" : runwayNum <= 6 ? "text-red-400" : runwayNum <= 12 ? "text-amber-400" : "text-emerald-400";

  const chartColor = timelineData.some((p) => p.isCritical)
    ? "#f87171" // red if any month goes negative
    : "#6366f1"; // indigo when healthy

  const [isChartFullscreen, setIsChartFullscreen] = useState(false);

  // Close fullscreen on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsChartFullscreen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ChartContent = ({ height }: { height: number | string }) => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={timelineData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
            <stop offset="95%" stopColor={chartColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.5} />
        <XAxis dataKey="label" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis
          tickFormatter={(v) => fmtK(v)}
          tick={{ fill: "#9ca3af", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={72}
        />
        <Tooltip content={<ChartTooltip />} />
        <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 2" strokeWidth={1.5} />
        <Area
          type="monotone"
          dataKey="cash"
          stroke={chartColor}
          strokeWidth={3}
          fill="url(#cashGrad)"
          dot={false}
          activeDot={{ r: 5, fill: chartColor, strokeWidth: 2, stroke: "#fff" }}
          animationDuration={400}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  return (
    <>
    {/* ── Fullscreen Chart Overlay ──────────────────────────────────────── */}
    {isChartFullscreen && (
      <div className="fixed inset-0 z-50 flex flex-col bg-gray-950/97 backdrop-blur-sm p-6 gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            📈 Cash Balance Runway
            <span className={`text-sm font-semibold ${runwayColor}`}>— {runway} months runway</span>
          </h2>
          <button
            onClick={() => setIsChartFullscreen(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors"
          >
            <X size={14} /> Close
          </button>
        </div>
        <div
          className="flex-1 rounded-2xl bg-gray-900/90 border border-indigo-600/50 p-5 overflow-hidden"
          style={{ boxShadow: "0 0 60px 0 rgba(99,102,241,0.18), 0 8px 40px 0 rgba(0,0,0,0.6)" }}
        >
          <ChartContent height="100%" />
        </div>
        <div className="flex items-center gap-4 text-[11px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 h-0.5 rounded" style={{ background: chartColor }} /> Cash Balance
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 border-t-2 border-dashed border-red-500" /> Zero Cash
          </span>
          <span className="ml-auto">Press Esc to close</span>
        </div>
      </div>
    )}
    <div className="flex flex-col gap-4 w-full">
      {/* ── Stats Bar ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Wallet size={16} className="text-indigo-400" />}
          label="Starting Capital"
          value={fmtK(data.starting_capital)}
          color="text-white"
          explanation="Directly taken from your selected starting capital input for this simulation run."
          citationIds={[]}
          references={data.references}
        />
        <StatCard
          icon={<Clock size={16} className={runwayColor} />}
          label="Runway"
          value={`${runway} months`}
          color={runwayColor}
          explanation="Computed from monthly cash projection and shown as the month before cash first drops below zero."
          citationIds={activeCitationIds}
          references={data.references}
        />
        <StatCard
          icon={netMonthly >= 0 ? <TrendingUp size={16} className="text-emerald-400" /> : <TrendingDown size={16} className="text-red-400" />}
          label="Net Monthly"
          value={(netMonthly >= 0 ? "+" : "") + fmtK(netMonthly)}
          color={netMonthly >= 0 ? "text-emerald-400" : "text-red-400"}
          explanation="Calculated as month-1 inflow minus month-1 outflow using your current variable and action-block settings."
          citationIds={activeCitationIds}
          references={data.references}
        />
        <StatCard
          icon={<TrendingUp size={16} className={lastCash >= 0 ? "text-emerald-400" : "text-red-400"} />}
          label={`Cash at M${data.months}`}
          value={fmtK(lastCash)}
          color={lastCash >= 0 ? "text-emerald-300" : "text-red-400"}
          explanation={`Projected cumulative cash balance at month ${data.months} after applying all monthly and scheduled one-time impacts.`}
          citationIds={activeCitationIds}
          references={data.references}
        />
      </div>

      {/* ── Main Grid: Sliders | Chart ────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-4">
        {/* Left: Variable Sliders */}
        <div className="bg-gray-900/60 border border-gray-700/50 rounded-2xl p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <span>🎛️</span> Variables
            </h3>
            <button
              onClick={resetAll}
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-gray-700/50"
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {data.core_variables.map((v) => (
              <VariableSlider
                key={v.id}
                variable={v}
                value={values[v.id] ?? v.default_value}
                references={data.references}
                onChange={setValue}
              />
            ))}
          </div>
          <div className="border-t border-gray-700/50 pt-3 mt-1">
            <p className="text-[10px] text-gray-500 flex items-center gap-1">
              <Info size={10} /> Slider bounds are set by real‑world market data. Hover [N] for sources.
            </p>
          </div>
        </div>

        {/* Right: Chart + Month Slots */}
        <div className="flex flex-col gap-3">
          {/* Chart */}
          <div
            className="bg-gray-900/80 border border-indigo-700/50 rounded-2xl p-4"
            style={{ boxShadow: "0 0 32px 0 rgba(99,102,241,0.12), 0 4px 24px 0 rgba(0,0,0,0.4)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                📈 Cash Balance Runway
                <span className={`text-xs font-medium ${runwayColor} bg-gray-800/70 rounded-full px-2 py-0.5`}>
                  {runway} mo runway
                </span>
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <span className="inline-block w-3 h-0.5 bg-red-500 rounded" /> Zero Cash
                </div>
                <button
                  onClick={() => setIsChartFullscreen(true)}
                  title="Expand chart"
                  className="flex items-center gap-1 px-2 py-1 text-[11px] text-gray-400 hover:text-white bg-gray-800/70 hover:bg-gray-700 border border-gray-700/50 hover:border-indigo-600/60 rounded-lg transition-all"
                >
                  <Maximize2 size={12} /> Expand
                </button>
              </div>
            </div>
            <ChartContent height={300} />
          </div>

          {/* Month Drop Slots */}
          <div className="bg-gray-900/60 border border-gray-700/50 rounded-2xl p-3">
            <p className="text-[10px] text-gray-500 mb-2">
              ↕ Drag action blocks onto a month to schedule them
            </p>
            <div
              className="flex gap-1.5 overflow-x-auto pb-1"
              onDragOver={(e) => e.preventDefault()}
            >
              {Array.from({ length: data.months }, (_, i) => i + 1).map((m) => (
                <MonthSlot
                  key={m}
                  month={m}
                  placedBlocks={placedBlocks}
                  allBlocks={data.action_blocks}
                  isDragTarget={dropTargetMonth === m}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onRemove={(id) => placeBlock(id, null)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Action Blocks Tray ────────────────────────────────────────────── */}
      <div
        className="bg-gray-900/60 border border-gray-700/50 rounded-2xl p-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleTrayDrop}
      >
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-white">🧱 Action Blocks</h3>
          <span className="text-[10px] text-gray-500">Drag onto the month timeline above — click a placed block to remove it</span>
        </div>
        <div className="flex gap-3 flex-wrap">
          {data.action_blocks.map((block) => (
            <div key={block.id} onDragEnd={handleDragEnd}>
              <ActionBlock
                variable={block}
                value={values[block.id] ?? block.default_value}
                references={data.references}
                isDragging={draggingId === block.id}
                isPlaced={placedBlocks[block.id] != null}
                onDragStart={setDraggingId}
                onValueChange={setValue}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── References Footer ─────────────────────────────────────────────── */}
      <div className="bg-gray-900/40 border border-gray-800/50 rounded-xl p-3 flex flex-wrap gap-x-4 gap-y-1">
        {data.references.map((ref) => (
          <div key={ref.id} className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <span className="text-[10px] font-bold bg-emerald-900/70 text-emerald-300 border border-emerald-800 rounded px-1">[{ref.id}]</span>
            <span>{ref.source_name}</span>
            {ref.url && ref.url !== "" && (
              <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400">
                <ExternalLink size={10} />
              </a>
            )}
          </div>
        ))}
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="ml-auto flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition-colors px-2 py-0.5 rounded hover:bg-gray-700/40"
          >
            <RefreshCw size={10} /> Regenerate with latest data
          </button>
        )}
      </div>
    </div>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  explanation,
  citationIds,
  references,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  explanation: string;
  citationIds: number[];
  references: TimelineCitation[];
}) {
  return (
    <div className="bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
          <span>{label}</span>
          <ValueExplainPopover
            title="How deduced"
            explanation={explanation}
            citationIds={citationIds}
            references={references}
          />
        </div>
        <div className={`text-sm font-bold tabular-nums truncate ${color}`}>{value}</div>
      </div>
    </div>
  );
}
