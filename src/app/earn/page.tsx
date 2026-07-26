import type { Metadata } from "next";
import Link from "next/link";
import { AAds } from "@/components/AAds";
import { PayoutProof } from "@/components/PayoutProof";
import { breadcrumbJsonLd, faqJsonLd, jsonLdScript, siteUrl, OG_IMAGE, TWITTER_IMAGE } from "@/lib/seo";

export const dynamic = "force-static";

const title = "How to Earn Free Bitcoin in 2026 (Without Buying It)";
const description =
  "Every legit way to stack sats without buying Bitcoin — shopping cashback, exchange sign-up bonuses, airdrops, interest, and learn-to-earn — ranked by effort and honest payout.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/earn" },
  openGraph: { title, description, type: "article", url: siteUrl("/earn"), images: [OG_IMAGE] },
  twitter: { card: "summary_large_image", title, description, images: [TWITTER_IMAGE] },
};

const METHODS = [
  { name: "Shopping cashback", effort: "Very low", payout: "1–20% back in sats", best: "Money you'd spend anyway", href: "/shop" },
  { name: "Sign-up bonuses", effort: "Low (one-off)", payout: "€10–$2,500", best: "A one-time top-up", href: "/bonus" },
  { name: "Airdrops", effort: "Medium–high", payout: "$0–thousands", best: "Active on-chain users", href: "/airdrops" },
  { name: "Interest / earn", effort: "Low (needs capital)", payout: "Up to ~13% APY", best: "Long-term holders", href: "/bonus/nexo" },
  { name: "Learn-to-earn", effort: "Low", payout: "A few $ per lesson", best: "Total beginners", href: "/bonus/coinbase" },
];

const FAQS = [
  {
    question: "What's the easiest way to earn free Bitcoin?",
    answer_md:
      "Shopping cashback. You install a browser extension, shop where you already shop, and a percentage comes back as sats — zero extra effort or capital. Sign-up bonuses are a close second: a one-time reward for joining an exchange you were going to use anyway.",
  },
  {
    question: "Is earning free Bitcoin actually legit, or a scam?",
    answer_md:
      "The methods on this page are legitimate — cashback, exchange bonuses, airdrops, and interest are all real. The scams live at the edges: anything that asks you to *deposit first* to \"unlock\" free Bitcoin, or to sign a wallet transaction to \"verify\" eligibility, is a trap. Real free-earning never asks for your money or a signature to check eligibility.",
  },
  {
    question: "How much can I realistically earn?",
    answer_md:
      "Be realistic: cashback and bonuses are meaningful side-sats, not a salary — think tens to low-hundreds of euros a year for a normal shopper, more if you stack a few methods. Airdrops are the only category with life-changing outliers, but they're the highest-effort and least predictable.",
  },
  {
    question: "Do I need to buy any crypto to start?",
    answer_md:
      "No. Cashback, learn-to-earn, and airdrops require zero purchase. Sign-up bonuses vary — some just need a verified account, others require a qualifying deposit or trade (we flag which on each bonus guide). Interest products do need capital, since you earn yield on Bitcoin you already hold.",
  },
];

