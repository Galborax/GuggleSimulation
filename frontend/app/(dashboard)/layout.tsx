"use client";
/**
 * Command Center App Shell — 100dvh viewport-locked layout.
 *
 * ┌──────┬─────────────────────────────────────┐
 * │      │  Header (breadcrumb + profile pill)  │
 * │ Side ├─────────────────────────────────────┤
 * │ bar  │                                     │
 * │      │   Main Canvas (overflow-y-auto)      │
 * │      │                                     │
 * └──────┴─────────────────────────────────────┘
 *
 * Pillar 1+2: URL ?session → SessionSync → Zustand store.
 */

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { cn } from "@/lib/utils";
import {
  BarChart2, Users2, Zap, TrendingUp, FileText,
  BookOpen, Building2, Sparkles, Rocket
} from "lucide-react";
import { useProfileStore } from "@/lib/store";

const NAV_ITEMS = [
  { path: "/dashboard",  label: "Strategy Hub",        Icon: BarChart2  },
  { path: "/debate",     label: "Advisory Panel",      Icon: Users2     },
  { path: "/scenario",   label: "Scenario Lab",        Icon: Zap        },
  { path: "/timeline",   label: "Runway Sim",          Icon: TrendingUp },
  { path: "/synthesis",  label: "Executive Blueprint", Icon: FileText   },
  { path: "/learn",      label: "Learn",               Icon: BookOpen   },
];

function SessionSync() {
  const searchParams = useSearchParams();
  const { setActiveSessionId } = useProfileStore();
  useEffect(() => {
    const urlSession = searchParams.get("session");
    if (urlSession) setActiveSessionId(urlSession);
  }, [searchParams, setActiveSessionId]);
  return null;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { activeSessionId } = useProfileStore();

  const navHref = (path: string) =>
    activeSessionId ? `${path}?session=${activeSessionId}` : path;

  const current = NAV_ITEMS.find(
    (i) => pathname === i.path || (i.path !== "/dashboard" && pathname?.startsWith(i.path))
  );

  return (
    <div className="h-[100dvh] flex overflow-hidden bg-[#080a0f]">
      <Suspense><SessionSync /></Suspense>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className="group/sidebar flex flex-col shrink-0 z-40 overflow-hidden
                   w-[64px] hover:w-[220px] transition-[width] duration-200 ease-out
                   bg-[#0c0e1a] border-r border-white/[0.07]"
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-[18px] gap-3 border-b border-white/[0.07] shrink-0">
          <Rocket className="text-white shrink-0 select-none h-5 w-5" />
          <span className="opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150 font-bold text-white text-sm whitespace-nowrap">
            Guggle
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-hidden">
          {NAV_ITEMS.map(({ path, label, Icon }) => {
            const active = pathname === path || (path !== "/dashboard" && pathname?.startsWith(path));
            return (
              <Link
                key={path}
                href={navHref(path)}
                title={label}
                className={cn(
                  "flex items-center gap-3 h-10 rounded-xl px-[15px] group-hover/sidebar:px-[11px] min-w-0 overflow-hidden transition-all duration-150",
                  active
                    ? "bg-indigo-500/15 text-indigo-300"
                    : "text-gray-500 hover:text-gray-200 hover:bg-white/[0.05]"
                )}
              >
                <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-indigo-400")} />
                <span className="text-sm font-medium whitespace-nowrap overflow-hidden opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150">
                  {label}
                </span>
                {active && (
                  <div className="ml-auto shrink-0 h-1.5 w-1.5 rounded-full bg-indigo-400 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Profiles */}
        <div className="px-2 py-3 border-t border-white/[0.07]">
          <Link
            href={navHref("/profiles")}
            title="Business Profiles"
            className={cn(
              "flex items-center gap-3 h-10 rounded-xl px-[15px] group-hover/sidebar:px-[11px] overflow-hidden transition-all duration-150",
              pathname?.startsWith("/profiles")
                ? "bg-indigo-500/15 text-indigo-300"
                : "text-gray-500 hover:text-gray-200 hover:bg-white/[0.05]"
            )}
          >
            <Building2 className="h-[18px] w-[18px] shrink-0" />
            <span className="text-sm font-medium whitespace-nowrap overflow-hidden opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-150">
              Profiles
            </span>
          </Link>
        </div>
      </aside>

      {/* ── Main Area ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Dynamic Header */}
        <header className="h-14 shrink-0 flex items-center gap-3 px-5 border-b border-white/[0.07] bg-[#080a0f]/70 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600 font-medium">Guggle</span>
            {current && (
              <>
                <span className="text-gray-700">/</span>
                <span className="text-gray-200 font-medium">{current.label}</span>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {activeSessionId ? (
              <Link
                href={navHref("/profiles")}
                className="flex items-center gap-2 h-8 px-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.09] transition-colors group/profile"
              >
                <div className="h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 ring-1 ring-indigo-400/30">
                  <span className="text-[9px] font-bold text-white leading-none">G</span>
                </div>
                <span className="text-[11px] font-mono text-gray-400 group-hover/profile:text-gray-200 transition-colors">
                  {activeSessionId.slice(-10)}
                </span>
              </Link>
            ) : (
              <Link
                href="/incubator"
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-indigo-200 text-xs font-medium transition-colors"
              >
                <Sparkles className="h-3 w-3" />
                Start Incubator
              </Link>
            )}
          </div>
        </header>

        {/* Scrollable Canvas */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
