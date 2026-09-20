import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AAds } from "@/components/AAds";
import {
  CATEGORY_META,
  PILLARS,
  SCORE_CRITERIA,
  opportunitiesByCategory,
  officialUrl,
  overallScore,
  type OppCategory,
} from "@/lib/opportunities";
import { FeaturedCard, RankedCard } from "@/components/ProgramCards";
import { siteUrl, breadcrumbJsonLd, faqJsonLd, jsonLdScript } from "@/lib/seo";

export const dynamic = "force-static";

const ALL_CATS: OppCategory[] = [
  "exchange",
  "learn-earn",
  "cashback",
  "card",
  "hardware",
  "onramp",
  "gpt",
];

interface CatContent {
  h1: string;
  title: string;
  description: string;
  intro: string[];
  faqs: Array<{ question: string; answer_md: string }>;
}

const CONTENT: Record<OppCategory, CatContent> = {
  exchange: {
    h1: "Best crypto exchange sign-up bonuses (2026)",
    title: "Best Crypto Exchange Sign-Up Bonuses (2026) — Ranked & Compared",
    description:
      "The best crypto exchange sign-up bonuses in 2026, compared honestly: reward, requirements, region and regulation for Bitvavo, Coinbase, Kraken, Bitpanda and more.",
    intro: [
      "An exchange sign-up bonus is the single biggest chunk of free crypto most people can get for the least effort. Open a regulated exchange through a referral link, meet the (usually small) requirement, and you get a one-time reward in real crypto — no grinding, no faucets.",
      "The catch is always in the terms: some bonuses only need a verified account, others a qualifying deposit or trade, and almost all are limited to specific countries. Below we compare the exchanges worth your time, with the honest requirement and region for each. Always open the referral link before you sign up — exchanges rarely add a bonus retroactively.",
    ],
    faqs: [
      {
        question: "Which crypto exchange has the best sign-up bonus?",
        answer_md:
          "It depends on your country. In the EU, Bitvavo is the easiest first exchange (iDEAL/SEPA, low fees, DNB-registered). Coinbase is the most widely available and adds learn-and-earn on top. Kraken and Bitpanda are strong regulated alternatives. Check the current offer and your region before signing up.",
      },
      {
        question: "Do I have to deposit money to get an exchange bonus?",
        answer_md:
          "Sometimes. Some bonuses only require a verified account; others need a qualifying deposit or trade. We flag the requirement on each exchange. Never treat a required deposit as 'free money' — only deposit what you'd invest anyway.",
      },
    ],
  },
  "learn-earn": {
    h1: "Best learn-and-earn crypto programs (2026)",
    title: "Best Learn-and-Earn Crypto Programs (2026) — Free Crypto for Learning",
    description:
      "Earn free crypto by learning: the best learn-and-earn programs in 2026 from Coinbase, Kraken and more — no deposit required, genuinely beginner-friendly.",
    intro: [
      "Learn-and-earn is the gentlest way to get your first crypto: watch a short lesson, pass a quick quiz, and receive a small amount of the token being taught. No deposit, no risk — just a verified account.",
      "Payouts are modest (a few dollars per token) and individual campaigns come and go, but it's genuinely free and teaches you the basics. It pairs naturally with an exchange sign-up bonus, since the same account often unlocks both.",
    ],
    faqs: [
      {
        question: "Is learn-and-earn actually free?",
        answer_md:
          "Yes. Reputable learn-and-earn programs (like Coinbase's) pay you crypto for completing lessons with no deposit required — you only need a verified account. The rewards are small and specific campaigns rotate, but there's no catch beyond that.",
      },
      {
        question: "How much can you earn from learn-and-earn?",
        answer_md:
          "Typically a few dollars per lesson while a campaign is live, so a one-time total in the tens of dollars if you complete what's available in your region. It's a great free start, not an income stream.",
      },
    ],
  },
  cashback: {
    h1: "Best crypto cashback sites (2026)",
    title: "Best Crypto Cashback Sites (2026) — Earn Bitcoin When You Shop",
    description:
      "Earn Bitcoin back on shopping you already do: the best crypto cashback sites and extensions in 2026 — Satsback, Lolli, Fold and more — compared by rate and region.",
    intro: [
      "Crypto cashback is the most passive way to earn: shop the stores you already use through a cashback link or extension, and a percentage comes back to you in real Bitcoin — sent as sats to a wallet you control, not points or vouchers.",
      "Rates run from around 1% at big retailers to double digits at some services. The one honest caveat is affiliate tracking isn't perfect, so not every order registers — treat cashback as a bonus on spending you'd do anyway, not a guarantee. Coverage and payout currency vary by provider and region.",
    ],
    faqs: [
      {
        question: "Which crypto cashback site is best?",
        answer_md:
          "For EU shoppers, Satsback has broad coverage and pays in Bitcoin over Lightning. Lolli and Fold are strong but mostly US-focused. Pick the one with the best coverage for the stores you actually use in your country.",
      },
      {
        question: "How does Bitcoin cashback get paid out?",
        answer_md:
          "You start your purchase from the cashback provider's link or extension, buy as normal, and once the order is confirmed the provider credits your account in Bitcoin (often over the Lightning Network). You then withdraw to your own wallet. Payouts can take days to weeks to confirm.",
      },
    ],
  },
  card: {
    h1: "Best crypto cards with rewards (2026)",
    title: "Best Crypto Cards with Rewards (2026) — Cashback Compared",
    description:
      "Crypto debit cards that pay cashback rewards on every purchase, compared honestly for 2026: Crypto.com, Nexo, Plutus and Wirex — with the real tier terms.",
    intro: [
      "A crypto rewards card pays you cashback in crypto on everyday spending. At the top tiers the rates are genuinely attractive; at the entry level they're modest — and the headline numbers usually require a large token stake.",
      "Read the tier table, not the marketing: rates have been cut over time on several cards, and cashback paid in a volatile token isn't the same as cash. Availability and card variants differ by region. Below, the main options with their honest catch.",
    ],
    faqs: [
      {
        question: "Are crypto cashback cards worth it?",
        answer_md:
          "Only if you'll actually hit a rewarding tier and spend enough to matter. Entry tiers pay little, and top rates need a substantial locked token stake whose value can fall. For heavy spenders already in an ecosystem they can pay off; for casual users, cashback shopping sites are simpler.",
      },
      {
        question: "In what currency is the cashback paid?",
        answer_md:
          "Usually the platform's own token (e.g. CRO for Crypto.com, PLU for Plutus) rather than Bitcoin or cash. That means the real value of your rewards moves with that token's price — factor that in.",
      },
    ],
  },
  hardware: {
    h1: "Best hardware wallets (2026)",
    title: "Best Hardware Wallets (2026) — Keep Your Crypto Safe",
    description:
      "Once you've earned crypto, protect it. The best hardware wallets in 2026 — Ledger and Trezor — compared, with the one safety rule that matters most.",
    intro: [
      "This is the one category here that doesn't earn you crypto — it protects what you've earned, which is the highest-return move on the whole site. A hardware wallet keeps your private keys offline, so your crypto is safe even if your computer is compromised or an exchange fails.",
      "Both leading brands do the same core job. The rule that matters more than the brand: only ever buy direct from the official manufacturer, and never enter your recovery phrase into any app or website. Anyone who asks for your seed phrase is a scammer.",
    ],
    faqs: [
      {
        question: "Do I really need a hardware wallet?",
        answer_md:
          "If you hold more than pocket change, yes. Leaving crypto on an exchange means trusting that exchange stays solvent and unhacked. A hardware wallet puts you in sole control. For small amounts you're just testing with, it can wait — but move it off the exchange as it grows.",
      },
      {
        question: "Ledger or Trezor?",
        answer_md:
          "Both are reputable. Ledger has the widest coin support and a polished app; Trezor is fully open-source, which security-minded users prefer. Either is a huge upgrade over leaving funds on an exchange. Buy only from the official site.",
      },
    ],
  },
  onramp: {
    h1: "Best crypto on-ramps (2026)",
    title: "Best Crypto On-Ramps (2026) — Buy Crypto with Card or Bank",
    description:
      "The easiest ways to buy your first crypto with a card or bank transfer in 2026 — MoonPay, Transak and more — with fees compared honestly.",
    intro: [
      "An on-ramp lets you buy crypto with a card or bank transfer and send it straight to your own wallet, often in minutes. It's the fastest way to get started when you don't want a full exchange account.",
      "The trade-off is fees: instant on-ramps are more expensive than buying on an exchange. They win on convenience, not price. For a small first purchase that's fine; for larger amounts, a regulated exchange is cheaper.",
    ],
    faqs: [
      {
        question: "What's the cheapest way to buy crypto?",
        answer_md:
          "A regulated exchange with bank transfer (SEPA/iDEAL) is almost always cheaper than an instant card on-ramp. On-ramps like MoonPay and Transak are worth the premium only when you value speed and simplicity over cost.",
      },
      {
        question: "Can I buy crypto straight to my own wallet?",
        answer_md:
          "Yes — that's exactly what on-ramps are for. You enter your wallet address and the crypto is delivered there directly, so you hold the keys from the start. Double-check the address; on-chain transfers can't be reversed.",
      },
    ],
  },
  gpt: {
    h1: "Crypto offerwalls & paid tasks (2026)",
    title: "Crypto Offerwalls & Paid Tasks (2026) — An Honest Look",
    description:
      "Offerwalls, surveys, paid-to-click and faucets in 2026, reviewed honestly: real payouts but low value per hour. What actually pays and what to skip.",
    intro: [
      "Offerwalls, surveys, paid-to-click and faucets are the most-hyped and lowest-paying corner of 'free crypto'. They're real — reputable sites do pay — but the effective rate is low, which is why we rank them last.",
      "Used with clear eyes they're fine: a way to get your first sats with zero budget. Just don't mistake them for income. The bigger offers (app installs, sign-ups) pay a few dollars but are limited and region-gated; surveys and clicks pay cents.",
    ],
    faqs: [
      {
        question: "Do crypto faucets and offerwalls actually pay?",
        answer_md:
          "The reputable ones do, but very little. Faucets pay a few satoshis per timed claim (cents per hour); offerwall tasks pay more but are inconsistent and geo-restricted. Fine for a first taste with no budget — not a real income source.",
      },
      {
        question: "What's the highest-paying task option?",
        answer_md:
          "Completed offers (app installs, service sign-ups) on a reputable offerwall pay the most — a few dollars each — but they're limited and depend on your country. Surveys are next; faucets and paid-to-click are the lowest.",
      },
    ],
  },
};

