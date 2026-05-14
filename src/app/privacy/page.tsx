import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What freecrypto.net collects, what we don't, and why.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 prose prose-invert">
      <h1>Privacy</h1>
      <p>Short version: we collect as little as possible and never your funds.</p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Pages you view.</strong> Standard server access logs (IP +
          path + user-agent). Used to debug 500s and detect abuse. Rotated
          every 30 days.
        </li>
        <li>
          <strong>Wallet addresses you paste into /check.</strong> Stored as a
          SHA-256 hash for rate-limiting only. The original address is never
          persisted.
        </li>
        <li>
          <strong>Newsletter signups.</strong> Email + a hashed IP. We never
          share or sell. One-click unsubscribe is in every email.
        </li>
        <li>
          <strong>Affiliate click logs.</strong> When you click a sponsored
          exchange CTA we log the redirect code + hashed IP + referrer. Used
          for attribution; never shared with the destination.
        </li>
      </ul>

      <h2>What we don't collect</h2>
      <ul>
        <li>
          <strong>Wallet signatures.</strong> We never request a wallet
          connection or signature anywhere on this site. Anyone claiming
          otherwise is impersonating us.
        </li>
        <li>
          <strong>Private keys, seed phrases.</strong> Same reason.
        </li>
        <li>
          <strong>KYC info.</strong> We don't run a KYC flow. Exchange CTAs
          may require KYC on the destination, but that's their flow, not ours.
        </li>
      </ul>

      <h2>Third parties</h2>
      <ul>
        <li>
          <strong>Google Analytics 4.</strong> If you opt out via standard
          browser-level DNT, GA respects it.
        </li>
        <li>
          <strong>A-Ads.</strong> A-Ads is a crypto-native ad network and
          serves anonymous ads (no user profile, no behavioral tracking).
        </li>
        <li>
          <strong>Exchange affiliates.</strong> When you click an exchange
          referral CTA, the destination platform sees standard referrer +
          your IP from that point on. We don't share your data with them
          beyond the standard click.
        </li>
      </ul>

      <h2>Data requests</h2>
      <p>
        Email <a href="mailto:hi@freecrypto.net">hi@freecrypto.net</a> for
        access or deletion of any data we hold about you (newsletter email,
        most likely). We'll respond within 7 days.
      </p>
    </article>
  );
}
