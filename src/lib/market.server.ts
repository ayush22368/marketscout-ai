import type { Analysis, Competitor, MarketInput, MarketReport, NewsItem, ShoppingItem } from "./market.types";

// All secrets are read from server environment variables only.
// Anyone running this code must provide their own SERPAPI_API_KEY.

type Json = Record<string, unknown>;

async function serp(params: Record<string, string>): Promise<Json> {
  const key = process.env["SERPAPI_API_KEY"];
  if (!key) throw new Error("Search is not configured. Add your own SERPAPI_API_KEY secret.");
  const url = new URL("https://serpapi.com/search.json");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("api_key", key);
  const res = await fetch(url);
  if (!res.ok) {
    console.error("SerpAPI error", params["engine"], res.status, (await res.text()).slice(0, 300));
    throw new Error(`Search provider error (${res.status})`);
  }
  return (await res.json()) as Json;
}

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch (e) {
    console.error(e);
    return fallback;
  }
}

async function aiJson<T>(instructions: string, input: string, name: string, schema: Json, effort: "low" | "medium"): Promise<T> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured.");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      instructions,
      input,
      stream: true,
      store: false,
      reasoning: { effort, summary: "auto" },
      include: ["reasoning.encrypted_content"],
      text: { format: { type: "json_schema", name, strict: true, schema } },
    }),
  });
  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    console.error("AI gateway error", res.status, body.slice(0, 500));
    if (res.status === 402) throw new Error("AI credits are exhausted. Add credits in Settings → Plans & credits.");
    if (res.status === 429) throw new Error("Too many requests right now. Please try again in a minute.");
    let msg = "";
    try {
      const j = JSON.parse(body) as { error?: { message?: string }; message?: string };
      msg = j.error?.message ?? j.message ?? "";
    } catch {}
    throw new Error(msg || `AI analysis failed (${res.status})`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const chunk = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const ev = JSON.parse(data) as { type?: string; delta?: string; error?: { message?: string }; response?: { error?: { message?: string } } };
          if (ev.type === "response.output_text.delta" && ev.delta) text += ev.delta;
          if (ev.type === "response.failed" || ev.type === "error") {
            throw new Error(ev.error?.message ?? ev.response?.error?.message ?? "AI analysis failed");
          }
        } catch (e) {
          if (e instanceof Error && e.message.startsWith("AI")) throw e;
        }
      }
    }
  }
  if (!text) throw new Error("The AI returned no analysis. Please try again.");
  return JSON.parse(text) as T;
}

const str = { type: "string" } as const;
const int = { type: "integer" } as const;
const arr = (items: Json) => ({ type: "array", items });
const obj = (properties: Record<string, Json>) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
const en = (values: string[]) => ({ type: "string", enum: values });

const planSchema = obj({
  countryCode: str,
  currencyCode: str,
  trendKeyword: str,
  equipment: arr(obj({ category: str, query: str })),
});

const mention = obj({ label: str, mentions: int, example: str });
const analysisSchema = obj({
  verdict: en(["Strong Opportunity", "Good Opportunity", "Moderate Opportunity", "Weak Opportunity", "High Risk"]),
  headline: str,
  why: str,
  strategy: str,
  scores: obj({ overall: int, demand: int, competition: int, customerGap: int, pricing: int, location: int }),
  scoreRationale: obj({ demand: str, competition: str, customerGap: str, pricing: str, location: str }),
  painPoints: arr(mention),
  positives: arr(mention),
  demand: obj({ level: en(["Low", "Medium", "High"]), trend: en(["Declining", "Stable", "Growing"]), signals: arr(str) }),
  developments: arr(obj({ title: str, impact: en(["Positive", "Negative", "Neutral"]), explanation: str, source: str, link: str })),
  costs: arr(obj({ item: str, low: int, high: int, note: str })),
  budgetFit: str,
  marketGap: obj({ title: str, reasons: arr(str), differentiation: arr(str) }),
  evidence: arr(obj({ topic: str, points: arr(str) })),
});

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? 0;
};

