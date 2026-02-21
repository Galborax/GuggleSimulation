"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Zap, TrendingDown, AlertTriangle, Building2, Banknote, RefreshCw,
  ArrowUp, ArrowDown, Minus, DollarSign, BarChart3,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface BusinessMetrics {
  revenue: number;
  costs: number;
  burnRate: number;
  runwayMonths: number;
  cashBalance: number;
}

const chaosEvents = [
  {
    id: "market-crash",
    name: "Market Crash",
    icon: TrendingDown,
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
    impact: { revenue: -35, costs: 5, runwayMonths: -6 },
    description: "A sudden market downturn reduces customer spending by 35% and increases operational costs.",
  },
  {
    id: "supply-chain",
    name: "Supply Chain Disruption",
    icon: AlertTriangle,
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800",
    impact: { revenue: -15, costs: 25, runwayMonths: -4 },
    description: "Global supply chain issues increase COGS by 25% and create delivery delays affecting revenue.",
  },
  {
    id: "competitor",
    name: "Competitor Entry",
    icon: Building2,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800",
    impact: { revenue: -20, costs: 15, runwayMonths: -3 },
    description: "A well-funded competitor enters the market, forcing price competition and increased marketing spend.",
  },
  {
    id: "regulatory",
    name: "Regulatory Change",
    icon: Banknote,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
    impact: { revenue: -10, costs: 30, runwayMonths: -5 },
    description: "New regulations require compliance investments, increasing costs and pausing some revenue streams.",
  },
  {
    id: "recession",
    name: "Economic Recession",
    icon: BarChart3,
    color: "text-gray-500",
    bgColor: "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700",
    impact: { revenue: -40, costs: 10, runwayMonths: -8 },
    description: "Broad economic recession severely impacts B2B and consumer spending across the market.",
  },
];

function generateProjectionData(metrics: BusinessMetrics, growth: number, cac: number, churn: number) {
  const data = [];
  let currentRevenue = metrics.revenue;
  let currentCosts = metrics.costs;

  for (let month = 1; month <= 12; month++) {
    currentRevenue = currentRevenue * (1 + (growth - churn / 2) / 100);
    currentCosts = currentCosts * (1 + cac / 500);
    const profit = currentRevenue - currentCosts;
    data.push({
      month: `M${month}`,
      revenue: Math.round(currentRevenue),
      costs: Math.round(currentCosts),
      profit: Math.round(profit),
    });
  }
  return data;
}

