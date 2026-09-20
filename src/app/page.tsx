import type { Metadata } from "next";
import Link from "next/link";
import { listStores, type StoreListItem } from "@/lib/db";
import { StoreCard } from "@/components/StoreCard";
import { PayoutProof } from "@/components/PayoutProof";
import { AAds } from "@/components/AAds";
import { siteUrl, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "freecrypto.net — The honest guide to earning free crypto",
  description:
    "The real ways to earn crypto, ranked by what actually pays: exchange sign-up bonuses, Bitcoin cashback, learn-and-earn and faucets — with honest payout numbers.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const topStores = await listStores({ limit: 8, sort: "rate", contentLang: "en" });
  const maxPct = topStores.find((s) => s.cashback_kind === "percent")?.cashback_value ?? null;

  return (
    <>
      <Hero />
      <WaysToEarn shopMetric={maxPct ? `up to ${maxPct}%` : "up to 12%"} />

      <div className="mx-auto max-w-page px-4 pb-16">
        <CalculatorTeaser />

        <FeaturedBonuses />

        {topStores.length > 0 && <TopStores stores={topStores} />}

        <PayoutProof className="mt-16" />

        <div className="my-12 flex justify-center">
          <AAds zone="leaderboard" />
        </div>

        <HonestyStrip />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(breadcrumbJsonLd([{ name: "Home", url: siteUrl("/") }])),
        }}
      />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-edge">
      <div className="absolute inset-0 bg-radial-fade" aria-hidden />
      <div className="absolute inset-0 bg-grid opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-page px-4 pt-20 pb-16 text-center">
        <div className="mb-5 font-mono text-xs uppercase tracking-[0.18em] text-text-dim">
          Earn crypto · the honest way
        </div>
        <h1 className="text-h1-hero tracking-tight mx-auto max-w-3xl">
          The real ways to <span className="text-accent-alt">earn free crypto</span>.
        </h1>
        <p className="mt-5 max-w-xl mx-auto text-lg text-text-dim">
          Skip the scams and the pennies. We rank what actually pays — exchange
          bonuses, cashback, learn-and-earn — with straight numbers, not hype.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/bonus"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-btn bg-text text-ink font-bold text-base hover:opacity-90 transition-opacity"
          >
            Compare exchange bonuses →
          </Link>
          <Link
            href="/earn"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-btn border border-edge font-semibold hover:bg-ink-muted transition-colors"
          >
            See all ways to earn
          </Link>
        </div>
        <p className="mt-4 font-mono text-xs text-text-faint">
          No purchase required to start · biggest payouts first
        </p>
      </div>
    </section>
  );
}

interface Method {
  href: string;
  emoji: string;
  name: string;
  badge?: { label: string; kind: "hot" | "easy" };
  desc: string;
  effort: number; // 1..3
  pay: string;
  per: string;
  tone: "earn" | "shop";
}

