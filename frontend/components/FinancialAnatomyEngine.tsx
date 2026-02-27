"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip,
  ResponsiveContainer, Cell, LabelList,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown, ChevronUp, ExternalLink, ShieldAlert, ToggleLeft,
  ToggleRight, TrendingUp, DollarSign, Package, Zap, Info,
} from "lucide-react";
import type {
  FinancialAnatomyData, CostLineItem, FinancialAnatomySource,
} from "@/lib/types";

// ─── helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR", maximumFractionDigits: 0 }).format(n);

const fmtNum = (n: number) => n.toLocaleString("en-MY");

// ─── Inline citation badge with hover tooltip ────────────────────────────────

function Cite({
  id,
  sources,
}: {
  id: number | null;
  sources: FinancialAnatomySource[];
}) {
  const [open, setOpen] = useState(false);
  if (id === null) return null;
  const src = sources.find((s) => s.id === id);
  if (!src) return null;

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center h-4 w-4 ml-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[9px] font-bold border border-indigo-500/40 hover:bg-indigo-500/40 cursor-pointer"
      >
        {id}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute z-[200] bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-xl border border-white/20 bg-gray-950 p-3 shadow-2xl text-left"
          >
            <p className="text-[11px] font-semibold text-white leading-snug">{src.title}</p>
            <p className="text-[10px] text-indigo-300 mt-0.5">{src.source_name}</p>
            {src.snippet && (
              <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{src.snippet}</p>
            )}
            {src.url && (
              <a
                href={src.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 flex items-center gap-1 text-[10px] text-indigo-400 hover:underline"
              >
                <ExternalLink className="h-2.5 w-2.5" /> Open source
              </a>
            )}
            {src.verified && (
              <Badge variant="outline" className="mt-1.5 text-[9px] border-emerald-500/50 text-emerald-400 px-1.5 py-0">
                ✓ Verified
              </Badge>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

// ─── Single cost row ─────────────────────────────────────────────────────────

function CostRow({
  item,
  leaseMode,
  sources,
}: {
  item: CostLineItem;
  leaseMode: boolean;
  sources: FinancialAnatomySource[];
}) {
  const [noteOpen, setNoteOpen] = useState(false);
  const displayAmount = leaseMode && item.lease_amount !== null ? item.lease_amount : item.amount;
  const displayUnit   = leaseMode && item.lease_unit  !== null ? item.lease_unit  : item.unit;
  const isLeased = leaseMode && item.lease_amount !== null;

  return (
    <motion.div
      layout
      className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
        item.is_hidden_cost
          ? "border-amber-500/25 bg-amber-950/20"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {item.is_hidden_cost && (
            <ShieldAlert className="h-3 w-3 shrink-0 text-amber-400" />
          )}
          <span className="text-gray-200 truncate">{item.item}</span>
          <Cite id={item.citation_id} sources={sources} />
          {isLeased && (
            <Badge variant="outline" className="shrink-0 text-[9px] border-sky-500/40 text-sky-300 px-1 py-0">
              leased
            </Badge>
          )}
          {item.notes && (
            <button
              type="button"
              onClick={() => setNoteOpen((v) => !v)}
              className="shrink-0 ml-0.5 text-gray-500 hover:text-gray-300"
            >
              <Info className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="shrink-0 text-right">
          <span className="font-semibold text-white">
            {item.category === "COGS"
              ? `${displayAmount}%`
              : fmt(displayAmount)}
          </span>
          <span className="ml-1 text-gray-500">{displayUnit}</span>
        </div>
      </div>
      <AnimatePresence>
        {noteOpen && item.notes && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-1.5 text-[10px] text-gray-400 leading-relaxed pl-1 border-l border-white/10"
          >
            {item.notes}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Pillar panel ─────────────────────────────────────────────────────────────

function PillarPanel({
  items,
  leaseMode,
  sources,
  total,
  totalLease,
  showToggle,
  onToggle,
}: {
  items: CostLineItem[];
  leaseMode: boolean;
  sources: FinancialAnatomySource[];
  total: number;
  totalLease?: number;
  showToggle?: boolean;
  onToggle?: () => void;
}) {
  const displayTotal = leaseMode && totalLease !== undefined ? totalLease : total;

  return (
    <div className="space-y-2">
      {/* Total + lease toggle */}
      <div className="flex items-center justify-between">
        <div className="text-sm">
          <span className="text-gray-400">Total: </span>
          <span className="font-bold text-white text-lg">{fmt(displayTotal)}</span>
          {leaseMode && totalLease !== undefined && (
            <span className="ml-2 text-xs text-sky-400">(lease mode)</span>
          )}
        </div>
        {showToggle && onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs hover:bg-white/10 transition-colors"
          >
            {leaseMode ? (
              <ToggleRight className="h-4 w-4 text-sky-400" />
            ) : (
              <ToggleLeft className="h-4 w-4 text-gray-400" />
            )}
            <span className={leaseMode ? "text-sky-300" : "text-gray-400"}>
              {leaseMode ? "Lease Mode ON" : "Lease Mode OFF"}
            </span>
          </button>
        )}
      </div>

      {/* Line items */}
      <div className="space-y-1.5">
        {items.map((item) => (
          <CostRow key={item.id} item={item} leaseMode={leaseMode} sources={sources} />
        ))}
      </div>
    </div>
  );
}

// ─── Break-even waterfall ─────────────────────────────────────────────────────

function BreakEvenChart({ data }: { data: FinancialAnatomyData["break_even"] }) {
  const bars = data.bars;

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={bars} margin={{ top: 16, right: 8, left: 8, bottom: 4 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: "#9ca3af", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <RTooltip
            contentStyle={{ background: "#030712", border: "1px solid rgba(255,255,255,.15)", borderRadius: 8 }}
            labelStyle={{ color: "#e5e7eb", fontWeight: 700, fontSize: 11 }}
            itemStyle={{ color: "#d1d5db" }}
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
            formatter={(val: number) => [fmt(val), ""]}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {bars.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              formatter={(v: number) => fmt(v)}
              style={{ fill: "#d1d5db", fontSize: 10 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Key stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Avg Ticket", value: fmt(data.avg_ticket_price), color: "text-white" },
          { label: "Units / Month", value: fmtNum(data.units_to_break_even), color: "text-amber-400" },
          { label: "Contribution Margin", value: fmt(data.contribution_margin), color: "text-emerald-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg border border-white/10 bg-white/5 px-2 py-2">
            <p className="text-[9px] text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={`text-sm font-bold mt-0.5 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Insight */}
      <p className="text-xs text-gray-400 leading-relaxed border-l-2 border-indigo-500/50 pl-3">
        {data.insight}
      </p>
    </div>
  );
}

// ─── Hidden Costs drawer ──────────────────────────────────────────────────────

function HiddenCostsDrawer({
  items,
  sources,
  leaseMode,
}: {
  items: CostLineItem[];
  sources: FinancialAnatomySource[];
  leaseMode: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-950/20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm"
      >
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-400" />
          <span className="font-semibold text-amber-200">Hidden Costs Founders Forget</span>
          <Badge variant="outline" className="text-[9px] border-amber-500/50 text-amber-400 px-1.5 py-0">
            {items.length} items
          </Badge>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0.85 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.85 }}
            style={{ originY: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="px-3 pb-3 space-y-1.5">
              {items.map((item) => (
                <CostRow key={item.id} item={item} leaseMode={leaseMode} sources={sources} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const TABS = [
  { key: "capex", label: "CapEx", icon: <Package className="h-3.5 w-3.5" />, color: "text-orange-400", borderActive: "border-orange-500" },
  { key: "opex",  label: "OpEx",  icon: <Zap      className="h-3.5 w-3.5" />, color: "text-sky-400",    borderActive: "border-sky-500" },
  { key: "cogs",  label: "COGS",  icon: <TrendingUp className="h-3.5 w-3.5" />, color: "text-purple-400", borderActive: "border-purple-500" },
  { key: "breakeven", label: "Break-Even", icon: <DollarSign className="h-3.5 w-3.5" />, color: "text-emerald-400", borderActive: "border-emerald-500" },
] as const;

type TabKey = typeof TABS[number]["key"];

export default function FinancialAnatomyEngine({ data }: { data: FinancialAnatomyData }) {
  const [activeTab, setActiveTab] = useState<TabKey>("capex");
  const [leaseMode, setLeaseMode] = useState(false);

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              🏗️ Financial Anatomy Engine
            </CardTitle>
            <p className="text-xs text-gray-400 mt-1">
              Three-pillar cost breakdown · {data.country} · hyper-local citations
            </p>
          </div>
          <div className="flex gap-3 text-xs">
            <div className="rounded-lg border border-orange-500/30 bg-orange-950/20 px-3 py-2 text-center">
              <p className="text-[9px] text-gray-500 uppercase tracking-wide">Day-1 CapEx</p>
              <p className="font-bold text-orange-400 text-sm mt-0.5">
                {leaseMode ? fmt(data.total_capex_lease_mode) : fmt(data.total_capex)}
              </p>
            </div>
            <div className="rounded-lg border border-sky-500/30 bg-sky-950/20 px-3 py-2 text-center">
              <p className="text-[9px] text-gray-500 uppercase tracking-wide">Monthly OpEx</p>
              <p className="font-bold text-sky-400 text-sm mt-0.5">
                {leaseMode ? fmt(data.total_monthly_opex_lease_mode) : fmt(data.total_monthly_opex)}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-3 py-2 text-center">
              <p className="text-[9px] text-gray-500 uppercase tracking-wide">Break-Even</p>
              <p className="font-bold text-emerald-400 text-sm mt-0.5">
                {fmtNum(data.break_even.units_to_break_even)} units
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 mt-4 rounded-xl bg-white/5 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all ${
                activeTab === t.key
                  ? `bg-white/10 ${t.color} border-b-2 ${t.borderActive}`
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === "capex" && (
              <PillarPanel
                items={data.capex}
                leaseMode={leaseMode}
                sources={data.sources}
                total={data.total_capex}
                totalLease={data.total_capex_lease_mode}
                showToggle
                onToggle={() => setLeaseMode((v) => !v)}
              />
            )}
            {activeTab === "opex" && (
              <PillarPanel
                items={data.opex}
                leaseMode={leaseMode}
                sources={data.sources}
                total={data.total_monthly_opex}
                totalLease={data.total_monthly_opex_lease_mode}
              />
            )}
            {activeTab === "cogs" && (
              <PillarPanel
                items={data.cogs}
                leaseMode={leaseMode}
                sources={data.sources}
                total={0}
              />
            )}
            {activeTab === "breakeven" && (
              <BreakEvenChart data={data.break_even} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Hidden Costs Drawer — always visible */}
        {data.hidden_costs.length > 0 && (
          <HiddenCostsDrawer
            items={data.hidden_costs}
            sources={data.sources}
            leaseMode={leaseMode}
          />
        )}

        {/* Sources footnote */}
        {data.sources.length > 0 && (
          <div className="border-t border-white/10 pt-3">
            <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-1.5">
              Sources ({data.sources.filter((s) => s.verified).length} verified ·{" "}
              {data.sources.filter((s) => !s.verified).length} estimated)
            </p>
            <div className="flex flex-wrap gap-1">
              {data.sources.map((src) => (
                <a
                  key={src.id}
                  href={src.url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] hover:opacity-80 transition-opacity ${
                    src.verified
                      ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                      : "border-white/10 bg-white/5 text-gray-500"
                  }`}
                >
                  [{src.id}] {src.source_name}
                  {src.verified && " ✓"}
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
