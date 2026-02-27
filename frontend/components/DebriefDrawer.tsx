"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { X, Send, Loader2, TrendingUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { debriefAgent } from "@/lib/api";
import { useProfileStore, type TimelinePatch } from "@/lib/store";
import { toast } from "sonner";
import MarkdownMessage from "@/components/MarkdownMessage";

interface Message {
  role: "user" | "agent";
  content: string;
  timeline_suggestion?: TimelinePatch | null;
}

export interface DebriefDrawerProps {
  open: boolean;
  onClose: () => void;
  debateId: number;
  claim: string;
  agentName: string;
  agentRole: string;
}

const ROLE_CONFIG: Record<string, { emoji: string; accent: string; pill: string; glow: string }> = {
  "Visionary Investor": {
    emoji: "🚀",
    accent: "from-indigo-600/30 to-violet-600/10",
    pill: "bg-indigo-500/15 border-indigo-500/30 text-indigo-300",
    glow: "shadow-indigo-500/10",
  },
  "Skeptic Analyst": {
    emoji: "🔍",
    accent: "from-rose-600/25 to-orange-600/10",
    pill: "bg-rose-500/15 border-rose-500/30 text-rose-300",
    glow: "shadow-rose-500/10",
  },
  "Market Expert": {
    emoji: "📊",
    accent: "from-emerald-600/25 to-teal-600/10",
    pill: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
    glow: "shadow-emerald-500/10",
  },
};

const DEFAULT_CONFIG = {
  emoji: "🤖",
  accent: "from-gray-600/20 to-gray-700/10",
  pill: "bg-white/10 border-white/15 text-gray-300",
  glow: "shadow-white/5",
};

const QUICK_PROMPTS = [
  "Show me the numbers behind this",
  "What's a concrete next step?",
  "How do I mitigate this risk?",
  "Give me a real SEA example",
] as const;

export default function DebriefDrawer({
  open,
  onClose,
  debateId,
  claim,
  agentName,
  agentRole,
}: DebriefDrawerProps) {
  const router = useRouter();
  const { activeSessionId, setPendingTimelinePatch } = useProfileStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [threadKey, setThreadKey] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setMessages([]);
      setInput("");
      setThreadKey(null);
    }
  }, [open, claim, debateId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [input]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await debriefAgent({
        debate_id: debateId,
        claim,
        agent_name: agentName,
        agent_role: agentRole,
        user_message: text,
        thread_key: threadKey ?? undefined,
      });

      if (res.thread_key && !threadKey) setThreadKey(res.thread_key);

      setMessages((prev) => [
        ...prev,
        { role: "agent", content: res.reply, timeline_suggestion: res.timeline_suggestion },
      ]);
    } catch {
      toast.error("Failed to reach the agent. Try again.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const applyTimelinePatch = (patch: TimelinePatch) => {
    setPendingTimelinePatch(patch);
    toast.success(`Queued: ${patch.label} → RM ${patch.new_value.toLocaleString()}`);
    router.push(activeSessionId ? `/timeline?session=${activeSessionId}` : "/timeline");
    onClose();
  };

  const cfg = ROLE_CONFIG[agentRole] ?? DEFAULT_CONFIG;
  const isEmpty = messages.length === 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className={`fixed top-0 right-0 h-full w-[440px] max-w-[95vw] z-50 flex flex-col bg-[#0b0d14] border-l border-white/[0.08] shadow-2xl ${cfg.glow}`}
          >
            {/* ── Header ── */}
            <div className={`relative overflow-hidden shrink-0 bg-gradient-to-br ${cfg.accent} border-b border-white/[0.08]`}>
              <div className="relative px-5 py-4 flex items-start gap-3">
                {/* Avatar */}
                <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 border border-white/10 text-xl">
                  {cfg.emoji}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm">{agentName}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.pill}`}>
                      {agentRole}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Drilling into:{" "}
                    <span className="text-gray-200 font-medium">"{claim}"</span>
                  </p>
                </div>

                {/* Close */}
                <button
                  onClick={onClose}
                  className="shrink-0 text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 -mr-1 -mt-1"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* ── Empty state (outside scroll so centering works) ── */}
            {isEmpty && (
              <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center px-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-3xl">
                  {cfg.emoji}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Ask {agentName}</p>
                  <p className="text-gray-500 text-xs mt-1 max-w-[260px]">
                    Replies are grounded in the debate — ask anything about this point.
                  </p>
                </div>
                <div className="w-full grid grid-cols-2 gap-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      disabled={loading}
                      className="text-left text-xs text-gray-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 rounded-xl px-3 py-2.5 transition-all disabled:opacity-40 leading-snug"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Messages (scroll container, only when there are messages) ── */}
            {!isEmpty && (
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 scroll-smooth"
            >

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  {msg.role === "agent" && (
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 ml-1">
                      <span>{cfg.emoji}</span>
                      <span>{agentName}</span>
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-sm"
                        : "bg-white/[0.06] border border-white/[0.09] text-gray-100 rounded-tl-sm"
                    }`}
                  >
                    {msg.role === "user" ? (
                      msg.content
                    ) : (
                      <MarkdownMessage content={msg.content} />
                    )}
                  </div>

                  {msg.role === "agent" && msg.timeline_suggestion && (
                    <button
                      onClick={() => applyTimelinePatch(msg.timeline_suggestion!)}
                      className="flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white bg-indigo-900/30 hover:bg-indigo-900/60 border border-indigo-500/30 hover:border-indigo-400/50 rounded-xl px-3 py-1.5 transition-all mt-0.5"
                    >
                      <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                      <span>Apply to Runway Sim</span>
                      <span className="text-indigo-400 font-medium ml-0.5">
                        · {msg.timeline_suggestion.label} → RM {msg.timeline_suggestion.new_value.toLocaleString()}
                      </span>
                      <ChevronRight className="h-3 w-3 ml-auto shrink-0" />
                    </button>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-start gap-2">
                  <div className="bg-white/[0.06] border border-white/[0.09] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                    <span className="flex gap-1">
                      {[0, 1, 2].map((d) => (
                        <motion.span
                          key={d}
                          className="h-1.5 w-1.5 rounded-full bg-gray-400"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ repeat: Infinity, duration: 1.1, delay: d * 0.18 }}
                        />
                      ))}
                    </span>
                  </div>
                </div>
              )}
            </div>
            )}

            {/* ── Input Bar ── */}
            <div className="shrink-0 px-4 pb-4 pt-3 border-t border-white/[0.08] bg-[#0b0d14]">
              <div className="flex items-end gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-3 py-2 focus-within:border-indigo-500/40 transition-colors">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  placeholder={`Ask ${agentName} anything…`}
                  className="flex-1 bg-transparent text-sm text-gray-100 placeholder:text-gray-600 outline-none resize-none min-h-[36px] max-h-[120px] leading-relaxed pt-0.5"
                  disabled={loading}
                  rows={1}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  {loading
                    ? <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                    : <Send className="h-3.5 w-3.5 text-white" />
                  }
                </button>
              </div>
              <p className="text-[10px] text-gray-600 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

