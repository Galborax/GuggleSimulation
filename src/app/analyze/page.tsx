"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Heart, UtensilsCrossed, Cpu, Wrench, ShoppingBag, Factory, DollarSign, GraduationCap,
  ChevronRight, ChevronLeft, Sparkles, TrendingUp, TrendingDown, Minus,
  BarChart3, Brain, CheckCircle2, Loader2,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import {
  type BusinessCategory,
  getClarificationQuestions,
  generateMarketAnalysis,
  type MarketAnalysisResult,
} from "@/lib/mockAI";

const categories: { id: BusinessCategory; icon: React.ElementType; description: string; color: string }[] = [
  { id: "Medical/Healthcare", icon: Heart, description: "Digital health, medical devices, biotech, telehealth", color: "text-red-500" },
  { id: "Food & Beverage", icon: UtensilsCrossed, description: "Restaurants, CPG, delivery, food tech", color: "text-orange-500" },
  { id: "Technology", icon: Cpu, description: "SaaS, AI, marketplace, consumer apps, hardware", color: "text-blue-500" },
  { id: "Service", icon: Wrench, description: "Consulting, agencies, professional services, B2B", color: "text-purple-500" },
  { id: "Retail", icon: ShoppingBag, description: "E-commerce, brick-and-mortar, omnichannel", color: "text-pink-500" },
  { id: "Manufacturing", icon: Factory, description: "Physical products, hardware, supply chain", color: "text-yellow-600" },
  { id: "Finance", icon: DollarSign, description: "Fintech, lending, investing, payments, insurance", color: "text-emerald-500" },
  { id: "Education", icon: GraduationCap, description: "EdTech, training, tutoring, corporate learning", color: "text-indigo-500" },
];

type Step = "category" | "questions" | "analyzing" | "results";

