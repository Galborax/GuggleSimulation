const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let detail = `API error ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}

// Onboarding
export const getCategories = () => req<{ categories: string[] }>("/api/onboarding/categories");
export const startOnboarding = (data: object) =>
  req("/api/onboarding/start", { method: "POST", body: JSON.stringify(data) });
export const answerQuestion = (data: object) =>
  req("/api/onboarding/answer", { method: "POST", body: JSON.stringify(data) });
export const submitFinancials = (data: object) =>
  req("/api/onboarding/financials", { method: "POST", body: JSON.stringify(data) });
export const getSession = (id: string) => req(`/api/onboarding/session/${id}`);

// Business Profiles
export const listProfiles = () => req<{ profiles: import("./types").ProfileSummary[] }>("/api/onboarding/profiles");
export const updateProfile = (id: string, data: object) =>
  req(`/api/onboarding/session/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteProfile = (id: string) =>
  req(`/api/onboarding/session/${id}`, { method: "DELETE" });

// Similar Businesses
export const getSimilarBusinesses = (data: object) =>
  req<{ businesses: import("./types").SimilarBusiness[] }>("/api/onboarding/similar-businesses", {
    method: "POST",
    body: JSON.stringify(data),
  });

// Brainstorm
export const brainstormChat = (data: object): Promise<Record<string, unknown>> =>
  req<Record<string, unknown>>("/api/brainstorm/chat", { method: "POST", body: JSON.stringify(data) });

export const generateIdeas = (data: object): Promise<Record<string, unknown>> =>
  req<Record<string, unknown>>("/api/brainstorm/generate-ideas", { method: "POST", body: JSON.stringify(data) });

export const selectIdea = (data: object) =>
  req("/api/brainstorm/select-idea", { method: "POST", body: JSON.stringify(data) });

// Market
export const getSectorInsight = (sector: string) => req(`/api/market/sector/${sector}`);
export const getCompetitors = (sector: string) => req(`/api/market/competitors/${sector}`);

// Debate
export const startDebate = (data: object) =>
  req("/api/debate/start", { method: "POST", body: JSON.stringify(data) });
export const nextDebateRound = (data: object) =>
  req("/api/debate/next", { method: "POST", body: JSON.stringify(data) });
export const runJudge = (data: object) =>
  req("/api/debate/judge", { method: "POST", body: JSON.stringify(data) });
export const getDebate = (id: number) => req(`/api/debate/${id}`);
export const debriefAgent = (data: object): Promise<{
  thread_key: string;
  agent_name: string;
  agent_role: string;
  reply: string;
  timeline_suggestion: { variable_id: string; label: string; new_value: number; impact_type: string } | null;
  history: { role: string; content: string }[];
}> => req("/api/debate/debrief", { method: "POST", body: JSON.stringify(data) });

// Scenario
export const previewRunway = (data: object) =>
  req("/api/scenario/runway", { method: "POST", body: JSON.stringify(data) });
export const getHiringRoadmap = (data: object) =>
  req("/api/scenario/hiring", { method: "POST", body: JSON.stringify(data) });

// Synthesis
export const createSynthesis = (sessionId: string) =>
  req(`/api/synthesis/${sessionId}`, { method: "POST", body: JSON.stringify({}) });

// Reality Dashboard
export const generateRealityDashboard = (sessionId: string) =>
  req<import("./types").BusinessRealityDashboard>(`/api/onboarding/reality-dashboard/${sessionId}`, { method: "POST", body: JSON.stringify({}) });

// Education
export const getGlossary = () => req<{ glossary: unknown[] }>("/api/education/glossary");
export const explainConcept = (concept: string) => req(`/api/education/explain/${concept}`);

// Glossary CRUD
export const fetchGlossaryTerms = (search?: string, category?: string): Promise<import("./types").GlossaryTerm[]> => {
  const params = new URLSearchParams();
  if (search)   params.set("search", search);
  if (category) params.set("category", category);
  const qs = params.toString();
  return req<import("./types").GlossaryTerm[]>(`/api/education/glossary/terms${qs ? `?${qs}` : ""}`);
};
export const fetchCategories = (): Promise<string[]> =>
  req<string[]>("/api/education/glossary/categories");
export const createGlossaryTerm = (data: { term: string; definition: string; category: string; source: string }): Promise<import("./types").GlossaryTerm> =>
  req<import("./types").GlossaryTerm>("/api/education/glossary/terms", { method: "POST", body: JSON.stringify(data) });
export const deleteGlossaryTerm = (id: number): Promise<void> =>
  req<void>(`/api/education/glossary/terms/${id}`, { method: "DELETE" });

export const runWhatIf = (data: object): Promise<Record<string, unknown>> =>
  req<Record<string, unknown>>("/api/scenario/whatif", { method: "POST", body: JSON.stringify(data) });

export const runFounderScenario = (data: object): Promise<import("./types").FounderScenarioResult> =>
  req<import("./types").FounderScenarioResult>("/api/scenario/founder-scenario", { method: "POST", body: JSON.stringify(data) });

export const runChaos = (data: object): Promise<Record<string, unknown>> =>
  req<Record<string, unknown>>("/api/scenario/chaos", { method: "POST", body: JSON.stringify(data) });

// Interactive Financial Timeline
export const generateTimeline = (sessionId: string, startingCapital?: number) =>
  req<import("./types").AdjustableTimeline>(`/api/timeline/${sessionId}`, {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, starting_capital: startingCapital ?? 50000 }),
  });

export const clearTimelineCache = (sessionId: string) =>
  req(`/api/timeline/${sessionId}/cache`, { method: "DELETE" });

export const fetchBenchmarks = (industry: string, location: string) =>
  req<import("./types").IndustryBenchmarkData>(
    `/api/benchmarks?industry=${encodeURIComponent(industry)}&location=${encodeURIComponent(location)}`
  );

// Financial Anatomy Engine
export const getFinancialAnatomy = (sessionData: object) =>
  req<import("./types").FinancialAnatomyData>("/api/financial-anatomy", { method: "POST", body: JSON.stringify(sessionData) });

// Multi-Format Export Engine
export const exportBlueprint = async (payload: {
  format: "pdf" | "docx" | "pptx" | "xlsx";
  session_id: string;
  report: object;
  timeline?: object[];
}): Promise<void> => {
  const res = await fetch(`${BASE}/api/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let detail = `Export failed: ${res.status}`;
    try { const b = await res.json(); if (b?.detail) detail = b.detail; } catch {}
    throw new Error(detail);
  }
  const blob = await res.blob();
  const ext = payload.format;
  const filename =
    ext === "pdf"  ? "executive-blueprint.pdf"  :
    ext === "docx" ? "executive-blueprint.docx" :
    ext === "pptx" ? "pitch-deck.pptx"          :
    "financial-sandbox.xlsx";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};