function WaysToEarn({ shopMetric }: { shopMetric: string }) {
  const methods: Method[] = [
    {
      href: "/bonus",
      emoji: "🏦",
      name: "Exchange sign-up bonuses",
      badge: { label: "Highest paying", kind: "hot" },
      desc: "Real money for opening & funding a regulated exchange — the biggest single payouts here.",
      effort: 2,
      pay: "$10 – 100+",
      per: "per exchange",
      tone: "earn",
    },
    {
      href: "/shop",
      emoji: "🪙",
      name: "Bitcoin cashback",
      desc: "Shop the stores you already use and get paid back in real Bitcoin via Satsback.",
      effort: 1,
      pay: shopMetric,
      per: "back in BTC",
      tone: "shop",
    },
    {
      href: "/earn",
      emoji: "🎓",
      name: "Learn-and-earn",
      desc: "Watch a short lesson or complete a task, get a small crypto reward. Low friction, real payout.",
      effort: 1,
      pay: "$5 – 40",
      per: "per program",
      tone: "earn",
    },
    {
      href: "/earn",
      emoji: "💧",
      name: "Faucets",
      badge: { label: "Easy but tiny", kind: "easy" },
      desc: "Claim a few sats on a timer. Fine for a first taste — don't expect real money.",
      effort: 1,
      pay: "2 – 240",
      per: "sat / claim",
      tone: "earn",
    },
  ];

  return (
    <section className="mx-auto max-w-page px-4 pt-16">
      <div className="mb-2">
        <div className="h-[3px] w-11 rounded bg-accent mb-4" />
        <h2 className="text-h2">Ways to earn, ranked by what actually pays</h2>
        <p className="mt-2 text-text-dim max-w-2xl">
          Most &ldquo;free crypto&rdquo; sites push faucets because they&rsquo;re easy.
          They&rsquo;re also the smallest payout. Here&rsquo;s the honest order — start at the top.
        </p>
      </div>

      <div className="mt-6 card overflow-hidden !p-0">
        {methods.map((m, i) => (
          <Link
            key={m.name}
            href={m.href}
            className={`grid grid-cols-[46px_1fr_auto] md:grid-cols-[46px_1.6fr_1.1fr_1fr_auto] items-center gap-4 md:gap-5 px-5 py-5 transition-colors hover:bg-ink-muted ${
              i > 0 ? "border-t border-edge" : ""
            } ${i === 0 ? "bg-accent/[0.06]" : ""}`}
          >
            <span
              className={`grid place-items-center w-11 h-11 rounded-xl text-xl ${
                m.tone === "shop" ? "bg-accent-warm/10" : "bg-accent/10"
              }`}
              aria-hidden
            >
              {m.emoji}
            </span>
            <span>
              <span className="flex flex-wrap items-center gap-2 font-bold text-[15px]">
                {m.name}
                {m.badge && (
                  <span
                    className={`font-mono text-[9.5px] uppercase tracking-[0.06em] font-bold px-2 py-0.5 rounded-chip ${
                      m.badge.kind === "hot"
                        ? "bg-accent text-ink"
                        : "bg-ink-muted text-text-faint border border-edge"
                    }`}
                  >
                    {m.badge.label}
                  </span>
                )}
              </span>
              <span className="block text-[13px] text-text-dim mt-0.5">{m.desc}</span>
            </span>
            <span className="hidden md:flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-text-faint">
                Effort
              </span>
              <span className="inline-flex gap-1" aria-hidden>
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className={`w-1.5 h-1.5 rounded-full ${
                      d < m.effort
                        ? m.tone === "shop"
                          ? "bg-accent-warm"
                          : "bg-accent"
                        : "bg-edge"
                    }`}
                  />
                ))}
              </span>
            </span>
            <span className="text-right md:text-left">
              <span
                className={`font-mono font-bold tabular-nums ${
                  m.tone === "shop" ? "text-accent-warm" : "text-accent-alt"
                }`}
              >
                {m.pay}
              </span>
              <span className="block font-mono text-[10.5px] text-text-faint">{m.per}</span>
            </span>
            <span
              className={`hidden md:block font-bold text-lg ${
                m.tone === "shop" ? "text-accent-warm" : "text-accent"
              }`}
              aria-hidden
            >
              →
            </span>
          </Link>
        ))}
      </div>
      <p className="mt-3 text-right font-mono text-[11px] text-text-faint">
        Payout ranges are typical, not guaranteed · earnings are small &amp; variable
      </p>
    </section>
  );
}

