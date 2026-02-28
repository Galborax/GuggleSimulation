"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createSynthesis } from "@/lib/api";
import { toast } from "sonner";
import type { SynthesisReport as SynthesisReportType, SourceDocument, CitedInsight, SourceCitation } from "@/lib/types";
import {
  FileText, Download, TrendingUp, AlertTriangle, Globe,
  DollarSign, Database, Lightbulb, CheckCircle2, MinusCircle, ExternalLink,
} from "lucide-react";
import CitedText from "@/components/CitedText";
import ExportModal from "@/components/ExportModal";
import { useProfileStore } from "@/lib/store";

interface SynthesisReportProps {
  sessionId?: string;
}

export default function SynthesisReport({ sessionId }: SynthesisReportProps) {
  const [report, setReport] = useState<SynthesisReportType | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<number | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const { activeSessionId } = useProfileStore();
  const activeId = sessionId || activeSessionId;
  const sources: SourceDocument[] = report?.sources ?? [];

  const generate = async () => {
    if (!activeId) { toast.error("No session found. Complete onboarding first."); return; }
    setLoading(true);
    try {
      const res = await createSynthesis(activeId);
      setReport(res as SynthesisReportType);
    } catch {
      toast.error("Failed to generate blueprint")
    } finally {
      setLoading(false);
    }
  };

  const verdictColor = (score: number) => score >= 70 ? "text-green-400" : score >= 50 ? "text-yellow-400" : "text-red-400";
  const verifiedCount = sources.filter((s) => s.verified).length;
  const estimatedCount = sources.length - verifiedCount;

  return (
    <div className="flex gap-6 items-start">
      {/* ── Main content column ── */}
      <div className="flex-1 min-w-0 space-y-4">
      {!report && (
        <div className="text-center space-y-4 py-8">
          <div className="text-5xl">📋</div>
          <h3 className="text-xl font-bold text-white">Executive Blueprint</h3>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            After running your simulations, the AI generates your Executive Blueprint — a comprehensive, investor-ready document outlining your risks, opportunities, and exact next steps.
          </p>
          <Button onClick={generate} disabled={loading || !activeId} className="mx-auto">
            <FileText className="h-4 w-4 mr-2" />
            {loading ? "Generating blueprint..." : "Generate Blueprint →"}
          </Button>
          {!activeId && <p className="text-red-400 text-xs">Complete onboarding to generate your blueprint</p>}
        </div>
      )}

      {report && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Executive Blueprint</h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Confidence:</span>
                <span className={`text-lg font-bold ${verdictColor(report.confidence_score)}`}>{report.confidence_score}%</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowExportModal(true)}
                className="gap-1.5 border-indigo-700/50 text-indigo-300 hover:bg-indigo-950/50 hover:border-indigo-500 transition-all">
                <Download className="h-3 w-3" /> Export
              </Button>
            </div>
          </div>

          {/* Sources hint */}
          {sources.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white/5 border border-white/10 px-4 py-2.5">
              <Database className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-400">Data sources:</span>
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
              <span className="text-[10px] text-gray-500 ml-auto">Click [N] inline to highlight →</span>
            </div>
          )}

          {/* Overall Summary (new) */}
          {report.overall_summary && report.overall_summary !== report.executive_summary && (
            <div className="rounded-xl border border-sky-500/20 bg-sky-900/10 px-5 py-4">
              <p className="text-gray-300 text-sm leading-relaxed italic">
                <CitedText text={report.overall_summary} sources={sources} onCite={setSelectedCitation} />
              </p>
            </div>
          )}

          {/* ── KEY FINDINGS (Perplexity-style cited insights) ── */}
          {(report.key_findings ?? []).length > 0 && (
            <div className="rounded-xl border border-sky-500/30 bg-sky-900/15 p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="h-4 w-4 text-sky-400" />
                <h4 className="font-semibold text-white text-sm">Key Findings</h4>
                <span className="ml-auto text-[10px] text-sky-400/70 font-medium uppercase tracking-wide">
                  {(report.key_findings ?? []).filter(f => f.confidence_level === "High").length} verified · {(report.key_findings ?? []).filter(f => f.confidence_level === "Medium").length} estimated
                </span>
              </div>
              <div className="space-y-2">
                {(report.key_findings ?? []).map((finding: CitedInsight, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className={[
                      "flex items-start gap-3 rounded-lg border p-3 text-sm",
                      finding.confidence_level === "High"
                        ? "bg-emerald-900/15 border-emerald-500/20"
                        : "bg-amber-900/15 border-amber-500/20",
                    ].join(" ")}
                  >
                    {finding.confidence_level === "High" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                    ) : (
                      <MinusCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-gray-200 leading-relaxed">
                        <CitedText text={finding.claim} sources={sources} onCite={setSelectedCitation} />
                      </p>
                    </div>
                    <span className={[
                      "text-[9px] font-bold uppercase tracking-widest shrink-0 mt-0.5 px-1.5 py-0.5 rounded-full border",
                      finding.confidence_level === "High"
                        ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/10"
                        : "text-amber-300 border-amber-500/30 bg-amber-500/10",
                    ].join(" ")}>
                      {finding.confidence_level}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Investor Pitch */}
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-900/20 p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-5 w-5 text-indigo-400" />
              <h4 className="font-semibold text-white">Investor Pitch</h4>
              <Badge variant="default" className="ml-auto">Elevator Pitch</Badge>
            </div>
            <p className="text-gray-200 text-sm italic">&quot;<CitedText text={report.investor_pitch} sources={sources} onCite={setSelectedCitation} />&quot;</p>
          </div>

          {/* Executive Summary */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-5">
            <h4 className="font-semibold text-white mb-2">Executive Summary</h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              <CitedText text={report.executive_summary} sources={sources} onCite={setSelectedCitation} />
            </p>
          </div>

          {/* SWOT */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "strengths", label: "Strengths", color: "border-green-500/30 bg-green-900/20", textColor: "text-green-400" },
              { key: "weaknesses", label: "Weaknesses", color: "border-red-500/30 bg-red-900/20", textColor: "text-red-400" },
              { key: "opportunities", label: "Opportunities", color: "border-blue-500/30 bg-blue-900/20", textColor: "text-blue-400" },
              { key: "threats", label: "Threats", color: "border-yellow-500/30 bg-yellow-900/20", textColor: "text-yellow-400" },
            ].map(({ key, label, color, textColor }) => (
              <div key={key} className={`rounded-xl border p-4 ${color}`}>
                <h5 className={`text-xs font-bold mb-2 ${textColor}`}>{label}</h5>
                {report.swot?.[key as keyof typeof report.swot]?.map((item: string, i: number) => (
                  <p key={i} className="text-xs text-gray-300">• <CitedText text={item} sources={sources} onCite={setSelectedCitation} /></p>
                ))}
              </div>
            ))}
          </div>

          {/* Financial Outlook */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <h4 className="font-semibold text-white text-sm">Financial Outlook</h4>
            </div>
            <p className="text-gray-300 text-sm">
              <CitedText text={report.financial_outlook} sources={sources} onCite={setSelectedCitation} />
            </p>
          </div>

          {/* ASEAN */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-indigo-400" />
              <h4 className="font-semibold text-white text-sm">ASEAN Opportunities</h4>
            </div>
            <p className="text-gray-300 text-sm">
              <CitedText text={report.asean_opportunities} sources={sources} onCite={setSelectedCitation} />
            </p>
          </div>

          {/* Risks & Recommendation */}
          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <h4 className="font-semibold text-white text-sm">Key Risks</h4>
              </div>
              <p className="text-gray-300 text-sm">
                <CitedText text={report.risks} sources={sources} onCite={setSelectedCitation} />
              </p>
            </div>
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-900/20 p-4">
              <h4 className="font-semibold text-indigo-300 text-sm mb-1">Our Recommendation</h4>
              <p className="text-gray-200 text-sm">
                <CitedText text={report.recommendation} sources={sources} onCite={setSelectedCitation} />
              </p>
            </div>
          </div>

          <Button variant="outline" onClick={() => setReport(null)} className="w-full">
            Regenerate Report
          </Button>

          {/* ── CITED REFERENCES FOOTER ── */}
          {(report.references ?? []).length > 0 && (
            <div className="rounded-xl bg-white/3 border border-white/8 p-4 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-3">
                Sources cited by AI
              </p>
              {(report.references ?? []).map((ref: SourceCitation) => {
                const full = sources.find(s => s.id === ref.id);
                return (
                  <div
                    key={ref.id}
                    className="flex items-center gap-3 group cursor-pointer"
                    onClick={() => setSelectedCitation(ref.id)}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-600/25 text-sky-300 text-[10px] font-bold">
                      {ref.id}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300 font-medium group-hover:text-white transition-colors truncate">
                        {ref.source_name}
                      </p>
                      {full && (
                        <p className="text-[10px] text-gray-500 truncate">{full.title}</p>
                      )}
                    </div>
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="shrink-0 text-gray-600 hover:text-blue-400 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Export Modal */}
      {report && activeId && (
        <ExportModal
          open={showExportModal}
          onClose={() => setShowExportModal(false)}
          report={report}
          sessionId={activeId}
        />
      )}

      </div>{/* end main content column */}

      {/* ── Permanent right sources panel ── */}
      {sources.length > 0 && (
        <div className="w-64 shrink-0 sticky top-4 self-start">
          <div className="rounded-xl bg-gray-900 border border-white/10 shadow-xl shadow-black/30 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Data Sources</p>
              <div className="flex items-center gap-2 flex-wrap">
                {verifiedCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                    ✓ {verifiedCount} verified
                  </span>
                )}
                {estimatedCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                    ~ {estimatedCount} AI
                  </span>
                )}
              </div>
            </div>
            {/* Source list */}
            <div className="divide-y divide-white/5 max-h-[72vh] overflow-y-auto">
              {sources.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedCitation(selectedCitation === s.id ? null : s.id)}
                  className={[
                    "px-4 py-3 cursor-pointer transition-colors group",
                    selectedCitation === s.id
                      ? s.verified ? "bg-emerald-900/25 border-l-2 border-emerald-500" : "bg-amber-900/25 border-l-2 border-amber-500"
                      : "hover:bg-white/5 border-l-2 border-transparent",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-2">
                    <span className={[
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-0.5",
                      s.verified ? "bg-emerald-500/25 text-emerald-300" : "bg-amber-500/25 text-amber-300",
                    ].join(" ")}>
                      {s.id}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-200 group-hover:text-white transition-colors leading-snug">
                        {s.source_name}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-snug line-clamp-2">{s.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={[
                          "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full border",
                          s.verified
                            ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/10"
                            : "text-amber-300 border-amber-500/30 bg-amber-500/10",
                        ].join(" ")}>
                          {s.verified ? "Verified" : "AI Est."}
                        </span>
                        {s.url && (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-gray-600 hover:text-blue-400 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Expanded snippet when selected */}
                  {selectedCitation === s.id && s.snippet && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 pl-7"
                    >
                      <p className="text-[10px] text-gray-400 leading-relaxed">{s.snippet}</p>
                      <p className="text-[9px] text-gray-600 mt-1">{s.fetched_at}</p>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
            {/* Footer legend */}
            <div className="px-4 py-2 border-t border-white/10 bg-white/[0.02]">
              <p className="text-[9px] text-gray-600 leading-relaxed">
                <span className="text-emerald-400 font-semibold">Green</span> = live fetched · <span className="text-amber-400 font-semibold">Amber</span> = AI estimated
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
