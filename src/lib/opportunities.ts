/**
 * Curated crypto earning/opportunity directory — the source of truth for
 * /programs and /programs/[slug]. Static + hand-curated (no DB) so it renders
 * anywhere and stays honest.
 *
 * Editorial rules (from the strategy panel + MiCA/EU compliance):
 *  - Only list reputable, ideally regulated platforms. `regulated` flags EU/
 *    major-jurisdiction licensing where known.
 *  - NEVER invent exact bonus amounts. Use honest ranges or "Varies".
 *  - Every reward is region- and terms-dependent — say so.
 *  - `lastChecked` is a visible freshness signal; bump it when you re-verify.
 *  - Affiliate links are wired later via /visit codes; `href` points at the
 *    internal detail page or an existing surface for now.
 */

export type OppCategory =
  | "exchange"
  | "learn-earn"
  | "cashback"
  | "card"
  | "hardware"
  | "onramp"
  | "gpt";

export type Effort = "Passive" | "Low" | "Medium" | "High";

export interface Opportunity {
  slug: string;
  name: string;
  category: OppCategory;
  /** Honest reward summary — range or "Varies". Never a fabricated exact figure. */
  reward: string;
  payoutType: string; // e.g. "Crypto", "BTC", "Fiat + crypto", "Token rewards"
  effort: Effort;
  geo: string; // "EU", "US", "Global", "EU/UK", ...
  regulated: boolean;
  /** The honest catch / requirement. */
  catch: string;
  /** One-line directory blurb. */
  blurb: string;
  /** Longer honest review body (markdown-ish paragraphs). Only for detail pages. */
  review?: string[];
  lastChecked: string; // e.g. "Sep 2026"
}

export const CATEGORY_META: Record<
  OppCategory,
  { label: string; short: string; tone: "earn" | "shop"; blurb: string }
> = {
  exchange: {
    label: "Exchange sign-up bonuses",
    short: "Exchanges",
    tone: "earn",
    blurb:
      "Open a regulated exchange through a referral and get a one-time reward in real crypto — the biggest single payouts here.",
  },
  "learn-earn": {
    label: "Learn & earn",
    short: "Learn & earn",
    tone: "earn",
    blurb:
      "Watch a short lesson, pass a quiz, get free crypto. Zero deposit, genuinely beginner-friendly.",
  },
  cashback: {
    label: "Crypto cashback",
    short: "Cashback",
    tone: "shop",
    blurb:
      "Shop the stores you already use and get paid back in real Bitcoin or crypto — not points.",
  },
  card: {
    label: "Crypto cards & rewards",
    short: "Cards",
    tone: "shop",
    blurb:
      "Spend with a crypto debit card and earn cashback rewards on every purchase. Read the tier terms first.",
  },
  hardware: {
    label: "Keep it safe: hardware wallets",
    short: "Hardware",
    tone: "earn",
    blurb:
      "Once you've earned crypto, get it off exchanges. A hardware wallet is the single best safety upgrade.",
  },
  onramp: {
    label: "On-ramps",
    short: "On-ramps",
    tone: "earn",
    blurb:
      "The easiest ways to buy your first crypto with a card or bank transfer, with fees compared honestly.",
  },
  gpt: {
    label: "Offerwalls & tasks",
    short: "Tasks",
    tone: "earn",
    blurb:
      "Paid tasks, surveys and offers. Real but low value per hour — we rank these last on purpose.",
  },
};

/** Pillars shown as primary navigation / homepage sections, in order. */
export const PILLARS: OppCategory[] = [
  "exchange",
  "learn-earn",
  "cashback",
  "card",
  "hardware",
];

