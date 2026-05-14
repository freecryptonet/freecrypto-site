import type { Metadata } from "next";
import Link from "next/link";
import {
  listAirdrops,
  listChains,
  listCategories,
  type AirdropFilters,
  type AirdropStatus,
} from "@/lib/db";
import { AirdropCard, SponsoredCard } from "@/components/AirdropCard";
import { FilterBar } from "@/components/FilterBar";
import { AAds } from "@/components/AAds";
import { ExchangeCTA } from "@/components/ExchangeCTA";
import { siteUrl, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Free Crypto Airdrops, Verified Daily",
  description:
    "Active retroactive drops, testnet rewards, and points programs — with deadlines, eligibility, and a free wallet-address checker.",
  alternates: { canonical: "/" },
};

const ALLOWED_STATUS = new Set<AirdropStatus>([
  "confirmed", "potential", "snapshot", "live", "ended",
]);
const ALLOWED_SORT = new Set([
  "newest", "ending-soon", "highest-value", "highest-funding",
]);

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pickStr(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function HomePage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const filters: AirdropFilters = {
    chainSlug: pickStr(sp.chain) || undefined,
    categorySlug: pickStr(sp.category) || undefined,
    status: (() => {
      const s = pickStr(sp.status) as AirdropStatus | undefined;
      return s && ALLOWED_STATUS.has(s) ? s : undefined;
    })(),
    kycOnly:
      pickStr(sp.kyc) === "yes" ? "yes"
        : pickStr(sp.kyc) === "no" ? "no"
        : undefined,
    sort: (() => {
      const s = pickStr(sp.sort);
      return s && ALLOWED_SORT.has(s) ? (s as AirdropFilters["sort"]) : "newest";
    })(),
    limit: 60,
  };

  const [airdrops, chains, categories] = await Promise.all([
    listAirdrops(filters),
    listChains(),
    listCategories(),
  ]);

  const empty = airdrops.length === 0;

  return (
    <>
      <Hero />

      <div className="mx-auto max-w-page px-4 pb-12">
        <div className="mb-6 flex justify-center">
          <AAds zone="leaderboard" />
        </div>

        <FilterBar
          chains={chains.map((c) => ({ value: c.slug, label: `${c.name} (${c.airdrop_count})` }))}
          categories={categories.map((c) => ({ value: c.slug, label: `${c.name} (${c.airdrop_count})` }))}
          totalCount={airdrops.length}
        />

        {empty ? (
          <EmptyState />
        ) : (
          <>
            <ListGrid>
              {airdrops.slice(0, 6).map((a) => (
                <AirdropCard key={a.id} a={a} />
              ))}
            </ListGrid>

            {airdrops.length > 6 ? (
              <div className="my-8">
                <ExchangeCTA variant="row" />
              </div>
            ) : null}

            <ListGrid>
              {airdrops.slice(6).map((a, i) => (
                <CardSlot key={a.id} index={i}>
                  <AirdropCard a={a} />
                </CardSlot>
              ))}
            </ListGrid>
          </>
        )}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([{ name: "Home", url: siteUrl("/") }]),
          ),
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
      <div className="relative mx-auto max-w-page px-4 pt-16 pb-12 text-center">
        <h1 className="text-h1-hero font-bold tracking-tight">
          Free crypto airdrops,{" "}
          <span className="text-accent">verified daily</span>.
        </h1>
        <p className="mt-4 text-text-dim max-w-2xl mx-auto">
          Every active retroactive drop, testnet incentive, and points program —
          with deadlines, eligibility, and a free wallet-address checker. No
          signups, no wallet signatures.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/check"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-btn bg-accent text-ink-soft font-semibold hover:bg-accent/90 transition-colors"
          >
            Check your wallet →
          </Link>
          <Link
            href="#airdrops"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-btn border border-edge text-text hover:bg-edge/50 transition-colors"
          >
            Browse airdrops
          </Link>
        </div>
      </div>
    </section>
  );
}

function ListGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      id="airdrops"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      style={{ scrollMarginTop: "5rem" }}
    >
      {children}
    </div>
  );
}

// Inject a sponsored slot every 6 cards.
function CardSlot({ index, children }: { index: number; children: React.ReactNode }) {
  if (index > 0 && (index + 1) % 6 === 0) {
    return (
      <>
        {children}
        <SponsoredCard>
          <AAds zone="inline" />
        </SponsoredCard>
      </>
    );
  }
  return <>{children}</>;
}

function EmptyState() {
  return (
    <div className="card p-12 text-center">
      <div className="text-h2 font-semibold mb-2">No airdrops match these filters</div>
      <p className="text-text-dim text-sm max-w-md mx-auto">
        Try clearing the chain or category filter — or check back tomorrow. New
        airdrops are added daily.
      </p>
      <Link
        href="/"
        className="mt-4 inline-flex items-center px-3 py-1.5 rounded-btn border border-edge text-sm hover:bg-edge/50"
      >
        Clear filters
      </Link>
    </div>
  );
}
