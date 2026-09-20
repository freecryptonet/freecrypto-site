import type { Metadata } from "next";
import Link from "next/link";
import { EarningsCalculator } from "@/components/EarningsCalculator";
import { AAds } from "@/components/AAds";
import {
  siteUrl,
  breadcrumbJsonLd,
  faqJsonLd,
  jsonLdScript,
} from "@/lib/seo";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Free crypto earnings calculator — what can you realistically earn?",
  description:
    "An honest calculator for earning crypto: set your hours and spending, see a realistic monthly estimate across exchange bonuses, cashback, offerwalls, surveys and faucets.",
  alternates: { canonical: "/calculator" },
};

const FAQS = [
  {
    q: "How much can you realistically earn from free crypto?",
    a: "For most people it's modest: a one-time boost of $50–100 from exchange sign-up bonuses and learn-and-earn, then a small recurring amount from cashback on normal spending. Active grinding (faucets, paid-to-click) pays close to nothing per hour — often under $0.50/hour — which is why we rank it last.",
  },
  {
    q: "Why are faucets ranked so low?",
    a: "Faucets pay a few satoshis per timed claim. Even claiming constantly, the effective rate is a few cents per hour. They're a fine way to see how payouts work, but they are not a real income source. Exchange bonuses and cashback pay far more for far less effort.",
  },
  {
    q: "Are the numbers guaranteed?",
    a: "No. Every figure is a conservative, typical estimate — actual payouts vary by country, program, and effort, and offers change. See our methodology for how we calculate them.",
  },
];

export default function CalculatorPage() {
  return (
    <div className="mx-auto max-w-page px-4 py-12">
      <nav className="font-mono text-xs text-text-faint mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-text-dim">Home</Link> / Calculator
      </nav>

      <div className="max-w-2xl">
        <div className="h-[3px] w-11 rounded bg-accent mb-4" />
        <h1 className="text-h1-page">What can you really earn?</h1>
        <p className="mt-3 text-lg text-text-dim">
          Drag the sliders for an honest estimate. No inflated numbers — the goal is to
          show where your time and clicks actually pay off, and where they don&rsquo;t.
        </p>
      </div>

      <div className="mt-8">
        <EarningsCalculator />
      </div>

      <p className="mt-4 text-sm text-text-dim max-w-2xl">
        Ready to collect the parts that actually pay? Start with{" "}
        <Link href="/programs/category/exchange" className="text-accent hover:underline font-semibold">exchange bonuses</Link>{" "}
        and{" "}
        <Link href="/shop" className="text-accent hover:underline font-semibold">Bitcoin cashback</Link>.
        Curious how we got these figures? Read our{" "}
        <Link href="/methodology" className="text-accent hover:underline font-semibold">methodology</Link>.
      </p>

      <div className="my-12 flex justify-center">
        <AAds zone="leaderboard" />
      </div>

      <section className="max-w-2xl">
        <h2 className="text-h2 mb-4">Questions</h2>
        <div className="space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="card p-4">
              <summary className="font-semibold cursor-pointer">{f.q}</summary>
              <p className="mt-2 text-sm text-text-dim">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", url: siteUrl("/") },
              { name: "Calculator", url: siteUrl("/calculator") },
            ]),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(faqJsonLd(FAQS.map((f) => ({ question: f.q, answer_md: f.a })))),
        }}
      />
    </div>
  );
}