export function generateStaticParams() {
  return ALL_CATS.map((cat) => ({ cat }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ cat: string }> },
): Promise<Metadata> {
  const { cat } = await params;
  const c = CONTENT[cat as OppCategory];
  if (!c) return {};
  return { title: c.title, description: c.description, alternates: { canonical: `/programs/category/${cat}` } };
}

export default async function CategoryPage(
  { params }: { params: Promise<{ cat: string }> },
) {
  const { cat } = await params;
  const category = cat as OppCategory;
  const c = CONTENT[category];
  const meta = CATEGORY_META[category];
  if (!c || !meta) notFound();

  const items = opportunitiesByCategory(category);
  const ranked = [...items].sort(
    (a, b) => (overallScore(b.slug) ?? 0) - (overallScore(a.slug) ?? 0),
  );
  const featured = ranked[0];
  const rest = ranked.slice(1);
  const accent = meta.tone === "shop" ? "bg-accent-warm" : "bg-accent";
  const accentText = meta.tone === "shop" ? "text-accent-warm" : "text-accent-alt";
  const faq = faqJsonLd(c.faqs);

  return (
    <div className="mx-auto max-w-page px-4 py-12">
      <nav className="font-mono text-xs text-text-faint mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-text-dim">Home</Link> /{" "}
        <Link href="/programs" className="hover:text-text-dim">Programs</Link> / {meta.short}
      </nav>

      <header className="max-w-3xl">
        <div className={`h-[3px] w-11 rounded mb-4 ${accent}`} />
        <h1 className="text-h1-page">{c.h1}</h1>
        <div className="mt-4 prose max-w-none">
          {c.intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <p className="mt-2 font-mono text-xs text-text-faint">
          {items.length} options · last reviewed Sep 2026 · terms change — check the current offer.
        </p>
      </header>

      <div className="my-10 flex justify-center">
        <AAds zone="leaderboard" />
      </div>

      {/* Ranked picks */}
      {featured && (
        <section>
          <h2 className="text-h2 mb-4">Our top pick</h2>
          <FeaturedCard o={featured} rank={1} />
          {rest.length > 0 && (
            <>
              <h2 className="text-h2 mt-10 mb-4">The rest, ranked</h2>
              <div className="grid grid-cols-1 gap-4">
                {rest.map((o, i) => (
                  <RankedCard key={o.slug} o={o} rank={i + 2} />
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* Comparison table */}
      <section className="mt-14">
        <h2 className="text-h2 mb-4">Compared at a glance</h2>
        <div className="overflow-x-auto card !p-0">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-xs text-text-faint">
                <th className="py-3 px-4 font-medium">#</th>
                <th className="py-3 px-4 font-medium">Program</th>
                <th className="py-3 px-4 font-medium">Score</th>
                <th className="py-3 px-4 font-medium">Reward</th>
                <th className="py-3 px-4 font-medium">Effort</th>
                <th className="py-3 px-4 font-medium">Region</th>
                <th className="py-3 px-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((o, i) => {
                const url = officialUrl(o.slug);
                const score = overallScore(o.slug);
                return (
                  <tr key={o.slug} className="border-b border-edge last:border-0 hover:bg-ink-muted">
                    <td className="py-3 px-4 font-mono text-text-faint">{i + 1}</td>
                    <td className="py-3 px-4">
                      <Link href={`/programs/${o.slug}`} className="font-semibold hover:underline">
                        {o.name}
                      </Link>
                      {o.regulated && <span className="ml-2 text-accent-alt" title="regulated">✓</span>}
                    </td>
                    <td className={`py-3 px-4 font-mono font-bold tabular-nums ${accentText}`}>
                      {score != null ? score.toFixed(1) : "—"}
                    </td>
                    <td className="py-3 px-4 font-mono text-text-dim">{o.reward}</td>
                    <td className="py-3 px-4 text-text-dim">{o.effort}</td>
                    <td className="py-3 px-4 text-text-dim">{o.geo}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Link href={`/programs/${o.slug}`} className="text-xs font-bold text-accent hover:underline">
                        Review
                      </Link>
                      {url && (
                        <>
                          <span className="mx-1.5 text-edge">|</span>
                          <a href={url} target="_blank" rel="sponsored nofollow noopener" className="text-xs font-bold text-text-dim hover:text-text">
                            Visit ↗
                          </a>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* How we rank */}
      <section className="mt-14 card p-6">
        <h2 className="text-h3">How we score</h2>
        <p className="mt-1.5 text-sm text-text-dim max-w-2xl">
          Every program gets a transparent 0–10 score — the average of five fixed criteria, not a
          made-up star rating. &ldquo;Varies&rdquo; rewards and unregulated custody are capped on purpose.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {SCORE_CRITERIA.map((cr) => (
            <span key={cr.key} className="chip">{cr.label}</span>
          ))}
        </div>
        <p className="mt-4 text-sm">
          <Link href="/methodology" className="text-accent hover:underline font-semibold">Read the full methodology →</Link>
        </p>
      </section>

      {/* FAQ */}
      <section className="mt-12 max-w-2xl">
        <h2 className="text-h2 mb-4">Questions</h2>
        <div className="space-y-3">
          {c.faqs.map((f) => (
            <details key={f.question} className="card p-4">
              <summary className="font-semibold cursor-pointer">{f.question}</summary>
              <p className="mt-2 text-sm text-text-dim">{f.answer_md}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Other categories */}
      <section className="mt-12 border-t border-edge pt-8">
        <h2 className="text-h2 mb-4">Other ways to earn</h2>
        <div className="flex flex-wrap gap-2">
          {PILLARS.filter((p) => p !== category).map((p) => (
            <Link key={p} href={`/programs/category/${p}`} className="chip hover:!text-text transition-colors">
              {CATEGORY_META[p].short}
            </Link>
          ))}
          <Link href="/programs" className="chip hover:!text-text transition-colors">All programs</Link>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", url: siteUrl("/") },
              { name: "Programs", url: siteUrl("/programs") },
              { name: meta.short, url: siteUrl(`/programs/category/${category}`) },
            ]),
          ),
        }}
      />
      {faq && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(faq) }} />
      )}
    </div>
  );
}
