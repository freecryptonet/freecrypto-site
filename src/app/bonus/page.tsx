import type { Metadata } from "next";
import Link from "next/link";
import { BONUS_OFFERS } from "@/lib/bonuses";
import { AAds } from "@/components/AAds";
import { breadcrumbJsonLd, jsonLdScript, siteUrl, OG_IMAGE, TWITTER_IMAGE } from "@/lib/seo";

export const dynamic = "force-static";

const title = "Crypto Sign-Up Bonuses That Pay in Bitcoin (2026)";
const description =
  "Compare the best exchange sign-up bonuses — Bitvavo, Nexo, and Coinbase — with the real requirements, honest caveats, and how to claim each one.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/bonus" },
  openGraph: { title, description, type: "website", url: siteUrl("/bonus"), images: [OG_IMAGE] },
  twitter: { card: "summary_large_image", title, description, images: [TWITTER_IMAGE] },
};

export default function BonusIndexPage() {
  return (
    <div className="mx-auto max-w-page px-4 py-8">
      <nav className="mb-4 text-xs text-text-faint" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-text-dim">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-text-dim">Bonuses</span>
      </nav>

      <header className="mb-6 max-w-3xl">
        <h1 className="text-h1-page font-bold tracking-tight">Crypto sign-up bonuses, paid in Bitcoin</h1>
        <p className="mt-2 text-sm text-text-dim">
          Every exchange dangles a sign-up bonus; few tell you the strings attached. Here are the
          three worth your time — with the real requirement, who each suits, and the catch — so you
          can pick one and claim it without surprises.
        </p>
      </header>

      <div className="mb-8 flex justify-center">
        <AAds zone="leaderboard" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {BONUS_OFFERS.map((o) => (
          <div key={o.slug} className="card flex flex-col p-5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: o.accent }} aria-hidden />
              <h2 className="text-lg font-semibold text-text">{o.name}</h2>
            </div>
            <p className="mt-2 text-sm text-text-dim">{o.tagline}</p>

            <div className="mt-4 rounded-lg border border-edge bg-ink-soft/50 p-3">
              <div className="font-mono text-accent">{o.reward}</div>
              <div className="mt-0.5 text-xs text-text-faint">{o.rewardNote}</div>
            </div>

            <dl className="mt-3 text-xs text-text-faint">
              <dt className="sr-only">Availability</dt>
              <dd>{o.geo}</dd>
            </dl>

            <div className="mt-4 flex items-center gap-2 pt-1">
              <a
                href={`/visit/${o.visitCode}`}
                rel="nofollow sponsored"
                className="inline-flex flex-1 justify-center rounded-btn bg-accent px-3 py-2 text-sm font-medium text-ink"
              >
                Get bonus →
              </a>
              <Link
                href={`/bonus/${o.slug}`}
                className="inline-flex justify-center rounded-btn border border-edge px-3 py-2 text-sm text-text hover:bg-edge/50"
              >
                Guide
              </Link>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 max-w-3xl text-xs text-text-faint">
        Bonus amounts and eligibility change and vary by country; the figures above are the
        advertised ceilings, not guarantees. Buying and holding crypto carries a risk of loss.
      </p>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", url: siteUrl("/") },
              { name: "Bonuses", url: siteUrl("/bonus") },
            ]),
          ),
        }}
      />
    </div>
  );
}
