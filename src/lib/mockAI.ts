// Mock AI responses for when no API key is present
// Structure mirrors what would be returned from Gemini API

export type BusinessCategory =
  | "Medical/Healthcare"
  | "Food & Beverage"
  | "Technology"
  | "Service"
  | "Retail"
  | "Manufacturing"
  | "Finance"
  | "Education";

export interface ClarificationQuestion {
  id: number;
  question: string;
}

export interface MarketAnalysisResult {
  trendForecast: { month: string; historical?: number; predicted?: number }[];
  riskScores: { category: string; score: number }[];
  growthPotential: number;
  sentiment: "positive" | "neutral" | "negative";
  investmentRecommendation: string;
  summary: string;
}

export interface DebateMessage {
  persona: string;
  role: string;
  color: string;
  message: string;
  round: number;
}

const categoryQuestions: Record<BusinessCategory, ClarificationQuestion[]> = {
  "Medical/Healthcare": [
    { id: 1, question: "What specific healthcare problem are you solving (e.g., diagnostics, treatment, patient management)?" },
    { id: 2, question: "Who is your target patient or healthcare provider demographic?" },
    { id: 3, question: "What regulatory approvals (FDA, CE mark) do you anticipate needing?" },
    { id: 4, question: "What is your planned go-to-market strategy — direct to hospitals, clinics, or patients?" },
    { id: 5, question: "How does your solution compare to existing treatments or tools on the market?" },
  ],
  "Food & Beverage": [
    { id: 1, question: "What is your core product concept — restaurant, packaged goods, delivery service, or other?" },
    { id: 2, question: "Who is your primary customer segment (families, health-conscious consumers, corporate, etc.)?" },
    { id: 3, question: "What is your supply chain strategy and key supplier relationships?" },
    { id: 4, question: "How do you plan to handle food safety regulations and certifications?" },
    { id: 5, question: "What is your planned unit economics — food cost percentage, pricing strategy, and target margins?" },
  ],
  "Technology": [
    { id: 1, question: "Is this a SaaS, marketplace, hardware, or consumer app product?" },
    { id: 2, question: "What is the core technical differentiator or proprietary IP?" },
    { id: 3, question: "What is your customer acquisition strategy — inbound, outbound, product-led growth?" },
    { id: 4, question: "What is your target market size and how did you arrive at that estimate?" },
    { id: 5, question: "What is your planned monetization model — subscription, usage-based, licensing, or ads?" },
  ],
  "Service": [
    { id: 1, question: "Is this a B2B, B2C, or marketplace service business?" },
    { id: 2, question: "How do you plan to scale — hiring more staff, technology leverage, or franchise model?" },
    { id: 3, question: "What is your key differentiator versus existing service providers in the space?" },
    { id: 4, question: "What is your customer retention strategy and expected lifetime value per customer?" },
    { id: 5, question: "How will you handle quality control as you scale your service delivery?" },
  ],
  "Retail": [
    { id: 1, question: "Is this an online, brick-and-mortar, or omnichannel retail concept?" },
    { id: 2, question: "What product categories will you sell and what is your sourcing strategy?" },
    { id: 3, question: "Who is your target customer and what is their average order value?" },
    { id: 4, question: "How do you plan to compete on price, selection, or experience against established retailers?" },
    { id: 5, question: "What inventory management and logistics approach will you use to manage costs?" },
  ],
  "Manufacturing": [
    { id: 1, question: "What product are you manufacturing and what is the production process?" },
    { id: 2, question: "What is your manufacturing capacity plan — own factory, contract manufacturing, or hybrid?" },
    { id: 3, question: "What are your key raw material inputs and supply chain risks?" },
    { id: 4, question: "Who are your target buyers — direct consumer, distributors, or OEM partners?" },
    { id: 5, question: "What are the key quality certifications or standards you need to meet for your market?" },
  ],
  "Finance": [
    { id: 1, question: "What financial product or service are you offering — lending, investing, payments, insurance, or advisory?" },
    { id: 2, question: "Which regulatory licenses or frameworks apply to your business (e.g., SEC, FINRA, OCC)?" },
    { id: 3, question: "Who is your target customer — retail consumers, small businesses, or institutional clients?" },
    { id: 4, question: "How do you plan to manage risk and fraud in your financial operations?" },
    { id: 5, question: "What is your revenue model — fees, interest spread, AUM percentage, or subscription?" },
  ],
  "Education": [
    { id: 1, question: "Is your offering K-12, higher education, professional development, or corporate training?" },
    { id: 2, question: "What is the delivery format — in-person, online, hybrid, or self-paced?" },
    { id: 3, question: "How do you measure learning outcomes and what results can you demonstrate?" },
    { id: 4, question: "Who pays — students, employers, school districts, or governments?" },
    { id: 5, question: "What is your content creation strategy and how will you keep curriculum current?" },
  ],
};

