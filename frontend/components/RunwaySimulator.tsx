"use client";

/**
 * Financial Runway Simulator
 * ──────────────────────────
 * Self-contained 100dvh dashboard.  All math runs client-side so the chart
 * reacts instantly to slider / DnD changes.  Gemini API hooks are stubbed
 * as async functions ready to be replaced with real calls.
 *
 * Layout (flex-col, overflow-hidden everywhere):
 *  ┌── Header + Capital Input ─────────────────────────────────────────┐
 *  ├── KPI Cards (4 columns) ──────────────────────────────────────────┤
 *  ├── Body (flex-row, flex-1, min-h-0) ───────────────────────────────┤
 *  │   ├── Left Sidebar  (Variables sliders)                           │
 *  │   └── Center (flex-col, flex-1, min-h-0)                         │
 *  │       ├── Chart legend                                            │
 *  │       ├── ResponsiveContainer (flex-1, min-h-0) ← NEVER overflows│
 *  │       └── Timeline drop-zone (24 slots)                           │
 *  ├── Action Blocks Tray ─────────────────────────────────────────────┤
 *  └── Citations Footer ───────────────────────────────────────────────┘
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useProfileStore } from "@/lib/store";
import { getSession } from "@/lib/api";
import type { OnboardingSession } from "@/lib/types";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, useDroppable, useDraggable,
} from "@dnd-kit/core";
import {
  Trash2, Plus, RefreshCw, Sparkles, TrendingDown,
  DollarSign, Calendar, Zap, RotateCcw, GripHorizontal, Pencil, Check, X,
  Briefcase, Megaphone, Shield, Monitor, Radio, Users, Wrench, Globe,
  Database, FileText, Mail, Palette, Server, CreditCard, HardDrive,
} from "lucide-react";

// ─── Domain types ─────────────────────────────────────────────────────────────

interface Variable {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  citation: number;
  isMonthly: boolean;
}

interface ActionBlock {
  id: string;
  label: string;
  cost: number;
  recurrence: "once" | "monthly" | "yearly";
  color: string;
}

interface PlacedBlock {
  blockId: string;
  month: number; // 1-24
}

interface TimelinePoint {
  month: number;
  cash: number;
}

// ─── Static seed data ─────────────────────────────────────────────────────────

const INITIAL_VARIABLES: Variable[] = [
  { id: "v1", label: "Monthly Commercial Rent",  value: 3500, min: 1000,  max: 8000,  citation: 1, isMonthly: true },
  { id: "v2", label: "Founder Salary",           value: 5000, min: 2000,  max: 12000, citation: 2, isMonthly: true },
  { id: "v3", label: "Server & Cloud Costs",     value: 800,  min: 100,   max: 5000,  citation: 3, isMonthly: true },
  { id: "v4", label: "Base Marketing Budget",    value: 2000, min: 500,   max: 10000, citation: 4, isMonthly: true },
  { id: "v5", label: "Utilities & Misc",         value: 600,  min: 200,   max: 2000,  citation: 5, isMonthly: true },
];

const BLOCK_CATALOG: ActionBlock[] = [
  { id: "b1", label: "Hire Junior Dev",            cost: 4000,  recurrence: "monthly", color: "indigo"  },
  { id: "b2", label: "Launch Marketing Campaign",  cost: 10000, recurrence: "once",    color: "violet"  },
  { id: "b3", label: "Legal Compliance Audit",     cost: 3500,  recurrence: "once",    color: "amber"   },
  { id: "b4", label: "Office Equipment",           cost: 8000,  recurrence: "once",    color: "sky"     },
  { id: "b5", label: "PR & Media Package",         cost: 5000,  recurrence: "once",    color: "rose"    },
  { id: "b6", label: "Part-time Sales Rep",        cost: 2500,  recurrence: "monthly", color: "emerald" },
];

const CITATION_MAP: Record<number, string> = {
  1: "PropertyGuru Selangor Commercial Report 2026",
  2: "Malaysia Startups Founder Compensation Survey 2025",
  3: "AWS & Azure SME Pricing Guide Q1 2026",
  4: "Digital Marketing Agency Rate Card Malaysia 2026",
  5: "SME Corp Malaysia Business Cost Index 2025",
};

// ─── AI stub functions (replace with real Gemini calls) ───────────────────────

async function generateCompanyVariables(_profile: unknown): Promise<Variable[]> {
  await new Promise((r) => setTimeout(r, 1300));
  const ts = Date.now();
  return [
    { id: `ai_${ts}_1`, label: "SaaS License Fees",       value: 1200, min: 200,  max: 5000,  citation: 3, isMonthly: true },
    { id: `ai_${ts}_2`, label: "Customer Acquisition Cost",value: 3000, min: 500,  max: 15000, citation: 4, isMonthly: true },
    { id: `ai_${ts}_3`, label: "Accounting & Finance",     value: 700,  min: 300,  max: 3000,  citation: 5, isMonthly: true },
  ];
}

const AI_BLOCK_POOL: Omit<ActionBlock, "id">[] = [
  { label: "Business Insurance",        cost: 2400,  recurrence: "yearly",  color: "teal"    },
  { label: "Product Hunt Launch",        cost: 1500,  recurrence: "once",    color: "orange"  },
  { label: "Freelance Designer",         cost: 1800,  recurrence: "monthly", color: "purple"  },
  { label: "SEO Optimisation",           cost: 1200,  recurrence: "once",    color: "sky"     },
  { label: "Cloud Backup Service",       cost: 300,   recurrence: "monthly", color: "indigo"  },
  { label: "Annual Software Licences",   cost: 4800,  recurrence: "yearly",  color: "amber"   },
  { label: "Trade Show Booth",           cost: 6000,  recurrence: "once",    color: "rose"    },
  { label: "Customer Support Tool",      cost: 500,   recurrence: "monthly", color: "violet"  },
  { label: "Office Furniture Refresh",   cost: 3000,  recurrence: "once",    color: "slate"   },
  { label: "Cybersecurity Audit",        cost: 2800,  recurrence: "yearly",  color: "emerald" },
  { label: "Content Creator Retainer",   cost: 2200,  recurrence: "monthly", color: "teal"    },
  { label: "Video Production Package",   cost: 7500,  recurrence: "once",    color: "violet"  },
  { label: "Hiring Recruitment Fee",     cost: 5000,  recurrence: "once",    color: "amber"   },
  { label: "Annual Trademark Filing",    cost: 1000,  recurrence: "yearly",  color: "sky"     },
  { label: "Part-time Bookkeeper",       cost: 1500,  recurrence: "monthly", color: "indigo"  },
  { label: "Email Marketing Platform",   cost: 400,   recurrence: "monthly", color: "emerald" },
  { label: "Brand Identity Design",      cost: 4000,  recurrence: "once",    color: "rose"    },
  { label: "Server Capacity Upgrade",    cost: 3500,  recurrence: "once",    color: "purple"  },
  { label: "Sales CRM Subscription",     cost: 800,   recurrence: "monthly", color: "orange"  },
  { label: "Annual Domain & Hosting",    cost: 600,   recurrence: "yearly",  color: "slate"   },
];

async function generateActionBlocks(
  _profile: unknown,
  existingLabels: string[],
): Promise<ActionBlock[]> {
  await new Promise((r) => setTimeout(r, 1000));
  const existingSet = new Set(existingLabels.map((l) => l.toLowerCase()));
  const pool = AI_BLOCK_POOL.filter((b) => !existingSet.has(b.label.toLowerCase()));
  // Fisher-Yates shuffle then pick up to 3
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const ts = Date.now();
  return pool.slice(0, 3).map((b, idx) => ({ ...b, id: `ai_b_${ts}_${idx}` }));
}

// ─── Math engine ──────────────────────────────────────────────────────────────

function calculateTimeline(
  startingCapital: number,
  variables: Variable[],
  placedBlocks: PlacedBlock[],
  allBlocks: ActionBlock[],
): TimelinePoint[] {
  const monthlyFixed = variables.reduce((s, v) => s + (v.isMonthly ? v.value : 0), 0);
  let cash = startingCapital;
  return Array.from({ length: 24 }, (_, i) => {
    const month = i + 1;
    // One-time costs dropped exactly on this month
    const oneTime = placedBlocks
      .filter((p) => p.month === month)
      .reduce((s, p) => {
        const b = allBlocks.find((b) => b.id === p.blockId);
        return s + (b && b.recurrence === "once" ? b.cost : 0);
      }, 0);
    // Monthly recurring costs from all blocks placed on or before this month
    const monthly = placedBlocks
      .filter((p) => p.month <= month)
      .reduce((s, p) => {
        const b = allBlocks.find((b) => b.id === p.blockId);
        return s + (b && b.recurrence === "monthly" ? b.cost : 0);
      }, 0);
    // Yearly costs fire on the placement month and every 12 months after
    const yearly = placedBlocks
      .filter((p) => p.month <= month && (month - p.month) % 12 === 0)
      .reduce((s, p) => {
        const b = allBlocks.find((b) => b.id === p.blockId);
        return s + (b && b.recurrence === "yearly" ? b.cost : 0);
      }, 0);
    cash = cash - monthlyFixed - oneTime - monthly - yearly;
    return { month, cash: Math.round(cash) };
  });
}

// ─── Colour helpers ───────────────────────────────────────────────────────────

const BLOCK_COLOR_CLASSES: Record<string, string> = {
  indigo:  "border-indigo-700  bg-indigo-950  text-indigo-300",
  violet:  "border-violet-700  bg-violet-950  text-violet-300",
  amber:   "border-amber-700   bg-amber-950   text-amber-300",
  sky:     "border-sky-700     bg-sky-950     text-sky-300",
  rose:    "border-rose-700    bg-rose-950    text-rose-300",
  emerald: "border-emerald-700 bg-emerald-950 text-emerald-300",
  teal:    "border-teal-700    bg-teal-950    text-teal-300",
  orange:  "border-orange-700  bg-orange-950  text-orange-300",
  purple:  "border-purple-700  bg-purple-950  text-purple-300",
  slate:   "border-slate-600   bg-slate-800   text-slate-300",
};

function blockColorClass(color: string): string {
  return BLOCK_COLOR_CLASSES[color] ?? "border-slate-700 bg-slate-900 text-slate-300";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function VariableSlider({
  variable,
  onChange,
  onDelete,
  onUpdate,
}: {
  variable: Variable;
  onChange: (id: string, value: number) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Pick<Variable, "label" | "min" | "max">>) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draftLabel, setDraftLabel] = React.useState(variable.label);
  const [draftMin, setDraftMin]   = React.useState(String(variable.min));
  const [draftMax, setDraftMax]   = React.useState(String(variable.max));

  const openEdit = () => {
    setDraftLabel(variable.label);
    setDraftMin(String(variable.min));
    setDraftMax(String(variable.max));
    setEditing(true);
  };

  const saveEdit = () => {
    const newMin = Math.max(0, parseInt(draftMin.replace(/,/g, "")) || variable.min);
    const newMax = Math.max(newMin + 1, parseInt(draftMax.replace(/,/g, "")) || variable.max);
    onUpdate(variable.id, {
      label: draftLabel.trim() || variable.label,
      min: newMin,
      max: newMax,
    });
    setEditing(false);
  };

  const cancelEdit = () => setEditing(false);

  const step = Math.max(1, Math.ceil((variable.max - variable.min) / 100));
  const pct  = ((variable.value - variable.min) / (variable.max - variable.min)) * 100;
  const fmt  = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n);

  return (
    <div className="group p-3 bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">

      {/* ─ header row ─ */}
      <div className="flex items-center justify-between mb-2">
        {editing ? (
          <input
            autoFocus
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
            className="flex-1 mr-2 bg-slate-800 border border-slate-600 rounded-lg px-2 py-0.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        ) : (
          <span className="text-xs text-slate-300 font-medium leading-tight flex-1 mr-2 line-clamp-1">
            {variable.label}
          </span>
        )}
        <div className="flex items-center gap-1 shrink-0">
          {!editing && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-indigo-400 font-mono border border-slate-700">
              [{variable.citation}]
            </span>
          )}
          {editing ? (
            <>
              <button onClick={saveEdit} className="text-emerald-400 hover:text-emerald-300 transition-colors" title="Save">
                <Check size={12} />
              </button>
              <button onClick={cancelEdit} className="text-slate-500 hover:text-slate-300 transition-colors" title="Cancel">
                <X size={12} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={openEdit}
                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-indigo-400 transition-all"
                title="Edit name & range"
              >
                <Pencil size={11} />
              </button>
              <button
                onClick={() => onDelete(variable.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                title="Delete variable"
              >
                <Trash2 size={12} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─ slider ─ */}
      <div className="relative mb-1">
        <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          min={variable.min}
          max={variable.max}
          step={step}
          value={variable.value}
          onChange={(e) => onChange(variable.id, Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      {/* ─ min / value / max ─ */}
      {editing ? (
        <div className="flex items-center gap-1.5 mt-2">
          <div className="flex-1">
            <p className="text-[9px] text-slate-600 mb-0.5">Min (RM)</p>
            <input
              type="number"
              value={draftMin}
              onChange={(e) => setDraftMin(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex-1">
            <p className="text-[9px] text-slate-600 mb-0.5">Max (RM)</p>
            <input
              type="number"
              value={draftMax}
              onChange={(e) => setDraftMax(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-600">RM {fmt(variable.min)}</span>
          <span className="text-xs font-mono text-white font-semibold">RM {fmt(variable.value)}</span>
          <span className="text-[10px] text-slate-600">RM {fmt(variable.max)}</span>
        </div>
      )}
    </div>
  );
}

// ─── Portal tooltip (escapes all overflow containers) ────────────────────────

function FixedTooltip({ anchorRef, children }: {
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}) {
  if (typeof document === "undefined" || !anchorRef.current) return null;
  const rect = anchorRef.current.getBoundingClientRect();

  const style: React.CSSProperties = {
    position: "fixed",
    left: rect.left + rect.width / 2,
    top: rect.top - 8,
    transform: "translate(-50%, -100%)",
    zIndex: 9999,
    pointerEvents: "none",
    width: 176,
  };

  return createPortal(
    <div style={style}>
      {children}
    </div>,
    document.body,
  );
}

// ─── Block icon helper ────────────────────────────────────────────────────────

function BlockIcon({ label, color, size = 14 }: { label: string; color: string; size?: number }) {
  const l = label.toLowerCase();
  let Icon = Briefcase;
  if (/hire|staff|rep|team|recruit/.test(l))        Icon = Users;
  if (/market|campaign|pr|brand|media|launch|seo/.test(l)) Icon = Megaphone;
  if (/legal|audit|compliance|trademark|filing/.test(l))   Icon = Shield;
  if (/server|cloud|hosting|backup|capacity/.test(l))      Icon = Server;
  if (/equip|hardware|furniture|office/.test(l))            Icon = Monitor;
  if (/design|creative|content|video/.test(l))              Icon = Palette;
  if (/software|saas|licence|crm|subscription/.test(l))    Icon = HardDrive;
  if (/email|mail/.test(l))                                 Icon = Mail;
  if (/insurance/.test(l))                                  Icon = Shield;
  if (/database|data/.test(l))                              Icon = Database;
  if (/domain/.test(l))                                     Icon = Globe;
  if (/sales|crm/.test(l))                                  Icon = CreditCard;
  if (/book|account|finance/.test(l))                       Icon = FileText;
  if (/custom/.test(l))                                     Icon = Wrench;
  void color;
  return <Icon size={size} strokeWidth={1.75} />;
}

// ─── Draggable tray block ─────────────────────────────────────────────────────

function DraggableTrayBlock({
  block,
  onUpdate,
  onDelete,
}: {
  block: ActionBlock;
  onUpdate: (id: string, patch: Partial<Pick<ActionBlock, "label" | "cost" | "recurrence">>) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing]               = React.useState(false);
  const [draftLabel, setDraftLabel]         = React.useState(block.label);
  const [draftCost, setDraftCost]           = React.useState(String(block.cost));
  const [draftRecurrence, setDraftRecurrence] = React.useState(block.recurrence);

  const cycleRecurrence = () =>
    setDraftRecurrence((r) => r === "once" ? "monthly" : r === "monthly" ? "yearly" : "once");

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `tray__${block.id}`,
    data: { block },
    disabled: editing,
  });

  const openEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraftLabel(block.label);
    setDraftCost(String(block.cost));
    setDraftRecurrence(block.recurrence);
    setEditing(true);
  };

  const saveEdit = () => {
    const newCost = Math.max(0, parseInt(draftCost.replace(/,/g, "")) || block.cost);
    onUpdate(block.id, {
      label: draftLabel.trim() || block.label,
      cost:  newCost,
      recurrence: draftRecurrence,
    });
    setEditing(false);
  };

  const cancelEdit = () => setEditing(false);

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...(editing ? {} : listeners)}
      className={[
        "group relative select-none rounded-xl border px-3 py-2",
        "text-xs font-medium transition-all duration-150 touch-none",
        blockColorClass(block.color),
        editing
          ? "cursor-default"
          : isDragging
            ? "opacity-25 scale-95 cursor-grabbing"
            : "opacity-100 hover:brightness-125 hover:scale-[1.02] cursor-grab",
      ].join(" ")}
    >
      {editing ? (
        <div onClick={(e) => e.stopPropagation()}>
          <input
            autoFocus
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
            className="w-full bg-black/30 border border-white/20 rounded-lg px-2 py-0.5 text-xs text-white focus:outline-none focus:border-white/40 mb-1.5"
            placeholder="Block name"
          />
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={draftCost}
              onChange={(e) => setDraftCost(e.target.value)}
              className="flex-1 min-w-0 bg-black/30 border border-white/20 rounded-lg px-2 py-0.5 text-xs text-white font-mono focus:outline-none focus:border-white/40"
              placeholder="Cost (RM)"
            />
            <button
              onClick={cycleRecurrence}
              className={[
                "shrink-0 text-[9px] px-1.5 py-0.5 rounded-lg border font-semibold transition-colors",
                draftRecurrence === "once"
                  ? "bg-black/20 border-white/10 text-white/50"
                  : draftRecurrence === "monthly"
                    ? "bg-white/20 border-white/30 text-white"
                    : "bg-amber-500/20 border-amber-400/30 text-amber-200",
              ].join(" ")}
              title="Click to cycle: once → /mo → /yr"
            >
              {draftRecurrence === "once" ? "1×" : draftRecurrence === "monthly" ? "/mo" : "/yr"}
            </button>
            <button
              onClick={saveEdit}
              className="text-emerald-300 hover:text-emerald-200 transition-colors"
              title="Save"
            >
              <Check size={12} />
            </button>
            <button
              onClick={cancelEdit}
              className="text-white/30 hover:text-white/60 transition-colors"
              title="Cancel"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1.5">
            <GripHorizontal size={10} className="opacity-40 shrink-0" />
            <span className="font-semibold flex-1 line-clamp-1">{block.label}</span>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={openEdit}
                title="Edit block"
                className="p-0.5 hover:brightness-150 transition-all"
              >
                <Pencil size={10} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}
                title="Delete block"
                className="p-0.5 hover:text-red-400 transition-colors"
              >
                <Trash2 size={10} />
              </button>
            </div>
          </div>
          <div className="text-[10px] mt-0.5 opacity-60 pl-4">
            RM {block.cost.toLocaleString()} · {block.recurrence === "once" ? "one-time" : block.recurrence === "monthly" ? "recurring /mo" : "recurring /yr"}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Placed block pin (icon + portal tooltip) ─────────────────────────────────

function PlacedBlockPin({ block, month, recurrenceLabel, onRemove }: {
  block: ActionBlock;
  month: number;
  recurrenceLabel: string;
  onRemove: (blockId: string, month: number) => void;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);

  return (
    <div className="w-full flex justify-center">
      <button
        ref={btnRef}
        onClick={() => onRemove(block.id, month)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 border border-white/20 text-white/70 hover:bg-red-900/50 hover:border-red-500/40 hover:text-red-300 transition-all duration-150"
      >
        <BlockIcon label={block.label} color={block.color} size={13} />
      </button>

      {hovered && (
        <FixedTooltip anchorRef={btnRef}>
          <div className="bg-gray-950 border border-slate-700 rounded-xl p-2.5 shadow-2xl shadow-black/60">
            <p className="text-white text-[11px] font-semibold leading-tight mb-1">{block.label}</p>
            <div className="flex items-center justify-between text-[10px] gap-2">
              <span className="text-slate-400 font-mono">RM {block.cost.toLocaleString()}</span>
              <span className={[
                "px-1.5 py-0.5 rounded-md font-semibold shrink-0",
                block.recurrence === "once"
                  ? "bg-slate-800 text-slate-400"
                  : block.recurrence === "monthly"
                    ? "bg-indigo-900/60 text-indigo-300"
                    : "bg-amber-900/60 text-amber-300",
              ].join(" ")}>
                {recurrenceLabel}
              </span>
            </div>
            <p className="text-[9px] text-slate-600 mt-1.5">Click to remove from M{month}</p>
          </div>
        </FixedTooltip>
      )}
    </div>
  );
}

// ─── Droppable month slot ──────────────────────────────────────────────────────

function MonthSlot({
  month, placedBlocks, allBlocks, onRemove,
}: {
  month: number;
  placedBlocks: PlacedBlock[];
  allBlocks: ActionBlock[];
  onRemove: (blockId: string, month: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `month__${month}` });
  const placed = placedBlocks.filter((p) => p.month === month);

  return (
    <div
      ref={setNodeRef}
      className={[
        "flex flex-col items-center min-w-[44px] max-w-[44px] rounded-lg border p-1 gap-1 transition-colors duration-150",
        isOver
          ? "border-indigo-500 bg-indigo-950/40 shadow-[0_0_0_1px] shadow-indigo-500/30"
          : placed.length > 0
            ? "border-slate-700 bg-slate-900/70"
            : "border-slate-800/60 bg-slate-900/30",
      ].join(" ")}
    >
      <span className="text-[9px] text-slate-500 font-mono font-bold">M{month}</span>
      {placed.map((p) => {
        const block = allBlocks.find((b) => b.id === p.blockId);
        if (!block) return null;
        const recurrenceLabel =
          block.recurrence === "once" ? "One-time" :
          block.recurrence === "monthly" ? "Monthly" : "Yearly";
        return (
          <PlacedBlockPin
            key={`${p.blockId}_${p.month}`}
            block={block}
            month={month}
            recurrenceLabel={recurrenceLabel}
            onRemove={onRemove}
          />
        );
      })}
    </div>
  );
}

// ─── Custom chart tooltip ──────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: Array<{ value: number }>; label?: number;
}) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs shadow-xl">
      <p className="text-slate-400 mb-1 font-medium">Month {label}</p>
      <p className={`font-mono font-bold text-sm ${val >= 0 ? "text-emerald-400" : "text-red-400"}`}>
        {val < 0 ? "−" : ""}RM {Math.abs(val).toLocaleString()}
        {val < 0 ? <span className="text-[10px] font-normal text-red-500 ml-1">(deficit)</span> : null}
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RunwaySimulator() {
  const { activeSessionId } = useProfileStore();
  const [startingCapital, setStartingCapital]   = useState(50000);
  const [inputCapital, setInputCapital]         = useState("50000");
  const [variables, setVariables]               = useState<Variable[]>([]);

  // Seed starting capital from the session's cash_reserve
  useEffect(() => {
    if (!activeSessionId) return;
    getSession(activeSessionId)
      .then((s) => {
        const sess = s as OnboardingSession;
        const capital = sess.cash_reserve;
        if (capital && capital > 0) {
          setStartingCapital(capital);
          setInputCapital(String(capital));
        }
      })
      .catch(() => {});
  }, [activeSessionId]);
  const [availableBlocks, setAvailableBlocks]   = useState<ActionBlock[]>(BLOCK_CATALOG);
  const [placedBlocks, setPlacedBlocks]         = useState<PlacedBlock[]>([]);
  const [activeBlock, setActiveBlock]           = useState<ActionBlock | null>(null);
  const [aiLoadingVars, setAiLoadingVars]       = useState(false);
  const [aiLoadingBlocks, setAiLoadingBlocks]   = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  // ── Derived: 24-month timeline ──────────────────────────────────────────────
  const timeline = useMemo(
    () => calculateTimeline(startingCapital, variables, placedBlocks, availableBlocks),
    [startingCapital, variables, placedBlocks, availableBlocks],
  );

  // Blocks not yet on the timeline (hide once placed, restore when removed)
  const placedBlockIds = useMemo(
    () => new Set(placedBlocks.map((p) => p.blockId)),
    [placedBlocks],
  );
  const trayBlocks = useMemo(
    () => availableBlocks.filter((b) => !placedBlockIds.has(b.id)),
    [availableBlocks, placedBlockIds],
  );

  // ── Derived: KPI values ─────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const monthlyFixed = variables.reduce((s, v) => s + (v.isMonthly ? v.value : 0), 0);
    const zeroIdx      = timeline.findIndex((d) => d.cash < 0);
    return {
      monthlyFixed,
      runway: zeroIdx === -1 ? 24 : zeroIdx,          // months before depletion
      cash24: timeline[23]?.cash ?? 0,
    };
  }, [timeline, variables]);

  // Gradient stops: the line turns red where cash goes negative
  const zeroFraction = useMemo(() => {
    const idx = timeline.findIndex((d) => d.cash < 0);
    if (idx === -1) return 1;
    if (idx === 0)  return 0;
    return idx / 24;
  }, [timeline]);

  // ── DnD handlers ───────────────────────────────────────────────────────────
  const handleDragStart = useCallback((e: DragStartEvent) => {
    const block = e.active.data.current?.block as ActionBlock | undefined;
    if (block) setActiveBlock(block);
  }, []);

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    setActiveBlock(null);
    const { active, over } = e;
    if (!over) return;
    const overId = String(over.id);
    if (!overId.startsWith("month__")) return;
    const month = parseInt(overId.replace("month__", ""), 10);
    const block  = active.data.current?.block as ActionBlock | undefined;
    if (block) setPlacedBlocks((prev) => [...prev, { blockId: block.id, month }]);
  }, []);

  const removeBlock = useCallback((blockId: string, month: number) => {
    setPlacedBlocks((prev) => prev.filter((p) => !(p.blockId === blockId && p.month === month)));
  }, []);

  // ── Variable handlers ──────────────────────────────────────────────────────
  const updateVariable = useCallback((id: string, value: number) => {
    setVariables((prev) => prev.map((v) => (v.id === id ? { ...v, value: Math.min(Math.max(value, v.min), v.max) } : v)));
  }, []);

  const updateVariableMeta = useCallback((id: string, patch: Partial<Pick<Variable, "label" | "min" | "max">>) => {
    setVariables((prev) => prev.map((v) => {
      if (v.id !== id) return v;
      const newMin = patch.min ?? v.min;
      const newMax = patch.max ?? v.max;
      return {
        ...v,
        ...patch,
        min: newMin,
        max: newMax,
        value: Math.min(Math.max(v.value, newMin), newMax),
      };
    }));
  }, []);

  const deleteVariable = useCallback((id: string) => {
    setVariables((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const resetAll = useCallback(() => {
    setVariables([]);
    setAvailableBlocks(BLOCK_CATALOG);
    setPlacedBlocks([]);
    setStartingCapital(50000);
    setInputCapital("50000");
  }, []);

  const addCustomVariable = useCallback(() => {
    setVariables((prev) => [
      ...prev,
      {
        id: `custom_${Date.now()}`,
        label: "Custom Expense",
        value: 1000,
        min: 100,
        max: 10000,
        citation: 1,
        isMonthly: true,
      },
    ]);
  }, []);

  // ── AI handlers ────────────────────────────────────────────────────────────
  const handleAIVars = useCallback(async () => {
    setAiLoadingVars(true);
    try {
      const generated = await generateCompanyVariables({ name: "Startup" });
      setVariables(generated);
    } finally {
      setAiLoadingVars(false);
    }
  }, []);

  const handleAIBlocks = useCallback(async () => {
    setAiLoadingBlocks(true);
    try {
      const generated = await generateActionBlocks(
        { name: "Startup" },
        availableBlocks.map((b) => b.label),
      );
      setAvailableBlocks((prev) => [...prev, ...generated]);
    } finally {
      setAiLoadingBlocks(false);
    }
  }, [availableBlocks]);

  const updateBlockMeta = useCallback((id: string, patch: Partial<Pick<ActionBlock, "label" | "cost" | "recurrence">>) => {
    setAvailableBlocks((prev) => prev.map((b) => b.id === id ? { ...b, ...patch } : b));
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setAvailableBlocks((prev) => prev.filter((b) => b.id !== id));
    setPlacedBlocks((prev) => prev.filter((p) => p.blockId !== id));
  }, []);

  const addCustomBlock = useCallback(() => {
    setAvailableBlocks((prev) => [
      ...prev,
      {
        id: `custom_b_${Date.now()}`,
        label: "Custom Action",
        cost: 1000,
        recurrence: "once" as const,
        color: "slate",
      },
    ]);
  }, []);

  // ── Capital input ───────────────────────────────────────────────────────────
  const applyCapital = useCallback(() => {
    const val = parseFloat(inputCapital.replace(/,/g, ""));
    if (!isNaN(val) && val > 0) setStartingCapital(val);
  }, [inputCapital]);

  // ── Active citations ────────────────────────────────────────────────────────
  const activeCitations = useMemo(() => {
    const ids = [...new Set(variables.map((v) => v.citation))].sort((a, b) => a - b);
    return ids.map((id) => ({ id, text: CITATION_MAP[id] ?? "Source not found" }));
  }, [variables]);

  // ── Formatters ──────────────────────────────────────────────────────────────
  const fmtRM = (n: number) =>
    `RM ${Math.abs(n) >= 1000 ? `${(Math.abs(n) / 1000).toFixed(1)}k` : Math.abs(n)}`;

  const runwayColor =
    kpis.runway > 12 ? "text-emerald-400"
    : kpis.runway < 6 ? "text-red-400"
    : "text-amber-400";

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>

      {/* Root: full height, no overflow */}
      <div className="h-full flex flex-col overflow-hidden bg-slate-950 text-slate-300 select-none">

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="flex-none px-5 pt-3 pb-2.5 border-b border-slate-800/70 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-base leading-none tracking-tight">
              Financial Runway Simulator
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Model burn rate &amp; cash runway · drag blocks onto months · sliders adjust variables live
            </p>
          </div>
          {/* Capital input */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 hidden md:inline">Starting Capital (RM)</span>
            <input
              type="text"
              value={inputCapital}
              onChange={(e) => setInputCapital(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyCapital()}
              className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="50000"
            />
            <button
              onClick={applyCapital}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Apply
            </button>
            <button
              onClick={resetAll}
              title="Reset everything"
              className="p-1.5 text-slate-600 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* ── KPI Cards ─────────────────────────────────────────────────────────── */}
        <div className="flex-none grid grid-cols-4 gap-2.5 px-5 py-2.5 border-b border-slate-800/70">
          {/* Starting Capital */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 px-3.5 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign size={11} className="text-slate-500" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Starting Capital</span>
            </div>
            <span className="text-base font-bold text-white font-mono">{fmtRM(startingCapital)}</span>
          </div>

          {/* Runway */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 px-3.5 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar size={11} className="text-slate-500" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Runway</span>
            </div>
            <span className={`text-base font-bold font-mono ${runwayColor}`}>
              {kpis.runway === 24 ? "24+" : kpis.runway} months
            </span>
          </div>

          {/* Net Monthly */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 px-3.5 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown size={11} className="text-slate-500" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Net Monthly</span>
            </div>
            <span className="text-base font-bold text-red-400 font-mono">
              −{fmtRM(kpis.monthlyFixed)}
            </span>
          </div>

          {/* Cash at M24 */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 px-3.5 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap size={11} className="text-slate-500" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Cash at M24</span>
            </div>
            <span className={`text-base font-bold font-mono ${kpis.cash24 >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {kpis.cash24 < 0 ? "−" : ""}{fmtRM(kpis.cash24)}
            </span>
          </div>
        </div>

        {/* ── Main body (sidebar + chart) ────────────────────────────────────── */}
        <div className="flex-1 min-h-0 flex overflow-hidden">

          {/* Left Sidebar — Variables Engine */}
          <aside className="w-60 shrink-0 flex flex-col border-r border-slate-800/70 overflow-hidden">
            <div className="flex-none flex items-center justify-between px-3.5 py-2 border-b border-slate-800/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Variables</span>
              {variables.length > 0 && (
                <button
                  onClick={() => setVariables([])}
                  className="text-slate-600 hover:text-white transition-colors"
                  title="Clear all variables"
                >
                  <RotateCcw size={11} />
                </button>
              )}
            </div>

            {/* Scrollable slider list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {variables.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-3 py-8">
                  <Sparkles size={24} className="text-indigo-500/60" />
                  <p className="text-xs text-slate-400 font-medium">No variables yet</p>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    Click &ldquo;AI Generate&rdquo; below to auto-build essential cost variables for your business.
                  </p>
                </div>
              ) : (
                variables.map((v) => (
                  <VariableSlider
                    key={v.id}
                    variable={v}
                    onChange={updateVariable}
                    onDelete={deleteVariable}
                    onUpdate={updateVariableMeta}
                  />
                ))
              )}
            </div>

            {/* Bottom actions */}
            <div className="flex-none p-2 space-y-1.5 border-t border-slate-800/60">
              <button
                onClick={handleAIVars}
                disabled={aiLoadingVars}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-900/40 hover:bg-indigo-800/50 border border-indigo-700/60 text-indigo-300 rounded-xl text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles size={11} className={aiLoadingVars ? "animate-pulse" : ""} />
                {aiLoadingVars ? "Generating…" : variables.length === 0 ? "✦ AI Generate Variables" : "Regenerate Variables"}
              </button>
              <button
                onClick={addCustomVariable}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-400 rounded-xl text-xs font-medium transition-colors"
              >
                <Plus size={11} />
                Add Custom Variable
              </button>
            </div>
          </aside>

          {/* Center: chart + timeline */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden px-4 pt-2.5 pb-0 gap-1.5">

            {/* Chart legend */}
            <div className="flex-none flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Cash Balance Runway — 24 Months
              </span>
              <div className="flex items-center gap-3 text-[9px] text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-5 h-px bg-emerald-500" />
                  Positive
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-5 h-px bg-red-500" />
                  Negative
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-5 h-px border-t border-dashed border-red-600" />
                  Zero Cash
                </span>
              </div>
            </div>

            {/* ── Recharts — flex-1 + min-h-0: never overflows ────────────────── */}
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timeline}
                  margin={{ top: 8, right: 16, bottom: 16, left: 8 }}
                >
                  {/* Gradient definition — green→red at the zero-crossing fraction */}
                  <defs>
                    <linearGradient id="cashLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset={`${Math.max(0, zeroFraction * 100 - 1)}%`} stopColor="#10b981" />
                      <stop offset={`${zeroFraction * 100}%`}               stopColor="#f87171" />
                      <stop offset="100%"                                    stopColor="#f87171" />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#475569", fontSize: 10 }}
                    label={{ value: "Month", position: "insideBottomRight", offset: -4, fill: "#475569", fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: "#1e293b" }}
                  />
                  <YAxis
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    tick={{ fill: "#475569", fontSize: 10 }}
                    width={38}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#334155", strokeWidth: 1 }} />
                  {/* Zero line */}
                  <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="6 4" strokeWidth={1.5} opacity={0.6} />
                  <Line
                    type="monotone"
                    dataKey="cash"
                    stroke="url(#cashLine)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, fill: "#818cf8", stroke: "#312e81", strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* ── Timeline drop-zone ────────────────────────────────────────────── */}
            <div className="flex-none pb-2">
              <div className="text-[9px] text-slate-600 uppercase tracking-wider font-bold mb-1.5">
                Timeline — Drop Action Blocks Onto a Month
              </div>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {Array.from({ length: 24 }, (_, i) => i + 1).map((month) => (
                  <MonthSlot
                    key={month}
                    month={month}
                    placedBlocks={placedBlocks}
                    allBlocks={availableBlocks}
                    onRemove={removeBlock}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Action Blocks Tray ────────────────────────────────────────────────── */}
        <div className="flex-none border-t border-slate-800/70 px-5 py-2.5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
              Action Blocks — Drag to Timeline
            </span>
            <button
              onClick={handleAIBlocks}
              disabled={aiLoadingBlocks}
              className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-indigo-900/40 hover:bg-indigo-800/50 border border-indigo-700/60 text-indigo-300 rounded-lg text-[10px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles size={10} className={aiLoadingBlocks ? "animate-pulse" : ""} />
              {aiLoadingBlocks ? "Generating…" : "AI: Suggest Resources"}
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {trayBlocks.map((block) => (
              <DraggableTrayBlock
                key={block.id}
                block={block}
                onUpdate={updateBlockMeta}
                onDelete={deleteBlock}
              />
            ))}
            <button
              onClick={addCustomBlock}
              className="flex items-center gap-1 rounded-xl border border-dashed border-slate-700 px-3 py-2 text-xs text-slate-600 hover:text-slate-400 hover:border-slate-600 transition-colors"
            >
              <Plus size={11} /> Add
            </button>
          </div>
        </div>

        {/* ── Citations Footer ──────────────────────────────────────────────────── */}
        <footer className="flex-none border-t border-slate-800/70 px-5 py-2">
          <div className="flex items-start gap-3 flex-wrap">
            <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold shrink-0 mt-0.5 pt-px">
              Sources
            </span>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 flex-1 min-w-0">
              {activeCitations.map(({ id, text }) => (
                <span key={id} className="text-[9px] text-slate-600 whitespace-nowrap">
                  <span className="text-indigo-500 font-mono font-bold">[{id}]</span> {text}
                </span>
              ))}
            </div>
            <button className="flex items-center gap-1 text-[9px] text-slate-600 hover:text-slate-400 transition-colors shrink-0">
              <RefreshCw size={9} />
              Regenerate with latest data
            </button>
          </div>
        </footer>
      </div>

      {/* DragOverlay — follows cursor while dragging */}
      <DragOverlay dropAnimation={null}>
        {activeBlock ? (
          <div className={[
            "rounded-xl border px-3 py-2 text-xs font-medium shadow-2xl shadow-black/50",
            "rotate-2 scale-105 pointer-events-none",
            blockColorClass(activeBlock.color),
          ].join(" ")}>
            <div className="font-semibold">{activeBlock.label}</div>
            <div className="text-[10px] mt-0.5 opacity-60">
              RM {activeBlock.cost.toLocaleString()} · {activeBlock.recurrence === "once" ? "one-time" : activeBlock.recurrence === "monthly" ? "/mo" : "/yr"}
            </div>
          </div>
        ) : null}
      </DragOverlay>

    </DndContext>
  );
}
