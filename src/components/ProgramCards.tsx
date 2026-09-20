import Link from "next/link";
import {
  CATEGORY_META,
  getScores,
  overallScore,
  getPros,
  officialUrl,
  SCORE_CRITERIA,
  type Opportunity,
} from "@/lib/opportunities";

function toneClasses(tone: "earn" | "shop") {
  return tone === "shop"
    ? { text: "text-accent-warm", bg: "bg-accent-warm", soft: "bg-accent-warm/10", border: "border-accent-warm/60", bar: "bg-accent-warm" }
    : { text: "text-accent-alt", bg: "bg-accent", soft: "bg-accent/10", border: "border-accent/60", bar: "bg-accent" };
}

export function ScoreNumber({ slug, tone, size = "md" }: { slug: string; tone: "earn" | "shop"; size?: "md" | "lg" }) {
  const score = overallScore(slug);
  if (score == null) return null;
  const t = toneClasses(tone);
  const big = size === "lg";
  return (
    <div className={`grid place-items-center rounded-xl ${t.soft} ${big ? "w-20 h-20" : "w-14 h-14"} shrink-0`}>
      <div className={`font-mono font-extrabold tabular-nums leading-none ${t.text} ${big ? "text-3xl" : "text-xl"}`}>
        {score.toFixed(1)}
      </div>
      <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-text-faint mt-0.5">/ 10</div>
    </div>
  );
}

export function ScoreMeter({ slug, tone }: { slug: string; tone: "earn" | "shop" }) {
  const s = getScores(slug);
  if (!s) return null;
  const t = toneClasses(tone);
  return (
    <dl className="grid grid-cols-1 gap-2">
      {SCORE_CRITERIA.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-3">
          <dt className="w-32 shrink-0 text-xs text-text-dim">{label}</dt>
          <div className="flex-1 h-2 rounded-full bg-ink-muted overflow-hidden">
            <div className={`h-full rounded-full ${t.bar}`} style={{ width: `${s[key] * 10}%` }} />
          </div>
          <dd className="w-7 shrink-0 text-right font-mono text-xs font-bold tabular-nums text-text">{s[key]}</dd>
        </div>
      ))}
    </dl>
  );
}

function Logo({ name, tone }: { name: string; tone: "earn" | "shop" }) {
  const t = toneClasses(tone);
  return (
    <span className={`grid place-items-center w-12 h-12 rounded-xl bg-ink-muted border border-edge font-extrabold ${t.text} shrink-0`}>
      {name.slice(0, 2)}
    </span>
  );
}

function Ctas({ o, tone }: { o: Opportunity; tone: "earn" | "shop" }) {
  const url = officialUrl(o.slug);
  const t = toneClasses(tone);
  return (
    <div className="flex items-center gap-3">
      {url && (
        <a
          href={url}
          target="_blank"
          rel="sponsored nofollow noopener"
          className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-btn text-sm font-bold text-ink ${t.bg} hover:opacity-90 transition-opacity`}
        >
          Visit {o.name} ↗
        </a>
      )}
      <Link href={`/programs/${o.slug}`} className="text-sm font-bold text-text-dim hover:text-text">
        {o.review ? "Read review →" : "Details →"}
      </Link>
    </div>
  );
}

function ProsCons({ o, tone }: { o: Opportunity; tone: "earn" | "shop" }) {
  const pros = getPros(o.slug);
  const t = toneClasses(tone);
  return (
    <div className="space-y-1.5">
      {pros.map((p) => (
        <div key={p} className="flex items-start gap-2 text-sm">
          <span className={`${t.text} font-bold leading-5`}>✓</span>
          <span className="text-text-dim">{p}</span>
        </div>
      ))}
      <div className="flex items-start gap-2 text-sm">
        <span className="text-accent-warm font-bold leading-5">!</span>
        <span className="text-text-dim">
          <span className="font-semibold text-text">The catch:</span> {o.catch}
        </span>
      </div>
    </div>
  );
}

/** The big #1 pick at the top of a category. */
export function FeaturedCard({ o, rank = 1 }: { o: Opportunity; rank?: number }) {
  const tone = CATEGORY_META[o.category].tone;
  const t = toneClasses(tone);
  return (
    <div className={`card p-6 md:p-7 border-2 ${t.border}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-chip text-ink ${t.bg} font-mono text-[11px] font-bold uppercase tracking-[0.06em]`}>
          #{rank} Best overall
        </span>
        {o.regulated && <span className="chip chip-confirmed">✓ regulated</span>}
      </div>
      <div className="grid gap-6 md:grid-cols-[1fr_260px]">
        <div>
          <div className="flex items-center gap-3">
            <Logo name={o.name} tone={tone} />
            <div>
              <h3 className="text-h2 leading-tight">{o.name}</h3>
              <div className={`font-mono text-sm font-bold ${t.text}`}>{o.reward}</div>
            </div>
            <div className="ml-auto md:hidden">
              <ScoreNumber slug={o.slug} tone={tone} />
            </div>
          </div>
          <p className="mt-3 text-text-dim">{o.blurb}</p>
          <div className="mt-4">
            <ProsCons o={o} tone={tone} />
          </div>
          <div className="mt-5">
            <Ctas o={o} tone={tone} />
          </div>
        </div>
        <div className="rounded-card bg-ink-muted border border-edge p-4">
          <div className="hidden md:flex items-center gap-3 mb-4">
            <ScoreNumber slug={o.slug} tone={tone} size="lg" />
            <div>
              <div className="font-semibold text-sm">Our score</div>
              <div className="text-xs text-text-faint">on 5 fixed criteria</div>
            </div>
          </div>
          <ScoreMeter slug={o.slug} tone={tone} />
          <div className="mt-3 font-mono text-[10px] text-text-faint">Checked {o.lastChecked}</div>
        </div>
      </div>
    </div>
  );
}

/** Compact ranked card for positions #2+. */
export function RankedCard({ o, rank }: { o: Opportunity; rank: number }) {
  const tone = CATEGORY_META[o.category].tone;
  const t = toneClasses(tone);
  return (
    <div
      className={`card p-5 transition-colors ${
        tone === "shop" ? "hover:border-accent-warm/60" : "hover:border-accent/60"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center gap-2 shrink-0">
          <span className="font-mono text-lg font-extrabold tabular-nums text-text-faint">#{rank}</span>
          <ScoreNumber slug={o.slug} tone={tone} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Logo name={o.name} tone={tone} />
            <div className="min-w-0">
              <h3 className="text-h3 leading-tight">{o.name}</h3>
              <div className={`font-mono text-sm font-bold ${t.text}`}>{o.reward}</div>
            </div>
            {o.regulated && <span className="chip chip-confirmed ml-auto shrink-0">✓ regulated</span>}
          </div>
          <div className="mt-3">
            <ProsCons o={o} tone={tone} />
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
            <Ctas o={o} tone={tone} />
            <span className="font-mono text-[11px] text-text-faint">
              {o.effort} effort · {o.geo}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
