import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listAirdrops, listCategories } from "@/lib/db";
import { AirdropListing } from "@/components/AirdropListing";
import { AAds } from "@/components/AAds";
import { breadcrumbJsonLd, jsonLdScript, siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function findCategory(slug: string) {
  const cats = await listCategories();
  return cats.find((c) => c.slug === slug) ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cat = await findCategory(slug);
  if (!cat) return { title: "Category not found" };
  return {
    title: `${cat.name} Airdrops — Active Drops & Eligibility`,
    description:
      cat.description ||
      `Every active ${cat.name.toLowerCase()} airdrop. Deadlines, eligibility, and how to claim.`,
    alternates: { canonical: `/categories/${cat.slug}` },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const cat = await findCategory(slug);
  if (!cat) notFound();

  const airdrops = await listAirdrops({ categorySlug: cat.slug, limit: 60 });

  return (
    <div className="mx-auto max-w-page px-4 py-8">
      <nav className="text-xs text-text-faint mb-4" aria-label="Breadcrumb">
        <a href="/" className="hover:text-text-dim">Home</a>
        <span className="mx-1.5">/</span>
        <span className="text-text-dim">{cat.name}</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-h1-page font-bold tracking-tight">{cat.name} Airdrops</h1>
        {cat.description ? (
          <p className="mt-2 text-text-dim max-w-3xl text-sm">{cat.description}</p>
        ) : null}
        <div className="mt-2 text-sm text-text-faint">
          {cat.airdrop_count} active {cat.airdrop_count === 1 ? "drop" : "drops"}
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
              { name: cat.name, url: siteUrl(`/categories/${cat.slug}`) },
            ]),
          ),
        }}
      />
    </div>
  );
}