export const OPPORTUNITIES: Opportunity[] = [
  // ---------------- Exchanges ----------------
  {
    slug: "bitvavo",
    name: "Bitvavo",
    category: "exchange",
    reward: "Fee-free trading + welcome offer (varies)",
    payoutType: "Fiat + crypto",
    effort: "Low",
    geo: "EU",
    regulated: true,
    catch: "ID verification + a first deposit/trade to unlock the full offer.",
    blurb: "The easiest first exchange for EU users — iDEAL/SEPA, low fees, Dutch-registered.",
    review: [
      "Bitvavo is one of the most beginner-friendly exchanges in the EU: euro deposits via iDEAL or SEPA, a clean app, and some of the lowest trading fees in the region. It's registered with the Dutch central bank (DNB) and operates under EU rules, which is exactly what you want from your first platform.",
      "The joining offer is usually a period of fee-free trading up to a limit, sometimes with a small welcome bonus — the exact terms change, so check the current offer before signing up and always open the referral link first, because exchanges rarely add a bonus retroactively.",
      "Best for: EU beginners who want a no-friction way to buy their first crypto and claim a straightforward sign-up perk.",
    ],
    lastChecked: "Sep 2026",
  },
  {
    slug: "coinbase",
    name: "Coinbase",
    category: "exchange",
    reward: "Referral + learn-and-earn (varies)",
    payoutType: "Crypto",
    effort: "Low",
    geo: "Global (varies)",
    regulated: true,
    catch: "Referral bonuses usually need a qualifying buy; learn-and-earn is free.",
    blurb: "The best-known regulated exchange, and home of the biggest learn-and-earn library.",
    review: [
      "Coinbase is the most recognized regulated exchange in the West and doubles as the biggest free on-ramp to crypto thanks to its learn-and-earn lessons — watch a short video, pass a quiz, receive a few dollars of the token being taught. No deposit required.",
      "Its referral bonus typically needs a qualifying purchase to pay out, and fees on the simple app are higher than pro alternatives — fine for a first buy, less so for regular trading. Availability of both the bonus and individual learn-and-earn campaigns varies by country.",
      "Best for: total beginners who want free crypto for learning, plus a trusted name for a first purchase.",
    ],
    lastChecked: "Sep 2026",
  },
  {
    slug: "kraken",
    name: "Kraken",
    category: "exchange",
    reward: "Referral (varies)",
    payoutType: "Crypto",
    effort: "Low",
    geo: "Global (varies)",
    regulated: true,
    catch: "Referral rewards depend on the referred user trading a minimum volume.",
    blurb: "A veteran, security-focused exchange with deep liquidity and strong staking options.",
    review: [
      "Kraken is one of the oldest exchanges still standing and has a reputation for security and transparency (it publishes proof-of-reserves). Fees are competitive and it offers staking on a wide range of assets.",
      "Its referral programme pays when your invitee trades a qualifying amount, so it converts best with people who actually intend to buy, not just window-shop. Some products are restricted by region.",
      "Best for: users who value a long track record and want staking alongside trading.",
    ],
    lastChecked: "Sep 2026",
  },
  {
    slug: "bitpanda",
    name: "Bitpanda",
    category: "exchange",
    reward: "Referral (varies)",
    payoutType: "Crypto",
    effort: "Low",
    geo: "EU",
    regulated: true,
    catch: "Spreads are wider than pro exchanges; bonus needs a qualifying investment.",
    blurb: "Austrian, EU-regulated, and beginner-simple — crypto plus stocks and metals in one app.",
    review: [
      "Bitpanda is an Austrian, EU-licensed platform aimed squarely at beginners, bundling crypto with fractional stocks, ETFs and precious metals. The interface is friendly and euro on/off-ramps are smooth.",
      "You pay for that simplicity in wider spreads than a pro exchange, and the referral bonus typically requires the new user to invest a minimum amount. A solid, compliant EU choice for first-timers.",
      "Best for: EU beginners who want one tidy app for crypto and traditional assets.",
    ],
    lastChecked: "Sep 2026",
  },
  {
    slug: "nexo",
    name: "Nexo",
    category: "exchange",
    reward: "Sign-up bonus in BTC (varies)",
    payoutType: "BTC",
    effort: "Low",
    geo: "Global (varies)",
    regulated: false,
    catch: "CeFi custody — you don't hold the keys; bonus needs a qualifying top-up.",
    blurb: "Interest-and-borrow platform that pays a BTC sign-up bonus after you fund and hold.",
    review: [
      "Nexo is a CeFi platform for earning interest on crypto and borrowing against it, with a sign-up bonus paid in Bitcoin after you fund and hold for a set period. Yields can be attractive.",
      "The honest caveat: this is custodial — you don't control the keys — and CeFi lenders carry real counterparty risk (several collapsed in past cycles). Only commit funds you can afford to have locked, and treat any yield as compensation for that risk. Availability varies by country.",
      "Best for: users comfortable with CeFi risk who want yield plus a straightforward bonus.",
    ],
    lastChecked: "Sep 2026",
  },
  {
    slug: "revolut",
    name: "Revolut",
    category: "exchange",
    reward: "Learn-and-earn + occasional promos (varies)",
    payoutType: "Crypto",
    effort: "Low",
    geo: "EU/UK",
    regulated: true,
    catch: "Crypto is custodial within the app; withdrawals to external wallets are limited on some tiers.",
    blurb: "The fintech app most people already have — with learn-and-earn crypto lessons built in.",
    review: [
      "Revolut is a mainstream fintech app (payments, FX, budgeting) that also offers crypto and periodic learn-and-earn lessons rewarding small amounts of a token for completing a quiz — an easy, familiar entry point for people who already use it.",
      "Crypto is held custodially and external withdrawal support depends on your plan and region, so it's better as a first taste than a long-term holding venue.",
      "Best for: existing Revolut users who want free crypto for learning without a new signup.",
    ],
    lastChecked: "Sep 2026",
  },
  {
    slug: "bybit",
    name: "Bybit",
    category: "exchange",
    reward: "Referral + task rewards (varies)",
    payoutType: "Crypto",
    effort: "Medium",
    geo: "Global (restricted in some regions)",
    regulated: false,
    catch: "Not available/registered in several EU countries; derivatives carry high risk.",
    blurb: "A large global exchange with generous referral and task campaigns — mind the region rules.",
    lastChecked: "Sep 2026",
  },
  {
    slug: "okx",
    name: "OKX",
    category: "exchange",
    reward: "Referral + mystery-box rewards (varies)",
    payoutType: "Crypto",
    effort: "Medium",
    geo: "Global (restricted in some regions)",
    regulated: false,
    catch: "Availability varies; advanced products are high-risk.",
    blurb: "Global exchange and Web3 wallet with frequent referral and reward campaigns.",
    lastChecked: "Sep 2026",
  },

  // ---------------- Learn & earn ----------------
  {
    slug: "coinbase-learn",
    name: "Coinbase Learn & Earn",
    category: "learn-earn",
    reward: "$1–10 per lesson (varies, while available)",
    payoutType: "Crypto",
    effort: "Low",
    geo: "Global (varies)",
    regulated: true,
    catch: "Individual campaigns come and go and are region-gated; needs a verified account.",
    blurb: "Short lessons that pay you a few dollars of the token being taught. The classic free start.",
    lastChecked: "Sep 2026",
  },
  {
    slug: "kraken-learn",
    name: "Kraken Learn",
    category: "learn-earn",
    reward: "Free educational content (occasional rewards)",
    payoutType: "Crypto",
    effort: "Low",
    geo: "Global",
    regulated: true,
    catch: "Mostly education; paid campaigns are occasional.",
    blurb: "A high-quality, no-hype crypto education library from a trusted exchange.",
    lastChecked: "Sep 2026",
  },

  // ---------------- Cashback ----------------
  {
    slug: "satsback",
    name: "Satsback",
    category: "cashback",
    reward: "1–12% back in BTC",
    payoutType: "BTC (Lightning)",
    effort: "Passive",
    geo: "EU/Global",
    regulated: false,
    catch: "Affiliate tracking isn't perfect — not every order registers.",
    blurb: "Bitcoin cashback at 900+ stores, paid as sats over Lightning. Our own payout history is on the shop page.",
    review: [
      "Satsback pays a percentage of your online orders back in Bitcoin, sent as sats to a Lightning wallet you control — no points, no vouchers. Rates run from about 1% at big retailers to double digits at some services.",
      "It's the lowest-effort earning method there is: shop as normal through the link or extension and the sats accrue. The one honest caveat is affiliate attribution isn't perfect, so treat cashback as a bonus, not a guarantee. We use it ourselves — see the payout proof on the shop page.",
      "Best for: anyone who shops online and wants passive Bitcoin on spending they'd do anyway.",
    ],
    lastChecked: "Sep 2026",
  },
  {
    slug: "lolli",
    name: "Lolli",
    category: "cashback",
    reward: "Up to ~30% back in BTC (store-dependent)",
    payoutType: "BTC",
    effort: "Passive",
    geo: "US (mainly)",
    regulated: false,
    catch: "Best coverage is US retailers; payouts can pend for weeks.",
    blurb: "Popular US Bitcoin-rewards app and browser extension for shopping and travel.",
    lastChecked: "Sep 2026",
  },
  {
    slug: "fold",
    name: "Fold",
    category: "cashback",
    reward: "Sats on spend + spin rewards (varies)",
    payoutType: "BTC",
    effort: "Passive",
    geo: "US",
    regulated: false,
    catch: "US-only; the debit card and best rewards need US residency.",
    blurb: "US Bitcoin rewards debit card and app — sats back on everyday spending.",
    lastChecked: "Sep 2026",
  },
  {
    slug: "stormx",
    name: "StormX",
    category: "cashback",
    reward: "Up to ~15% crypto back (varies)",
    payoutType: "Crypto",
    effort: "Passive",
    geo: "Global",
    regulated: false,
    catch: "Rewards paid in its own ecosystem token on some stores; check the payout asset.",
    blurb: "Crypto cashback marketplace and extension with a wide store list.",
    lastChecked: "Sep 2026",
  },

  // ---------------- Cards ----------------
  {
    slug: "crypto-com-card",
    name: "Crypto.com Visa Card",
    category: "card",
    reward: "0.25–5% cashback (tier-dependent)",
    payoutType: "Crypto (CRO)",
    effort: "Passive",
    geo: "EU/UK/US (varies)",
    regulated: true,
    catch: "Top rates need a large CRO stake; entry tiers pay much less than headline rates.",
    blurb: "The best-known crypto cashback card — great rewards at the top tiers, modest at the bottom.",
    review: [
      "The Crypto.com Visa pays cashback in CRO on every purchase. The headline rates are eye-catching, but they scale with how much CRO you stake — the free tier pays little, and the highest rates require a substantial locked stake.",
      "Rates have also been cut over time, so read the current tier table rather than old reviews. Cashback in a volatile token is not the same as cash: its value can move a lot. Availability and card variants differ by region.",
      "Best for: people already in the Crypto.com ecosystem who spend enough to justify a tier.",
    ],
    lastChecked: "Sep 2026",
  },
  {
    slug: "nexo-card",
    name: "Nexo Card",
    category: "card",
    reward: "Up to ~2% back in crypto (varies)",
    payoutType: "Crypto",
    effort: "Passive",
    geo: "EU (mainly)",
    regulated: false,
    catch: "Rewards and credit-line mechanics depend on your Nexo loyalty tier and balances.",
    blurb: "A card that spends against your Nexo balance and pays crypto cashback.",
    lastChecked: "Sep 2026",
  },
  {
    slug: "plutus",
    name: "Plutus",
    category: "card",
    reward: "Up to 3% back in PLU (tier-dependent)",
    payoutType: "Token (PLU)",
    effort: "Passive",
    geo: "EU/UK",
    regulated: true,
    catch: "Rewards are in PLU and capped monthly; top rates need a PLU stake.",
    blurb: "A European rewards debit card paying cashback in its PLU token, with perks for staking.",
    lastChecked: "Sep 2026",
  },
  {
    slug: "wirex",
    name: "Wirex",
    category: "card",
    reward: "Cashback in crypto (varies)",
    payoutType: "Crypto",
    effort: "Passive",
    geo: "EU/UK/Global (varies)",
    regulated: true,
    catch: "Reward rates and supported regions have changed repeatedly — verify current terms.",
    blurb: "A long-running crypto card with multi-currency accounts and cashback.",
    lastChecked: "Sep 2026",
  },

  // ---------------- Hardware ----------------
  {
    slug: "ledger",
    name: "Ledger",
    category: "hardware",
    reward: "Not an earner — protects what you earn",
    payoutType: "—",
    effort: "Low",
    geo: "Global",
    regulated: true,
    catch: "Buy only from the official site; never from third-party marketplaces.",
    blurb: "The most popular hardware wallet. Once you've earned crypto, this is how you keep it safe.",
    review: [
      "A hardware wallet keeps your private keys offline, so your crypto is safe even if your computer is compromised or an exchange fails. Ledger is the market-leading brand, with a wide coin range and a polished app.",
      "This isn't an earning method — it's the safety layer for everything you do earn. The one rule: only ever buy direct from the official Ledger site, and never enter your recovery phrase into any app or website. Anyone asking for it is a scammer.",
      "Best for: anyone holding more than pocket change — get it off the exchange.",
    ],
    lastChecked: "Sep 2026",
  },
  {
    slug: "trezor",
    name: "Trezor",
    category: "hardware",
    reward: "Not an earner — protects what you earn",
    payoutType: "—",
    effort: "Low",
    geo: "Global",
    regulated: true,
    catch: "Buy only from the official site; open-source but verify the source.",
    blurb: "The original hardware wallet — fully open-source, a trusted alternative to Ledger.",
    review: [
      "Trezor made the first hardware wallet and remains a top choice, with fully open-source firmware that security-minded users prefer. It does the same core job as any hardware wallet: keeps your keys offline and out of reach.",
      "As with any wallet, buy only from the official Trezor site and never share your recovery seed. It's a safety purchase, not an earning one — but protecting a stack you earned for free is the highest-return move on this whole site.",
      "Best for: users who want an open-source, audited hardware wallet.",
    ],
    lastChecked: "Sep 2026",
  },

  // ---------------- On-ramps ----------------
  {
    slug: "moonpay",
    name: "MoonPay",
    category: "onramp",
    reward: "Convenience, not a bonus",
    payoutType: "—",
    effort: "Low",
    geo: "Global",
    regulated: true,
    catch: "Fees are higher than buying on an exchange — convenient, not cheap.",
    blurb: "Buy crypto with a card in minutes, straight to your own wallet. Handy, but check the fee.",
    lastChecked: "Sep 2026",
  },
  {
    slug: "transak",
    name: "Transak",
    category: "onramp",
    reward: "Convenience, not a bonus",
    payoutType: "—",
    effort: "Low",
    geo: "Global",
    regulated: true,
    catch: "Like all instant on-ramps, fees beat exchanges only on convenience.",
    blurb: "A widely-integrated fiat-to-crypto on-ramp used inside many wallets and dapps.",
    lastChecked: "Sep 2026",
  },

  // ---------------- Offerwalls / tasks (ranked last) ----------------
  {
    slug: "freecash",
    name: "Freecash",
    category: "gpt",
    reward: "$0.50–25 per offer (highly variable)",
    payoutType: "Crypto or gift cards",
    effort: "Medium",
    geo: "Global",
    regulated: false,
    catch: "Offer approval is inconsistent and geo-dependent; effective hourly rate is low.",
    blurb: "One of the larger get-paid-to sites — real payouts on offers, but grind-y and low value per hour.",
    review: [
      "Freecash aggregates offerwalls, surveys and tasks and pays out in crypto or gift cards. It's one of the more reputable sites in a scammy category, and payouts are real.",
      "Be honest with yourself about the rate: good offers (app installs, sign-ups) pay a few dollars but are limited and often geo-restricted; surveys and micro-tasks pay cents. The effective hourly is low, which is why we rank tasks last. Fine for pocket money, not income.",
      "Best for: people with spare time and no budget who want to try earning without spending.",
    ],
    lastChecked: "Sep 2026",
  },
  {
    slug: "faucetpay",
    name: "FaucetPay (faucets & offerwall)",
    category: "gpt",
    reward: "Cents/hour from faucets; more from its offerwall/PTC",
    payoutType: "Crypto (micro)",
    effort: "High",
    geo: "Global",
    regulated: false,
    catch: "Faucet claims are tiny; the real value is its offerwall/PTC, still low per hour.",
    blurb: "A crypto micro-wallet with faucets, PTC ads and an offerwall. Great for a first sat, poor for income.",
    lastChecked: "Sep 2026",
  },
];

