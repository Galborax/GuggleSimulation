"use client";

/**
 * /timeline -> "Runway Sim" in the sidebar nav.
 * Renders the fully self-contained Financial Runway Simulator dashboard.
 */
import RunwaySimulator from "@/components/RunwaySimulator";

export default function TimelinePage() {
  return (
    <div className="h-full">
      <RunwaySimulator />
    </div>
  );
}