export default function AnalyzePage() {
  const [step, setStep] = useState<Step>("category");
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(5).fill(""));
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [results, setResults] = useState<MarketAnalysisResult | null>(null);

  const questions = selectedCategory ? getClarificationQuestions(selectedCategory) : [];

  const handleCategorySelect = (cat: BusinessCategory) => {
    setSelectedCategory(cat);
    setStep("questions");
    setCurrentQuestion(0);
    setAnswers(Array(5).fill(""));
    setCurrentAnswer("");
  };

  const handleNextQuestion = () => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = currentAnswer;
    setAnswers(newAnswers);
    setCurrentAnswer("");

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setStep("analyzing");
      setTimeout(() => {
        const analysis = generateMarketAnalysis(selectedCategory!, newAnswers);
        setResults(analysis);
        setStep("results");
      }, 2500);
    }
  };

  const handleSkipQuestion = () => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = "";
    setAnswers(newAnswers);
    setCurrentAnswer("");

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setStep("analyzing");
      setTimeout(() => {
        const analysis = generateMarketAnalysis(selectedCategory!, newAnswers);
        setResults(analysis);
        setStep("results");
      }, 2500);
    }
  };

  const handleReset = () => {
    setStep("category");
    setSelectedCategory(null);
    setResults(null);
    setCurrentQuestion(0);
    setAnswers(Array(5).fill(""));
    setCurrentAnswer("");
  };

  const SentimentIcon = results?.sentiment === "positive"
    ? TrendingUp : results?.sentiment === "negative"
    ? TrendingDown : Minus;

  const sentimentColor = results?.sentiment === "positive"
    ? "text-emerald-600 dark:text-emerald-400" : results?.sentiment === "negative"
    ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400";

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Business Analysis</h1>
          <p className="text-muted-foreground">AI-powered market analysis for your business concept</p>
        </div>

        {/* Progress */}
        {step !== "category" && (
          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>
                {step === "questions" ? `Question ${currentQuestion + 1} of ${questions.length}` :
                 step === "analyzing" ? "Analyzing..." : "Analysis Complete"}
              </span>
              <span>{step === "results" ? "100%" : step === "analyzing" ? "90%" : `${Math.floor((currentQuestion / questions.length) * 80)}%`}</span>
            </div>
            <Progress
              value={step === "results" ? 100 : step === "analyzing" ? 90 : Math.floor((currentQuestion / questions.length) * 80)}
              className="h-2"
            />
          </div>
        )}

        {/* Step: Category Selection */}
        {step === "category" && (
          <div>
            <h2 className="text-xl font-semibold mb-6 text-center">Select your business category</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 hover:shadow-md text-center"
                  >
                    <div className="p-3 rounded-xl bg-muted group-hover:bg-primary/10 transition-colors">
                      <Icon className={`h-6 w-6 ${cat.color}`} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{cat.id}</div>
                      <div className="text-xs text-muted-foreground mt-1 leading-tight">{cat.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step: Questions */}
        {step === "questions" && selectedCategory && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <button onClick={handleReset} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                <ChevronLeft className="h-4 w-4" /> Back to categories
              </button>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm font-medium">{selectedCategory}</span>
            </div>

            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Brain className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    AI Analysis — Question {currentQuestion + 1} of {questions.length}
                  </span>
                </div>
                <CardTitle className="text-xl leading-relaxed">
                  {questions[currentQuestion]?.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Share your thoughts... (or skip to use AI-generated context)"
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <div className="flex gap-3">
                  <Button onClick={handleNextQuestion} className="flex-1 gap-2">
                    {currentQuestion < questions.length - 1 ? (
                      <>Next Question <ChevronRight className="h-4 w-4" /></>
                    ) : (
                      <>Analyze Business <Sparkles className="h-4 w-4" /></>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleSkipQuestion}>
                    Skip
                  </Button>
                </div>

                {/* Answered questions tracker */}
                <div className="flex gap-2 mt-2">
                  {questions.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i < currentQuestion ? "bg-primary" :
                        i === currentQuestion ? "bg-primary/50" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step: Analyzing */}
        {step === "analyzing" && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 mb-6 animate-pulse">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Analyzing your business...</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Processing market data, competitive landscape, and financial models for {selectedCategory}.
            </p>
            <div className="mt-8 space-y-2 max-w-xs mx-auto text-left">
              {["Scanning market trends...", "Evaluating competitive risks...", "Calculating growth potential...", "Generating recommendations..."].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step: Results */}
        {step === "results" && results && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="font-semibold">Analysis Complete — {selectedCategory}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset}>
                New Analysis
              </Button>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">Growth Potential</div>
                  <div className="text-4xl font-bold text-primary">{results.growthPotential}%</div>
                  <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${results.growthPotential}%` }} />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">Market Sentiment</div>
                  <div className={`flex items-center gap-2 text-2xl font-bold capitalize ${sentimentColor}`}>
                    <SentimentIcon className="h-6 w-6" />
                    {results.sentiment}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Based on current market conditions</p>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">Avg Risk Score</div>
                  <div className="text-4xl font-bold text-amber-500">
                    {Math.floor(results.riskScores.reduce((sum, r) => sum + r.score, 0) / results.riskScores.length)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">out of 100</div>
                </CardContent>
              </Card>
            </div>

            {/* Trend Forecast Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Market Trend Forecast
                </CardTitle>
                <CardDescription>Historical data and 5-month AI prediction</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={results.trendForecast}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: "8px" }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="historical" stroke="#7c3aed" strokeWidth={2} dot={{ r: 4 }} name="Historical" connectNulls={false} />
                    <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} name="Predicted" connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Risk Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-amber-500" />
                  Risk Assessment
                </CardTitle>
                <CardDescription>Risk scores across key business dimensions (lower is better)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={results.riskScores} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <YAxis dataKey="category" type="category" tick={{ fontSize: 12 }} width={120} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", borderRadius: "8px" }}
                    />
                    <Bar dataKey="score" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Risk Score" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Investment Recommendation */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Investment Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{results.investmentRecommendation}</p>
                <div className="mt-4 flex gap-2 flex-wrap">
                  <Badge variant="secondary">{selectedCategory}</Badge>
                  <Badge variant={results.sentiment === "positive" ? "default" : "secondary"} className="capitalize">
                    {results.sentiment} Outlook
                  </Badge>
                  <Badge variant="outline">{results.growthPotential}% Growth Potential</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
