"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Map, Plus, Trash2, DollarSign, AlertTriangle, Users, Briefcase, Code, BarChart3,
} from "lucide-react";

interface HiringMilestone {
  id: string;
  month: number;
  role: string;
  department: string;
  salary: number;
  color: string;
}

const departmentColors: Record<string, string> = {
  Engineering: "bg-blue-500",
  Marketing: "bg-pink-500",
  Sales: "bg-emerald-500",
  Operations: "bg-amber-500",
  Product: "bg-purple-500",
  Finance: "bg-red-500",
  HR: "bg-indigo-500",
  Customer: "bg-teal-500",
};

const departmentIcons: Record<string, React.ElementType> = {
  Engineering: Code,
  Marketing: BarChart3,
  Sales: DollarSign,
  Operations: Briefcase,
  Product: Map,
  Finance: BarChart3,
  HR: Users,
  Customer: Users,
};

const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const defaultMilestones: HiringMilestone[] = [
  { id: "1", month: 1, role: "Senior Engineer", department: "Engineering", salary: 12000, color: "bg-blue-500" },
  { id: "2", month: 3, role: "Growth Marketer", department: "Marketing", salary: 8000, color: "bg-pink-500" },
  { id: "3", month: 5, role: "Sales Lead", department: "Sales", salary: 9000, color: "bg-emerald-500" },
  { id: "4", month: 7, role: "Product Manager", department: "Product", salary: 11000, color: "bg-purple-500" },
  { id: "5", month: 9, role: "Customer Success", department: "Customer", salary: 7000, color: "bg-teal-500" },
];

