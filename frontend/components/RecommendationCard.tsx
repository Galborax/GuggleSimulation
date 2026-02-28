"use client";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Analysis } from "@/lib/types";
import { TrendingUp, AlertTriangle, CheckCircle, Globe } from "lucide-react";

interface RecommendationCardProps {
  analysis: Analysis;
}

export default function RecommendationCard({ analysis }: RecommendationCardProps) {
  const scoreColor = analysis.viability_score >= 70 ? "text-green-400" : analysis.viability_score >= 50 ? "text-yellow-400" : "text-red-400";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className={`text-4xl font-bold ${scoreColor}`}>{analysis.viability_score}</div>
          <div className="text-xs text-gray-400">Viability Score</div>
        </div>
        <div className="flex-1">
          <Progress value={analysis.viability_score} className="h-3" />
          <p className="text-sm text-gray-300 mt-2">{analysis.summary}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <CheckCircle className="h-4 w-4 text-green-400" />, label: "Strengths", items: analysis.strengths, color: "text-green-300" },
          { icon: <AlertTriangle className="h-4 w-4 text-red-400" />, label: "Weaknesses", items: analysis.weaknesses, color: "text-red-300" },
          { icon: <TrendingUp className="h-4 w-4 text-blue-400" />, label: "Opportunities", items: analysis.opportunities, color: "text-blue-300" },
          { icon: <AlertTriangle className="h-4 w-4 text-yellow-400" />, label: "Threats", items: analysis.threats, color: "text-yellow-300" },
        ].map(({ icon, label, items, color }) => (
          <div key={label} className="rounded-xl bg-white/5 border border-white/10 p-3">
            <div className="flex items-center gap-1.5 mb-2">{icon}<span className="text-xs font-semibold text-white">{label}</span></div>
            {(items || []).slice(0, 3).map((item, i) => (
              <p key={i} className={`text-xs ${color}`}>• {item}</p>
            ))}
          </div>
        ))}
      </div>

      {analysis.asean_expansion_tips && (
        <div className="rounded-xl bg-indigo-900/20 border border-indigo-500/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-semibold text-white">ASEAN Expansion Tips</span>
          </div>
          {analysis.asean_expansion_tips.map((tip, i) => (
            <p key={i} className="text-xs text-indigo-200">• {tip}</p>
          ))}
        </div>
      )}

      {analysis.next_steps && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <h4 className="text-sm font-semibold text-white mb-2">Next Steps</h4>
          {analysis.next_steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-gray-300 mb-1">
              <span className="text-indigo-400 font-bold">{i + 1}.</span>{step}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
