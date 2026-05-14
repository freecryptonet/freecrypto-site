import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listAirdrops, listCategories } from "@/lib/db";
import { AirdropListing } from "@/components/AirdropListing";
import { AAds } from "@/components/AAds";
import { Pagination } from "@/components/Pagination";
import { breadcrumbJsonLd, jsonLdScript, siteUrl } from "@/lib/seo";

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

async function findCategory(slug: string) {
  const cats = await listCategories();
  return cats.find((c) => c.slug === slug) ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cat = await findCategory(slug);
  if (!cat) return { title: "Category not found", robots: { index: false, follow: false } };
  const title = `${cat.name} Airdrops — Active Drops & Eligibility`;
  const description =
    cat.description ||
    `Every active ${cat.name.toLowerCase()} airdrop. Deadlines, eligibility, and how to claim.`;
  const indexable = cat.airdrop_count > 0;
  return {
    title,
    description,
    alternates: { canonical: `/categories/${cat.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: siteUrl(`/categories/${cat.slug}`),
    },
    twitter: { card: "summary_large_image", title, description },
    robots: indexable ? undefined : { index: false, follow: true },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const cat = await findCategory(slug);
  if (!cat) notFound();

  const sp = await searchParams;
  const page = Math.max(1, Math.min(50, Number(pickStr(sp.page)) || 1));

  const fetched = await listAirdrops({
    categorySlug: cat.slug,
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

      <Pagination
        page={page}
        hasNext={hasNext}
        basePath={`/categories/${cat.slug}`}
        preserveParams={{}}
      />

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
