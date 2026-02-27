"use client";

import { useState, useRef } from "react";
import { ExternalLink } from "lucide-react";

export interface CitationBadgeProps {
  /** The citation number displayed inside the badge (e.g. 1, 2, "3") */
  id: number | string;
  /** Human-readable source name shown in the tooltip */
  source: string;
  /** Optional deep-link URL; omit or pass "" when no URL is available */
  url?: string;
  /** Optional override for badge colour scheme: "verified" (sky) | "estimated" (amber) */
  variant?: "verified" | "estimated";
}

/**
 * Reusable inline citation badge.
 *
 * Usage:
 *   <CitationBadge id={1} source="The Edge Markets" url="https://theedgemarkets.com/…" />
 *
 * Hover / focus shows a compact tooltip with the source name and a "View Source" link.
 * The badge is keyboard-accessible (shows tooltip on focus).
 */
export default function CitationBadge({
  id,
  source,
  url = "",
  variant = "verified",
}: CitationBadgeProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(true);
  };
  const hide = () => {
    timerRef.current = setTimeout(() => setVisible(false), 120);
  };

  const colourClasses =
    variant === "verified"
      ? "bg-sky-500/20 text-sky-300 border-sky-500/40 hover:bg-sky-500/35 focus:ring-sky-500"
      : "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/35 focus:ring-amber-500";

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-label={`Citation ${id}: ${source}`}
        className={[
          "inline-flex items-center justify-center",
          "mx-0.5 px-1.5 py-0 rounded text-[10px] font-bold leading-5",
          "cursor-pointer transition-all duration-150 select-none",
          "border hover:scale-110 hover:shadow-md focus:outline-none focus:ring-2",
          colourClasses,
        ].join(" ")}
      >
        {id}
      </button>

      {/* Tooltip */}
      {visible && (
        <span
          role="tooltip"
          onMouseEnter={show}
          onMouseLeave={hide}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 pointer-events-auto"
        >
          <span className="relative flex flex-col gap-1 min-w-[140px] max-w-[220px] rounded-xl bg-slate-800/95 backdrop-blur-sm border border-slate-700/80 px-3 py-2.5 shadow-2xl">
            <span className="text-[11px] font-semibold text-white/90 leading-tight">{source}</span>
            {url && url !== "#" ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-sky-400 hover:text-sky-300 transition-colors w-fit"
              >
                View Source <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
              </a>
            ) : (
              <span className="text-[10px] text-white/25 italic">No source link available</span>
            )}
            {/* Downward arrow */}
            <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-[5px] border-transparent border-t-slate-800/95" />
          </span>
        </span>
      )}
    </span>
  );
}
