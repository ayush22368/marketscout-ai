import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { analyzeMarket } from "@/lib/market.functions";
import type { MarketInput, MarketReport } from "@/lib/market.types";
import { Dashboard } from "@/components/scout/Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BUDGET_UNITS, CUSTOMER_OPTIONS, formatBudget } from "@/lib/market-form-options";
import { Check, Loader2, Radar, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MarketScout AI — Should you start this business here?" },
      { name: "description", content: "Live competitor, review, demand, news and cost research turned into a clear go/no-go business recommendation." },
      { property: "og:title", content: "MarketScout AI — Should you start this business here?" },
      { property: "og:description", content: "Live market research turned into an opportunity score and clear recommendation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const STEPS = [
  "Planning research for your market",
  "Mapping nearby competitors",
  "Reading competitor customer reviews",
  "Measuring search demand trends",
  "Scanning local news & developments",
  "Pricing equipment & startup costs",
  "Finding the market gap & scoring",
];

const EXAMPLE: MarketInput = { business: "Premium Gym", location: "Nashik", budget: "₹15 lakh", targetCustomers: "Students + young professionals" };

function Index() {
  const [form, setForm] = useState<MarketInput>({ business: "", location: "", budget: "", targetCustomers: "" });
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetUnit, setBudgetUnit] = useState<(typeof BUDGET_UNITS)[number]>("Lakh");
  const [customerPreset, setCustomerPreset] = useState("");
  const [report, setReport] = useState<MarketReport | null>(null);
  const fn = useServerFn(analyzeMarket);
  const mutation = useMutation({ mutationFn: (data: MarketInput) => fn({ data }), onSuccess: setReport });

  if (report) return <Dashboard report={report} onReset={() => { setReport(null); mutation.reset(); }} />;
  if (mutation.isPending) return <Research input={mutation.variables ?? form} />;

  const set = (k: keyof MarketInput) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  const updateBudget = (amount: string, unit: (typeof BUDGET_UNITS)[number]) => {
    setBudgetAmount(amount);
    setBudgetUnit(unit);
    setForm((current) => ({ ...current, budget: formatBudget(amount, unit) }));
  };
  const chooseCustomer = (value: string) => {
    setCustomerPreset(value);
    setForm((current) => ({ ...current, targetCustomers: value === "Other" ? "" : value }));
  };
  const loadExample = () => {
    setForm(EXAMPLE);
    setBudgetAmount("15");
    setBudgetUnit("Lakh");
    setCustomerPreset("Other");
  };
  const valid = form.business.trim().length > 1 && form.location.trim().length > 1 && form.budget.trim() && form.targetCustomers.trim().length > 1;

  return (
    <main className="bg-hero grid-bg min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-4 py-12 md:px-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="animate-rise">
          <div className="flex items-center gap-2 font-display text-lg font-bold"><Radar className="h-5 w-5 text-primary" /> MarketScout AI</div>
          <h1 className="mt-8 text-5xl font-extrabold leading-[1.02] md:text-7xl">Should you start this business <span className="text-primary">here?</span></h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">We map competitors, read their reviews, measure demand, scan local news and price your equipment — then give you a clear answer and how to stand out.</p>
          <div className="mt-8 grid max-w-lg grid-cols-3 gap-3 font-mono text-xs text-muted-foreground">
            {["Live competitor map", "Review pain points", "Opportunity score"].map((t) => <div key={t} className="rounded-lg border bg-card/60 p-3">{t}</div>)}
          </div>
        </div>
        <form
          className="panel animate-rise space-y-5 p-6 md:p-8"
          style={{ animationDelay: "120ms" }}
          onSubmit={(e) => { e.preventDefault(); if (valid) mutation.mutate(form); }}
        >
          <div>
            <h2 className="text-2xl font-bold">Describe your idea</h2>
            <p className="text-sm text-muted-foreground">Takes about a minute to research.</p>
          </div>
          <Field id="business" label="Business type" placeholder="e.g. Premium Gym" value={form.business} onChange={set("business")} />
          <Field id="location" label="Location" placeholder="e.g. Nashik" value={form.location} onChange={set("location")} />
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget</Label>
              <div className="grid grid-cols-[minmax(0,1fr)_7.5rem]">
                <Input id="budget" inputMode="decimal" className="h-11 rounded-r-none bg-surface" maxLength={12} placeholder="e.g. 15" value={budgetAmount} onChange={(e) => updateBudget(e.target.value.replace(/[^0-9.]/g, ""), budgetUnit)} />
                <Select value={budgetUnit} onValueChange={(value) => updateBudget(budgetAmount, value as (typeof BUDGET_UNITS)[number])}>
                  <SelectTrigger aria-label="Budget unit" className="h-11 rounded-l-none border-l-0 bg-surface">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>{BUDGET_UNITS.map((unit) => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-customers">Target customers</Label>
              <Select value={customerPreset} onValueChange={chooseCustomer}>
                <SelectTrigger id="target-customers" className="h-11 bg-surface"><SelectValue placeholder="Select customers" /></SelectTrigger>
                <SelectContent>{CUSTOMER_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
              </Select>
              {customerPreset === "Other" && <Input aria-label="Other target customers" className="h-11 bg-surface" maxLength={160} placeholder="Describe your customers" value={form.targetCustomers} onChange={set("targetCustomers")} />}
            </div>
          </div>
          {mutation.isError && <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-danger">{mutation.error.message}</p>}
          <Button type="submit" size="lg" className="glow h-12 w-full text-base font-semibold" disabled={!valid}><Sparkles /> Analyze Market</Button>
          <Button type="button" variant="ghost" className="w-full text-muted-foreground hover:text-foreground" onClick={loadExample}>
            Try an example: Premium Gym in Nashik
          </Button>
        </form>
      </div>
    </main>
  );
}

function Field({ id, label, ...rest }: { id: string; label: string; placeholder: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} className="h-11 bg-surface" maxLength={150} {...rest} />
    </div>
  );
}

function Research({ input }: { input: MarketInput }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 7000);
    return () => clearInterval(t);
  }, []);
  return (
    <main className="bg-hero grid-bg flex min-h-screen items-center justify-center px-4">
      <div className="panel animate-rise w-full max-w-lg p-8">
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
          <span className="animate-ping-soft absolute h-12 w-12 rounded-full bg-primary/40" />
          <Radar className="relative h-10 w-10 text-primary" />
        </div>
        <h2 className="text-center text-2xl font-bold">Researching {input.business}</h2>
        <p className="text-center text-sm text-muted-foreground">in {input.location}</p>
        <ul className="mt-8 space-y-3">
          {STEPS.map((s, i) => (
            <li key={s} className={`flex items-center gap-3 text-sm transition-opacity ${i > step ? "opacity-35" : ""}`}>
              {i < step ? <Check className="h-4 w-4 text-primary" /> : i === step ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <span className="h-4 w-4 rounded-full border" />}
              {s}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
