import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for freecrypto.net.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 prose prose-invert">
      <h1>Terms of use</h1>

      <h2>1. No financial advice</h2>
      <p>
        Nothing on freecrypto.net is financial, investment, tax, or legal
        advice. We aggregate publicly-available information about crypto
        airdrops; we do not endorse any project listed. Airdrops carry risk
        including total loss of any funds you commit to qualifying for them.
        You are solely responsible for verifying contracts, teams, and claim
        portals before interacting.
      </p>

      <h2>2. No warranty</h2>
      <p>
        Listings may be inaccurate, stale, or incomplete. Claim deadlines,
        eligibility criteria, and project status change without notice. We
        explicitly disclaim any guarantee about the accuracy or completeness
        of any listing.
      </p>

      <h2>3. Scam awareness</h2>
      <p>
        freecrypto.net never asks you to sign a transaction, connect a wallet,
        or share a private key. The only safe wallet-checking method on this
        site is pasting a public address into <a href="/check">/check</a>. Any
        URL that imitates us and requests a wallet signature is a phishing
        attack — close the tab and report it.
      </p>

      <h2>4. Affiliate disclosure</h2>
      <p>
        Some outbound links (notably to centralized exchanges) are affiliate
        referrals that pay us a commission when you sign up. We label these as
        "Sponsored" wherever they appear. Affiliate status does not influence
        what we list, how we rank, or what we recommend.
      </p>

      <h2>5. Acceptable use</h2>
      <p>
        Don't scrape this site aggressively, attempt to compromise it, or
        misrepresent yourself as us. Our content (other than user-submitted
        data) is licensed CC-BY 4.0 — you're free to reproduce with
        attribution.
      </p>

      <h2>6. Changes</h2>
      <p>
        We may update these terms at any time. Continued use of the site
        constitutes acceptance of the current version.
      </p>

      <p className="text-sm text-text-faint">
        Questions: <a href="mailto:hi@freecrypto.net">hi@freecrypto.net</a>
      </p>
    </article>
  );
}
