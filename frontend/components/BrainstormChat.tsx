"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { brainstormChat, generateIdeas } from "@/lib/api";
import { toast } from "sonner";
import { Lightbulb, Send, Sparkles } from "lucide-react";
import MarkdownMessage from "@/components/MarkdownMessage";

interface Message { role: "user" | "assistant"; content: string }

const INPUT_CLS =
  "rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none";

const CAPITAL_LABELS: Record<string, string> = {
  bootstrap: "< $10k",
  seed: "$10k–$100k",
  series_a: "$100k+",
};

function getInitialMessage(
  benchmarkContext?: string,
  founderContext?: string,
  country?: string,
  initialSkills?: string,
  initialInterests?: string,
): string {
  if (benchmarkContext) return benchmarkContext;
  if (founderContext)
    return `I reviewed your profile: you're in ${country}, strong in ${initialSkills}, and interested in ${initialInterests}. Let’s build 3 practical startup ideas you can execute fast. What real problem do you want to solve first?`;
  return "I’m your AI Ideation Coach. Share your skills, interests, and budget, and I’ll turn them into 3 startup ideas with clear business models and next steps.";
}

interface BrainstormChatProps {
  onIdeasGenerated?: (sessionId: string, ideas: unknown[]) => void;
  country?: string;
  industry?: string;
  founderContext?: string;
  initialSkills?: string;
  initialInterests?: string;
  initialCapital?: string;
  benchmarkContext?: string;  // ai_coach_briefing from IndustryBenchmarkData
}

export default function BrainstormChat({
  onIdeasGenerated,
  country = "Singapore",
  industry = "saas",
  founderContext,
  initialSkills = "",
  initialInterests = "",
  initialCapital = "bootstrap",
  benchmarkContext,
}: BrainstormChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: getInitialMessage(benchmarkContext, founderContext, country, initialSkills, initialInterests),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [skills, setSkills] = useState(initialSkills);
  const [interests, setInterests] = useState(initialInterests);
  const [capital, setCapital] = useState(initialCapital);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await brainstormChat({
        session_id: sessionId,
        message: input,
        history: messages.map(m => ({ role: m.role, content: m.content })),
        country,
        business_category: industry,
        business_description: founderContext || "",
        founder_context: [founderContext, benchmarkContext].filter(Boolean).join("\n\n") || "",
      });
      setSessionId(res.session_id as string);
      setMessages([...newMessages, { role: "assistant", content: res.reply as string }]);
      if (newMessages.length >= 4) setShowGenerate(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to connect to AI. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!skills || !interests) {
      toast.error("Please fill in skills and interests");
      return;
    }
    setLoading(true);
    try {
      const res = await generateIdeas({
        session_id: sessionId,
        skills,
        interests,
        capital_bracket: capital,
        country,
        business_category: industry,
        business_description: founderContext || "",
      });
      onIdeasGenerated?.(res.session_id as string, res.ideas as unknown[]);
    } catch {
      toast.error("Failed to generate ideas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 relative">

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4 min-h-0 select-text cursor-text">
        <AnimatePresence>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm select-text ${
                m.role === "user" ? "bg-indigo-600 text-white" : "bg-white/10 text-gray-200"
              }`}>
                {m.role === "assistant" ? (
                  <>
                    <Lightbulb className="inline h-4 w-4 mr-1 text-yellow-400" />
                    <MarkdownMessage content={m.content} />
                  </>
                ) : (
                  m.content
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/10 rounded-2xl px-4 py-3 text-sm text-gray-400">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Generate Ideas Form ── */}
      {showGenerate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-white/10 p-4 space-y-3"
        >
          <p className="text-sm text-indigo-400 font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Ready to generate your 3 startup ideas!
          </p>
          <div className="grid grid-cols-2 gap-2">
            <input
              className={INPUT_CLS}
              placeholder="Your skills (e.g. coding, finance)"
              value={skills}
              onChange={e => setSkills(e.target.value)}
            />
            <input
              className={INPUT_CLS}
              placeholder="Your interests (e.g. food, health)"
              value={interests}
              onChange={e => setInterests(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {Object.entries(CAPITAL_LABELS).map(([c, label]) => (
              <button
                key={c}
                onClick={() => setCapital(c)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  capital === c ? "bg-indigo-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            <Sparkles className="h-4 w-4 mr-2" />
            {loading ? "Generating 3 ideas..." : "Generate My Startup Ideas ✨"}
          </Button>
        </motion.div>
      )}



      {/* ── Input Bar ── */}
      <div className="p-4 border-t border-white/10 flex gap-2">
        <Textarea
          className="flex-1 min-h-[44px] max-h-32 resize-none"
          placeholder="Tell me about yourself or a problem you want to solve…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        <Button size="icon" onClick={send} disabled={loading || !input.trim()} className="self-end">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