export default function EarnPillarPage() {
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    author: { "@type": "Organization", name: "freecrypto.net editorial" },
    publisher: { "@type": "Organization", name: "freecrypto.net", url: siteUrl("/") },
    mainEntityOfPage: siteUrl("/earn"),
  };
  const faq = faqJsonLd(FAQS);

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-4 text-xs text-text-faint" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-text-dim">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-text-dim">Earn Bitcoin</span>
      </nav>

      <header className="mb-6">
        <div className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">₿ The guide</div>
        <h1 className="text-h1-page font-bold tracking-tight">How to earn free Bitcoin in 2026 — without buying it</h1>
        <p className="mt-3 text-text-dim">
          You don&apos;t need to trade or invest to stack sats. There are five legitimate ways to earn
          Bitcoin for free — some passive, some hands-on — and the right mix depends on how much
          effort and capital you have. Here&apos;s each one, what it really pays, and where to start.
        </p>
      </header>

      <div className="mb-8 flex justify-center">
        <AAds zone="leaderboard" />
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-h2 font-semibold">The methods at a glance</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-xs text-text-faint">
                <th className="py-2 pr-4 font-medium">Method</th>
                <th className="py-2 pr-4 font-medium">Effort</th>
                <th className="py-2 pr-4 font-medium">Typical payout</th>
                <th className="py-2 pr-4 font-medium">Best for</th>
                <th className="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {METHODS.map((m) => (
                <tr key={m.name} className="border-b border-edge/50">
                  <td className="py-3 pr-4 font-medium text-text">{m.name}</td>
                  <td className="py-3 pr-4 text-text-dim">{m.effort}</td>
                  <td className="py-3 pr-4 font-mono text-accent">{m.payout}</td>
                  <td className="py-3 pr-4 text-text-dim">{m.best}</td>
                  <td className="py-3 text-right"><Link href={m.href} className="text-xs text-accent hover:underline">Start →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <PayoutProof className="mb-10" />

      <div className="prose prose-invert max-w-none">
        <h2>1. Shopping cashback — the easiest sats you&apos;ll ever earn</h2>
        <p>
          If you buy anything online, this is free money on spending you&apos;d do anyway. Cashback
          services like Satsback pay you a percentage of each order back in Bitcoin — sent as sats to
          a Lightning wallet you control, no points or vouchers. You install a browser extension, shop
          normally, and the sats accrue. Rates run from around 1% at supermarkets to 20% at some
          services, and Bitcoin-native shops give fixed discount codes instead.
        </p>
        <p>
          It&apos;s the lowest-effort method by far, with one honest caveat: affiliate tracking isn&apos;t
          perfect, so roughly two in three orders track cleanly. Treat the sats as a bonus, not a
          guarantee. → <Link href="/shop">Browse stores that pay Bitcoin cashback</Link> (or the{" "}
          <Link href="/nl/shop">Dutch store directory</Link>).
        </p>

        <h2>2. Sign-up bonuses — a one-time free top-up</h2>
        <p>
          Most exchanges pay a reward for joining through a referral. It&apos;s a one-off, but it&apos;s the
          single largest chunk of free Bitcoin most people can get for the least work — anywhere from
          €10 to (with a large deposit) thousands. The trick is reading the requirement: some bonuses
          need only a verified account, others a qualifying deposit or trade.
        </p>
        <p>
          We compare the three worth your time — Bitvavo, Nexo, and Coinbase — with the real strings
          attached on the <Link href="/bonus">bonuses page</Link>. Whichever you pick, always open the
          referral link <em>before</em> you sign up; exchanges rarely add a bonus retroactively.
        </p>

        <h2>3. Airdrops — the highest ceiling, the highest effort</h2>
        <p>
          Airdrops reward on-chain activity with free tokens, and they&apos;re the only method here with
          genuinely life-changing outliers (Uniswap, Arbitrum, and Jupiter all paid four- to
          five-figure sums to ordinary early users). The catch is they&apos;re unpredictable and
          time-consuming, and the space is full of &quot;connect wallet to verify&quot; scams.
        </p>
        <p>
          Start by checking what you already qualify for — paste a public address into our{" "}
          <Link href="/check">free wallet checker</Link> (no signature required), browse{" "}
          <Link href="/airdrops">active airdrops</Link>, and read{" "}
          <Link href="/guides/how-to-qualify-for-l2-airdrops-2026">how to qualify without sybil flagging</Link>{" "}
          before farming.
        </p>

        <h2>4. Interest and earn — put idle Bitcoin to work</h2>
        <p>
          If you already hold Bitcoin, earning interest turns a static stack into a growing one.
          Platforms like Nexo pay yield on deposited crypto — up to double digits on some assets —
          though this is the one method that needs capital, and yield always carries counterparty
          risk. Only ever earn interest on funds you can afford to have locked. →{" "}
          <Link href="/bonus/nexo">How the Nexo earn programme works</Link>.
        </p>

        <h2>5. Learn-to-earn — free crypto for beginners</h2>
        <p>
          The gentlest on-ramp: exchanges like Coinbase pay you small amounts of crypto for watching
          short lessons and passing a quiz. The payouts are modest (a few dollars per token), but it&apos;s
          genuinely free, teaches you the basics, and often comes bundled with the sign-up bonus. →{" "}
          <Link href="/bonus/coinbase">Start with Coinbase</Link>.
        </p>

        <h2>The one rule that keeps you safe</h2>
        <p>
          Every method here is free to <em>start</em>. So the red flag is simple: if a site asks you to{" "}
          <strong>deposit money to unlock</strong> free Bitcoin, or to <strong>sign a wallet
          transaction to &quot;verify&quot;</strong> eligibility, it&apos;s a scam — close the tab. Real
          free-earning never asks for your money or a signature to check what you&apos;re owed. The full
          playbook is in our{" "}
          <Link href="/guides/avoid-connect-wallet-airdrop-scams">wallet-drainer scam guide</Link>.
        </p>
      </div>

      <section className="mt-10 border-t border-edge pt-8">
        <h2 className="mb-4 text-h2 font-semibold">Frequently asked questions</h2>
        <dl className="space-y-4">
          {FAQS.map((f, i) => (
            <div key={i}>
              <dt className="font-semibold text-text">{f.question}</dt>
              <dd className="mt-1 text-sm text-text-dim">{f.answer_md}</dd>
            </div>
          ))}
        </dl>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd([
        { name: "Home", url: siteUrl("/") },
        { name: "Earn Bitcoin", url: siteUrl("/earn") },
      ])) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(article) }} />
      {faq && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(faq) }} />}
    </article>
  );
}
