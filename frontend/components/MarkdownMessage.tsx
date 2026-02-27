"use client";
/**
 * MarkdownMessage — zero-dependency markdown renderer for AI chat responses.
 * Handles: bold, italic, inline-code, headings, bullet/ordered lists,
 * horizontal rules, and GFM-style pipe tables. No external packages needed.
 */
import React from "react";

interface Props {
  content: string;
  className?: string;
}

// ── inline parser: **bold**, *italic*, `code` ────────────────────────────────
function parseInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+?)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const k = `${keyPrefix}-${m.index}`;
    if (m[2] !== undefined)
      parts.push(<strong key={k} className="font-semibold text-white">{m[2]}</strong>);
    else if (m[3] !== undefined)
      parts.push(<em key={k} className="italic text-gray-300">{m[3]}</em>);
    else if (m[4] !== undefined)
      parts.push(<code key={k} className="bg-black/30 rounded px-1 py-0.5 text-[11px] font-mono">{m[4]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// ── table parser ─────────────────────────────────────────────────────────────
function parseTable(lines: string[], key: string): React.ReactNode | null {
  if (lines.length < 2) return null;
  const sep = lines[1].replace(/\s/g, "");
  if (!/^[|:\-]+$/.test(sep)) return null;
  const parseRow = (line: string) =>
    line.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
  const headers = parseRow(lines[0]);
  const rows = lines.slice(2).map(parseRow);
  return (
    <div key={key} className="overflow-x-auto my-3 rounded-lg border border-white/15">
      <table className="w-full text-xs border-collapse">
        <thead className="bg-white/10">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left whitespace-nowrap uppercase tracking-wide text-[10px] text-gray-300 font-semibold">
                {parseInline(h, `th-${key}-${i}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {rows.map((row, ri) => (
            <tr key={ri} className="hover:bg-white/5 transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-gray-200 align-top">
                  {parseInline(cell, `td-${key}-${ri}-${ci}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── block parser ─────────────────────────────────────────────────────────────
function parseBlocks(raw: string): React.ReactNode[] {
  const lines = raw.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") { i++; continue; }

    // Headings
    const hm = line.match(/^(#{1,3})\s+(.+)$/);
    if (hm) {
      const cls = hm[1].length === 1
        ? "font-bold text-white mt-2 mb-1"
        : hm[1].length === 2
        ? "font-semibold text-white mt-2 mb-1"
        : "font-medium text-gray-100 mt-1 mb-0.5";
      nodes.push(<p key={i} className={cls}>{parseInline(hm[2], `h${i}`)}</p>);
      i++; continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      nodes.push(<hr key={i} className="border-white/10 my-2" />);
      i++; continue;
    }

    // GFM table
    if (line.trimStart().startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith("|")) {
        tableLines.push(lines[i++]);
      }
      const tbl = parseTable(tableLines, `tbl${i}`);
      if (tbl) { nodes.push(tbl); continue; }
      tableLines.forEach((l, j) =>
        nodes.push(<p key={`tf-${i}-${j}`} className="mb-1 leading-relaxed">{parseInline(l, `tfp${j}`)}</p>)
      );
      continue;
    }

    // Unordered list
    if (/^(\s*[-*+])\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^(\s*[-*+])\s/.test(lines[i])) {
        const text = lines[i].replace(/^\s*[-*+]\s+/, "");
        items.push(<li key={i} className="leading-relaxed">{parseInline(text, `li${i}`)}</li>);
        i++;
      }
      nodes.push(<ul key={`ul${i}`} className="list-disc list-inside space-y-0.5 mb-2 pl-1">{items}</ul>);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const text = lines[i].replace(/^\d+\.\s+/, "");
        items.push(<li key={i} className="leading-relaxed">{parseInline(text, `oli${i}`)}</li>);
        i++;
      }
      nodes.push(<ol key={`ol${i}`} className="list-decimal list-inside space-y-0.5 mb-2 pl-1">{items}</ol>);
      continue;
    }

    // Plain paragraph — gather consecutive non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trimStart().startsWith("|") &&
      !/^#{1,3}\s/.test(lines[i]) &&
      !/^(\s*[-*+])\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i++]);
    }
    if (paraLines.length) {
      nodes.push(
        <p key={`p${i}`} className="mb-2 last:mb-0 leading-relaxed">
          {parseInline(paraLines.join(" "), `para${i}`)}
        </p>
      );
    }
  }

  return nodes;
}

// ── component ────────────────────────────────────────────────────────────────
export default function MarkdownMessage({ content, className = "" }: Props) {
  return (
    <div className={`text-sm ${className}`}>
      {parseBlocks(content)}
    </div>
  );
}