export function getClarificationQuestions(category: BusinessCategory): ClarificationQuestion[] {
  return categoryQuestions[category] || categoryQuestions["Technology"];
}

export function generateMarketAnalysis(
  category: BusinessCategory,
  answers: string[]
): MarketAnalysisResult {
  const categoryMultipliers: Record<BusinessCategory, number> = {
    "Technology": 1.4,
    "Medical/Healthcare": 1.3,
    "Finance": 1.2,
    "Education": 1.15,
    "Food & Beverage": 1.1,
    "Service": 1.05,
    "Retail": 1.0,
    "Manufacturing": 0.95,
  };

  const multiplier = categoryMultipliers[category] ?? 1.0;
  const baseGrowth = 65 + Math.floor(Math.random() * 20);
  const growthPotential = Math.min(95, Math.floor(baseGrowth * multiplier));

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const trendForecast = months.map((month, i) => {
    if (i < 7) {
      return {
        month,
        historical: Math.floor(40 + i * 8 + Math.random() * 15),
      };
    }
    return {
      month,
      predicted: Math.floor(90 + (i - 6) * 12 * multiplier + Math.random() * 10),
    };
  });

  const riskScores = [
    { category: "Market Risk", score: Math.floor(30 + Math.random() * 40) },
    { category: "Operational Risk", score: Math.floor(20 + Math.random() * 35) },
    { category: "Financial Risk", score: Math.floor(25 + Math.random() * 45) },
    { category: "Regulatory Risk", score: Math.floor(15 + Math.random() * 50) },
    { category: "Competition Risk", score: Math.floor(35 + Math.random() * 40) },
  ];

  const sentiments: MarketAnalysisResult["sentiment"][] = ["positive", "neutral", "negative"];
  const sentiment = growthPotential > 75 ? "positive" : growthPotential > 55 ? "neutral" : "negative";

  const recommendations: Record<BusinessCategory, string> = {
    "Technology": `Your ${category} venture shows strong market signals. With a ${growthPotential}% growth potential, we recommend prioritizing product-market fit validation in the next 90 days, followed by a Series A raise targeting $3-5M. Focus on reducing CAC through content-led growth and build moats around your data and network effects.`,
    "Medical/Healthcare": `The ${category} sector presents significant opportunity. With ${growthPotential}% growth potential, pursue FDA pre-submission meetings early and consider a pilot program with 2-3 health systems. Plan for an 18-24 month regulatory runway and structure your funding to bridge to first reimbursement milestone.`,
    "Food & Beverage": `Your ${category} concept shows ${growthPotential}% growth potential in current market conditions. Recommend launching in a single city to refine unit economics before scaling. Target 60-65% gross margins on packaged goods or 70%+ on service components. Build brand story around authentic differentiation.`,
    "Finance": `${category} shows ${growthPotential}% growth potential with moderate regulatory headwinds. Prioritize licensing requirements as your critical path. Consider a banking-as-a-service partnership to accelerate time-to-market while pursuing your own charter. Target underserved segments where incumbents have poor NPS scores.`,
    "Education": `${category} demonstrates ${growthPotential}% market growth potential. Recommend an outcomes-first go-to-market: lead with measurable results data. Pursue school district or employer contracts for predictable ARR, complemented by direct-to-consumer for scale. Build a community around learners to reduce churn.`,
    "Service": `Your ${category} business shows ${growthPotential}% growth potential. Focus on systematizing delivery before scaling headcount. Identify your 3-5 anchor clients in the first year and build case studies around them. Consider a technology layer to improve margins as you grow beyond initial service capacity.`,
    "Retail": `${category} analysis shows ${growthPotential}% growth potential. Lead with online to test product-market fit with minimal inventory risk, then expand to physical retail once you have proven demand. Focus on LTV:CAC ratio >3:1 before scaling paid acquisition. Build a loyalty program from day one to improve retention economics.`,
    "Manufacturing": `${category} shows ${growthPotential}% growth potential. Consider contract manufacturing for your first 12 months to preserve capital while validating demand. Target a 45-55% gross margin threshold before scaling production. Secure 2-3 anchor purchase orders before signing long-term supplier contracts.`,
  };

  return {
    trendForecast,
    riskScores,
    growthPotential,
    sentiment,
    investmentRecommendation: recommendations[category] ?? recommendations["Technology"],
    summary: `Analysis complete for ${category} business with ${answers.filter(Boolean).length} data points gathered. Market conditions are ${sentiment} with ${growthPotential}% growth potential over the next 12 months.`,
  };
}

