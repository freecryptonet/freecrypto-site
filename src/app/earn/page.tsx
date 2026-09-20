import type { Metadata } from "next";
import Link from "next/link";
import { AAds } from "@/components/AAds";
import { PayoutProof } from "@/components/PayoutProof";
import { breadcrumbJsonLd, faqJsonLd, jsonLdScript, siteUrl, OG_IMAGE, TWITTER_IMAGE } from "@/lib/seo";

export const dynamic = "force-static";

const title = "How to Earn Free Crypto in 2026 (Ranked by What Pays)";
const description =
  "Every legit way to earn crypto without buying it — exchange sign-up bonuses, Bitcoin cashback, learn-and-earn, faucets and interest — ranked by effort and honest payout.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/earn" },
  openGraph: { title, description, type: "article", url: siteUrl("/earn"), images: [OG_IMAGE] },
  twitter: { card: "summary_large_image", title, description, images: [TWITTER_IMAGE] },
};

const METHODS = [
  { name: "Exchange sign-up bonuses", effort: "Low (one-off)", payout: "$10–100+", best: "The single biggest free payout", href: "/bonus" },
  { name: "Bitcoin cashback", effort: "Very low", payout: "1–12% back", best: "Money you'd spend anyway", href: "/shop" },
  { name: "Learn-and-earn", effort: "Low", payout: "$5–40", best: "Total beginners", href: "/bonus" },
  { name: "Interest / earn", effort: "Low (needs capital)", payout: "Up to ~13% APY", best: "Long-term holders", href: "/bonus" },
  { name: "Faucets & tasks", effort: "High for the payout", payout: "Cents/hour", best: "A first taste only", href: "/calculator" },
];

