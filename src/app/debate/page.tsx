"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Swords, Play, RotateCcw, Loader2, MessageSquare, Users } from "lucide-react";
import { generateDebateMessages, debatePersonas, type DebateMessage } from "@/lib/mockAI";
import { cn } from "@/lib/utils";

const sampleTopics = [
  "AI-powered SaaS for small business accounting",
  "Plant-based fast food chain",
  "Web3 marketplace for digital artists",
  "Mental health app for teenagers",
  "Electric vehicle charging network",
  "Online education platform for coding",
];

const roundOptions = [3, 5, 7, 10];

export default function DebatePage() {
  const [topic, setTopic] = useState("");
  const [rounds, setRounds] = useState(5);
  const [isDebating, setIsDebating] = useState(false);
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [displayedCount, setDisplayedCount] = useState(0);
  const [debateComplete, setDebateComplete] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayedCount]);

  const startDebate = () => {
    if (!topic.trim()) return;
    const allMessages = generateDebateMessages(topic, rounds);
    setMessages(allMessages);
    setDisplayedCount(0);
    setIsDebating(true);
    setDebateComplete(false);

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayedCount(i);
      if (i >= allMessages.length) {
        clearInterval(interval);
        setIsDebating(false);
        setDebateComplete(true);
      }
    }, 1200);
  };

  const resetDebate = () => {
    setMessages([]);
    setDisplayedCount(0);
    setIsDebating(false);
    setDebateComplete(false);
    setTopic("");
  };

  const personaInfo = (name: string) =>
    debatePersonas.find((p) => p.name === name)!;

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
            <Swords className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">AI Debate Simulation</h1>
          <p className="text-muted-foreground">
            Watch AI personas argue your business idea from multiple investor perspectives
          </p>
        </div>

        {/* Setup Card */}
        {!isDebating && messages.length === 0 && (
          <Card className="mb-8 border-2">
            <CardHeader>
              <CardTitle>Configure Your Debate</CardTitle>
              <CardDescription>Choose a business topic and how many rounds to simulate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="topic">Business Idea / Topic</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., AI-powered SaaS for small business accounting"
                  className="text-base"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {sampleTopics.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTopic(t)}
                      className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors border"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Number of Rounds</Label>
                <div className="flex gap-3">
                  {roundOptions.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRounds(r)}
                      className={cn(
                        "flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                        rounds === r
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Personas preview */}
              <div className="space-y-2">
                <Label>Debate Participants</Label>
                <div className="grid grid-cols-2 gap-3">
                  {debatePersonas.map((p) => (
                    <div key={p.name} className={cn("flex items-center gap-2 p-3 rounded-lg border", p.bgColor)}>
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                        {p.name[0]}
                      </div>
                      <div>
                        <div className={cn("text-sm font-semibold", p.color)}>{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={startDebate}
                disabled={!topic.trim()}
                className="w-full gap-2 text-base h-11"
              >
                <Play className="h-4 w-4" /> Start Debate
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Debate in progress */}
        {(isDebating || debateComplete) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isDebating ? (
                  <>
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    <span className="font-semibold text-sm">Debate in progress...</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 text-emerald-500" />
                    <span className="font-semibold text-sm">Debate complete</span>
                  </>
                )}
                <Badge variant="secondary">{topic.length > 40 ? topic.slice(0, 40) + "…" : topic}</Badge>
              </div>
              {debateComplete && (
                <Button variant="outline" size="sm" onClick={resetDebate} className="gap-1">
                  <RotateCcw className="h-3.5 w-3.5" /> New Debate
                </Button>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 pb-2">
              {debatePersonas.map((p) => (
                <div key={p.name} className="flex items-center gap-1.5 text-xs">
                  <div className={cn("font-semibold", p.color)}>{p.name}</div>
                  <span className="text-muted-foreground">· {p.role}</span>
                </div>
              ))}
            </div>

            {/* Messages */}
            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              {messages.slice(0, displayedCount).map((msg, idx) => {
                const persona = personaInfo(msg.persona);
                return (
                  <div
                    key={idx}
                    className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    <div className={cn("rounded-xl border p-4", persona.bgColor)}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-background border flex items-center justify-center text-xs font-bold">
                            {persona.name[0]}
                          </div>
                          <span className={cn("text-sm font-semibold", persona.color)}>
                            {persona.name}
                          </span>
                          <span className="text-xs text-muted-foreground">{persona.role}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">Round {msg.round}</Badge>
                      </div>
                      <p className="text-sm leading-relaxed">{msg.message.replace(`[Round ${msg.round}] `, "")}</p>
                    </div>
                  </div>
                );
              })}
              {isDebating && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Next speaker preparing argument...
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Summary */}
            {debateComplete && (
              <Card className="border-primary/30 bg-primary/5 animate-in fade-in duration-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4 text-primary" />
                    Debate Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The {rounds}-round debate on <strong>&ldquo;{topic}&rdquo;</strong> surfaced key tensions between
                    growth optimism and risk caution. The Bull Investor and Growth Advocate emphasized market
                    timing and execution track record, while the Bear Analyst raised unit economics concerns
                    and the Market Skeptic questioned foundational assumptions. A balanced investment approach
                    would involve structured milestones with capital tranches tied to key performance thresholds.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="font-medium text-emerald-600 dark:text-emerald-400 mb-1">Bullish Signals</div>
                      <ul className="space-y-1 text-muted-foreground text-xs">
                        <li>• Strong market timing</li>
                        <li>• Experienced founding team</li>
                        <li>• Network effect potential</li>
                      </ul>
                    </div>
                    <div>
                      <div className="font-medium text-red-600 dark:text-red-400 mb-1">Risk Factors</div>
                      <ul className="space-y-1 text-muted-foreground text-xs">
                        <li>• Unit economics under scrutiny</li>
                        <li>• Competitive threats real</li>
                        <li>• Regulatory uncertainty</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