function CalculatorTeaser() {
  return (
    <section className="pt-16">
      <Link
        href="/calculator"
        className="group card block p-6 md:p-8 transition-colors hover:border-accent/60"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
          <div className="flex-1">
            <div className="font-mono text-xs uppercase tracking-[0.12em] text-accent-alt">
              The reality check
            </div>
            <h2 className="mt-2 text-h2">What can you actually earn per hour?</h2>
            <p className="mt-2 text-text-dim max-w-xl">
              Our calculator does the honest math: set your hours and spending and see a
              realistic monthly total — and exactly how little faucet-grinding pays versus
              bonuses and cashback.
            </p>
          </div>
          <div className="shrink-0">
            <span className="inline-flex items-center gap-2 px-5 py-3 rounded-btn bg-text text-ink font-bold group-hover:opacity-90 transition-opacity">
              Open the calculator
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
}

interface Bonus {
  href: string;
  name: string;
  initial: string;
  reward: string;
  note: string;
  terms: string;
}

function FeaturedBonuses() {
  const bonuses: Bonus[] = [
    {
      href: "/bonus",
      name: "Bitvavo",
      initial: "Bv",
      reward: "€10 + fee-free",
      note: "EU-friendly, iDEAL/SEPA, low fees — the easiest first exchange.",
      terms: "EU · ID + small deposit",
    },
    {
      href: "/bonus",
      name: "Coinbase",
      initial: "Cb",
      reward: "Learn & earn",
      note: "Free crypto for finishing short lessons — no deposit needed.",
      terms: "Many countries · no deposit",
    },
    {
      href: "/bonus",
      name: "Nexo",
      initial: "Nx",
      reward: "Sign-up bonus",
      note: "Bonus in BTC after you fund and hold — paid in real crypto.",
      terms: "ID + qualifying deposit",
    },
  ];
  return (
    <section className="pt-16">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <div className="h-[3px] w-11 rounded bg-accent mb-4" />
          <h2 className="text-h2">Where the real money is: exchange bonuses</h2>
          <p className="mt-2 text-text-dim max-w-2xl">
            Sign-up bonuses pay in real crypto, not points. We only list regulated
            exchanges and show the honest terms.
          </p>
        </div>
        <Link href="/programs" className="shrink-0 text-sm font-bold text-accent-alt hover:underline">
          Browse all programs →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {bonuses.map((b) => (
          <Link key={b.name} href={b.href} className="card p-5 transition-colors hover:border-accent/60">
            <div className="flex items-center gap-3">
              <span className="grid place-items-center w-11 h-11 rounded-xl bg-ink-muted border border-edge font-extrabold text-accent-alt">
                {b.initial}
              </span>
              <div>
                <div className="font-bold">{b.name}</div>
                <div className="font-mono text-sm text-accent-alt font-bold tabular-nums">{b.reward}</div>
              </div>
            </div>
            <p className="mt-3 text-sm text-text-dim">{b.note}</p>
            <p className="mt-2 font-mono text-[11px] text-text-faint">{b.terms}</p>
            <div className="mt-4 text-sm font-bold text-accent">See the offer →</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function TopStores({ stores }: { stores: StoreListItem[] }) {
  return (
    <section className="pt-16">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <div className="h-[3px] w-11 rounded bg-accent-warm mb-4" />
          <h2 className="text-h2">Get Bitcoin back when you shop</h2>
          <p className="mt-2 text-sm text-text-dim">Highest sats-back at stores on Satsback right now.</p>
        </div>
        <Link href="/shop" className="shrink-0 text-sm font-bold text-accent-warm hover:underline">
          All stores →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stores.map((s) => (
          <StoreCard key={s.id} store={s} />
        ))}
      </div>
    </section>
  );
}

function HonestyStrip() {
  return (
    <section className="mt-4 card p-6 md:p-8">
      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.12em] text-accent-alt">Honest by default</div>
          <h3 className="mt-2 text-h3">We show the real numbers</h3>
          <p className="mt-1 text-sm text-text-dim">
            Every method lists its typical payout and effort — including when the honest
            answer is &ldquo;barely worth it.&rdquo; See our{" "}
            <Link href="/methodology" className="text-accent hover:underline">methodology</Link>.
          </p>
        </div>
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.12em] text-accent-alt">No hidden agenda</div>
          <h3 className="mt-2 text-h3">Affiliate links, disclosed</h3>
          <p className="mt-1 text-sm text-text-dim">
            Some links earn us a commission at no extra cost to you — and it never changes
            what you earn. We rank on payout, not on payout to us.
          </p>
        </div>
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.12em] text-accent-alt">Safety first</div>
          <h3 className="mt-2 text-h3">Avoid the scams</h3>
          <p className="mt-1 text-sm text-text-dim">
            Learn the red flags before you connect a wallet or fund an account.{" "}
            <Link href="/guides" className="text-accent hover:underline">Read the safety guides →</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
