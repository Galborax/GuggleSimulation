/**
 * Pillar 2: Global Profile Context — Zustand store
 *
 * Why Zustand with `persist`?
 * - Every component (chart, debate, timeline) reads `activeSessionId` from this store.
 * - `persist` middleware mirrors the value to localStorage under "guggle-profile"
 *   automatically, so a page refresh / bookmark / tab-close never loses state.
 * - The URL (`?session=<id>`) is the ultimate source of truth (Pillar 1).
 *   `SessionSync` in layout.tsx writes to this store from the URL, keeping them
 *   perfectly in sync without any prop drilling.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * A suggested patch from the Post-Debate Debrief AI.
 * When set, FinancialTimeline reads it on mount, applies it, then clears it.
 */
export interface TimelinePatch {
  variable_id: string;
  label: string;
  new_value: number;
  impact_type: string;
}

interface ProfileStore {
  /** The currently active business profile session ID (e.g. "prof_8f72a"). */
  activeSessionId: string | null;

  /**
   * Set the active profile. Persisted automatically to localStorage.
   * Always call router.push with ?session=<id> alongside this so the URL
   * (Pillar 1) stays in sync with the store (Pillar 2).
   */
  setActiveSessionId: (id: string | null) => void;

  /**
   * A pending Financial Timeline variable patch from Post-Debate Debrief.
   * FinancialTimeline consumes and clears this on mount.
   * NOT persisted (transient between pages in the same session only).
   */
  pendingTimelinePatch: TimelinePatch | null;
  setPendingTimelinePatch: (patch: TimelinePatch | null) => void;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      activeSessionId: null,
      setActiveSessionId: (id) => set({ activeSessionId: id }),
      pendingTimelinePatch: null,
      setPendingTimelinePatch: (patch) => set({ pendingTimelinePatch: patch }),
    }),
    {
      name: "guggle-profile",          // localStorage key (replaces "guggle_session_id")
      // Only persist the session ID — patches are transient
      partialize: (state) => ({ activeSessionId: state.activeSessionId }),
    }
  )
);

/** Helper: read the session ID on the server side (or before React hydrates). */
export function getStoredSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("guggle-profile");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { activeSessionId?: string } };
    return parsed?.state?.activeSessionId ?? null;
  } catch {
    return null;
  }
}
