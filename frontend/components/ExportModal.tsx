"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, PresentationIcon, FileSpreadsheet, FileEdit, Download, Loader2, CheckCircle2 } from "lucide-react";
import { exportBlueprint } from "@/lib/api";
import { toast } from "sonner";
import type { SynthesisReport, ComputedMonthPoint } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ExportFormat = "pdf" | "docx" | "pptx" | "xlsx";

interface FormatOption {
  fmt: ExportFormat;
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  tag: string;
  colour: string;        // tailwind bg class (selected state)
  borderColour: string;  // tailwind border class
  tagColour: string;
  description: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    fmt: "pdf",
    icon: <FileText size={28} />,
    label: "Investor Brief",
    subtitle: ".PDF",
    tag: "Shareable",
    colour: "bg-indigo-950/60",
    borderColour: "border-indigo-500",
    tagColour: "bg-indigo-500/20 text-indigo-300",
    description:
      "A beautifully formatted, uneditable document. Perfect for emailing directly to a bank manager or angel investor.",
  },
  {
    fmt: "pptx",
    icon: <PresentationIcon size={28} />,
    label: "Pitch Deck",
    subtitle: ".PPTX",
    tag: "Demo Day",
    colour: "bg-purple-950/60",
    borderColour: "border-purple-500",
    tagColour: "bg-purple-500/20 text-purple-300",
    description:
      "5-slide deck auto-generated from your AI findings: Problem, Solution, SWOT, Financials, AI Verdict. Citations in speaker notes.",
  },
  {
    fmt: "docx",
    icon: <FileEdit size={28} />,
    label: "Editable Strategy",
    subtitle: ".DOCX",
    tag: "Edit Me",
    colour: "bg-sky-950/60",
    borderColour: "border-sky-500",
    tagColour: "bg-sky-500/20 text-sky-300",
    description:
      "Full formal business plan prose. Rewrite the AI's summary in your own voice before sharing with co-founders or partners.",
  },
  {
    fmt: "xlsx",
    icon: <FileSpreadsheet size={28} />,
    label: "Financial Sandbox",
    subtitle: ".XLSX",
    tag: "QuickBooks",
    colour: "bg-emerald-950/60",
    borderColour: "border-emerald-500",
    tagColour: "bg-emerald-500/20 text-emerald-300",
    description:
      "Month-by-month cash flow data + data sources tab. Import directly into QuickBooks, Excel, or build a custom model.",
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  report: SynthesisReport;
  sessionId: string;
  /** Optional: pass the computed timeline from the Financial Runway Simulator for richer XLSX output */
  timeline?: ComputedMonthPoint[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExportModal({
  open,
  onClose,
  report,
  sessionId,
  timeline,
}: ExportModalProps) {
  const [selected, setSelected] = useState<ExportFormat | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<ExportFormat | null>(null);

  const handleExport = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await exportBlueprint({
        format: selected,
        session_id: sessionId,
        report,
        timeline: timeline ?? [],
      });
      setDone(selected);
      toast.success("Export successful!", {
        description: `Your ${selected.toUpperCase()} file has been downloaded.`,
        duration: 4000,
      });
      setTimeout(() => {
        setDone(null);
        setSelected(null);
        onClose();
      }, 1800);
    } catch (e: unknown) {
      toast.error("Export failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedOption = FORMAT_OPTIONS.find((o) => o.fmt === selected);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Lock body scroll while modal is open, restore on close/unmount
  useEffect(() => {
    if (!mounted) return;
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open, mounted]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", duration: 0.35 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-2xl bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/60">
                <div>
                  <h2 className="text-lg font-bold text-white">Export Executive Blueprint</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    How do you want to <span className="text-indigo-400 font-medium">use</span> this data?
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-700/60 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Format grid */}
              <div className="grid grid-cols-2 gap-3 p-5">
                {FORMAT_OPTIONS.map((opt) => {
                  const isSelected = selected === opt.fmt;
                  return (
                    <button
                      key={opt.fmt}
                      onClick={() => setSelected(opt.fmt)}
                      className={[
                        "relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all",
                        isSelected
                          ? `${opt.colour} ${opt.borderColour} shadow-lg`
                          : "bg-gray-900/50 border-gray-700/60 hover:border-gray-500 hover:bg-gray-900",
                      ].join(" ")}
                    >
                      {/* Badge */}
                      <span className={`absolute top-3 right-3 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${opt.tagColour}`}>
                        {opt.tag}
                      </span>

                      <span className={isSelected ? "text-white" : "text-gray-400"}>
                        {opt.icon}
                      </span>

                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-semibold text-sm text-white">{opt.label}</span>
                          <span className="text-[11px] text-gray-500 font-mono">{opt.subtitle}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                          {opt.description}
                        </p>
                      </div>

                      {isSelected && (
                        <motion.div
                          layoutId="selected-check"
                          className="absolute bottom-3 right-3"
                        >
                          <CheckCircle2 size={16} className="text-white" />
                        </motion.div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Trust layer note */}
              <div className="mx-5 mb-4 px-3 py-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-center gap-2">
                <CheckCircle2 size={12} className="shrink-0 text-emerald-400" />
                Citations are preserved in all formats — inline [N] in PDF/DOCX, speaker notes in PPTX, and a "Data Sources" tab in XLSX.
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 pb-5 gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleExport}
                  disabled={!selected || loading}
                  className={[
                    "flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all",
                    selected && !loading
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                      : "bg-gray-700/50 text-gray-500 cursor-not-allowed",
                  ].join(" ")}
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Generating {selected?.toUpperCase()}…
                    </>
                  ) : done ? (
                    <>
                      <CheckCircle2 size={15} className="text-emerald-300" />
                      Downloaded!
                    </>
                  ) : (
                    <>
                      <Download size={15} />
                      {selected
                        ? `Download ${selectedOption?.label} (${selected.toUpperCase()})`
                        : "Select a format above"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