export default function RoadmapPage() {
  const [milestones, setMilestones] = useState<HiringMilestone[]>(defaultMilestones);
  const [cashBalance, setCashBalance] = useState(500000);
  const [baseMonthlyBurn, setBaseMonthlyBurn] = useState(45000);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [newRole, setNewRole] = useState("");
  const [newDepartment, setNewDepartment] = useState("Engineering");
  const [newSalary, setNewSalary] = useState(8000);

  const calculateBurnByMonth = () => {
    return months.map((month, idx) => {
      const monthNum = idx + 1;
      const hiresUpToMonth = milestones.filter((m) => m.month <= monthNum);
      const salaryBurn = hiresUpToMonth.reduce((sum, m) => sum + m.salary, 0);
      return {
        month,
        monthNum,
        totalBurn: baseMonthlyBurn + salaryBurn,
        salaryBurn,
      };
    });
  };

  const burnByMonth = calculateBurnByMonth();

  const calculateDateOfZeroCash = () => {
    let remaining = cashBalance;
    for (const { month, totalBurn } of burnByMonth) {
      remaining -= totalBurn;
      if (remaining <= 0) return month;
    }
    return "Beyond Dec";
  };

  const dateOfZero = calculateDateOfZeroCash();
  const totalSalaryBurn = milestones.reduce((sum, m) => sum + m.salary, 0);
  const finalBurnRate = baseMonthlyBurn + totalSalaryBurn;
  const runwayMonths = Math.floor(cashBalance / Math.max(finalBurnRate, 1));

  const addMilestone = () => {
    if (!newRole.trim()) return;
    const milestone: HiringMilestone = {
      id: Date.now().toString(),
      month: selectedMonth,
      role: newRole,
      department: newDepartment,
      salary: newSalary,
      color: departmentColors[newDepartment] || "bg-gray-500",
    };
    setMilestones([...milestones, milestone].sort((a, b) => a.month - b.month));
    setNewRole("");
    setShowAddForm(false);
  };

  const removeMilestone = (id: string) => {
    setMilestones(milestones.filter((m) => m.id !== id));
  };

  const isZeroCashMonth = (month: string) => month === dateOfZero;

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/10 mb-4">
            <Map className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Hiring Roadmap</h1>
          <p className="text-muted-foreground">Plan your 12-month team growth with live cash runway tracking</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-2">
            <CardContent className="pt-5 pb-4">
              <div className="text-xs text-muted-foreground mb-1">Cash Balance</div>
              <div className="text-2xl font-bold text-primary">${(cashBalance / 1000).toFixed(0)}K</div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="pt-5 pb-4">
              <div className="text-xs text-muted-foreground mb-1">Current Burn/mo</div>
              <div className="text-2xl font-bold text-amber-500">${(finalBurnRate / 1000).toFixed(1)}K</div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="pt-5 pb-4">
              <div className="text-xs text-muted-foreground mb-1">Runway</div>
              <div className={`text-2xl font-bold ${runwayMonths <= 6 ? "text-red-500" : runwayMonths <= 12 ? "text-amber-500" : "text-emerald-500"}`}>
                {runwayMonths}mo
              </div>
            </CardContent>
          </Card>
          <Card className={`border-2 ${dateOfZero === "Beyond Dec" ? "border-emerald-500/50" : "border-red-500/50"}`}>
            <CardContent className="pt-5 pb-4">
              <div className="text-xs text-muted-foreground mb-1">Date of Zero Cash</div>
              <div className={`text-2xl font-bold ${dateOfZero === "Beyond Dec" ? "text-emerald-500" : "text-red-500"}`}>
                {dateOfZero}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Financial Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cash Balance ($)</Label>
                <Input
                  type="number"
                  value={cashBalance}
                  onChange={(e) => setCashBalance(Number(e.target.value))}
                  min={0}
                  step={10000}
                />
              </div>
              <div className="space-y-2">
                <Label>Base Monthly Burn (ex-salaries) ($)</Label>
                <Input
                  type="number"
                  value={baseMonthlyBurn}
                  onChange={(e) => setBaseMonthlyBurn(Number(e.target.value))}
                  min={0}
                  step={1000}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">12-Month Hiring Timeline</CardTitle>
                <CardDescription className="text-xs mt-1">Click on a month to add a hire</CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} className="gap-1">
                <Plus className="h-4 w-4" /> Add Hire
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Add form */}
            {showAddForm && (
              <div className="mb-6 p-4 rounded-lg border bg-muted/50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="col-span-2 sm:col-span-1 space-y-1">
                    <Label className="text-xs">Month</Label>
                    <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((m, i) => (
                          <SelectItem key={m} value={String(i + 1)}>{i + 1} — {m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 sm:col-span-1 space-y-1">
                    <Label className="text-xs">Department</Label>
                    <Select value={newDepartment} onValueChange={setNewDepartment}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(departmentColors).map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Role Title</Label>
                    <Input
                      className="h-8 text-sm"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      placeholder="e.g., Senior Engineer"
                      onKeyDown={(e) => e.key === "Enter" && addMilestone()}
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1 space-y-1">
                    <Label className="text-xs">Monthly Salary ($)</Label>
                    <Input
                      type="number"
                      className="h-8 text-sm"
                      value={newSalary}
                      onChange={(e) => setNewSalary(Number(e.target.value))}
                      min={1000}
                      step={500}
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex items-end gap-2">
                    <Button size="sm" onClick={addMilestone} className="flex-1 h-8 gap-1">
                      <Plus className="h-3.5 w-3.5" /> Add
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)} className="h-8">
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Monthly grid */}
            <div className="overflow-x-auto">
              <div className="grid grid-cols-12 gap-1.5 min-w-[700px]">
                {months.map((month, idx) => {
                  const monthNum = idx + 1;
                  const monthHires = milestones.filter((m) => m.month === monthNum);
                  const { totalBurn } = burnByMonth[idx];
                  const isZero = isZeroCashMonth(month);

                  return (
                    <div
                      key={month}
                      className={`relative rounded-lg border p-2 min-h-[100px] cursor-pointer hover:border-primary/50 transition-colors ${
                        isZero ? "border-red-500 bg-red-50 dark:bg-red-950/50" : "border-border"
                      }`}
                      onClick={() => {
                        setSelectedMonth(monthNum);
                        setShowAddForm(true);
                      }}
                    >
                      <div className={`text-xs font-semibold mb-1 ${isZero ? "text-red-500" : "text-muted-foreground"}`}>
                        {month}
                      </div>
                      {isZero && (
                        <div className="absolute top-1 right-1">
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                        </div>
                      )}
                      <div className="space-y-1">
                        {monthHires.map((hire) => {
                          const Icon = departmentIcons[hire.department] || Users;
                          return (
                            <div
                              key={hire.id}
                              className="group relative"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className={`text-white text-[9px] rounded px-1 py-0.5 ${hire.color} flex items-center gap-0.5 pr-4`}>
                                <Icon className="h-2 w-2 shrink-0" />
                                <span className="truncate">{hire.role}</span>
                              </div>
                              <button
                                onClick={() => removeMilestone(hire.id)}
                                className="absolute right-0 top-0 hidden group-hover:flex items-center justify-center h-full w-4 rounded-r bg-black/30 text-white"
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-auto pt-1 text-[9px] text-muted-foreground">
                        ${(totalBurn / 1000).toFixed(0)}K/mo
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Milestone List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-500" />
              Hiring Plan ({milestones.length} roles, ${(totalSalaryBurn / 1000).toFixed(1)}K/mo total salaries)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {milestones.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No hires planned yet. Click on the timeline or use Add Hire to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {milestones.map((m) => {
                  const Icon = departmentIcons[m.department] || Users;
                  return (
                    <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className={`p-1.5 rounded-md ${m.color}`}>
                        <Icon className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{m.role}</span>
                          <Badge variant="secondary" className="text-xs">{m.department}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">Starting {months[m.month - 1]} (Month {m.month})</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">${m.salary.toLocaleString()}/mo</div>
                        <div className="text-xs text-muted-foreground">${(m.salary * 12 / 1000).toFixed(0)}K/yr</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeMilestone(m.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
