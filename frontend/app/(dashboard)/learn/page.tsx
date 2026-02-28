"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getGlossary, explainConcept } from "@/lib/api";
import { Loader2, BookOpen, Lightbulb } from "lucide-react";

interface GlossaryItem { term: string; short: string }
interface ExplainResult { concept: string; simple_explanation: string; sea_example: string; why_it_matters: string; common_mistake: string }

export default function LearnPage() {
  const [glossary, setGlossary] = useState<GlossaryItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<ExplainResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getGlossary().then(d => setGlossary((d as { glossary: GlossaryItem[] }).glossary || [])).catch(() => {});
  }, []);

  const explore = async (term: string) => {
    if (selected === term) { setSelected(null); setExplanation(null); return; }
    setSelected(term);
    setExplanation(null);
    setLoading(true);
    try {
      const res = await explainConcept(term);
      setExplanation(res as ExplainResult);
    } catch { setExplanation(null); }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-white">📚 Startup Academy</h1>
        <p className="text-gray-400 mt-1">Learn key startup concepts explained for SEA founders</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-4 w-4" />Glossary</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              {glossary.map(({ term, short }) => (
                <button key={term} onClick={() => explore(term)}
                  className={`w-full text-left p-2 rounded-lg text-sm transition-all ${selected === term ? "bg-indigo-600 text-white" : "hover:bg-white/10 text-gray-300"}`}>
                  <span className="font-medium">{term}</span>
                  <span className="block text-xs text-gray-500 mt-0.5 truncate">{short}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-yellow-400" />{selected || "Select a Term"}</CardTitle></CardHeader>
            <CardContent>
              {loading && (
                <div className="flex items-center justify-center h-32 text-gray-400">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading explanation...
                </div>
              )}
              <AnimatePresence>
                {explanation && !loading && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="rounded-xl bg-indigo-900/20 border border-indigo-500/30 p-4">
                      <p className="text-white text-sm leading-relaxed">{explanation.simple_explanation}</p>
                    </div>
                    {explanation.sea_example && (
                      <div>
                        <Badge variant="secondary" className="mb-2">🌏 SEA Example</Badge>
                        <p className="text-gray-300 text-sm">{explanation.sea_example}</p>
                      </div>
                    )}
                    {explanation.why_it_matters && (
                      <div>
                        <Badge variant="secondary" className="mb-2">💡 Why It Matters</Badge>
                        <p className="text-gray-300 text-sm">{explanation.why_it_matters}</p>
                      </div>
                    )}
                    {explanation.common_mistake && (
                      <div>
                        <Badge variant="destructive" className="mb-2">⚠️ Common Mistake</Badge>
                        <p className="text-gray-300 text-sm">{explanation.common_mistake}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              {!explanation && !loading && !selected && (
                <div className="flex items-center justify-center h-32 text-gray-600">
                  <p className="text-sm">← Click a term to explore its meaning</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
