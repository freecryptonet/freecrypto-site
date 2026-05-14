import type { Metadata } from "next";
import { CheckerForm } from "@/components/CheckerForm";
import { AAds } from "@/components/AAds";
import { breadcrumbJsonLd, jsonLdScript, siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Free Wallet Airdrop Checker — Paste, Don't Sign",
  description:
    "Paste an EVM or Solana address. We check it against every known airdrop snapshot we track. No wallet signature, no extension, no risk.",
  alternates: { canonical: "/check" },
};

export default function CheckPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <header className="text-center mb-8">
        <h1 className="text-h1-page font-bold tracking-tight">
          Check your wallet for airdrops
        </h1>
        <p className="mt-3 text-text-dim">
          Paste an address. We&apos;ll check it against every snapshot we
          track. <strong className="text-text">No wallet connection</strong>,
          no signature, read-only.
        </p>
      </header>

      <div className="card p-6">
        <CheckerForm />
      </div>

      <div className="my-8 flex justify-center">
        <AAds zone="leaderboard" />
      </div>

      <section className="prose prose-invert prose-sm max-w-none">
        <h2>How this works</h2>
        <p>
          We maintain a list of finalized airdrop snapshot contracts. When you
          paste an address, we check whether that address is eligible to claim
          from any of them. We never request a wallet connection — pasting an
          address is read-only and cannot drain funds.
        </p>
        <h3>Why is this safer than &quot;Connect Wallet&quot; checkers?</h3>
        <p>
          The most common airdrop scam pattern is a fake checker site that
          asks you to &quot;connect wallet to verify&quot; — then the very
          first signature drains your tokens via a hidden permit or
          setApprovalForAll. Pasting a public address has none of this risk.
          If a site asks you to <em>sign</em> anything to check eligibility,
          close the tab.
        </p>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", url: siteUrl("/") },
              { name: "Wallet Check", url: siteUrl("/check") },
            ]),
          ),
        }}
      />
    </div>
  );
}