export async function runMarketAnalysis(input: MarketInput): Promise<MarketReport> {
  const planP = aiJson<{ countryCode: string; currencyCode: string; trendKeyword: string; equipment: { category: string; query: string }[] }>(
    "You help plan market research. Return the ISO-3166 alpha-2 country code (lowercase) of the location, the ISO-4217 local currency code, a short generic Google Trends keyword for the business (1-2 words, e.g. 'gym'), and exactly 4 major startup equipment/product categories needed for this business with a concise shopping search query each.",
    `Business: ${input.business}\nLocation: ${input.location}`,
    "research_plan",
    planSchema,
    "low",
  );

  const mapsP = safe(serp({ engine: "google_maps", q: `${input.business} in ${input.location}`, type: "search", hl: "en" }), {} as Json);
  const plan = await planP;
  const gl = (plan.countryCode || "us").toLowerCase().slice(0, 2);

  const newsP = safe(
    serp({ engine: "google_news", q: `${input.location} new development OR infrastructure OR college OR residential OR metro`, gl, hl: "en" }),
    {} as Json,
  );
  const trendsP = safe(
    serp({ engine: "google_trends", q: plan.trendKeyword || input.business, geo: gl.toUpperCase(), data_type: "TIMESERIES", date: "today 12-m" }),
    {} as Json,
  );
  const shoppingP = Promise.all(
    plan.equipment.slice(0, 4).map(async (eq) => {
      const r = await safe(serp({ engine: "google_shopping", q: eq.query, gl, hl: "en" }), {} as Json);
      const items = ((r["shopping_results"] as Json[] | undefined) ?? []).slice(0, 6);
      return items
        .map((it): ShoppingItem => ({
          category: eq.category,
          title: String(it["title"] ?? ""),
          price: Number(it["extracted_price"] ?? 0),
          source: String(it["source"] ?? ""),
          link: String(it["product_link"] ?? it["link"] ?? ""),
        }))
        .filter((x) => x.price > 0);
    }),
  ).then((x) => x.flat());

  const maps = await mapsP;
  const local = ((maps["local_results"] as Json[] | undefined) ?? []).slice(0, 20);
  const raw = local.map((r) => {
    const gps = r["gps_coordinates"] as { latitude?: number; longitude?: number } | undefined;
    return {
      name: String(r["title"] ?? "Unknown"),
      rating: typeof r["rating"] === "number" ? (r["rating"] as number) : null,
      reviews: Number(r["reviews"] ?? 0),
      address: String(r["address"] ?? ""),
      lat: gps?.latitude ?? null,
      lng: gps?.longitude ?? null,
      type: String(r["type"] ?? ""),
      dataId: String(r["data_id"] ?? ""),
    };
  });
  const withGps = raw.filter((r) => r.lat != null && r.lng != null);
  const center = withGps.length
    ? { lat: median(withGps.map((r) => r.lat as number)), lng: median(withGps.map((r) => r.lng as number)) }
    : null;
  const competitors: Competitor[] = raw.map(({ dataId: _d, ...r }) => ({
    ...r,
    distanceKm: center && r.lat != null && r.lng != null ? Math.round(haversine(center, { lat: r.lat, lng: r.lng }) * 10) / 10 : null,
  }));

  const topForReviews = [...raw].filter((r) => r.dataId).sort((a, b) => b.reviews - a.reviews).slice(0, 4);
  const reviewSets = await Promise.all(
    topForReviews.map(async (c) => {
      const r = await safe(serp({ engine: "google_maps_reviews", data_id: c.dataId, hl: "en", sort_by: "newestFirst" }), {} as Json);
      const reviews = ((r["reviews"] as Json[] | undefined) ?? [])
        .map((rv) => ({
          rating: Number(rv["rating"] ?? 0),
          text: String(rv["snippet"] ?? (rv["extracted_snippet"] as Json | undefined)?.["original"] ?? "").slice(0, 350),
        }))
        .filter((rv) => rv.text);
      return { name: c.name, reviews };
    }),
  );
  const reviewsAnalyzed = reviewSets.reduce((n, s) => n + s.reviews.length, 0);

  const [news, trends, shopping] = await Promise.all([newsP, trendsP, shoppingP]);
  const newsItems: NewsItem[] = ((news["news_results"] as Json[] | undefined) ?? []).slice(0, 10).map((n) => ({
    title: String(n["title"] ?? ""),
    source: String((n["source"] as Json | undefined)?.["name"] ?? ""),
    date: String(n["date"] ?? ""),
    link: String(n["link"] ?? ""),
  }));
  const timeline = (((trends["interest_over_time"] as Json | undefined)?.["timeline_data"] as Json[] | undefined) ?? []).map((t) => ({
    date: String(t["date"] ?? ""),
    value: Number(((t["values"] as Json[] | undefined)?.[0]?.["extracted_value"]) ?? 0),
  }));
  let trendChangePct: number | null = null;
  if (timeline.length >= 16) {
    const avg = (xs: { value: number }[]) => xs.reduce((s, x) => s + x.value, 0) / Math.max(xs.length, 1);
    const first = avg(timeline.slice(0, 8));
    const last = avg(timeline.slice(-8));
    trendChangePct = first > 0 ? Math.round(((last - first) / first) * 100) : null;
  }

  const rated = competitors.filter((c) => c.rating != null);
  const avgRating = rated.length ? rated.reduce((s, c) => s + (c.rating ?? 0), 0) / rated.length : null;
  const research = {
    input,
    currency: plan.currencyCode,
    competitorStats: { count: competitors.length, avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null, totalReviews: competitors.reduce((s, c) => s + c.reviews, 0) },
    competitors: competitors.map((c) => ({ name: c.name, rating: c.rating, reviews: c.reviews, distanceKm: c.distanceKm })),
    reviews: reviewSets,
    searchTrend: { keyword: plan.trendKeyword, country: gl, last12MonthsWeekly: timeline.map((t) => t.value), changePctFirst8vsLast8Weeks: trendChangePct },
    news: newsItems,
    shoppingPrices: shopping.map((s) => ({ category: s.category, title: s.title.slice(0, 80), price: s.price, source: s.source })),
  };

  const analysis = await aiJson<Analysis>(
    `You are MarketScout AI, a rigorous market analyst helping a business owner decide whether to open a business in a location. Use ONLY the research data provided plus clearly labelled general knowledge. Rules:
- Scores are integers 0-100 where higher is better for the entrepreneur. competition: high = less crowded/weaker incumbents. customerGap: high = big unmet needs. pricing: high = budget fits and price room exists. location: high = favorable developments and demographics.
- overall = round(0.25*demand + 0.2*competition + 0.25*customerGap + 0.15*pricing + 0.15*location). Verdict: >=80 Strong, 68-79 Good, 55-67 Moderate, 40-54 Weak, <40 High Risk.
- painPoints and positives: cluster review themes; mentions = actual number of reviews in the data mentioning that theme. 3-6 each, sorted by mentions desc. example = short quote.
- demand.signals: 3-5 concrete signals citing trend numbers or counts.
- developments: 2-5 items, derived only from the provided news (copy title, source, link). If none are relevant say so in a single Neutral item with empty link.
- costs: 4-6 line items in ${plan.currencyCode} (integers, whole currency units) using the shopping prices as signals, scaled for a commercial setup. budgetFit: one sentence comparing the total to the stated budget.
- marketGap: the single most important unmet need, 3-4 reasons tied to evidence, 3-5 differentiation ideas.
- evidence: one entry each for topics "Demand score", "Competition score", "Customer gap", "Key complaints", "Local developments", "Final recommendation" with 2-4 specific data-backed points.
- why: 2-3 sentences. strategy: 1-2 sentences. headline: short punchy line. Be concise and specific.`,
    JSON.stringify(research),
    "market_analysis",
    analysisSchema,
    "medium",
  );

  return {
    input,
    currency: plan.currencyCode || "USD",
    competitors,
    center,
    trend: timeline,
    trendKeyword: plan.trendKeyword,
    trendChangePct,
    reviewsAnalyzed,
    news: newsItems,
    shopping,
    analysis,
    generatedAt: new Date().toISOString(),
  };
}
