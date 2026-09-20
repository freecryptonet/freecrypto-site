import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl, OG_IMAGE, jsonLdScript } from "@/lib/seo";

const title = "About";
const description =
  "About freecrypto.net — the honest guide to earning crypto. How we score programs, why we show the catch, and how we make money.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/about" },
  openGraph: { title: "About freecrypto.net", description, type: "website", url: siteUrl("/about"), images: [OG_IMAGE] },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "freecrypto.net",
  url: siteUrl("/"),
  logo: siteUrl("/icon.svg"),
  description:
    "The honest guide to earning crypto: exchange sign-up bonuses, Bitcoin cashback, learn-and-earn and more — scored on fixed criteria with the real catch spelled out.",
  email: "hi@freecrypto.net",
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 prose">
      <h1>About freecrypto.net</h1>
      <p>
        freecrypto.net is an independent guide to earning real crypto — from
        exchange sign-up bonuses and Bitcoin cashback to learn-and-earn and
        faucets. It exists because most &ldquo;earn crypto&rdquo; sites bury the
        real requirements, inflate the numbers, or push you toward sketchy
        connect-wallet traps. We do the opposite: rank by what actually pays and
        show the catch up front.
      </p>

      <h2>What you&apos;ll find here</h2>
      <ul>
        <li>
          <Link href="/programs">All programs</Link> — a curated directory of
          every way to earn, each given a transparent 0–10 score on five fixed
          criteria.
        </li>
        <li>
          <Link href="/earn">Ways to earn</Link> — the honest overview of every
          legit method, ranked by effort and realistic payout.
        </li>
        <li>
          <Link href="/shop">Bitcoin cashback</Link> — stores that pay you back
          in sats via Satsback, with real rates and honest tracking notes.
        </li>
        <li>
          <Link href="/calculator">Earnings calculator</Link> — a no-hype
          estimate of what you can realistically earn per month.
        </li>
      </ul>

      <h2>How we score</h2>
      <p>
        Every program is rated on reward value, ease, trust/regulation, clean
        terms, and region fit — no invented star ratings, and &ldquo;varies&rdquo;
        rewards are capped on purpose. The full rubric is on our{" "}
        <Link href="/methodology">methodology page</Link>.
      </p>

      <h2>How we make money</h2>
      <p>
        Some outbound links are affiliate links: if you sign up or shop through
        them we may earn a commission, at no extra cost to you, and it never
        changes what you earn or how we rank. We also run anonymous,
        crypto-native display ads (A-Ads). We never accept payment to rank one
        program above another.
      </p>

      <h2>How to reach us</h2>
      <p>
        Spotted an out-of-date figure, a broken link, or a scam we should flag?
        Email <a href="mailto:hi@freecrypto.net">hi@freecrypto.net</a>.
      </p>

      <p className="text-sm text-text-faint">
        Nothing on this site is financial advice. Crypto earnings are small and
        variable, and availability varies by country. Always verify a program&apos;s
        current terms before you sign up.
      </p>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(orgJsonLd) }}
      />
    </article>
  );
}
