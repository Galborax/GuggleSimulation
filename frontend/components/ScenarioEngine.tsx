"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { runFounderScenario } from "@/lib/api";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { FounderScenarioResult, FounderScenarioType } from "@/lib/types";

const FOUNDER_SCENARIOS: { id: FounderScenarioType; icon: string; title: string; tagline: string }[] = [
  { id: "supply_chain_shock", icon: "📦", title: "The Supply Chain Shock",       tagline: "Core input cost jumps 20%. Tests if your pricing model survives or collapses." },
  { id: "price_war",          icon: "⚔️",  title: "The Goliath Enters",           tagline: "A funded rival undercuts your prices by 30%. Tests your customer moat." },
  { id: "viral_spike",        icon: "🚀", title: "The TikTok Viral Moment",      tagline: "Demand 4x's overnight. Too much growth kills businesses through bad reviews & burnout." },
  { id: "key_player_churn",   icon: "🧑‍💼", title: "The Key Player Churn",     tagline: "Your best person quits suddenly. Does your business survive without them?" },
  { id: "policy_shift",       icon: "📜", title: "The Policy Shift",             tagline: "A min wage hike or fuel subsidy cut raises your costs 20%. Is your model future-proof?" },
  { id: "talent_drought",     icon: "🏜️", title: "The Talent Drought",          tagline: "Can't hire. Existing team burns out, quality drops, costs balloon. Tests your people resilience." },
  { id: "co_founder_split",   icon: "💔", title: "The Co-Founder Split",         tagline: "Co-founder exits in a dispute, legal costs mount, team loses morale. Can you survive it?" },
  { id: "platform_algorithm", icon: "📉", title: "The Algorithm Kills Your Reach", tagline: "Organic reach collapses 80%. CAC triples. Tests if you own your audience—or just rent it." },
  { id: "currency_crisis",    icon: "💱", title: "The Currency Crisis",           tagline: "Local currency drops 25% vs USD. Imported inputs spike. Tests your FX exposure." },
  { id: "recession_hit",      icon: "🌧️", title: "The Recession Hits",          tagline: "Consumer spending drops 25%, B2B budgets freeze. Is your product a vitamin or a painkiller?" },
];

interface ScenarioEngineProps {
  initialRevenue?: number;
  initialBurn?: number;
  initialCash?: number;
  sessionId?: string;
}

