"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, CheckCircle2, Sparkles } from "lucide-react";
import { SourceDocument } from "@/lib/types";

interface SourceDrawerProps {
  sources: SourceDocument[];
  openId: number | null;   // which citation number is active
  onClose: () => void;
}

/**
 * Slide-in right-side drawer that shows the full Data Pedigree for a
 * cited source. Verified sources show a green badge; AI-estimated ones
 * show an amber "AI Estimated" badge.
 */
export default function SourceDrawer({ sources, openId, onClose }: SourceDrawerProps) {
  const source = openId !== null ? sources.find((s) => s.id === openId) ?? null : null;
  const isOpen = openId !== null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Thin backdrop — only dims slightly, does NOT block scrolling */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/20"
            style={{ pointerEvents: "auto" }}
          />

          {/* Drawer panel — anchored below the top nav, full remaining height */}
          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 z-50 w-[360px] max-w-[90vw]
                       bg-gray-900/95 backdrop-blur-md border-l border-white/10
                       shadow-2xl shadow-black/60 flex flex-col overflow-hidden"
            style={{ top: "3.5rem", height: "calc(100vh - 3.5rem)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
                Data Pedigree
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10
                           transition-colors focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Source count pills */}
            <div className="flex flex-wrap gap-2 px-5 pt-3 pb-2">
              {sources.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    /* parent controls openId; re-render happens via prop */
                    const el = document.getElementById(`src-${s.id}`);
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={[
                    "px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors",
                    s.id === openId
                      ? s.verified
                        ? "bg-emerald-500/30 text-emerald-200 border-emerald-500/50"
                        : "bg-amber-500/30 text-amber-200 border-amber-500/50"
                      : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10",
                  ].join(" ")}
                >
                  [{s.id}]
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-5">
              {sources.map((s) => (
                <div
                  key={s.id}
                  id={`src-${s.id}`}
                  className={[
                    "rounded-xl p-4 border transition-colors",
                    s.id === openId
                      ? s.verified
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-amber-500/10 border-amber-500/30"
                      : "bg-white/5 border-white/8",
                  ].join(" ")}
                >
                  {/* Badge */}
                  {s.verified ? (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full
                                    bg-emerald-500/20 border border-emerald-500/40 mb-2">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wide">
                        Verified Source
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full
                                    bg-amber-500/20 border border-amber-500/40 mb-2">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span className="text-[10px] font-semibold text-amber-300 uppercase tracking-wide">
                        AI Estimated
                      </span>
                    </div>
                  )}

                  {/* Citation number + title */}
                  <p className="text-xs text-gray-400 mb-0.5">[{s.id}]</p>
                  <p className="text-sm font-medium text-white leading-snug mb-1">
                    {s.title}
                  </p>

                  {/* Source name + date */}
                  <p className="text-xs text-gray-400 mb-2">
                    <span className="font-semibold text-gray-300">{s.source_name}</span>
                    {" · "}{s.fetched_at}
                  </p>

                  {/* Snippet */}
                  <p className="text-xs text-gray-400 leading-relaxed mb-3">
                    {s.snippet}
                  </p>

                  {/* URL link */}
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-400
                                 hover:text-blue-300 underline underline-offset-2 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Source
                    </a>
                  )}
                </div>
              ))}
            </div>

            {/* Footer disclaimer */}
            <div className="px-5 py-3 border-t border-white/10">
              <p className="text-[10px] text-gray-500 leading-relaxed">
                <span className="text-emerald-400 font-semibold">Green badges</span> = fetched live from NewsAPI / Alpha Vantage.{" "}
                <span className="text-amber-400 font-semibold">Amber badges</span> = AI-synthesised estimates. Always verify financials with a local advisor.
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
