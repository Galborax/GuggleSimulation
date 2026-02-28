"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BrainstormChat from "@/components/BrainstormChat";
import IdeaTrioCards from "@/components/IdeaTrioCards";
import IndustryBenchmarkPanel from "@/components/IndustryBenchmarkPanel";
import IndustryRealityCheck from "@/components/IndustryRealityCheck";
import { selectIdea, fetchBenchmarks } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Idea, IndustryBenchmarkData } from "@/lib/types";
import { useProfileStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sprout } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const SEA_COUNTRIES = [
  "Singapore","Indonesia","Malaysia","Thailand","Vietnam",
  "Philippines","Myanmar","Cambodia","Laos","Brunei",
];
const CAPITAL_OPTIONS = [
  { value: "bootstrap", label: "Bootstrap (< $10k)" },
  { value: "seed",      label: "Seed ($10k – $100k)" },
  { value: "series_a",  label: "Funded ($100k+)" },
];
const INDUSTRY_OPTIONS = [
  { value: "fnb",        label: "🍜 F&B (Cafes & Restaurants)" },
  { value: "saas",       label: "💻 Tech & SaaS" },
  { value: "ecommerce",  label: "🛒 E-Commerce & Retail" },
  { value: "healthtech", label: "❤️ Health & Wellness" },
  { value: "edtech",     label: "📚 Education & EdTech" },
  { value: "logistics",  label: "🚚 Logistics & Delivery" },
  { value: "fintech",    label: "💳 Finance & Payments" },
  { value: "others",     label: "🔲 Others" },
];

interface FounderProfile {
  country: string;
  skills: string;
  interests: string;
  capital: string;
  problem: string;
  experience: string;
  industry: string;
}