export function opportunitiesByCategory(cat: OppCategory): Opportunity[] {
  return OPPORTUNITIES.filter((o) => o.category === cat);
}

export function getOpportunity(slug: string): Opportunity | undefined {
  return OPPORTUNITIES.find((o) => o.slug === slug);
}

export function opportunitiesWithDetail(): Opportunity[] {
  return OPPORTUNITIES.filter((o) => o.review && o.review.length > 0);
}

/**
 * Official program homepages (factual). CTAs link here for now; swap each to an
 * affiliate/referral URL (ideally via a /visit tracking code) at launch.
 */
const OFFICIAL_URL: Record<string, string> = {
  bitvavo: "https://bitvavo.com",
  coinbase: "https://www.coinbase.com",
  kraken: "https://www.kraken.com",
  bitpanda: "https://www.bitpanda.com",
  nexo: "https://nexo.com",
  revolut: "https://www.revolut.com",
  bybit: "https://www.bybit.com",
  okx: "https://www.okx.com",
  "coinbase-learn": "https://www.coinbase.com/learn",
  "kraken-learn": "https://www.kraken.com/learn",
  satsback: "https://satsback.com",
  lolli: "https://www.lolli.com",
  fold: "https://foldapp.com",
  stormx: "https://www.stormx.io",
  "crypto-com-card": "https://crypto.com/cards",
  "nexo-card": "https://nexo.com/nexo-card",
  plutus: "https://plutus.it",
  wirex: "https://wirexapp.com",
  ledger: "https://www.ledger.com",
  trezor: "https://trezor.io",
  moonpay: "https://www.moonpay.com",
  transak: "https://transak.com",
  freecash: "https://freecash.com",
  faucetpay: "https://faucetpay.io",
};

export function officialUrl(slug: string): string | null {
  return OFFICIAL_URL[slug] ?? null;
}
