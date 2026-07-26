import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl, OG_IMAGE } from "@/lib/seo";

const title = "About";
const description =
  "About freecrypto.net — the free ways we help you earn real Bitcoin (cashback, bonuses, airdrops), how we source data, and why we never ask you to connect a wallet.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/about" },
  openGraph: { title: "About freecrypto.net", description, type: "website", url: siteUrl("/about"), images: [OG_IMAGE] },
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 prose prose-invert">
      <h1>About freecrypto.net</h1>
      <p>
        freecrypto.net is a free guide to earning real Bitcoin from things you
        already do — shopping cashback, exchange sign-up bonuses, and verified
        airdrops, all paid in BTC. It exists because most &ldquo;earn crypto&rdquo;
        sites either bury the real requirements, push you toward fake
        connect-wallet checkers, or hide the useful data behind a subscription.
      </p>

      <h2>What you'll find here</h2>
      <ul>
        <li>
          <Link href="/earn">How to earn Bitcoin</Link> — the honest overview of
          every legit method, ranked by effort and realistic payout.
        </li>
        <li>
          <Link href="/shop">Shop &amp; earn</Link> — stores that pay you back in
          sats via Satsback, with real rates and honest tracking notes.
        </li>
        <li>
          <Link href="/bonus">Sign-up bonuses</Link> — the exchange bonuses worth
          claiming, with the actual requirement and the catch spelled out.
        </li>
        <li>
          <Link href="/airdrops">Airdrops</Link> — editorial picks plus an
          auto-pulled feed, deduped and tagged by chain + category, with a{" "}
          <Link href="/check">wallet checker</Link> that never asks for a
          signature.
        </li>
        <li>
          <Link href="/guides">Guides</Link> — longer-form playbooks on farming
          L2 drops, avoiding scams, and reading retroactive eligibility.
        </li>
      </ul>

      <h2>How we make money</h2>
      <p>
        Display ads (A-Ads, anonymous and crypto-native) and exchange affiliate
        links. We disclose every paid placement. We never accept payment to
        list, recommend, or rank an airdrop above another.
      </p>

      <h2>How to reach us</h2>
      <p>
        Spotted a missing airdrop, broken claim link, or scam URL we should
        flag? Drop a note at{" "}
        <a href="mailto:hi@freecrypto.net">hi@freecrypto.net</a>.
      </p>

      <p className="text-sm text-text-faint">
        Nothing on this site is financial advice. Airdrops carry risk including
        total loss; always verify contracts and team before interacting.
      </p>
    </article>
  );
}