export interface DebatePersona {
  name: string;
  role: string;
  color: string;
  bgColor: string;
  perspective: string;
}

export const debatePersonas: DebatePersona[] = [
  {
    name: "Alex Chen",
    role: "Bull Investor",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800",
    perspective: "bullish",
  },
  {
    name: "Morgan Hayes",
    role: "Bear Analyst",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
    perspective: "bearish",
  },
  {
    name: "Sam Rivera",
    role: "Market Skeptic",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800",
    perspective: "skeptical",
  },
  {
    name: "Jordan Kim",
    role: "Growth Advocate",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
    perspective: "growth",
  },
];

const debateScripts: Record<string, string[][]> = {
  bullish: [
    [
      "The fundamentals here are incredibly strong. We're seeing a convergence of technology maturation, market readiness, and favorable macro conditions that creates a perfect storm for this business to succeed.",
      "Looking at comparable exits in this space over the last 5 years, the median multiple is 8-12x revenue. If this team executes even at 70% of their plan, we're looking at a 3-4x return on reasonable entry valuations.",
      "The total addressable market is consistently underestimated by skeptics. As we saw with mobile, cloud, and now AI — these markets expand far beyond initial projections once network effects kick in.",
      "My thesis is simple: the founding team has done this before, the market timing is right, and the competitive moat is defensible. That's a rare combination worth backing aggressively.",
      "Early user data and retention metrics are the tell here. When you see NPS scores above 70 combined with 85%+ day-30 retention, you have evidence of genuine product-market fit — not vanity metrics.",
    ],
    [
      "I've deployed capital into 47 companies at this stage, and the pattern recognition is clear: this has the hallmarks of a category-defining company. The revenue trajectory mirrors Stripe's early years almost exactly.",
      "The bears are focusing on the wrong risks. Yes, competition exists — but this team's execution velocity and product quality creates a compounding advantage that's very hard to replicate once they achieve scale.",
      "With current interest rates stabilizing and institutional investors searching for yield, growth-stage companies with strong unit economics are experiencing a flight-to-quality. This company is positioned perfectly.",
    ],
  ],
  bearish: [
    [
      "I've seen this movie before, and it doesn't end well. The burn rate is unsustainable, the market assumptions are wildly optimistic, and there are at least three well-funded incumbents who will simply outspend them into irrelevance.",
      "Let's look at the customer acquisition cost math honestly. At their current CAC of roughly $340 and an LTV of $800, they need perfection in execution just to break even — there's zero margin for the inevitable market headwinds.",
      "The competitive analysis in this deck is dangerously incomplete. They've dismissed the three largest competitors with vague claims of 'superior product' — but product advantages erode, price advantages don't.",
      "Their go-to-market assumption that enterprise sales cycles will average 45 days is frankly delusional. I've seen this market — 180 days is optimistic, 270 is more realistic. That blows up the entire financial model.",
      "The regulatory environment is shifting in ways that will disproportionately hurt late movers in this space. The compliance costs alone could consume 2-3 years of runway.",
    ],
    [
      "The revenue projections assume 40% month-over-month growth sustained for 18 months. Show me ONE company that has sustained that without massive capital injection. The math simply doesn't work.",
      "I'm not opposed to investing in this space — I'm opposed to investing at this valuation with these unit economics at this burn rate. Fix two of those three and we can have a real conversation.",
      "The churn data they're presenting is cherry-picked from their best cohort. When you look at the full picture including the enterprise customers who churned in Q2, the retention story falls apart completely.",
    ],
  ],
  skeptical: [
    [
      "I'm going to push back on both of my colleagues here. The bulls are too enamored with the vision and the bears are too focused on current metrics. Neither is asking the right question: what does the market actually want?",
      "The technology works — I'll grant them that. But 'it works' and 'customers will pay for it' are separated by a chasm that most startups fall into. Where's the evidence of willingness to pay at scale?",
      "Has anyone actually talked to the customers who didn't convert? Because I did my own research, and the pattern I'm hearing is that the product is impressive in demos but creates workflow disruption that IT teams resist.",
      "The partnership announcements sound impressive until you read the fine print. These are 'preferred vendor' relationships with no revenue guarantees. I've seen these vaporize when the partner's strategic priorities shift.",
      "I want to believe in this company, but belief isn't an investment thesis. Give me three falsifiable predictions for the next 12 months and I'll tell you whether this is worth the risk.",
    ],
    [
      "The question I keep coming back to is: why now? What has changed in the last 12 months that makes this viable when three prior attempts in this exact space failed? The team hasn't answered that satisfactorily.",
      "The reference customer everyone keeps citing is a design partner who got 90% off. That's not a customer, that's a test subject. Real price discovery hasn't happened yet.",
      "My concern is sequencing risk. They need A to happen before B, B before C, and C before D — and each dependency has a 70% probability of success. That's a 24% chance of reaching D on plan.",
    ],
  ],
  growth: [
    [
      "Let's zoom out and think about the 10-year vision here. The near-term unit economics debate misses the forest for the trees. The companies that transformed industries — Amazon, Uber, Airbnb — all looked 'uneconomical' in year 1-3.",
      "The network effects in this model are genuinely rare and potentially very powerful. Once they cross the 10,000 user threshold, the value proposition improves exponentially, which changes all the CAC and LTV math.",
      "I've been watching emerging market dynamics closely, and the international expansion opportunity is completely unpriced in the current valuation. Southeast Asia and Latin America alone represent a 5x TAM expansion.",
      "The team's previous venture reached $40M ARR before acquisition. That pedigree and the operational muscle they've built creates execution advantages that don't show up on any spreadsheet.",
      "The platform play they're hinting at in their roadmap is the real story. If they execute on the API strategy, they become infrastructure — and infrastructure companies command 15-25x revenue multiples.",
    ],
    [
      "Data from our portfolio shows that companies with this combination of growth rate and net revenue retention consistently outperform valuation models by 40-60% at exit. The skeptics are using outdated frameworks.",
      "The hiring roadmap is the most underappreciated slide in the deck. They've identified the exact talent they need at each stage of growth — that's organizational design sophistication I rarely see at this stage.",
      "Macro headwinds are real, but this company is building countercyclical value. When budgets tighten, tools that demonstrably improve efficiency see accelerated adoption. They're a 'save money' sell, not a 'nice to have.'",
    ],
  ],
};

export function generateDebateMessages(topic: string, rounds: number): DebateMessage[] {
  const messages: DebateMessage[] = [];

  for (let round = 1; round <= rounds; round++) {
    const personasForRound = round === 1
      ? debatePersonas
      : debatePersonas.slice().sort(() => Math.random() - 0.5).slice(0, 2 + (round % 2));

    for (const persona of personasForRound) {
      const scripts = debateScripts[persona.perspective];
      const roundScripts = round <= 2 ? scripts[0] : scripts[1] || scripts[0];
      const idx = (round - 1) % roundScripts.length;
      const baseMessage = roundScripts[idx];

      messages.push({
        persona: persona.name,
        role: persona.role,
        color: persona.color,
        message: `[Round ${round}] ${baseMessage}`,
        round,
      });
    }
  }

  return messages;
}
