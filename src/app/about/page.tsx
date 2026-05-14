import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "About freecrypto.net — what we index, how we source data, and why we don't ask you to connect a wallet.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 prose prose-invert">
      <h1>About freecrypto.net</h1>
      <p>
        freecrypto.net is a free index of crypto airdrops, retroactive
        distributions, and testnet incentive programs. It exists because every
        existing airdrop aggregator either runs blog content as airdrops, asks
        users to connect wallets to fake checkers, or hides the useful data
        behind a subscription.
      </p>

      <h2>What you'll find here</h2>
      <ul>
        <li>
          <Link href="/">Active airdrops</Link> — editorial picks plus an
          auto-pulled feed from DefiLlama and airdrops.io, deduped and tagged
          by chain + category.
        </li>
        <li>
          <Link href="/calendar">Calendar</Link> — every deadline we track,
          sorted by date.
        </li>
        <li>
          <Link href="/check">Wallet checker</Link> — paste an address, we
          query on-chain claim contracts. No signature ever required.
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
