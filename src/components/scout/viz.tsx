import type { Competitor } from "@/lib/market.types";
import { useState } from "react";

export function scoreTone(v: number) {
  if (v >= 75) return "text-signal";
  if (v >= 55) return "text-warn";
  return "text-danger";
}
export function scoreStroke(v: number) {
  if (v >= 75) return "var(--signal)";
  if (v >= 55) return "var(--warn)";
  return "var(--danger)";
}

export function ScoreRing({ value, size = 180, stroke = 12, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={scoreStroke(v)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (v / 100) * c}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.7,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl font-extrabold tabular-nums">{v}</span>
        <span className="font-mono text-xs text-muted-foreground">/ 100</span>
        {label && <span className="eyebrow mt-1">{label}</span>}
      </div>
    </div>
  );
}

export function Bar({ value, max = 100, tone = "var(--signal)" }: { value: number; max?: number; tone?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (value / Math.max(max, 1)) * 100)}%`, background: tone }} />
    </div>
  );
}

export function TrendChart({ data }: { data: { date: string; value: number }[] }) {
  if (data.length < 2) return <p className="text-sm text-muted-foreground">No trend data available for this keyword.</p>;
  const w = 600;
  const h = 140;
  const max = Math.max(...data.map((d) => d.value), 1);
  const pts = data.map((d, i) => [(i / (data.length - 1)) * w, h - (d.value / max) * (h - 10) - 4] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-36 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="tg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--signal)" stopOpacity="0.35" />
            <stop offset="1" stopColor="var(--signal)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${line} L${w},${h} L0,${h} Z`} fill="url(#tg)" />
        <path d={line} fill="none" stroke="var(--signal)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

export function CompetitorMap({ competitors, center }: { competitors: Competitor[]; center: { lat: number; lng: number } | null }) {
  const [hover, setHover] = useState<number | null>(null);
  const pts = competitors
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c.lat != null && c.lng != null);
  if (!center || pts.length === 0) return <p className="text-sm text-muted-foreground">No location data for competitors.</p>;
  const cos = Math.cos((center.lat * Math.PI) / 180);
  const xy = pts.map(({ c, i }) => ({ c, i, x: ((c.lng as number) - center.lng) * cos, y: (c.lat as number) - center.lat }));
  const span = Math.max(...xy.map((p) => Math.max(Math.abs(p.x), Math.abs(p.y))), 0.002) * 1.15;
  const maxRev = Math.max(...pts.map((p) => p.c.reviews), 1);
  const maxKm = Math.max(...pts.map((p) => p.c.distanceKm ?? 0), 0.5);
  const S = 400;
  const proj = (v: number) => S / 2 + (v / span) * (S / 2 - 16);
  const active = hover != null ? competitors[hover] : null;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${S} ${S}`} className="grid-bg aspect-square w-full rounded-xl border bg-surface">
        {[0.33, 0.66, 1].map((f) => (
          <circle key={f} cx={S / 2} cy={S / 2} r={(S / 2 - 16) * f} fill="none" stroke="var(--border)" strokeDasharray="4 6" />
        ))}
        <line x1={S / 2} x2={S / 2} y1={8} y2={S - 8} stroke="var(--border)" />
        <line y1={S / 2} y2={S / 2} x1={8} x2={S - 8} stroke="var(--border)" />
        <circle cx={S / 2} cy={S / 2} r={6} fill="var(--info)" />
        <circle cx={S / 2} cy={S / 2} r={6} fill="var(--info)" className="animate-ping-soft origin-center" style={{ transformBox: "fill-box" }} />
        {xy.map(({ c, i, x, y }) => {
          const r = 5 + Math.sqrt(c.reviews / maxRev) * 14;
          const fill = c.rating == null ? "var(--muted-foreground)" : c.rating >= 4.5 ? "var(--danger)" : c.rating >= 4 ? "var(--warn)" : "var(--signal)";
          return (
            <circle
              key={i}
              cx={proj(x)}
              cy={proj(-y)}
              r={r}
              fill={fill}
              fillOpacity={hover === i ? 0.95 : 0.55}
              stroke={fill}
              strokeWidth={hover === i ? 3 : 1.5}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className="cursor-pointer transition-all"
            />
          );
        })}
        <text x={12} y={S - 12} className="fill-muted-foreground font-mono" fontSize="10">
          outer ring ≈ {(maxKm * 1.15).toFixed(1)} km
        </text>
      </svg>
      {active && (
        <div className="panel pointer-events-none absolute left-3 top-3 max-w-[70%] p-3 text-sm">
          <div className="font-semibold">{active.name}</div>
          <div className="font-mono text-xs text-muted-foreground">
            ★ {active.rating ?? "–"} · {active.reviews} reviews · {active.distanceKm ?? "?"} km
          </div>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-4 font-mono text-[11px] text-muted-foreground">
        <Legend color="var(--info)" label="Market center" />
        <Legend color="var(--danger)" label="Strong (4.5★+)" />
        <Legend color="var(--warn)" label="Solid (4–4.5★)" />
        <Legend color="var(--signal)" label="Weak (<4★)" />
        <span>size = review volume</span>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