export default function ScenarioEngine({ initialRevenue = 0, initialBurn = 5000, initialCash = 50000, sessionId }: ScenarioEngineProps) {
  const [revenue, setRevenue] = useState(initialRevenue);
  const [burn, setBurn] = useState(initialBurn);
  const [cash, setCash] = useState(initialCash);
  const [loading, setLoading] = useState<string | null>(null);

  // Founder Scenario state
  const [selectedScenario, setSelectedScenario] = useState<FounderScenarioType | null>(null);
  const [founderResult, setFounderResult] = useState<FounderScenarioResult | null>(null);
  const [appliedFixes, setAppliedFixes] = useState<Set<number>>(new Set());
  const [recoveredMode, setRecoveredMode] = useState(false);

  const handleFounderScenario = async () => {
    if (!selectedScenario) return;
    setLoading("scenarios");
    setFounderResult(null);
    setAppliedFixes(new Set());
    setRecoveredMode(false);
    try {
      const res = await runFounderScenario({
        monthly_revenue: revenue,
        monthly_burn: burn,
        cash_reserve: cash,
        scenario_type: selectedScenario,
      });
      setFounderResult(res);
    } catch { toast.error("Failed to run founder scenario"); }
    setLoading(null);
  };

  return (
    <div className="space-y-5">
      {/* Financial inputs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Monthly Revenue ($)", value: revenue, setter: setRevenue },
          { label: "Monthly Burn ($)", value: burn, setter: setBurn },
          { label: "Cash Reserve ($)", value: cash, setter: setCash },
        ].map(({ label, value, setter }) => (
          <div key={label}>
            <label className="text-xs text-gray-400">{label}</label>
            <input
              type="number"
              value={value}
              onChange={e => setter(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        ))}
      </div>

      {/* Scenario picker */}
      <div>
        <p className="text-xs text-gray-400 leading-relaxed mb-3">
          Choose the crisis that keeps you awake. The simulator calculates the exact financial damage
          and hands you a step-by-step survival playbook.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {FOUNDER_SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSelectedScenario(s.id);
                setFounderResult(null);
                setAppliedFixes(new Set());
                setRecoveredMode(false);
              }}
              className={`rounded-xl border p-4 text-left transition-all hover:bg-white/5 ${
                selectedScenario === s.id
                  ? "border-amber-500/60 bg-amber-500/10 ring-1 ring-amber-500/30"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-sm font-semibold text-white leading-tight">{s.title}</div>
              <div className="text-xs text-gray-400 mt-1 leading-relaxed">{s.tagline}</div>
            </button>
          ))}
        </div>
      </div>

      {selectedScenario && (
        <Button
          onClick={handleFounderScenario}
          disabled={loading === "scenarios"}
          className="w-full"
        >
          {loading === "scenarios"
            ? "Simulating crisis..."
            : `Simulate: ${FOUNDER_SCENARIOS.find((s) => s.id === selectedScenario)?.title} →`}
        </Button>
      )}

      {/* Result panel */}
      {founderResult && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border-2 p-4 space-y-4 transition-colors ${
            recoveredMode
              ? "border-green-500/60 bg-green-950/30"
              : founderResult.severity === "critical"
              ? "border-red-500/60 bg-red-950/30"
              : founderResult.severity === "warning"
              ? "border-amber-500/60 bg-amber-950/30"
              : "border-yellow-500/40 bg-yellow-900/20"
          }`}
        >
          {/* Header */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white">{founderResult.scenario_title}</h3>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                recoveredMode ? "bg-green-700 text-green-100" :
                founderResult.severity === "critical" ? "bg-red-700 text-red-100" :
                "bg-amber-700 text-amber-100"
              }`}>
                {recoveredMode ? "Recovered" : founderResult.severity}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">{founderResult.use_case}</p>
          </div>

          {/* Runway cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs text-gray-400">Runway Before</p>
              <p className="text-2xl font-bold text-green-400">
                {founderResult.baseline_runway === 999 ? "∞" : founderResult.baseline_runway.toFixed(1)}
                <span className="text-sm font-normal text-gray-400 ml-1">mo</span>
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs text-gray-400">Runway After Crisis</p>
              <p className={`text-2xl font-bold ${
                recoveredMode ? "text-green-400" :
                founderResult.severity === "critical" ? "text-red-400" : "text-amber-400"
              }`}>
                {founderResult.stressed_runway === 999 ? "∞" : founderResult.stressed_runway.toFixed(1)}
                <span className="text-sm font-normal text-gray-400 ml-1">
                  mo ({founderResult.runway_delta > 0 ? "+" : ""}{founderResult.runway_delta.toFixed(1)})
                </span>
              </p>
            </div>
          </div>

          {/* Cash flow chart */}
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recoveredMode ? founderResult.baseline_timeline : founderResult.stressed_timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="month" stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 11 }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "#1f2937", border: "1px solid #374151", color: "#fff" }}
                  formatter={(v: unknown) => [`$${Number(v).toLocaleString()}`, ""]}
                />
                <Area
                  type="monotone"
                  dataKey="cash"
                  stroke={recoveredMode ? "#22c55e" : founderResult.severity === "critical" ? "#ef4444" : "#f59e0b"}
                  fill={recoveredMode ? "#22c55e30" : founderResult.severity === "critical" ? "#ef444430" : "#f59e0b30"}
                  name="Cash"
                  isAnimationActive
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Survival Playbook */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider">⚡ Survival Playbook</p>
              {appliedFixes.size === founderResult.action_plan.length && !recoveredMode && (
                <button
                  onClick={() => setRecoveredMode(true)}
                  className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded-full font-semibold transition-colors"
                >
                  Apply All Fixes → Recover
                </button>
              )}
            </div>

            {founderResult.action_plan.map((tactic, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.12 }}
                className={`rounded-lg border p-3 text-sm transition-colors ${
                  appliedFixes.has(i) ? "border-green-500/40 bg-green-900/20" : "border-white/10 bg-white/5"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <span className="font-semibold text-white">{tactic.label}:</span>{" "}
                    <span className="text-gray-300">{tactic.advice}</span>
                  </div>
                  <button
                    onClick={() =>
                      setAppliedFixes((prev) => {
                        const next = new Set(prev);
                        next.has(i) ? next.delete(i) : next.add(i);
                        return next;
                      })
                    }
                    className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                      appliedFixes.has(i) ? "bg-green-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    {appliedFixes.has(i) ? "✓ Done" : "Mark Done"}
                  </button>
                </div>
              </motion.div>
            ))}

            {recoveredMode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-green-500/40 bg-green-900/20 p-4 text-center"
              >
                <div className="text-2xl mb-1">📈</div>
                <p className="text-sm font-bold text-green-300">Recovery Mode Active</p>
                <p className="text-xs text-gray-400 mt-1">
                  Cash flow is recovering. Execute these fixes to protect your runway.
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