export default function ScenariosPage() {
  const [baseMetrics] = useState<BusinessMetrics>({
    revenue: 85000,
    costs: 120000,
    burnRate: 35000,
    runwayMonths: 14,
    cashBalance: 490000,
  });

  const [marketGrowth, setMarketGrowth] = useState(8);
  const [cac, setCac] = useState(250);
  const [churnRate, setChurnRate] = useState(5);
  const [activeEvent, setActiveEvent] = useState<(typeof chaosEvents)[0] | null>(null);

  const adjustedRevenue = baseMetrics.revenue * (1 + (marketGrowth - churnRate / 2) / 100);
  const adjustedCosts = baseMetrics.costs * (1 + cac / 5000);
  const adjustedBurnRate = adjustedCosts - adjustedRevenue;
  const adjustedRunway = Math.max(0, Math.floor(baseMetrics.cashBalance / Math.max(adjustedBurnRate, 1)));

  const eventRevenue = activeEvent ? adjustedRevenue * (1 + activeEvent.impact.revenue / 100) : adjustedRevenue;
  const eventCosts = activeEvent ? adjustedCosts * (1 + activeEvent.impact.costs / 100) : adjustedCosts;
  const eventBurn = eventCosts - eventRevenue;
  const eventRunway = activeEvent
    ? Math.max(0, Math.floor(baseMetrics.cashBalance / Math.max(eventBurn, 1)))
    : adjustedRunway;

  const triggerRandomChaos = () => {
    const random = chaosEvents[Math.floor(Math.random() * chaosEvents.length)];
    setActiveEvent(random);
  };

  const projectionData = generateProjectionData(baseMetrics, marketGrowth, cac, churnRate);
  const eventProjectionData = activeEvent
    ? generateProjectionData(
        { ...baseMetrics, revenue: baseMetrics.revenue * (1 + activeEvent.impact.revenue / 100), costs: baseMetrics.costs * (1 + activeEvent.impact.costs / 100) },
        marketGrowth * 0.6,
        cac * 1.3,
        churnRate * 1.5
      )
    : null;

  const MetricDiff = ({ base, adjusted, prefix = "$" }: { base: number; adjusted: number; prefix?: string }) => {
    const diff = adjusted - base;
    const pct = Math.abs(Math.round((diff / base) * 100));
    if (Math.abs(diff) < 10) return <span className="text-muted-foreground text-xs">No change</span>;
    return (
      <span className={`flex items-center gap-0.5 text-xs font-medium ${diff > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
        {diff > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
        {pct}%
      </span>
    );
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-amber-500/10 mb-4">
            <Zap className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">What-If Scenario Engine</h1>
          <p className="text-muted-foreground">
            Adjust key business variables and simulate chaos events to stress-test your model
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="space-y-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Adjust Variables</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Market Growth Rate</Label>
                    <span className="text-sm font-semibold text-primary">{marketGrowth}%</span>
                  </div>
                  <Slider
                    min={-20} max={50} step={1}
                    value={[marketGrowth]}
                    onValueChange={([v]) => setMarketGrowth(v)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>-20% (contraction)</span>
                    <span>+50% (boom)</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Customer Acquisition Cost</Label>
                    <span className="text-sm font-semibold text-primary">${cac}</span>
                  </div>
                  <Slider
                    min={50} max={1000} step={10}
                    value={[cac]}
                    onValueChange={([v]) => setCac(v)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$50 (efficient)</span>
                    <span>$1,000 (expensive)</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Monthly Churn Rate</Label>
                    <span className="text-sm font-semibold text-primary">{churnRate}%</span>
                  </div>
                  <Slider
                    min={0} max={30} step={0.5}
                    value={[churnRate]}
                    onValueChange={([v]) => setChurnRate(v)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0% (no churn)</span>
                    <span>30% (high churn)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chaos Events */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Chaos Events</CardTitle>
                <CardDescription className="text-xs">Trigger a market disruption to see the impact</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={triggerRandomChaos}
                  variant="destructive"
                  className="w-full gap-2"
                  size="sm"
                >
                  <Zap className="h-4 w-4" /> Random Chaos Event!
                </Button>
                <div className="space-y-1.5 mt-2">
                  {chaosEvents.map((event) => {
                    const Icon = event.icon;
                    return (
                      <button
                        key={event.id}
                        onClick={() => setActiveEvent(activeEvent?.id === event.id ? null : event)}
                        className={`w-full flex items-center gap-2 p-2.5 rounded-lg border text-left text-sm transition-all ${
                          activeEvent?.id === event.id ? event.bgColor : "hover:bg-muted"
                        }`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${event.color}`} />
                        <span className="font-medium">{event.name}</span>
                      </button>
                    );
                  })}
                </div>
                {activeEvent && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1 mt-2"
                    onClick={() => setActiveEvent(null)}
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Clear Event
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Active chaos event alert */}
            {activeEvent && (
              <Card className={`border-2 animate-in fade-in slide-in-from-top-2 duration-300 ${activeEvent.bgColor}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <activeEvent.icon className={`h-5 w-5 shrink-0 mt-0.5 ${activeEvent.color}`} />
                    <div>
                      <div className={`font-semibold ${activeEvent.color}`}>{activeEvent.name} TRIGGERED</div>
                      <p className="text-sm text-muted-foreground mt-0.5">{activeEvent.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Metrics comparison */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Monthly Revenue",
                  base: baseMetrics.revenue,
                  adjusted: activeEvent ? Math.round(eventRevenue) : Math.round(adjustedRevenue),
                  icon: DollarSign,
                  format: (v: number) => `$${(v / 1000).toFixed(0)}K`,
                },
                {
                  label: "Monthly Costs",
                  base: baseMetrics.costs,
                  adjusted: activeEvent ? Math.round(eventCosts) : Math.round(adjustedCosts),
                  icon: BarChart3,
                  format: (v: number) => `$${(v / 1000).toFixed(0)}K`,
                },
                {
                  label: "Burn Rate",
                  base: baseMetrics.burnRate,
                  adjusted: activeEvent ? Math.round(eventBurn) : Math.round(adjustedBurnRate),
                  icon: TrendingDown,
                  format: (v: number) => `$${(v / 1000).toFixed(0)}K`,
                },
                {
                  label: "Runway",
                  base: baseMetrics.runwayMonths,
                  adjusted: activeEvent ? eventRunway : adjustedRunway,
                  icon: Minus,
                  format: (v: number) => `${v}mo`,
                },
              ].map(({ label, base, adjusted, icon: Icon, format }) => (
                <Card key={label} className="border">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="text-xl font-bold">{format(adjusted)}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-muted-foreground">Was {format(base)}</span>
                      <MetricDiff base={base} adjusted={adjusted} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Projection Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">12-Month Revenue Projection</CardTitle>
                <CardDescription className="text-xs">
                  {activeEvent ? `Impact of ${activeEvent.name} vs. baseline scenario` : "Based on current variable settings"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={projectionData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                    <Tooltip
                      formatter={(v) => [`$${Number(v).toLocaleString()}`, ""]}
                      contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: "8px" }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" stroke="#7c3aed" fill="url(#colorRevenue)" strokeWidth={2} name="Revenue" />
                    <Area type="monotone" dataKey="costs" stroke="#ef4444" fill="url(#colorCosts)" strokeWidth={2} name="Costs" />
                  </AreaChart>
                </ResponsiveContainer>

                {activeEvent && eventProjectionData && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Post-{activeEvent.name} Projection</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={eventProjectionData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                        <Tooltip
                          formatter={(v) => [`$${Number(v).toLocaleString()}`, ""]}
                          contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: "8px" }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fill="#fed7aa40" name="Revenue (post-event)" />
                        <Area type="monotone" dataKey="costs" stroke="#dc2626" strokeWidth={2} fill="#fecaca40" name="Costs (post-event)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Before/After comparison */}
            {activeEvent && (
              <Card className="animate-in fade-in duration-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Before vs. After: {activeEvent.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Before Event</div>
                      {[
                        { label: "Revenue", value: `$${adjustedRevenue.toFixed(0)}`, neutral: true },
                        { label: "Costs", value: `$${adjustedCosts.toFixed(0)}`, neutral: true },
                        { label: "Runway", value: `${adjustedRunway} months`, neutral: true },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">After Event</div>
                      {[
                        { label: "Revenue", value: `$${eventRevenue.toFixed(0)}`, negative: eventRevenue < adjustedRevenue },
                        { label: "Costs", value: `$${eventCosts.toFixed(0)}`, negative: eventCosts > adjustedCosts },
                        { label: "Runway", value: `${eventRunway} months`, negative: eventRunway < adjustedRunway },
                      ].map(({ label, value, negative }) => (
                        <div key={label} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{label}</span>
                          <span className={`font-medium ${negative ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
