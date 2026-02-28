"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, TrendingUp, Users, DollarSign } from "lucide-react";
import type { Idea } from "@/lib/types";

interface IdeaTrioCardsProps {
  ideas: Idea[];
  onSelect: (index: number) => void;
  loading?: boolean;
}

const COLORS = ["from-indigo-600/20 to-purple-600/20", "from-emerald-600/20 to-teal-600/20", "from-orange-600/20 to-rose-600/20"];
const BORDERS = ["border-indigo-500/30", "border-emerald-500/30", "border-orange-500/30"];

export default function IdeaTrioCards({ ideas, onSelect, loading }: IdeaTrioCardsProps) {
  if (ideas.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {ideas.map((idea, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.15 }}
          className={`rounded-2xl border bg-gradient-to-br ${COLORS[i]} ${BORDERS[i]} p-5 flex flex-col justify-between`}>
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold text-white">{idea.name}</h3>
              <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-0.5">
                <TrendingUp className="h-3 w-3 text-green-400" />
                <span className="text-xs text-green-400 font-semibold">{idea.viability_score}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-300 italic">{idea.tagline}</p>
            <div className="space-y-2 text-xs">
              <div className="flex gap-2"><Users className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" /><span className="text-gray-300">{idea.target_customer}</span></div>
              <div className="flex gap-2"><DollarSign className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" /><span className="text-gray-300">{idea.revenue_model}</span></div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1 font-medium">Why SEA:</p>
              <p className="text-xs text-gray-300">{idea.why_sea}</p>
            </div>
            <div>
              <p className="text-xs text-green-400 mb-1 font-medium">Strengths:</p>
              {idea.pros?.map((p, pi) => (
                <div key={pi} className="flex items-center gap-1.5 text-xs text-gray-300">
                  <CheckCircle className="h-3 w-3 text-green-400 flex-shrink-0" />{p}
                </div>
              ))}
            </div>
            {idea.cons && idea.cons.length > 0 && (
              <div>
                <p className="text-xs text-red-400 mb-1 font-medium">Challenges:</p>
                {idea.cons.map((c, ci) => (
                  <p key={ci} className="text-xs text-gray-400">• {c}</p>
                ))}
              </div>
            )}
          </div>
          <Button onClick={() => onSelect(i)} disabled={loading} className="mt-4 w-full" variant="outline">
            Choose This Idea →
          </Button>
        </motion.div>
      ))}
    </div>
  );
}
