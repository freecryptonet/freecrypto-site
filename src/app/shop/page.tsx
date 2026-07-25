import type { Metadata } from "next";
import Link from "next/link";
import { listStores, listStoreCategories } from "@/lib/db";
import { StoreCard } from "@/components/StoreCard";
import { AAds } from "@/components/AAds";
import { breadcrumbJsonLd, jsonLdScript, siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const title = "Earn Bitcoin When You Shop Online — Store Directory";
const description =
  "Get real Bitcoin cashback at the stores you already use. Browse shops that pay you back in sats via Satsback — rates, honest tracking notes, and how to start.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/shop" },
  openGraph: { title, description, type: "website", url: siteUrl("/shop") },
  twitter: { card: "summary_large_image", title, description },
};

export default async function ShopIndexPage() {
  const [categories, topStores] = await Promise.all([
    listStoreCategories(),
    listStores({ limit: 24, sort: "rate" }),
  ]);
  const activeCats = categories.filter((c) => c.store_count > 0);

  return (
    <div className="mx-auto max-w-page px-4 py-8">
      <nav className="mb-4 text-xs text-text-faint" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-text-dim">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-text-dim">Shop &amp; Earn</span>
      </nav>

      <header className="mb-6 max-w-3xl">
        <h1 className="text-h1-page font-bold tracking-tight">Earn Bitcoin when you shop online</h1>
        <p className="mt-2 text-sm text-text-dim">
          Route your everyday purchases through Satsback and get paid in real Bitcoin — sent as sats
          to a Lightning wallet you control, no points or store vouchers. Below are stores worth using
          it for, with honest notes on rates and tracking.
        </p>
        <a
          href="/visit/satsback"
          rel="nofollow sponsored"
          className="mt-4 inline-flex rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-ink"
        >
          Create a free Satsback account →
        </a>
      </header>

      <div className="mb-8 flex justify-center">
        <AAds zone="leaderboard" />
      </div>

      {activeCats.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-h2 font-semibold">Browse by category</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {activeCats.map((c) => (
              <Link
                key={c.slug}
                href={`/shop/category/${c.slug}`}
                className="card p-4 transition-colors hover:border-accent/60"
              >
                <div className="font-semibold text-sm text-text">{c.name}</div>
                <div className="mt-1 text-xs text-text-faint">
                  {c.store_count} {c.store_count === 1 ? "store" : "stores"}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-h2 font-semibold">Top Bitcoin cashback rates right now</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topStores.map((s) => (
            <StoreCard key={s.id} store={s} />
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", url: siteUrl("/") },
              { name: "Shop & Earn", url: siteUrl("/shop") },
            ]),
          ),
        }}
      />
    </div>
  );
}
