import type { Metadata } from "next";
import Link from "next/link";
import { listGuides } from "@/lib/db";
import { breadcrumbJsonLd, jsonLdScript, siteUrl } from "@/lib/seo";
import { timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Crypto Airdrop Guides — Eligibility, Wallet Safety, Farming",
  description:
    "Long-form guides on qualifying for retroactive drops, farming testnets without sybil risk, avoiding airdrop scams, and reading on-chain eligibility signals.",
  alternates: { canonical: "/guides" },
};

export default async function GuidesIndexPage() {
  const guides = await listGuides();

  return (
    <div className="mx-auto max-w-page px-4 py-10">
      <nav className="text-xs text-text-faint mb-4" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-text-dim">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-text-dim">Guides</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-h1-page font-bold tracking-tight">Airdrop Guides</h1>
        <p className="mt-2 text-text-dim max-w-2xl">
          Evergreen explainers and farming playbooks. Read these before you
          interact with anything claiming to be an airdrop.
        </p>
      </header>

      {guides.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-text">Guides are loading.</div>
          <p className="text-text-dim text-sm mt-2">
            Check back shortly — first batch of guides publishes this week.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((g) => (
            <Link
              key={g.id}
              href={`/guides/${g.slug}`}
              className="card p-5 flex flex-col hover:border-accent/60 transition-colors"
            >
              <h2 className="text-h3 font-semibold text-text">{g.title}</h2>
              {g.excerpt ? (
                <p className="text-sm text-text-dim mt-2 line-clamp-3">{g.excerpt}</p>
              ) : null}
              <div className="mt-auto pt-4 text-xs text-text-faint">
                Updated {timeAgo(g.updated_at)}
              </div>
            </Link>
          ))}
        </div>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", url: siteUrl("/") },
              { name: "Guides", url: siteUrl("/guides") },
            ]),
          ),
        }}
      />
    </div>
  );
}
