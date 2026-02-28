"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfileStore } from "@/lib/store";
import { getCategories, startOnboarding, answerQuestion, submitFinancials } from "@/lib/api";
import SimilarBusinesses from "@/components/SimilarBusinesses";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const FALLBACK_CATEGORIES = [
  "Fintech & Payments", "E-Commerce & Retail", "Healthtech & Biotech",
  "Edtech & Upskilling", "Agritech & Food", "Logistics & Supply Chain",
  "SaaS & Productivity", "Travel & Tourism", "Media & Entertainment",
  "Clean Energy & Sustainability", "Property & Construction",
  "HR & Workforce Management", "Legal & Compliance", "Gaming & Esports",
  "Government & Civic Tech",
];

const SEA_COUNTRIES = ["Singapore", "Indonesia", "Malaysia", "Thailand", "Vietnam", "Philippines", "Myanmar", "Cambodia", "Laos", "Brunei"];

type Step = "category" | "details" | "similar" | "clarify" | "financials" | "done";

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("category");
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);
  const [sessionId, setSessionId] = useState<string>("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    category: "", name: "", description: "", country: "Singapore",
    revenue: "", burn: "", cash: "", team: "1",
  });

  useEffect(() => {
    getCategories().then((d) => setCategories(d.categories)).catch(() => {});
  }, []);

  // Track where to go after the similar-businesses step
  const [postSimilarStep, setPostSimilarStep] = useState<"clarify" | "financials">("financials");

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = (await startOnboarding({
        path: "A",
        business_category: form.category,
        business_name: form.name,
        business_description: form.description,
        country: form.country,
      })) as { session_id: string; questions?: string[] };
      setSessionId(res.session_id);
      if (res.questions && res.questions.length > 0) {
        setQuestions(res.questions);
        setPostSimilarStep("clarify");
      } else {
        setPostSimilarStep("financials");
      }
      // Always show similar businesses first
      setStep("similar");
    } catch {
      toast.error("Failed to connect to API. Please check backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async () => {
    const answer = answers[currentQ] || "";
    if (!answer.trim()) return;
    setLoading(true);
    try {
      await answerQuestion({ session_id: sessionId, question_index: currentQ, answer });
      if (currentQ < questions.length - 1) {
        setCurrentQ((q) => q + 1);
      } else {
        setStep("financials");
      }
    } catch {
      toast.error("Failed to save answer.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinancials = async () => {
    setLoading(true);
    try {
      await submitFinancials({
        session_id: sessionId,
        monthly_revenue: parseFloat(form.revenue) || 0,
        monthly_burn: parseFloat(form.burn) || 0,
        cash_reserve: parseFloat(form.cash) || 0,
        team_size: parseInt(form.team) || 1,
      });
      // Pillar 1 + 2: write to Zustand store (auto-persists) and put session ID in URL
      useProfileStore.getState().setActiveSessionId(sessionId);
      setStep("done");
      setTimeout(() => router.push(`/dashboard?session=${sessionId}`), 1500);
    } catch {
      toast.error("Failed to submit financials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8"
      >
        {step === "category" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Your Business Category</h2>
              <p className="text-gray-400 mt-1">Tell us what sector you&apos;re in</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Category</Label>
                <Select onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Country</Label>
                <Select onValueChange={(v) => setForm({ ...form, country: v })} defaultValue="Singapore">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEA_COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={() => setStep("details")} disabled={!form.category} className="w-full">
              Next →
            </Button>
          </div>
        )}

        {step === "details" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Your Startup</h2>
              <Badge variant="secondary" className="mt-1">{form.category}</Badge>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Startup Name</Label>
                <Input className="mt-1" placeholder="e.g. PayEasy" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>What does it do? (1-2 sentences)</Label>
                <Textarea className="mt-1" placeholder="We help SMEs in SEA..." value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("category")}>← Back</Button>
              <Button onClick={handleStart} disabled={!form.name || !form.description || loading} className="flex-1">
                {loading ? "Generating questions..." : "Continue →"}
              </Button>
            </div>
          </div>
        )}

        {step === "similar" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-white">Businesses Like Yours</h2>
              <p className="text-gray-400 mt-1 text-sm">
                Here are companies already operating in a similar space in {form.country} and nearby SEA markets — know your landscape before you build.
              </p>
            </div>
            <div className="max-h-[55vh] overflow-y-auto pr-1">
              <SimilarBusinesses
                category={form.category}
                businessName={form.name}
                description={form.description}
                country={form.country}
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setStep("details")}>← Back</Button>
              <Button className="flex-1" onClick={() => setStep(postSimilarStep)}>
                {postSimilarStep === "clarify" ? "Continue to Questions →" : "Continue to Financials →"}
              </Button>
            </div>
          </div>
        )}

        {step === "clarify" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Quick Questions</h2>
              <p className="text-gray-400 mt-1">Question {currentQ + 1} of {questions.length}</p>
              <div className="mt-2 h-1 bg-white/10 rounded-full">
                <div className="h-1 bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Label className="text-white text-base">{questions[currentQ]}</Label>
                <Textarea className="mt-3" placeholder="Your answer..." rows={4}
                  value={answers[currentQ] || ""}
                  onChange={(e) => setAnswers({ ...answers, [currentQ]: e.target.value })} />
              </motion.div>
            </AnimatePresence>
            <Button onClick={handleAnswer} disabled={!answers[currentQ]?.trim() || loading} className="w-full">
              {loading ? "Saving..." : currentQ < questions.length - 1 ? "Next →" : "Finish Questions →"}
            </Button>
          </div>
        )}

        {step === "financials" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Financial Snapshot</h2>
              <p className="text-gray-400 mt-1">Monthly numbers (in USD)</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Monthly Revenue ($)", key: "revenue", placeholder: "0" },
                { label: "Monthly Burn ($)", key: "burn", placeholder: "5000" },
                { label: "Cash Reserve ($)", key: "cash", placeholder: "50000" },
                { label: "Team Size", key: "team", placeholder: "1" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <Input className="mt-1" type="number" placeholder={placeholder}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
            </div>
            <Button onClick={handleFinancials} disabled={!form.burn || !form.cash || loading} className="w-full">
              {loading ? "Analyzing..." : "Complete Setup →"}
            </Button>
          </div>
        )}

        {step === "done" && (
          <div className="text-center space-y-4">
            <div className="text-5xl">🚀</div>
            <h2 className="text-2xl font-bold text-white">Analysis Complete!</h2>
            <p className="text-gray-400">Redirecting to your Strategy Hub...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
