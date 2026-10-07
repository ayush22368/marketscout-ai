import type { MarketReport } from "@/lib/market.types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Bar, CompetitorMap, ScoreRing, TrendChart, scoreStroke, scoreTone } from "./viz";
import {
  ArrowLeft, ArrowUpRight, Building2, Coins, ExternalLink, FileSearch, Flame, Lightbulb, MapPin, Newspaper,
  Printer, Star, ThumbsDown, ThumbsUp, TrendingDown, TrendingUp, Minus, Target,
} from "lucide-react";
import type { ReactNode } from "react";

function money(n: number, currency: string) {
  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency", currency, notation: "compact", maximumFractionDigits: 1,
    }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString()}`;
  }
}

function Section({ icon, eyebrow, title, children, className = "", action }: { icon: ReactNode; eyebrow: string; title: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={`panel animate-rise p-6 ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-primary">{icon}</div>
          <div>
            <div className="eyebrow">{eyebrow}</div>
            <h3 className="text-lg font-bold">{title}</h3>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

const SCORE_KEYS = [
  ["demand", "Demand"],
  ["competition", "Competition"],
  ["customerGap", "Customer Gap"],
  ["pricing", "Pricing"],
  ["location", "Location"],
] as const;

export function Dashboard({ report, onReset }: { report: MarketReport; onReset: () => void }) {
  const a = report.analysis;
  const { input, currency } = report;
  const comps = [...report.competitors].sort((x, y) => y.reviews - x.reviews);
  const rated = comps.filter((c) => c.rating != null);
  const avgRating = rated.length ? (rated.reduce((s, c) => s + (c.rating ?? 0), 0) / rated.length).toFixed(1) : "–";
  const maxPain = Math.max(...a.painPoints.map((p) => p.mentions), 1);
  const maxPos = Math.max(...a.positives.map((p) => p.mentions), 1);
  const totalLow = a.costs.reduce((s, c) => s + c.low, 0);
  const totalHigh = a.costs.reduce((s, c) => s + c.high, 0);
  const TrendIcon = a.demand.trend === "Growing" ? TrendingUp : a.demand.trend === "Declining" ? TrendingDown : Minus;
  const crowd = comps.length >= 15 ? "Crowded" : comps.length >= 8 ? "Moderately crowded" : "Open";

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 pb-20 pt-6 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={onReset}><ArrowLeft /> New analysis</Button>
        <div className="flex gap-2">
          <EvidenceDialog report={report} />
          <Button variant="outline" onClick={() => window.print()}><Printer /> Print report</Button>
        </div>
      </div>

      {/* Verdict */}
      <section className="panel bg-hero animate-rise relative overflow-hidden p-6 md:p-10">
        <div className="grid items-center gap-8 md:grid-cols-[auto_1fr]">
          <div className="flex justify-center"><ScoreRing value={a.scores.overall} size={210} stroke={14} label="Opportunity" /></div>
          <div>
            <div className="eyebrow">Should I start this business?</div>
            <h1 className={`mt-2 text-4xl font-extrabold md:text-6xl ${scoreTone(a.scores.overall)}`}>{a.verdict}</h1>
            <p className="mt-3 text-xl font-semibold">{a.headline}</p>
            <p className="mt-3 max-w-3xl text-muted-foreground">{a.why}</p>
            <div className="mt-5 rounded-xl border bg-surface p-4">
              <div className="eyebrow flex items-center gap-2"><Target className="h-3.5 w-3.5" /> Recommended strategy</div>
              <p className="mt-1.5">{a.strategy}</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 font-mono text-xs text-muted-foreground">
              <Chip>{input.business}</Chip><Chip><MapPin className="h-3 w-3" />{input.location}</Chip><Chip>Budget {input.budget}</Chip><Chip>{input.targetCustomers}</Chip>
            </div>
          </div>
        </div>
      </section>

      {/* Score breakdown */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {SCORE_KEYS.map(([k, label], i) => (
          <div key={k} className="panel animate-rise p-5" style={{ animationDelay: `${i * 70}ms` }}>
            <div className="eyebrow">{label}</div>
            <div className={`mt-1 font-display text-4xl font-extrabold tabular-nums ${scoreTone(a.scores[k])}`}>{a.scores[k]}<span className="text-base text-muted-foreground">/100</span></div>
            <div className="mt-3"><Bar value={a.scores[k]} tone={scoreStroke(a.scores[k])} /></div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{a.scoreRationale[k]}</p>
          </div>
        ))}
      </section>

      {/* Market gap */}
      <section className="panel glow animate-rise p-6 md:p-8">
        <div className="eyebrow flex items-center gap-2 text-primary"><Lightbulb className="h-4 w-4" /> Identified market gap</div>
        <h2 className="mt-2 text-3xl font-extrabold md:text-4xl">{a.marketGap.title}</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <div className="mb-2 text-sm font-semibold">Why this gap exists</div>
            <ul className="space-y-2">{a.marketGap.reasons.map((r) => <li key={r} className="flex gap-2 text-sm text-muted-foreground"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{r}</li>)}</ul>
          </div>
          <div>
            <div className="mb-2 text-sm font-semibold">How to differentiate</div>
            <div className="flex flex-wrap gap-2">{a.marketGap.differentiation.map((d) => <span key={d} className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm text-primary">{d}</span>)}</div>
          </div>
        </div>
      </section>

      {/* Competition */}
      <Section icon={<Building2 className="h-4 w-4" />} eyebrow="Competition analysis" title={`${comps.length} competitors found · ${crowd}`}
        action={<a className="hidden items-center gap-1 text-sm text-primary hover:underline sm:flex" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/${encodeURIComponent(`${input.business} in ${input.location}`)}`}>Open in Maps <ArrowUpRight className="h-3.5 w-3.5" /></a>}>
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <CompetitorMap competitors={report.competitors} center={report.center} />
          <div>
            <div className="mb-4 grid grid-cols-3 gap-3">
              <Stat label="Competitors" value={String(comps.length)} />
              <Stat label="Avg rating" value={`${avgRating}★`} />
              <Stat label="Total reviews" value={comps.reduce((s, c) => s + c.reviews, 0).toLocaleString()} />
            </div>
            <div className="max-h-[360px] overflow-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface text-left"><tr className="eyebrow"><th className="p-3">Name</th><th className="p-3">Rating</th><th className="p-3">Reviews</th><th className="p-3">Dist.</th></tr></thead>
                <tbody>
                  {comps.map((c) => (
                    <tr key={c.name + c.address} className="border-t">
                      <td className="p-3"><div className="font-medium">{c.name}</div><div className="truncate text-xs text-muted-foreground max-w-[220px]">{c.address}</div></td>
                      <td className="p-3 font-mono"><span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-warn text-warn" />{c.rating ?? "–"}</span></td>
                      <td className="p-3 font-mono">{c.reviews.toLocaleString()}</td>
                      <td className="p-3 font-mono">{c.distanceKm != null ? `${c.distanceKm} km` : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Section>

      {/* Reviews */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section icon={<ThumbsDown className="h-4 w-4" />} eyebrow={`From ${report.reviewsAnalyzed} reviews`} title="Customer pain points">
          <ul className="space-y-4">{a.painPoints.map((p) => (
            <li key={p.label}>
              <div className="flex justify-between text-sm"><span className="font-semibold">{p.label}</span><span className="font-mono text-danger">{p.mentions} mentions</span></div>
              <div className="mt-1.5"><Bar value={p.mentions} max={maxPain} tone="var(--danger)" /></div>
              <p className="mt-1.5 text-xs italic text-muted-foreground">“{p.example}”</p>
            </li>))}
          </ul>
        </Section>
        <Section icon={<ThumbsUp className="h-4 w-4" />} eyebrow="What customers already love" title="Positive signals">
          <ul className="space-y-4">{a.positives.map((p) => (
            <li key={p.label}>
              <div className="flex justify-between text-sm"><span className="font-semibold">{p.label}</span><span className="font-mono text-signal">{p.mentions} mentions</span></div>
              <div className="mt-1.5"><Bar value={p.mentions} max={maxPos} /></div>
              <p className="mt-1.5 text-xs italic text-muted-foreground">“{p.example}”</p>
            </li>))}
          </ul>
        </Section>
      </div>

      {/* Demand + Developments */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section icon={<Flame className="h-4 w-4" />} eyebrow={`Search interest · "${report.trendKeyword}" · 12 months`} title="Demand analysis">
          <div className="mb-5 grid grid-cols-3 gap-3">
            <Stat label="Demand score" value={`${a.scores.demand}/100`} tone={scoreTone(a.scores.demand)} />
            <Stat label="Search demand" value={a.demand.level} />
            <Stat label="Trend" value={<span className="inline-flex items-center gap-1"><TrendIcon className="h-4 w-4" />{a.demand.trend}</span>} />
          </div>
          <TrendChart data={report.trend} />
          {report.trendChangePct != null && <p className="mt-2 font-mono text-xs text-muted-foreground">Recent 8 weeks vs first 8 weeks: <span className={report.trendChangePct >= 0 ? "text-signal" : "text-danger"}>{report.trendChangePct >= 0 ? "+" : ""}{report.trendChangePct}%</span></p>}
          <ul className="mt-4 space-y-2">{a.demand.signals.map((s) => <li key={s} className="flex gap-2 text-sm text-muted-foreground"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-info" />{s}</li>)}</ul>
        </Section>
        <Section icon={<Newspaper className="h-4 w-4" />} eyebrow="Local news & development" title="What could change demand">
          <ul className="space-y-3">{a.developments.map((d) => (
            <li key={d.title} className="rounded-xl border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="font-semibold leading-snug">{d.title}</div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase ${d.impact === "Positive" ? "bg-primary/15 text-signal" : d.impact === "Negative" ? "bg-destructive/15 text-danger" : "bg-muted text-muted-foreground"}`}>{d.impact}</span>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">{d.explanation}</p>
              {d.link && <a href={d.link} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">{d.source || "Source"} <ExternalLink className="h-3 w-3" /></a>}
            </li>))}
          </ul>
        </Section>
      </div>

      {/* Costs */}
      <Section icon={<Coins className="h-4 w-4" />} eyebrow="Approximate market price signals — not final costs" title="Startup cost signals">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
          <div className="grid gap-3 sm:grid-cols-2">
            {a.costs.map((c) => (
              <div key={c.item} className="rounded-xl border bg-surface p-4">
                <div className="flex justify-between gap-2"><span className="font-semibold">{c.item}</span><span className="font-mono text-sm">{money(c.low, currency)} – {money(c.high, currency)}</span></div>
                <p className="mt-1 text-xs text-muted-foreground">{c.note}</p>
              </div>
            ))}
          </div>
          <div className="flex min-w-[240px] flex-col justify-center rounded-xl border border-primary/30 bg-primary/5 p-5">
            <div className="eyebrow">Estimated total</div>
            <div className="mt-1 font-display text-3xl font-extrabold">{money(totalLow, currency)} – {money(totalHigh, currency)}</div>
            <p className="mt-2 text-sm text-muted-foreground">{a.budgetFit}</p>
          </div>
        </div>
      </Section>

      {/* Final report */}
      <Section icon={<FileSearch className="h-4 w-4" />} eyebrow="Final market report" title="Summary">
        <div className="grid gap-6 md:grid-cols-3">
          <ReportBlock title="Brief" items={[`Business: ${input.business}`, `Location: ${input.location}`, `Budget: ${input.budget}`, `Target: ${input.targetCustomers}`]} />
          <ReportBlock title={`Opportunity score: ${a.scores.overall}/100`} items={SCORE_KEYS.map(([k, l]) => `${l}: ${a.scores[k]}/100`)} />
          <ReportBlock title="Top pain points" items={a.painPoints.slice(0, 4).map((p) => `${p.label} — ${p.mentions} mentions`)} />
          <ReportBlock title="Demand signals" items={a.demand.signals.slice(0, 3)} />
          <ReportBlock title="Local developments" items={a.developments.slice(0, 3).map((d) => `${d.title} (${d.impact})`)} />
          <ReportBlock title="Cost signals" items={[...a.costs.slice(0, 4).map((c) => `${c.item}: ${money(c.low, currency)}–${money(c.high, currency)}`)]} />
          <ReportBlock title="Market gap" items={[a.marketGap.title]} />
          <ReportBlock title="Differentiation" items={a.marketGap.differentiation} />
          <ReportBlock title={`Recommendation: ${a.verdict}`} items={[a.strategy]} />
        </div>
      </Section>

      <p className="text-center font-mono text-xs text-muted-foreground">Generated {new Date(report.generatedAt).toLocaleString()} · Live search data + AI analysis. Verify key figures before investing.</p>
    </div>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded-full border bg-surface px-3 py-1">{children}</span>;
}
function Stat({ label, value, tone = "" }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="rounded-xl border bg-surface p-3">
      <div className="eyebrow !text-[10px]">{label}</div>
      <div className={`mt-1 font-display text-xl font-bold ${tone}`}>{value}</div>
    </div>
  );
}
function ReportBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border bg-surface p-4">
      <div className="text-sm font-bold">{title}</div>
      <ul className="mt-2 space-y-1">{items.map((i) => <li key={i} className="text-sm text-muted-foreground">{i}</li>)}</ul>
    </div>
  );
}

