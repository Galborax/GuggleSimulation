import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Brain,
  Swords,
  Sliders,
  Map,
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Business Analysis",
    description: "AI-guided analysis of your business concept with tailored clarifying questions and deep market insights.",
    href: "/analyze",
    badge: "AI Powered",
    color: "text-purple-500",
  },
  {
    icon: Swords,
    title: "AI Debate Simulation",
    description: "Watch AI personas debate your business idea from bull, bear, skeptic, and growth advocate perspectives.",
    href: "/debate",
    badge: "Multi-Agent",
    color: "text-blue-500",
  },
  {
    icon: Sliders,
    title: "What-If Scenarios",
    description: "Adjust key business variables and simulate chaos events to stress-test your financial model.",
    href: "/scenarios",
    badge: "Interactive",
    color: "text-amber-500",
  },
  {
    icon: Map,
    title: "Hiring Roadmap",
    description: "Plan your 12-month hiring timeline with dynamic cash runway and burn rate calculations.",
    href: "/roadmap",
    badge: "Planning",
    color: "text-emerald-500",
  },
];

const stats = [
  { value: "8+", label: "Business Categories" },
  { value: "4", label: "AI Personas" },
  { value: "∞", label: "Scenarios" },
  { value: "12mo", label: "Roadmap Horizon" },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-blue-500/10 py-24 md:py-32">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 px-4 py-1.5 text-sm" variant="secondary">
              <Zap className="h-3.5 w-3.5 mr-1.5 text-primary" />
              AI-Powered Financial Analysis
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
              Simulate Your Business
              <span className="block bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
                Before You Build It
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              GuggleSimulation harnesses AI to analyze market trends, simulate investment debates,
              model chaos scenarios, and build hiring roadmaps — so you can make smarter decisions
              before committing real resources.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-base px-8 gap-2">
                <Link href="/analyze">
                  Start Analysis <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8">
                <Link href="/debate">Watch AI Debate</Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything You Need to Validate Your Business</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Four powerful simulation modules powered by AI to stress-test your ideas before they meet reality.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/30">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="p-2 rounded-lg bg-muted">
                        <Icon className={`h-6 w-6 ${feature.color}`} />
                      </div>
                      <Badge variant="secondary" className="text-xs">{feature.badge}</Badge>
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="ghost" className="gap-2 group-hover:text-primary transition-colors p-0">
                      <Link href={feature.href}>
                        Get Started <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Stop Guessing. Start Simulating.
              </h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                Most businesses fail not because of bad ideas, but because of poor market timing,
                misunderstood risks, and inadequate financial planning. GuggleSimulation gives you
                an AI-powered sandbox to test your assumptions before they cost you real money.
              </p>
              <div className="space-y-4">
                {[
                  { icon: TrendingUp, text: "Real-time market trend forecasting with confidence intervals" },
                  { icon: Shield, text: "Multi-dimensional risk assessment across operational, financial, and regulatory domains" },
                  { icon: BarChart3, text: "Dynamic financial modeling that updates as your assumptions change" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="p-1.5 rounded-md bg-primary/10 mt-0.5 shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20 p-8 border">
                <div className="space-y-4">
                  {[
                    { label: "Growth Potential", value: 78, color: "bg-primary" },
                    { label: "Market Confidence", value: 65, color: "bg-blue-500" },
                    { label: "Risk Score", value: 34, color: "bg-amber-500" },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{label}</span>
                        <span className="text-muted-foreground">{value}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        Positive market sentiment detected
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 border-y">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Simulate Your Success?</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join founders and investors who use GuggleSimulation to make data-driven decisions.
          </p>
          <Button asChild size="lg" className="text-base px-10 gap-2">
            <Link href="/analyze">
              Begin Free Analysis <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 GuggleSimulation. AI-powered business simulation platform.</p>
        </div>
      </footer>
    </div>
  );
}
