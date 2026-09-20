import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Our methodology — how we rank ways to earn crypto",
  description:
    "How freecrypto.net estimates payouts and ranks earning methods: conservative typical figures, effort ratings, affiliate disclosure, and how we handle safety and geography.",
  alternates: { canonical: "/methodology" },
};

const PRINCIPLES = [
  {
    h: "We rank by real payout, not by what pays us",
    p: "Methods are ordered by the money a typical person can realistically earn for the effort involved. Exchange sign-up bonuses and cashback sit at the top because they pay real crypto for little work; faucets sit at the bottom because they pay pennies. Affiliate commission never changes the ranking.",
  },
  {
    h: "Payout figures are conservative and typical",
    p: "Every number is a typical, lower-middle estimate — not a best case. Ranges reflect what most users see, not the cherry-picked maximum an offer advertises. Where a payout depends on your spending or country, we say so.",
  },
  {
    h: "Effort is rated honestly",
    p: "A one-time bonus you claim once is not the same as a faucet you must click every few minutes. Our effort dots reflect ongoing time cost, so a low payout that also takes hours is clearly marked as poor value.",
  },
  {
    h: "Affiliate links are disclosed",
    p: "Some outbound links are affiliate links: if you sign up or shop through them we may earn a commission, at no extra cost to you, and it never reduces what you earn. Non-affiliate options are included where they matter.",
  },
  {
    h: "Geography and eligibility are flagged",
    p: "Many exchange bonuses only pay in specific countries, and some faucet/offerwall traffic can't complete offers where they live. We surface which offers fit which regions instead of sending everyone everywhere.",
  },
  {
    h: "Safety over hype",
    p: "We never ask you to connect a wallet to claim a listing, and we flag KYC, custody and scam risks. If a method is popular but risky, we say that plainly rather than burying it.",
  },
];

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-page px-4 py-12">
      <nav className="font-mono text-xs text-text-faint mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-text-dim">Home</Link> / Methodology
      </nav>

      <div className="max-w-2xl">
        <div className="h-[3px] w-11 rounded bg-accent mb-4" />
        <h1 className="text-h1-page">How we rank ways to earn</h1>
        <p className="mt-3 text-lg text-text-dim">
          &ldquo;Free crypto&rdquo; is full of inflated promises. Our whole value is being
          straight with you — here&rsquo;s exactly how we decide what goes where.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 max-w-4xl">
        {PRINCIPLES.map((pr, i) => (
          <div key={pr.h} className="card p-5">
            <div className="font-mono text-sm font-bold tabular-nums text-accent-alt">
              {String(i + 1).padStart(2, "0")}
            </div>
            <h2 className="mt-2 text-h3">{pr.h}</h2>
            <p className="mt-1.5 text-sm text-text-dim">{pr.p}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 max-w-2xl card p-6">
        <h2 className="text-h3">Found something wrong?</h2>
        <p className="mt-1.5 text-sm text-text-dim">
          Payouts change and offers get pulled. If a figure looks off, tell us and we&rsquo;ll
          re-check it — accuracy is the only thing this site has going for it. Try the{" "}
          <Link href="/calculator" className="text-accent-alt hover:underline font-semibold">earnings calculator</Link>{" "}
          to see these numbers applied to your own hours and spending.
        </p>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", url: siteUrl("/") },
              { name: "Methodology", url: siteUrl("/methodology") },
            ]),
          ),
        }}
      />
    </div>
  );
}
