/**
 * Exchange sign-up bonus offers. Only a handful and editorial in nature, so
 * they live in code (typed, versioned) rather than the DB. Each offer's CTA
 * routes through the cloaked /visit/[code] redirector using `visitCode`,
 * which resolves to Tim's referral link seeded in visit_codes.
 *
 * Claims are kept honest and hedged — referral terms change and vary by
 * region, so we describe the mechanism, not a guaranteed number.
 */
export interface BonusOffer {
  slug: string;
  name: string;
  /** visit_codes.code → /visit/{visitCode} */
  visitCode: string;
  /** Short reward headline, e.g. "€10 in Bitcoin". */
  reward: string;
  /** One-line qualifier under the reward. */
  rewardNote: string;
  geo: string;
  /** Brand accent hex for the offer tile. */
  accent: string;
  tagline: string;
  summary: string;
  /** What the new user must do to trigger the reward. */
  requirement: string;
  steps: string[];
  goodFor: string;
  watchOut: string;
}

export const BONUS_OFFERS: BonusOffer[] = [
  {
    slug: "bitvavo",
    name: "Bitvavo",
    visitCode: "bitvavo",
    reward: "€10 in Bitcoin",
    rewardNote: "for you and a friend who switches",
    geo: "Europe (Netherlands-based)",
    accent: "#0069FF",
    tagline: "MiCA-regulated European exchange with some of the lowest fees in the EU.",
    summary:
      "Bitvavo is a Dutch, MiCA-regulated exchange and one of the cheapest ways for Europeans to buy Bitcoin. Sign up through a referral and, once you switch over and verify, both you and the person who referred you receive €10 in Bitcoin.",
    requirement:
      "You create an account through the invite link, verify your identity, and complete a qualifying deposit or trade.",
    steps: [
      "Open Bitvavo through the link below.",
      "Create your account and complete identity verification.",
      "Make your first deposit or trade to activate the bonus.",
      "€10 in Bitcoin is credited to your account.",
    ],
    goodFor:
      "European — especially Dutch — users who want a low-fee, regulated on-ramp and euro deposits by iDEAL or SEPA.",
    watchOut:
      "EU-focused and not available in the US. Bonus terms and minimums can change, and buying crypto carries a risk of loss.",
  },
  {
    slug: "nexo",
    name: "Nexo",
    visitCode: "nexo",
    reward: "Up to $2,500 in NEXO",
    rewardNote: "based on your deposit — the headline needs $5,000+",
    geo: "Global (some products region-limited)",
    accent: "#1A4FFF",
    tagline: "Earn interest on crypto, with a referral reward that scales to your balance.",
    summary:
      "Nexo lets you earn interest on Bitcoin and other crypto and borrow against it. Its referral reward is generous but tiered: the up-to-$2,500 figure requires a sizeable deposit, and the total reward is split between you and the person who referred you.",
    requirement:
      "You sign up through the referral link and add funds — the reward is based on your average portfolio balance over your first 30 days, and unlocks fully at $5,000+.",
    steps: [
      "Open Nexo through the link below and create an account.",
      "Complete verification and add funds to your Nexo account.",
      "Keep the balance for the qualifying period (based on your 30-day average).",
      "The NEXO reward is credited once requirements are met.",
    ],
    goodFor:
      "People planning to hold a larger balance and earn yield on it, rather than active traders.",
    watchOut:
      "The headline reward needs a $5,000+ balance; smaller deposits earn proportionally less. Interest and lending products carry risk and are not covered by deposit protection.",
  },
  {
    slug: "coinbase",
    name: "Coinbase",
    visitCode: "coinbase",
    reward: "A Bitcoin sign-up bonus",
    rewardNote: "unlocked when you sign up and buy",
    geo: "Global (largest coverage of the three)",
    accent: "#0052FF",
    tagline: "The most familiar, widely-supported on-ramp — easiest for first-timers.",
    summary:
      "Coinbase is the largest US-listed exchange and the simplest place for most people to buy their first Bitcoin. New users who sign up through an invite and make a qualifying purchase can unlock a Bitcoin referral bonus.",
    requirement:
      "You sign up through the invite link and buy or trade the qualifying amount within the promo window.",
    steps: [
      "Open Coinbase through the invite link below.",
      "Create your account and verify your identity.",
      "Buy or trade the qualifying amount to unlock the bonus.",
      "Your Bitcoin bonus is credited to your Coinbase account.",
    ],
    goodFor:
      "Beginners who want the most familiar, widely-supported exchange and don't mind paying a little more for simplicity.",
    watchOut:
      "Simple-buy fees are higher than most exchanges — use Coinbase's Advanced Trade for far lower fees. Bonus amounts and eligibility vary by country and over time.",
  },
];

export function getBonusOffer(slug: string): BonusOffer | undefined {
  return BONUS_OFFERS.find((o) => o.slug === slug);
}
