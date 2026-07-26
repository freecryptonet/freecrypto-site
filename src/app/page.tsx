import type { Metadata } from "next";
import Link from "next/link";
import {
  listAirdrops,
  listCategories,
  listStores,
  type StoreListItem,
  type AirdropListItem,
} from "@/lib/db";
import { AirdropCard } from "@/components/AirdropCard";
import { StoreCard } from "@/components/StoreCard";
import { AAds } from "@/components/AAds";
import { siteUrl, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "freecrypto.net — Earn Bitcoin From What You Already Do",
  description:
    "Stack real Bitcoin without buying it: cashback when you shop, sign-up bonuses, and verified airdrops — all paid in BTC. No trading, no wallet signatures.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [topStores, previewAirdrops, categories] = await Promise.all([
    listStores({ limit: 8, sort: "rate", contentLang: "en" }),
    listAirdrops({ sort: "newest", limit: 6 }),
    listCategories(),
  ]);

  const airdropCount = categories.reduce((n, c) => n + (c.airdrop_count || 0), 0);
  const maxPct = topStores.find((s) => s.cashback_kind === "percent")?.cashback_value ?? null;

  return (
    <>
      <Hero />

      <EarnChannels
        shopMetric={maxPct ? `up to ${maxPct}% back` : "Bitcoin cashback"}
        airdropMetric={airdropCount > 0 ? `${airdropCount} tracked` : "Verified daily"}
      />

      <div className="mx-auto max-w-page px-4 pb-14">
        <div className="my-10 flex justify-center">
          <AAds zone="leaderboard" />
        </div>

        {topStores.length > 0 && <TopStores stores={topStores} />}

        {previewAirdrops.length > 0 && <AirdropPreview airdrops={previewAirdrops} />}
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
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-50" aria-hidden />
      <div className="absolute inset-0 bg-radial-fade" aria-hidden />
      <div className="relative mx-auto max-w-page px-4 pt-16 pb-10 text-center">
        <div className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-accent">
          ₿ Stack sats · no purchase required
        </div>
        <h1 className="text-h1-hero font-bold tracking-tight">
          Earn Bitcoin from{" "}
          <span className="text-accent">what you already do</span>.
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-text-dim">
          Cashback when you shop, bonuses when you sign up, and tokens from airdrops — all paid in
          real BTC. No trading, no wallet signatures, no catch.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-btn bg-accent text-ink font-semibold hover:bg-accent/90 transition-colors"
          >
            Start with shopping →
          </Link>
          <Link
            href="/check"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-btn border border-edge text-text hover:bg-edge/50 transition-colors"
          >
            Check your wallet
          </Link>
        </div>
        <p className="mt-5 text-sm text-text-faint">
          New to this?{" "}
          <Link href="/earn" className="text-accent hover:underline">
            Read the full guide to earning Bitcoin →
          </Link>
        </p>
      </div>
    </section>
  );
}

interface Channel {
  href: string;
  label: string;
  blurb: string;
  metric: string;
  cta: string;
}

function EarnChannels({ shopMetric, airdropMetric }: { shopMetric: string; airdropMetric: string }) {
  const channels: Channel[] = [
    {
      href: "/shop",
      label: "Shop & earn",
      blurb: "Bitcoin cashback at 100+ stores you already use, through Satsback — paid in sats.",
      metric: shopMetric,
      cta: "Browse stores",
    },
    {
      href: "/bonus",
      label: "Sign-up bonuses",
      blurb: "One-time rewards for joining the right exchange — Bitvavo, Nexo, and Coinbase.",
      metric: "up to $2,500",
      cta: "Compare bonuses",
    },
    {
      href: "/airdrops",
      label: "Airdrops",
      blurb: "Verified retroactive drops, testnet incentives, and points programs, updated daily.",
      metric: airdropMetric,
      cta: "Browse airdrops",
    },
  ];

  return (
    <section className="mx-auto max-w-page px-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {channels.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group card relative overflow-hidden p-5 pl-6 transition-colors hover:border-accent/60"
          >
            <span className="absolute inset-y-0 left-0 w-1 bg-accent/70" aria-hidden />
            <div className="font-mono text-2xl text-accent">{c.metric}</div>
            <h2 className="mt-3 text-lg font-semibold text-text">{c.label}</h2>
            <p className="mt-1 text-sm text-text-dim">{c.blurb}</p>
            <div className="mt-4 text-sm font-medium text-accent">
              {c.cta} <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function TopStores({ stores }: { stores: StoreListItem[] }) {
  return (
    <section className="mb-14">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-h2 font-semibold">Top Bitcoin cashback rates</h2>
          <p className="mt-1 text-sm text-text-dim">Highest sats-back at stores on Satsback right now.</p>
        </div>
        <Link href="/shop" className="shrink-0 text-sm font-medium text-accent hover:underline">
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

function AirdropPreview({ airdrops }: { airdrops: AirdropListItem[] }) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-h2 font-semibold">Fresh airdrops</h2>
          <p className="mt-1 text-sm text-text-dim">Newly added drops — check your wallet for eligibility.</p>
        </div>
        <Link href="/airdrops" className="shrink-0 text-sm font-medium text-accent hover:underline">
          All airdrops →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {airdrops.map((a) => (
          <AirdropCard key={a.id} a={a} />
        ))}
      </div>
    </section>
  );
}
