"use client";

import React from "react";
import { SourceDocument } from "@/lib/types";

interface CitedTextProps {
  text: string;
  sources: SourceDocument[];
  onCite: (id: number) => void;
  className?: string;
}

/**
 * Renders plain text that may contain [N] citation markers.
 * Each [N] becomes a clickable superscript badge that triggers onCite(N).
 * Badge colour: verified source → emerald, AI estimated → amber.
 */
export default function CitedText({ text, sources, onCite, className }: CitedTextProps) {
  if (!text || typeof text !== "string") return null;

  // Normalise any malformed citation patterns the AI might emit:
  //   [ID: 1]  →  [1]
  //   [ID: anything non-numeric]  →  "" (remove)
  //   [non-numeric label like "AI Analysis"]  →  "" (remove)
  const clean = text
    .replace(/\[ID:\s*(\d+)\]/g, "[$1]")          // [ID: 1] → [1]
    .replace(/\[ID:\s*[^\]]*\]/g, "")              // [ID: anything else] → gone
    .replace(/\[[^\d\]]+[^\]]*\]/g, "");            // [non-numeric] → gone

  // Split on pure [N] tokens
  const parts = clean.split(/(\[\d+\])/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        const match = part.match(/^\[(\d+)\]$/);
        if (!match) return <React.Fragment key={i}>{part}</React.Fragment>;

        const id = parseInt(match[1], 10);
        const source = sources.find((s) => s.id === id);
        const isVerified = source?.verified ?? false;

        return (
          <button
            key={i}
            onClick={() => onCite(id)}
            title={source ? `${source.source_name}: ${source.title}` : `Source ${id}`}
            className={[
              "inline-flex items-center justify-center",
              "mx-0.5 px-1.5 py-0 rounded text-[10px] font-bold leading-5",
              "cursor-pointer transition-all duration-150",
              "hover:scale-110 hover:shadow-md focus:outline-none focus:ring-2",
              isVerified
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/35 focus:ring-emerald-500"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/35 focus:ring-amber-500",
            ].join(" ")}
          >
            {id}
          </button>
        );
      })}
    </span>
  );
}
