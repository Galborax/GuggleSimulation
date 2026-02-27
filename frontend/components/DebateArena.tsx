"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { startDebate, nextDebateRound, runJudge } from "@/lib/api";
import { toast } from "sonner";
import MarkdownMessage from "@/components/MarkdownMessage";
import type { DebateRound, JudgeSummary } from "@/lib/types";
import { Gavel, ChevronRight, AlertTriangle, TrendingUp, Pause, MessageSquare } from "lucide-react";
import { useProfileStore } from "@/lib/store";
import DebriefDrawer from "@/components/DebriefDrawer";

export default function DebateArena() {
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const [debateId, setDebateId] = useState<number | null>(null);
  const [rounds, setRounds] = useState<DebateRound[]>([]);
  const [judgeResult, setJudgeResult] = useState<JudgeSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle");

  // Debrief drawer state
  const [debriefOpen, setDebriefOpen] = useState(false);
  const [debriefClaim, setDebriefClaim] = useState("");
  const [debriefAgentName, setDebriefAgentName] = useState("");
  const [debriefAgentRole, setDebriefAgentRole] = useState("");

  const { activeSessionId } = useProfileStore();

  const handleStart = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = (await startDebate({
        topic, business_context: context, session_id: activeSessionId
      })) as { debate_id: number; rounds: DebateRound[]; status: string };
      setDebateId(res.debate_id);
      setRounds(res.rounds);
      setStatus(res.status);
    } catch {
      toast.error("Failed to start debate");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (!debateId) return;
    setLoading(true);
    try {
      const res = (await nextDebateRound({ debate_id: debateId })) as {
        new_round: DebateRound;
        status: string;
      };
      setRounds((prev) => [...prev, res.new_round]);
      setStatus(res.status);
    } catch {
      toast.error("Failed to get next round");
    } finally {
      setLoading(false);
    }
  };

  const handleJudge = async () => {
    if (!debateId) return;
    setLoading(true);
    try {
      const res = (await runJudge({ debate_id: debateId })) as {
        judge_summary: JudgeSummary;
      };
      setJudgeResult(res.judge_summary);
      setStatus("concluded");
    } catch {
      toast.error("Failed to get judge verdict");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Find the agent from rounds who best matches a given role.
   * Falls back to the backend AGENTS defaults if no round is found.
   */
  const agentFor = (role: string): { name: string; role: string } => {
    const round = rounds.find((r) => r.role === role);
    if (round) return { name: round.agent, role: round.role };
    // Fallback to backend AGENTS list
    const DEFAULTS: Record<string, { name: string; role: string }> = {
      "Visionary Investor": { name: "Marcus Tan", role: "Visionary Investor" },
      "Skeptic Analyst": { name: "Diana Lim", role: "Skeptic Analyst" },
      "Market Expert": { name: "Ryan Chen", role: "Market Expert" },
    };
    return DEFAULTS[role] ?? { name: "Advisory Agent", role };
  };

  const openDebrief = (text: string, forRole: string) => {
    const agent = agentFor(forRole);
    setDebriefClaim(text);
    setDebriefAgentName(agent.name);
    setDebriefAgentRole(agent.role);
    setDebriefOpen(true);
  };

  const verdictIcon = (v: string) => v === "proceed" ? <TrendingUp className="h-5 w-5 text-green-400" /> : v === "pause" ? <Pause className="h-5 w-5 text-yellow-400" /> : <AlertTriangle className="h-5 w-5 text-red-400" />;
  const verdictColor = (v: string) => v === "proceed" ? "border-green-500/30 bg-green-900/20" : v === "pause" ? "border-yellow-500/30 bg-yellow-900/20" : "border-red-500/30 bg-red-900/20";

  const ROLE_COLORS: Record<string, string> = {
    "Visionary Investor": "bg-indigo-600/20 border-indigo-500/30 text-indigo-300",
    "Skeptic Analyst": "bg-red-600/20 border-red-500/30 text-red-300",
    "Market Expert": "bg-emerald-600/20 border-emerald-500/30 text-emerald-300",
  };

  return (
    <div className="space-y-6">
      {status === "idle" && (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 font-medium">Topic for your Advisory Panel</label>
            <Input className="mt-1" placeholder="e.g. Should we expand to Indonesia in Year 1?"
              value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-300 font-medium">Business Context (optional)</label>
            <Input className="mt-1" placeholder="e.g. B2B fintech for SMEs in SG, $50k/month burn"
              value={context} onChange={(e) => setContext(e.target.value)} />
          </div>
          <Button onClick={handleStart} disabled={!topic.trim() || loading} className="w-full">
            {loading ? "Consulting panel..." : "Submit to Advisory Panel →"}
          </Button>
        </div>
      )}

      {rounds.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence>
            {rounds.map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className={`rounded-xl border p-4 ${ROLE_COLORS[r.role] || "bg-white/5 border-white/10 text-gray-300"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{r.emoji}</span>
                  <span className="font-semibold text-white text-sm">{r.agent}</span>
                  <Badge variant="secondary" className="text-xs">{r.role}</Badge>
                  <Badge variant="outline" className="text-xs ml-auto">Round {r.round}</Badge>
                </div>
                <MarkdownMessage content={r.content} className="text-sm text-gray-200" />
              </motion.div>
            ))}
          </AnimatePresence>

          {!judgeResult && (
            <div className="flex gap-3">
              {status !== "concluded" && status !== "ready_for_judge" && (
                <Button onClick={handleNext} disabled={loading} variant="outline" className="flex-1">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  {loading ? "..." : "Next Agent"}
                </Button>
              )}
              {(status === "ready_for_judge" || rounds.length >= 3) && !judgeResult && (
                <Button onClick={handleJudge} disabled={loading} className="flex-1">
                  <Gavel className="h-4 w-4 mr-2" />
                  {loading ? "Getting verdict..." : "Get Final Verdict ⚖️"}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {judgeResult && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border p-6 ${verdictColor(judgeResult.verdict)}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">⚖️</span>
            <div>
              <h3 className="text-lg font-bold text-white">Judge Victoria Wong</h3>
              <p className="text-xs text-gray-400">Final Verdict</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {verdictIcon(judgeResult.verdict)}
              <span className={`font-bold text-lg uppercase ${judgeResult.verdict === "proceed" ? "text-green-400" : judgeResult.verdict === "pause" ? "text-yellow-400" : "text-red-400"}`}>
                {judgeResult.verdict}
              </span>
            </div>
          </div>
          <p className="text-gray-200 text-sm mb-4">{judgeResult.reasoning}</p>

          <div className="grid grid-cols-2 gap-4">
            {/* ── Opportunities (clickable → Visionary Investor debrief) ── */}
            <div>
              <p className="text-xs text-green-400 font-semibold mb-2">
                Opportunities
                <span className="text-gray-500 font-normal ml-1">(click to drill in)</span>
              </p>
              <div className="space-y-1">
                {judgeResult.key_opportunities?.map((o, i) => (
                  <button
                    key={i}
                    onClick={() => openDebrief(o, "Visionary Investor")}
                    className="w-full text-left text-xs text-gray-300 hover:text-white bg-white/0 hover:bg-green-900/30 border border-transparent hover:border-green-500/30 rounded-lg px-2 py-1.5 transition-all flex items-start gap-1.5 group"
                  >
                    <span className="shrink-0 mt-0.5">•</span>
                    <span className="flex-1">{o}</span>
                    <MessageSquare className="h-3 w-3 text-green-500/0 group-hover:text-green-400/70 shrink-0 mt-0.5 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* ── Risks (clickable → Skeptic Analyst debrief) ── */}
            <div>
              <p className="text-xs text-red-400 font-semibold mb-2">
                Risks
                <span className="text-gray-500 font-normal ml-1">(click to drill in)</span>
              </p>
              <div className="space-y-1">
                {judgeResult.key_risks?.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => openDebrief(r, "Skeptic Analyst")}
                    className="w-full text-left text-xs text-gray-300 hover:text-white bg-white/0 hover:bg-red-900/30 border border-transparent hover:border-red-500/30 rounded-lg px-2 py-1.5 transition-all flex items-start gap-1.5 group"
                  >
                    <span className="shrink-0 mt-0.5">•</span>
                    <span className="flex-1">{r}</span>
                    <MessageSquare className="h-3 w-3 text-red-500/0 group-hover:text-red-400/70 shrink-0 mt-0.5 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-white/5 rounded-lg">
            <p className="text-xs text-gray-400 font-semibold">Recommendation</p>
            <p className="text-sm text-white mt-1">{judgeResult.recommendation}</p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-400">Confidence:</span>
            <div className="flex-1 h-1.5 bg-white/10 rounded-full">
              <div className="h-1.5 bg-indigo-500 rounded-full" style={{ width: `${judgeResult.confidence_score}%` }} />
            </div>
            <span className="text-xs text-white font-semibold">{judgeResult.confidence_score}%</span>
          </div>
        </motion.div>
      )}

      {/* ── Post-Debate Debrief Drawer ── */}
      {debateId !== null && (
        <DebriefDrawer
          open={debriefOpen}
          onClose={() => setDebriefOpen(false)}
          debateId={debateId}
          claim={debriefClaim}
          agentName={debriefAgentName}
          agentRole={debriefAgentRole}
        />
      )}
    </div>
  );
}

