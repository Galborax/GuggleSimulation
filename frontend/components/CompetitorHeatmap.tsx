"use client";
import { useState, useEffect } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getCompetitors } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

interface Competitor {
  name: string;
  score: number;
  market_share: number;
  growth: number;
  country: string;
}

interface CompetitorHeatmapProps {
  sector?: string;
}

const COUNTRY_COLORS: Record<string, string> = {
  SG: "#6366f1", ID: "#10b981", MY: "#f59e0b", TH: "#ef4444", VN: "#8b5cf6", PH: "#ec4899",
};

export default function CompetitorHeatmap({ sector = "fintech" }: CompetitorHeatmapProps) {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCompetitors(sector)
      .then((d: unknown) => setCompetitors((d as { competitors: Competitor[] }).competitors || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sector]);

  if (loading) return <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Loading competitor data...</div>;

  const data = competitors.map(c => ({ ...c, x: c.market_share * 100, y: c.growth * 100, z: c.score }));

  return (
    <div className="space-y-3">
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="x" type="number" name="Market Share %" stroke="#9ca3af"
              tick={{ fill: "#9ca3af", fontSize: 10 }} label={{ value: "Market Share %", position: "insideBottom", offset: -15, fill: "#9ca3af", fontSize: 11 }} />
            <YAxis dataKey="y" type="number" name="Growth %" stroke="#9ca3af"
              tick={{ fill: "#9ca3af", fontSize: 10 }} label={{ value: "Growth %", angle: -90, position: "insideLeft", fill: "#9ca3af", fontSize: 11 }} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{ background: "#1f2937", border: "1px solid #374151", color: "#fff", fontSize: 12 }}
              formatter={(value: number | string, name: string | number) => [
                `${Number(value).toFixed(1)}%`,
                name,
              ]}
            />
            <Scatter data={data} name="Competitors">
              {data.map((entry, i) => (
                <Cell key={i} fill={COUNTRY_COLORS[entry.country] || "#6366f1"} fillOpacity={0.8} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-1.5">
        {competitors.map((c, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: COUNTRY_COLORS[c.country] || "#6366f1" }} />
              <span className="text-white font-medium">{c.name}</span>
              <Badge variant="outline" className="text-xs py-0">{c.country}</Badge>
            </div>
            <div className="flex gap-3 text-gray-400">
              <span>{(c.market_share * 100).toFixed(0)}% share</span>
              <span className="text-green-400">+{(c.growth * 100).toFixed(0)}% growth</span>
              <span className="text-indigo-300">Score: {c.score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