function EvidenceDialog({ report }: { report: MarketReport }) {
  const a = report.analysis;
  return (
    <Dialog>
      <DialogTrigger asChild><Button><FileSearch /> View evidence</Button></DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display text-2xl">Evidence behind the conclusions</DialogTitle></DialogHeader>
        <Accordion type="multiple" defaultValue={[a.evidence[0]?.topic ?? ""]}>
          {a.evidence.map((e) => (
            <AccordionItem key={e.topic} value={e.topic}>
              <AccordionTrigger className="font-semibold">{e.topic}</AccordionTrigger>
              <AccordionContent><ul className="space-y-2">{e.points.map((p) => <li key={p} className="flex gap-2 text-sm text-muted-foreground"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{p}</li>)}</ul></AccordionContent>
            </AccordionItem>
          ))}
          <AccordionItem value="sources-comp">
            <AccordionTrigger className="font-semibold">Source: competitor listings ({report.competitors.length})</AccordionTrigger>
            <AccordionContent><ul className="space-y-1 font-mono text-xs text-muted-foreground">{report.competitors.map((c) => <li key={c.name + c.address}>{c.name} — ★{c.rating ?? "–"} · {c.reviews} reviews · {c.distanceKm ?? "?"} km</li>)}</ul></AccordionContent>
          </AccordionItem>
          <AccordionItem value="sources-news">
            <AccordionTrigger className="font-semibold">Source: news articles ({report.news.length})</AccordionTrigger>
            <AccordionContent><ul className="space-y-2 text-sm">{report.news.map((n) => <li key={n.link}><a className="text-primary hover:underline" href={n.link} target="_blank" rel="noreferrer">{n.title}</a> <span className="text-xs text-muted-foreground">— {n.source} {n.date}</span></li>)}</ul></AccordionContent>
          </AccordionItem>
          <AccordionItem value="sources-shop">
            <AccordionTrigger className="font-semibold">Source: product price listings ({report.shopping.length})</AccordionTrigger>
            <AccordionContent><ul className="space-y-1 text-xs text-muted-foreground">{report.shopping.map((s, i) => <li key={i}><span className="text-foreground">{s.category}</span> · {s.title} — <span className="font-mono">{s.price.toLocaleString()}</span> ({s.source})</li>)}</ul></AccordionContent>
          </AccordionItem>
          <AccordionItem value="sources-trend">
            <AccordionTrigger className="font-semibold">Source: search trend data</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">Google Trends interest for “{report.trendKeyword}” over 12 months ({report.trend.length} data points). Change recent vs early period: {report.trendChangePct ?? "n/a"}%. Reviews analysed: {report.reviewsAnalyzed}.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </DialogContent>
    </Dialog>
  );
}
