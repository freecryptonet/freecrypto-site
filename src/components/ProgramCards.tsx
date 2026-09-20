import Link from "next/link";
import {
  CATEGORY_META,
  getScores,
  overallScore,
  getPros,
  officialUrl,
  brandColor,
  logoPath,
  SCORE_CRITERIA,
  type Opportunity,
} from "@/lib/opportunities";

function toneClasses(tone: "earn" | "shop") {
  return tone === "shop"
    ? { text: "text-accent-warm", bg: "bg-accent-warm", soft: "bg-accent-warm/10", border: "border-accent-warm/60", accent: "bg-accent-warm", tint: "bg-accent-warm/[0.04]", hover: "hover:border-accent-warm/50" }
    : { text: "text-accent-alt", bg: "bg-accent", soft: "bg-accent/10", border: "border-accent/60", accent: "bg-accent", tint: "bg-accent/[0.04]", hover: "hover:border-accent/50" };
}

export function ScoreNumber({ slug, tone, size = "md" }: { slug: string; tone: "earn" | "shop"; size?: "sm" | "md" | "lg" }) {
  const score = overallScore(slug);
  if (score == null) return null;
  const t = toneClasses(tone);
  const dims = size === "lg" ? "w-20 h-20" : size === "sm" ? "w-14 h-14" : "w-16 h-16";
  const num = size === "lg" ? "text-4xl" : size === "sm" ? "text-xl" : "text-2xl";
  return (
    <div className={`grid place-items-center rounded-xl ${t.soft} ${dims} shrink-0`}>
      <div className={`font-mono font-extrabold tabular-nums leading-none ${t.text} ${num}`}>
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
    <dl className="grid grid-cols-1 gap-2.5">
      {SCORE_CRITERIA.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-3">
          <dt className="w-28 shrink-0 text-xs text-text-dim">{label}</dt>
          <div className="flex-1 h-2.5 rounded-full bg-edge overflow-hidden">
            <div className={`h-full rounded-full ${t.accent}`} style={{ width: `${s[key] * 10}%` }} />
          </div>
          <dd className="w-6 shrink-0 text-right font-mono text-xs font-bold tabular-nums text-text">{s[key]}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The two highest-scoring criteria — compact, fills the ranked-card score column. */
function TopStrengths({ slug, tone }: { slug: string; tone: "earn" | "shop" }) {
  const s = getScores(slug);
  if (!s) return null;
  const t = toneClasses(tone);
  const top = [...SCORE_CRITERIA].sort((a, b) => s[b.key] - s[a.key]).slice(0, 2);
  return (
    <div className="w-full space-y-2" aria-hidden>
      {top.map((c) => (
        <div key={c.key} className="flex items-center gap-2">
          <span className="w-12 shrink-0 text-[11px] text-text-dim">{c.short}</span>
          <div className="flex-1 h-2 rounded-full bg-edge overflow-hidden">
            <div className={`h-full rounded-full ${t.accent}`} style={{ width: `${s[c.key] * 10}%` }} />
          </div>
          <span className="w-3 text-right text-[11px] font-mono font-bold text-text">{s[c.key]}</span>
        </div>
      ))}
    </div>
  );
}

export function ProgramLogo({ slug, name, tone, size = "md" }: { slug: string; name: string; tone: "earn" | "shop"; size?: "md" | "lg" }) {
  const path = logoPath(slug);
  const tile = size === "lg" ? "w-14 h-14" : "w-12 h-12";
  const img = size === "lg" ? "w-9 h-9" : "w-8 h-8";
  if (path) {
    return (
      <span className={`grid place-items-center ${tile} rounded-xl bg-white border border-edge shrink-0 overflow-hidden shadow-sm`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={path} alt={`${name} logo`} className={`${img} object-contain`} loading="lazy" />
      </span>
    );
  }
  const brand = brandColor(slug);
  const initials = name.replace(/[^A-Za-z0-9 ]/g, "").slice(0, 2);
  if (brand) {
    return (
      <span
        style={{ backgroundColor: brand, color: "#fff" }}
        className={`grid place-items-center ${tile} rounded-xl font-extrabold shrink-0 shadow-sm`}
      >
        {initials}
      </span>
    );
  }
  const t = toneClasses(tone);
  return (
    <span className={`grid place-items-center ${tile} rounded-xl bg-ink-muted border border-edge font-extrabold ${t.text} shrink-0`}>
      {initials}
    </span>
  );
}

function RewardPill({ o, tone }: { o: Opportunity; tone: "earn" | "shop" }) {
  const t = toneClasses(tone);
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-chip text-xs font-bold ${t.soft} ${t.text}`}>
      {o.reward}
    </span>
  );
}

function Ctas({
  o,
  tone,
  variant = "primary",
}: {
  o: Opportunity;
  tone: "earn" | "shop";
  variant?: "primary" | "secondary";
}) {
  const url = officialUrl(o.slug);
  const t = toneClasses(tone);
  const btn =
    variant === "primary"
      ? `text-ink ${t.bg} hover:opacity-90 px-5 py-2.5`
      : `bg-ink-muted border border-edge text-text hover:bg-edge px-4 py-2.5`;
  return (
    <div>
      <div className="flex items-center gap-3 flex-wrap">
        {url && (
          <a
            href={url}
            target="_blank"
            rel="sponsored nofollow noopener"
            className={`inline-flex items-center gap-1.5 rounded-btn text-sm font-bold transition-colors ${btn}`}
          >
            Visit {o.name} ↗
          </a>
        )}
        <Link href={`/programs/${o.slug}`} className="text-sm font-bold text-text-dim hover:text-text">
          {o.review ? "Read review →" : "Details →"}
        </Link>
      </div>
      <div className="mt-1.5 text-[10px] text-text-faint">
        18+ · T&amp;Cs apply · availability varies by country · affiliate link
      </div>
    </div>
  );
}

function ProsCons({ o, tone }: { o: Opportunity; tone: "earn" | "shop" }) {
  const pros = getPros(o.slug);
  const t = toneClasses(tone);
  return (
    <div className="space-y-2">
      {pros.map((p) => (
        <div key={p} className="flex items-start gap-2 text-sm">
          <span className={`grid place-items-center w-4 h-4 rounded-full ${t.soft} ${t.text} text-[10px] font-bold mt-0.5 shrink-0`}>✓</span>
          <span className="text-text-dim">{p}</span>
        </div>
      ))}
      <div className="flex items-start gap-2 text-sm rounded-lg border-l-[3px] border-accent-warm bg-accent-warm/[0.07] px-3 py-2">
        <span className="text-accent-warm font-bold mt-0.5 shrink-0">⚠</span>
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
    <div className={`card p-6 md:p-8 border-2 ${t.border} ${t.tint} shadow-glow`}>
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-chip text-ink ${t.bg} font-mono text-[11px] font-bold uppercase tracking-[0.08em]`}>
          ★ #{rank} Best overall
        </span>
        {o.regulated && <span className="chip chip-confirmed">✓ regulated</span>}
      </div>
      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div>
          <div className="flex items-center gap-4">
            <ProgramLogo slug={o.slug} name={o.name} tone={tone} size="lg" />
            <div className="min-w-0">
              <h3 className="text-h2 leading-tight">{o.name}</h3>
              <div className="mt-1"><RewardPill o={o} tone={tone} /></div>
            </div>
            <div className="ml-auto md:hidden">
              <ScoreNumber slug={o.slug} tone={tone} />
            </div>
          </div>
          <p className="mt-4 text-text-dim">{o.blurb}</p>
          <div className="mt-4">
            <ProsCons o={o} tone={tone} />
          </div>
          <div className="mt-6">
            <Ctas o={o} tone={tone} />
          </div>
        </div>
        <div className="rounded-card bg-surface border border-edge p-5">
          <div className="hidden md:flex items-center gap-3 mb-4">
            <ScoreNumber slug={o.slug} tone={tone} size="lg" />
            <div>
              <div className="font-bold text-sm">Our score</div>
              <div className="text-xs text-text-faint">on 5 fixed criteria</div>
            </div>
          </div>
          <ScoreMeter slug={o.slug} tone={tone} />
          <div className="mt-4 font-mono text-[10px] text-text-faint">Independently scored · checked {o.lastChecked}</div>
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
    <div className={`card relative overflow-hidden p-5 pl-6 transition-shadow hover:shadow-glow ${t.hover}`}>
      <span className={`absolute inset-y-0 left-0 w-1.5 ${t.accent}`} aria-hidden />
      <div className="flex items-start gap-4">
        <span className="grid place-items-center w-8 h-8 rounded-full bg-ink-muted border border-edge font-mono text-sm font-extrabold tabular-nums text-text shrink-0">
          {rank}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <ProgramLogo slug={o.slug} name={o.name} tone={tone} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-h3 leading-tight">{o.name}</h3>
                {o.regulated && <span className="chip chip-confirmed">✓ regulated</span>}
              </div>
              <div className="mt-1"><RewardPill o={o} tone={tone} /></div>
            </div>
            <div className="ml-auto md:hidden">
              <ScoreNumber slug={o.slug} tone={tone} size="sm" />
            </div>
          </div>
          <div className="mt-3">
            <ProsCons o={o} tone={tone} />
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
            <Ctas o={o} tone={tone} variant="secondary" />
            <span className="font-mono text-[11px] text-text-faint">
              {o.effort} effort · {o.geo} · checked {o.lastChecked}
            </span>
          </div>
        </div>
        <div className="hidden md:flex flex-col items-center gap-2.5 shrink-0 w-[160px] pl-5 border-l border-edge self-stretch justify-center">
          <ScoreNumber slug={o.slug} tone={tone} />
          <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-text-faint">Our score</div>
          <TopStrengths slug={o.slug} tone={tone} />
        </div>
      </div>
    </div>
  );
}