const FAQS = [
  {
    question: "What's the best way to earn free crypto?",
    answer_md:
      "Exchange sign-up bonuses. Opening a regulated exchange through a referral pays a one-time reward in real crypto — the biggest single payout on this page for the least ongoing effort. Bitcoin cashback is a close second because it earns on spending you'd do anyway.",
  },
  {
    question: "Is earning free crypto actually legit, or a scam?",
    answer_md:
      "The methods on this page are legitimate — exchange bonuses, cashback, learn-and-earn and interest are all real. The scams live at the edges: anything that asks you to *deposit first* to \"unlock\" free crypto, or to sign a wallet transaction to \"verify\" eligibility, is a trap. Real free-earning never asks for your money or a signature to check eligibility.",
  },
  {
    question: "How much can I realistically earn?",
    answer_md:
      "Be realistic: a one-time $50–100 from bonuses and learn-and-earn, plus modest recurring cashback on your normal spending. Faucets and paid clicks pay cents per hour — fine for a first taste, not an income. Try the calculator to see honest numbers for your own hours and spending.",
  },
  {
    question: "Do I need to buy any crypto to start?",
    answer_md:
      "No. Cashback and learn-and-earn require zero purchase. Sign-up bonuses vary — some just need a verified account, others a qualifying deposit or trade (we flag which on each bonus guide). Interest products do need capital, since you earn yield on crypto you already hold.",
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
    <article className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-4 text-xs text-text-faint" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-text-dim">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-text-dim">Ways to earn</span>
      </nav>

      <header className="mb-6">
        <div className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-accent">The guide</div>
        <h1 className="text-h1-page tracking-tight">How to earn free crypto in 2026 — ranked by what pays</h1>
        <p className="mt-3 text-text-dim">
          You don&apos;t need to trade or invest to earn crypto. There are five legitimate ways —
          some passive, some hands-on — and the right mix depends on your effort and budget.
          Here&apos;s each one, what it really pays, and where to start. Biggest payouts first.
        </p>
      </header>

      <div className="mb-8 flex justify-center">
        <AAds zone="leaderboard" />
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-h2">The methods at a glance</h2>
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
                <tr key={m.name} className="border-b border-edge">
                  <td className="py-3 pr-4 font-semibold text-text">{m.name}</td>
                  <td className="py-3 pr-4 text-text-dim">{m.effort}</td>
                  <td className="py-3 pr-4 font-mono text-accent-alt font-bold">{m.payout}</td>
                  <td className="py-3 pr-4 text-text-dim">{m.best}</td>
                  <td className="py-3 text-right"><Link href={m.href} className="text-xs font-bold text-accent hover:underline">Start →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-text-faint">
          Want these numbers for your own hours &amp; spending? Try the{" "}
          <Link href="/calculator" className="text-accent hover:underline">earnings calculator</Link>.
        </p>
      </section>

      <PayoutProof className="mb-10" />

      <div className="prose max-w-none">
        <h2>1. Exchange sign-up bonuses — the biggest free payout</h2>
        <p>
          Most regulated exchanges pay a reward for joining through a referral. It&apos;s a one-off, but
          it&apos;s the single largest chunk of free crypto most people can get for the least work —
          anywhere from €10 to (with a qualifying deposit) far more. The trick is reading the
          requirement: some bonuses need only a verified account, others a qualifying deposit or trade.
        </p>
        <p>
          We compare the ones worth your time — Bitvavo, Coinbase and Nexo — with the real strings
          attached on the <Link href="/programs/category/exchange">bonuses page</Link>. Whichever you pick, always open the
          referral link <em>before</em> you sign up; exchanges rarely add a bonus retroactively. Note
          that most pay only in supported countries, so check eligibility first.
        </p>

        <h2>2. Bitcoin cashback — the easiest sats you&apos;ll ever earn</h2>
        <p>
          If you buy anything online, this is free money on spending you&apos;d do anyway. Cashback
          services like Satsback pay a percentage of each order back in Bitcoin — sent as sats to a
          wallet you control, no points or vouchers. Rates run from around 1% up to about 12%.
        </p>
        <p>
          It&apos;s the lowest-effort method by far, with one honest caveat: affiliate tracking isn&apos;t
          perfect, so not every order tracks. Treat the sats as a bonus, not a guarantee. →{" "}
          <Link href="/shop">Browse stores that pay Bitcoin cashback</Link> (or the{" "}
          <Link href="/nl/shop">Dutch store directory</Link>).
        </p>

        <h2>3. Learn-and-earn — free crypto for beginners</h2>
        <p>
          The gentlest on-ramp: exchanges like Coinbase pay small amounts of crypto for watching short
          lessons and passing a quiz. Payouts are modest (a few dollars per token), but it&apos;s
          genuinely free, teaches you the basics, and often comes bundled with the sign-up bonus. →{" "}
          <Link href="/programs/category/exchange">See learn-and-earn offers</Link>.
        </p>

        <h2>4. Interest and earn — put idle crypto to work</h2>
        <p>
          If you already hold crypto, earning interest turns a static stack into a growing one.
          Platforms like Nexo pay yield on deposited assets, though this is the one method that needs
          capital and always carries counterparty risk. Only earn interest on funds you can afford to
          have locked. → <Link href="/programs/category/exchange">How exchange earn programmes work</Link>.
        </p>

        <h2>5. Faucets &amp; tasks — easy, but tiny</h2>
        <p>
          Faucets drip a few satoshis on a timer, and paid-to-click and offerwall tasks pay small
          amounts for clicks and micro-jobs. They&apos;re a fine way to see how payouts work and get your
          first sats, but the effective rate is cents per hour — so we rank them last, honestly. The{" "}
          <Link href="/calculator">calculator</Link> shows exactly how little grinding pays versus the
          methods above.
        </p>

        <h2>The one rule that keeps you safe</h2>
        <p>
          Every method here is free to <em>start</em>. So the red flag is simple: if a site asks you to{" "}
          <strong>deposit money to unlock</strong> free crypto, or to <strong>sign a wallet
          transaction to &quot;verify&quot;</strong> eligibility, it&apos;s a scam — close the tab. Real
          free-earning never asks for your money or a signature to check what you&apos;re owed. See{" "}
          <Link href="/methodology">how we score &amp; vet</Link> each program before you sign up.
        </p>
      </div>

      <section className="mt-10 card p-6 bg-accent/[0.04] border-accent/30">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.12em] text-accent-alt">Where to start</div>
            <h2 className="mt-1 text-h3">Grab the two that actually pay first</h2>
            <p className="mt-1 text-sm text-text-dim">
              Skip the grind: open a regulated exchange for the sign-up bonus, then turn on Bitcoin
              cashback for spending you already do.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/programs/category/exchange" className="inline-flex px-5 py-2.5 rounded-btn bg-text text-ink font-bold text-sm hover:opacity-90 transition-opacity">
              Compare bonuses →
            </Link>
            <Link href="/shop" className="inline-flex px-4 py-2.5 rounded-btn bg-ink-muted border border-edge font-bold text-sm hover:bg-edge transition-colors">
              Set up cashback
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10 border-t border-edge pt-8">
        <h2 className="mb-4 text-h2">Frequently asked questions</h2>
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
        { name: "Ways to earn", url: siteUrl("/earn") },
      ])) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(article) }} />
      {faq && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(faq) }} />}
    </article>
  );
}