export default function IncubatorPage() {
  const router = useRouter();
  const { setActiveSessionId } = useProfileStore();
  const [step, setStep] = useState<"profile" | "reality" | "chat">("profile");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingIdeaIndex, setPendingIdeaIndex] = useState<number | null>(null);
  const [customIdeaName, setCustomIdeaName] = useState("");
  const [benchmark, setBenchmark] = useState<IndustryBenchmarkData | null>(null);
  const [loadingBenchmark, setLoadingBenchmark] = useState(false);

  const [profile, setProfile] = useState<FounderProfile>({
    country: "Singapore",
    skills: "",
    interests: "",
    capital: "bootstrap",
    problem: "",
    experience: "",
    industry: "fnb",
  });

  const handleIdeasGenerated = (sid: string, newIdeas: unknown[]) => {
    setSessionId(sid);
    setIdeas(newIdeas as Idea[]);
  };

  const handleSelectIdea = (index: number) => {
    const chosen = ideas[index];
    setPendingIdeaIndex(index);
    setCustomIdeaName(chosen?.name ?? "");
  };

  const confirmSelectIdea = async (useCustomName: boolean) => {
    if (!sessionId) return;
    if (pendingIdeaIndex === null) return;

    const trimmedName = customIdeaName.trim();
    setLoading(true);
    try {
      await selectIdea({
        session_id: sessionId,
        idea_index: pendingIdeaIndex,
        custom_name: useCustomName && trimmedName ? trimmedName : undefined,
      });
      setActiveSessionId(sessionId);
      setPendingIdeaIndex(null);
      toast.success("Idea selected! Setting up your workspace...");
      setTimeout(() => router.push(`/dashboard?session=${sessionId}`), 1500);
    } catch {
      toast.error("Failed to select idea");
    } finally {
      setLoading(false);
    }
  };

  const isProfileValid = profile.skills.trim() && profile.interests.trim() && profile.country;

  const founderContext = [
    `I'm a founder based in ${profile.country}.`,
    `My skills: ${profile.skills}.`,
    `My interests/passions: ${profile.interests}.`,
    `Capital available: ${CAPITAL_OPTIONS.find(c => c.value === profile.capital)?.label}.`,
    profile.problem    ? `Problem I want to solve: ${profile.problem}.`  : "",
    profile.experience ? `Relevant experience: ${profile.experience}.`   : "",
  ].filter(Boolean).join("\n");

  return (
    <div className={`bg-[#080a0f] ${step === "chat" || step === "reality" ? "h-[100dvh] overflow-hidden" : "min-h-screen"}`}>
      <div className={`${step === "chat" || step === "reality" ? "h-full flex flex-col" : "max-w-5xl mx-auto p-4"}`}>

        {/* Header — compact when in chat mode */}
        <div className={`${step === "chat" || step === "reality" ? "h-14 flex items-center gap-3 px-6 border-b border-white/[0.07] bg-[#0c0e1a] shrink-0" : "mb-6"}`}>
          {(step === "chat" || step === "reality") && (
            <button
              onClick={() => setStep(step === "reality" ? "profile" : "reality")}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              ← Back
            </button>
          )}
          <span className={(step === "chat" || step === "reality") ? "text-base font-bold text-white flex items-center gap-1.5" : "text-3xl font-bold text-white flex items-center gap-2"}>
            <Sprout className={(step === "chat" || step === "reality") ? "w-4 h-4 text-white" : "w-7 h-7 text-white"} />
            Idea Incubator
          </span>
          {step === "profile" && (
            <p className="text-gray-400 mt-1">
              Tell us about yourself so the AI can tailor ideas just for you
            </p>
          )}
          {(step === "chat" || step === "reality") && (
            <div className="ml-4 flex gap-2 flex-wrap">
              <span className="bg-white/[0.06] text-gray-400 text-[11px] rounded-full px-2.5 py-0.5">📍 {profile.country}</span>
              <span className="bg-white/[0.06] text-gray-400 text-[11px] rounded-full px-2.5 py-0.5">🛠 {profile.skills.length > 25 ? profile.skills.slice(0,25)+"…" : profile.skills}</span>
              <span className="bg-emerald-900/30 text-emerald-400 text-[11px] rounded-full px-2.5 py-0.5 border border-emerald-700/40">{CAPITAL_OPTIONS.find(c => c.value === profile.capital)?.label}</span>
              <span className="bg-sky-900/30 text-sky-400 text-[11px] rounded-full px-2.5 py-0.5 border border-sky-700/40">{INDUSTRY_OPTIONS.find(i => i.value === profile.industry)?.label ?? profile.industry}</span>
            </div>
          )}
        </div>

        {/* Fills remaining height in chat mode so the split-screen stretches edge-to-edge */}
        <div className={step === "chat" || step === "reality" ? "flex-1 flex flex-col overflow-hidden" : ""}>
        <AnimatePresence mode="wait">

          {/* ── Step 1: Founder Profile ── */}
          {step === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-4xl mx-auto bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-white">About You</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Help the AI understand your background so it can generate startup ideas that actually fit you.
                </p>
              </div>

              {/* Country */}
              <div className="space-y-1.5">
                <Label className="text-gray-300">Where are you based?</Label>
                <Select
                  value={profile.country}
                  onValueChange={(v) => setProfile({ ...profile, country: v })}
                >
                  <SelectTrigger className="mt-1 bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEA_COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Industry */}
              <div className="space-y-1.5">
                <Label className="text-gray-300">Which industry are you targeting?</Label>
                <Select
                  value={profile.industry}
                  onValueChange={(v) => setProfile({ ...profile, industry: v })}
                >
                  <SelectTrigger className="mt-1 bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">We&apos;ll load real benchmarks for this industry on the right canvas.</p>
              </div>

              {/* Skills */}
              <div className="space-y-1.5">
                <Label className="text-gray-300">
                  What are your key skills? <span className="text-red-400">*</span>
                </Label>
                <Input
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                  placeholder="e.g. software engineering, marketing, finance, design"
                  value={profile.skills}
                  onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                />
                <p className="text-xs text-gray-500">Be specific — this helps match ideas to what you can actually build.</p>
              </div>

              {/* Interests */}
              <div className="space-y-1.5">
                <Label className="text-gray-300">
                  What are you passionate about? <span className="text-red-400">*</span>
                </Label>
                <Input
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                  placeholder="e.g. food, education, sustainability, gaming, health"
                  value={profile.interests}
                  onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
                />
              </div>

              {/* Capital */}
              <div className="space-y-1.5">
                <Label className="text-gray-300">Capital available to start?</Label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {CAPITAL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setProfile({ ...profile, capital: opt.value })}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        profile.capital === opt.value
                          ? "bg-emerald-600 text-white"
                          : "bg-white/10 text-gray-300 hover:bg-white/20"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Problem (optional) */}
              <div className="space-y-1.5">
                <Label className="text-gray-300">
                  Any problem you&apos;d love to solve?{" "}
                  <span className="text-gray-500 text-xs">(optional)</span>
                </Label>
                <Textarea
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                  placeholder="e.g. Small businesses in SEA struggle to access affordable loans…"
                  rows={2}
                  value={profile.problem}
                  onChange={(e) => setProfile({ ...profile, problem: e.target.value })}
                />
              </div>

              {/* Experience (optional) */}
              <div className="space-y-1.5">
                <Label className="text-gray-300">
                  Relevant industry experience?{" "}
                  <span className="text-gray-500 text-xs">(optional)</span>
                </Label>
                <Input
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                  placeholder="e.g. 3 years in banking, ran a food stall, worked at a logistics firm"
                  value={profile.experience}
                  onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                />
              </div>

              <Button
                onClick={() => {
                  // Kick off the real benchmark fetch in the background so it may be
                  // ready by the time the user clicks "Continue" on the reality screen.
                  setLoadingBenchmark(true);
                  fetchBenchmarks(profile.industry, profile.country)
                    .then((data) => setBenchmark(data))
                    .catch(() => {})
                    .finally(() => setLoadingBenchmark(false));
                  setStep("reality");
                }}
                disabled={!isProfileValid}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40"
              >
                See Industry Reality Check →
              </Button>
            </motion.div>
          )}

          {/* ── Step 2: Industry Reality Check (intermediate) ── */}
          {step === "reality" && (
            <motion.div
              key="reality"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex overflow-hidden"
            >
              <IndustryRealityCheck
                industry={
                  INDUSTRY_OPTIONS.find((o) => o.value === profile.industry)
                    ?.label.replace(/^[^a-zA-Z]+/, "").trim() ?? profile.industry
                }
                location={profile.country}
                founderContext={founderContext}
                onContinue={() => setStep("chat")}
              />
            </motion.div>
          )}

          {/* ── Step 3: Split-Screen Brainstorm ── */}
          {step === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex overflow-hidden"
            >
              {/* LEFT — AI Chat (50%) */}
              <div className="flex-1 flex flex-col border-r border-white/[0.07] overflow-hidden">
                <div className="px-5 py-3 border-b border-white/[0.07] bg-[#0c0e1a]/60 shrink-0">
                  <p className="text-xs font-semibold text-gray-400">💬 AI Ideation Coach</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">Chat naturally — the AI knows your profile.</p>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col">
                  <BrainstormChat
                    onIdeasGenerated={handleIdeasGenerated}
                    country={profile.country}
                    industry={profile.industry}
                    founderContext={founderContext}
                    initialSkills={profile.skills}
                    initialInterests={profile.interests}
                    initialCapital={profile.capital}
                    benchmarkContext={benchmark?.ai_coach_briefing}
                  />
                </div>
              </div>

              {/* RIGHT — Live Canvas: ideas build as you chat (50%) */}
              <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0c14]">
                <div className="px-5 py-3 border-b border-white/[0.07] shrink-0">
                  <p className="text-xs font-semibold text-gray-400">✨ Live Idea Canvas</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    {ideas.length > 0
                      ? "Your startup ideas — pick one to continue."
                      : "Industry benchmarks load here first, then your ideas appear as the AI generates them."}
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                  <AnimatePresence mode="wait">
                    {ideas.length > 0 ? (
                      <motion.div key="ideas" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <IdeaTrioCards ideas={ideas} onSelect={handleSelectIdea} loading={loading} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="benchmark"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-full"
                      >
                        <IndustryBenchmarkPanel data={benchmark} loading={loadingBenchmark} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
        </div>  {/* end flex-1 wrapper */}
      </div>

      <AnimatePresence>
        {pendingIdeaIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !loading && setPendingIdeaIndex(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0c0e1a] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white">Edit idea name?</h3>
              <p className="mt-1 text-sm text-gray-400">
                You can rename this idea before continuing to your dashboard.
              </p>

              <div className="mt-4 space-y-2">
                <Label className="text-gray-300">Business name</Label>
                <Input
                  value={customIdeaName}
                  onChange={(e) => setCustomIdeaName(e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                  placeholder="Enter business name"
                  disabled={loading}
                />
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => confirmSelectIdea(false)}
                  disabled={loading}
                  className="border-white/25 text-gray-200 hover:bg-white/10"
                >
                  No changes
                </Button>
                <Button
                  type="button"
                  onClick={() => confirmSelectIdea(true)}
                  disabled={loading || !customIdeaName.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Save name & continue
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
