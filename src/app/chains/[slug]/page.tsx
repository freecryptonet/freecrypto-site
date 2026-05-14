import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listAirdrops, listChains } from "@/lib/db";
import { AirdropListing } from "@/components/AirdropListing";
import { AAds } from "@/components/AAds";
import { breadcrumbJsonLd, jsonLdScript, siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function findChain(slug: string) {
  const chains = await listChains();
  return chains.find((c) => c.slug === slug) ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const chain = await findChain(slug);
  if (!chain) return { title: "Chain not found" };
  return {
    title: `${chain.name} Airdrops — Active Drops & Eligibility`,
    description:
      chain.description ||
      `Every active ${chain.name} airdrop in one place. Deadlines, eligibility, and how to claim.`,
    alternates: { canonical: `/chains/${chain.slug}` },
  };
}

export default async function ChainPage({ params }: PageProps) {
  const { slug } = await params;
  const chain = await findChain(slug);
  if (!chain) notFound();

  const airdrops = await listAirdrops({ chainSlug: chain.slug, limit: 60 });

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
