export type MarketInput = {
  business: string;
  location: string;
  budget: string;
  targetCustomers: string;
};

export type Competitor = {
  name: string;
  rating: number | null;
  reviews: number;
  address: string;
  lat: number | null;
  lng: number | null;
  distanceKm: number | null;
  type: string;
};

export type Verdict =
  | "Strong Opportunity"
  | "Good Opportunity"
  | "Moderate Opportunity"
  | "Weak Opportunity"
  | "High Risk";

export type Mention = { label: string; mentions: number; example: string };

export type Analysis = {
  verdict: Verdict;
  headline: string;
  why: string;
  strategy: string;
  scores: {
    overall: number;
    demand: number;
    competition: number;
    customerGap: number;
    pricing: number;
    location: number;
  };
  scoreRationale: {
    demand: string;
    competition: string;
    customerGap: string;
    pricing: string;
    location: string;
  };
  painPoints: Mention[];
  positives: Mention[];
  demand: {
    level: "Low" | "Medium" | "High";
    trend: "Declining" | "Stable" | "Growing";
    signals: string[];
  };
  developments: {
    title: string;
    impact: "Positive" | "Negative" | "Neutral";
    explanation: string;
    source: string;
    link: string;
  }[];
  costs: { item: string; low: number; high: number; note: string }[];
  budgetFit: string;
  marketGap: { title: string; reasons: string[]; differentiation: string[] };
  evidence: { topic: string; points: string[] }[];
};

export type NewsItem = { title: string; source: string; date: string; link: string };
export type ShoppingItem = { category: string; title: string; price: number; source: string; link: string };

export type MarketReport = {
  input: MarketInput;
  currency: string;
  competitors: Competitor[];
  center: { lat: number; lng: number } | null;
  trend: { date: string; value: number }[];
  trendKeyword: string;
  trendChangePct: number | null;
  reviewsAnalyzed: number;
  news: NewsItem[];
  shopping: ShoppingItem[];
  analysis: Analysis;
  generatedAt: string;
};
