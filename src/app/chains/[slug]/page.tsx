import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listAirdrops, listChains } from "@/lib/db";
import { AirdropListing } from "@/components/AirdropListing";
import { AAds } from "@/components/AAds";
import { Pagination } from "@/components/Pagination";
import { breadcrumbJsonLd, jsonLdScript, siteUrl, OG_IMAGE, TWITTER_IMAGE } from "@/lib/seo";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pickStr(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

async function findChain(slug: string) {
  const chains = await listChains();
  return chains.find((c) => c.slug === slug) ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const chain = await findChain(slug);
  if (!chain) return { title: "Chain not found", robots: { index: false, follow: false } };
  const description =
    chain.description ||
    `Every active ${chain.name} airdrop in one place. Deadlines, eligibility, and how to claim.`;
  const title = `${chain.name} Airdrops — Active Drops & Eligibility`;
  // Listing pages with zero active drops add nothing the user can act on,
  // so we keep them out of the index to avoid soft-empty signals.
  const indexable = chain.airdrop_count > 0;
  return {
    title,
    description,
    alternates: { canonical: `/chains/${chain.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: siteUrl(`/chains/${chain.slug}`),
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title, description, images: [TWITTER_IMAGE] },
    robots: indexable ? undefined : { index: false, follow: true },
  };
}

export default async function ChainPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const chain = await findChain(slug);
  if (!chain) notFound();

  const sp = await searchParams;
  const page = Math.max(1, Math.min(50, Number(pickStr(sp.page)) || 1));

  const fetched = await listAirdrops({
    chainSlug: chain.slug,
    limit: PAGE_SIZE + 1,
    offset: (page - 1) * PAGE_SIZE,
  });
  const hasNext = fetched.length > PAGE_SIZE;
  const airdrops = fetched.slice(0, PAGE_SIZE);

  return (
    <div className="mx-auto max-w-page px-4 py-8">
      <nav className="text-xs text-text-faint mb-4" aria-label="Breadcrumb">
        <a href="/" className="hover:text-text-dim">Home</a>
        <span className="mx-1.5">/</span>
        <span className="text-text-dim">{chain.name}</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-h1-page font-bold tracking-tight">
          {chain.name} Airdrops
        </h1>
        {chain.description ? (
          <p className="mt-2 text-text-dim max-w-3xl text-sm">{chain.description}</p>
        ) : null}
        <div className="mt-2 text-sm text-text-faint">
          {chain.airdrop_count} active {chain.airdrop_count === 1 ? "drop" : "drops"}
        </div>
      </header>

      <div className="mb-6 flex justify-center">
        <AAds zone="leaderboard" />
      </div>

      <AirdropListing airdrops={airdrops} />

      <Pagination
        page={page}
        hasNext={hasNext}
        basePath={`/chains/${chain.slug}`}
        preserveParams={{}}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", url: siteUrl("/") },
              { name: chain.name, url: siteUrl(`/chains/${chain.slug}`) },
            ]),
          ),
        }}
      />
    </div>
  );
}
