"use client";
import { useEffect, useState } from "react";
import ScenarioEngine from "@/components/ScenarioEngine";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { getSession } from "@/lib/api";
import type { OnboardingSession } from "@/lib/types";
import { useProfileStore } from "@/lib/store";

export default function ScenarioPage() {
  const [session, setSession] = useState<OnboardingSession | null>(null);
  const { activeSessionId } = useProfileStore();

  useEffect(() => {
    if (activeSessionId) getSession(activeSessionId).then(s => setSession(s as OnboardingSession)).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-white">🔮 Scenario Lab</h1>
        <p className="text-gray-400 mt-1">10 crisis simulations · Survival playbooks · Real financial impact</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>What Keeps You Awake at Night?</CardTitle>
          <CardDescription>Choose a crisis, enter your financials, and get a precise damage report + survival playbook</CardDescription>
        </CardHeader>
        <CardContent>
          <ScenarioEngine
            initialRevenue={session?.monthly_revenue || 0}
            initialBurn={session?.monthly_burn || 5000}
            initialCash={session?.cash_reserve || 50000}
            sessionId={session?.session_id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
