import type { Metadata } from "next";
import Link from "next/link";
import { listStores, listStoreCategories } from "@/lib/db";
import { StoreCard } from "@/components/StoreCard";
import { AAds } from "@/components/AAds";
import { breadcrumbJsonLd, jsonLdScript, siteUrl } from "@/lib/seo";
import { nlCategoryLabel } from "@/lib/store-i18n";

export const dynamic = "force-dynamic";

const title = "Bitcoin cashback bij online winkels — verdien sats met shoppen";
const description =
  "Verdien echte Bitcoin bij winkels waar je toch al koopt. Bekijk Nederlandse en Europese winkels die je via Satsback uitbetalen in sats — tarieven, eerlijke tracking-notities en hoe je begint.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/nl/shop",
    languages: { "nl-NL": siteUrl("/nl/shop"), "en": siteUrl("/shop") },
  },
  openGraph: { title, description, type: "website", url: siteUrl("/nl/shop"), locale: "nl_NL" },
};

export default async function NlShopIndexPage() {
  const [categories, topStores] = await Promise.all([
    listStoreCategories("nl"),
    listStores({ limit: 24, sort: "rate", contentLang: "nl" }),
  ]);
  const activeCats = categories.filter((c) => c.store_count > 0);

  return (
    <div className="mx-auto max-w-page px-4 py-8">
      <nav className="mb-4 text-xs text-text-faint" aria-label="Kruimelpad">
        <Link href="/" className="hover:text-text-dim">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-text-dim">Shoppen &amp; verdienen</span>
      </nav>

      <header className="mb-6 max-w-3xl">
        <h1 className="text-h1-page font-bold tracking-tight">Verdien Bitcoin met online shoppen</h1>
        <p className="mt-2 text-sm text-text-dim">
          Reken je aankopen af via Satsback en word uitbetaald in echte Bitcoin — als sats naar een
          Lightning-wallet die van jou is, geen punten of tegoedbonnen. Hieronder de winkels waarvoor
          het de moeite waard is, met eerlijke informatie over tarieven en tracking.
        </p>
        <a
          href="/visit/satsback"
          rel="nofollow sponsored"
          className="mt-4 inline-flex rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-ink"
        >
          Maak een gratis Satsback-account aan →
        </a>
      </header>

      <div className="mb-8 flex justify-center">
        <AAds zone="leaderboard" />
      </div>

      {activeCats.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-h2 font-semibold">Categorieën</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {activeCats.map((c) => (
              <Link
                key={c.slug}
                href={`/nl/shop/category/${c.slug}`}
                className="card p-4 transition-colors hover:border-accent/60"
              >
                <div className="text-sm font-semibold text-text">{nlCategoryLabel(c.slug, c.name)}</div>
                <div className="mt-1 text-xs text-text-faint">
                  {c.store_count} {c.store_count === 1 ? "winkel" : "winkels"}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-h2 font-semibold">Hoogste Bitcoin cashback nu</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topStores.map((s) => (
            <StoreCard key={s.id} store={s} lang="nl" />
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", url: siteUrl("/") },
              { name: "Shoppen & verdienen", url: siteUrl("/nl/shop") },
            ]),
          ),
        }}
      />
    </div>
  );
}
