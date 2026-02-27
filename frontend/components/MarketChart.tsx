"use client";
import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getSectorInsight } from "@/lib/api";

interface MarketChartProps {
  sector?: string;
}

export default function MarketChart({ sector = "fintech" }: MarketChartProps) {
  const [data, setData] = useState<{ date: string; value: number }[]>([]);
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSectorInsight(sector)
      .then((d: unknown) => {
        const res = d as { data: { date: string; value: number }[]; insight: string };
        setData(res.data || []);
        setInsight(res.insight || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sector]);

  if (loading) return <div className="h-32 flex items-center justify-center text-gray-400 text-sm">Loading market data...</div>;

  return (
    <div className="space-y-3">
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="date" stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 10 }} />
            <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", color: "#fff" }} />
            <Area type="monotone" dataKey="value" stroke="#6366f1" fill="#6366f130" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {insight && <p className="text-xs text-gray-400 italic">{insight}</p>}
    </div>
  );
}
