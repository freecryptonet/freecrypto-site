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
import { Pagination } from "@/components/Pagination";
import { siteUrl, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

const PAGE_SIZE = 30;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Crypto Airdrops — Active Drops, Testnets & Points (Verified Daily)",
  description:
    "Every active retroactive drop, testnet incentive, and points program — with deadlines, eligibility, and a free wallet-address checker. No signups, no signatures.",
  alternates: { canonical: "/airdrops" },
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

export default async function AirdropsPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const chainSlug = pickStr(sp.chain) || undefined;
  const categorySlug = pickStr(sp.category) || undefined;
  const status = (() => {
    const s = pickStr(sp.status) as AirdropStatus | undefined;
    return s && ALLOWED_STATUS.has(s) ? s : undefined;
  })();
  const kyc = pickStr(sp.kyc) === "yes" ? "yes" as const
    : pickStr(sp.kyc) === "no" ? "no" as const
    : undefined;
  const sort = (() => {
    const s = pickStr(sp.sort);
    return s && ALLOWED_SORT.has(s) ? (s as AirdropFilters["sort"]) : "newest";
  })();
  const page = Math.max(1, Math.min(50, Number(pickStr(sp.page)) || 1));

  const filters: AirdropFilters = {
    chainSlug, categorySlug, status, kycOnly: kyc, sort,
    limit: PAGE_SIZE + 1,
    offset: (page - 1) * PAGE_SIZE,
  };

  const [fetched, chains, categories] = await Promise.all([
    listAirdrops(filters),
    listChains(),
    listCategories(),
  ]);
  const hasNext = fetched.length > PAGE_SIZE;
  const airdrops = fetched.slice(0, PAGE_SIZE);
  const empty = airdrops.length === 0;

  return (
    <div className="mx-auto max-w-page px-4 py-8">
      <nav className="mb-4 text-xs text-text-faint" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-text-dim">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-text-dim">Airdrops</span>
      </nav>

      <header className="mb-6 max-w-3xl">
        <h1 className="text-h1-page font-bold tracking-tight">Crypto airdrops, verified daily</h1>
        <p className="mt-2 text-sm text-text-dim">
          Active retroactive drops, testnet incentives, and points programs — with deadlines,
          eligibility, and estimated value. Paste a wallet address into the{" "}
          <Link href="/check" className="text-accent hover:underline">checker</Link> to see what you
          might already qualify for. No signups, no wallet signatures.
        </p>
      </header>

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

          <ListGrid>
            {airdrops.slice(6).map((a, i) => (
              <CardSlot key={a.id} index={i}>
                <AirdropCard a={a} />
              </CardSlot>
            ))}
          </ListGrid>

          <Pagination
            page={page}
            hasNext={hasNext}
            basePath="/airdrops"
            preserveParams={{
              chain: chainSlug ?? "",
              category: categorySlug ?? "",
              status: status ?? "",
              kyc: kyc ?? "",
              sort: sort === "newest" ? "" : (sort ?? ""),
            }}
          />
        </>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", url: siteUrl("/") },
              { name: "Airdrops", url: siteUrl("/airdrops") },
            ]),
          ),
        }}
      />
    </div>
  );
}

function ListGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}

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
        Try clearing the chain or category filter — or check back tomorrow. New airdrops are added daily.
      </p>
      <Link
        href="/airdrops"
        className="mt-4 inline-flex items-center px-3 py-1.5 rounded-btn border border-edge text-sm hover:bg-edge/50"
      >
        Clear filters
      </Link>
    </div>
  );
}
