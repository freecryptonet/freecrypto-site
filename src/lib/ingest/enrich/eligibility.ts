/**
 * Eligibility section generator — STRUCTURED DATA ONLY, no prose copied.
 *
 * Most ingested airdrops have an empty `eligibility_md`, which is the single
 * biggest reason they fall under the 800-char indexable threshold
 * (see `isAirdropIndexable` in src/lib/seo.ts). This synthesises an original
 * eligibility paragraph from facts we already hold:
 *   - the project name
 *   - the qualifying ACTIONS derived from the step TITLES (e.g. a step called
 *     "Provide Liquidity to GLV Vaults" → "providing liquidity"). We never
 *     copy the step bodies / prose — only classify what the step is about.
 *   - structured fields when present (chain, category, KYC, est. value)
 *
 * Because the action list comes from each project's own task flow, the output
 * varies per listing instead of being near-duplicate boilerplate (which Google
 * treats as thin/doorway content).
 */

export interface EligibilityFacts {
  name: string;
  /** Step titles from how_to_claim (scraped) or parsed from how_to_claim_md. */
  stepTitles?: string[];
  chainName?: string | null;
  categoryName?: string | null;
  kycRequired?: boolean;
  /** Raw estimated-value text, e.g. "$50K - $200K". */
  estimatedValue?: string | null;
}

/**
 * Step-title keyword → human qualifying-action phrase. Ordered most-distinctive
 * first so that, when capped, the meaningful actions survive over the generic
 * "connect a wallet" / "track points" steps almost every campaign shares.
 */
const ACTION_RULES: Array<{ re: RegExp; phrase: string }> = [
  { re: /\b(bridg)/i,                       phrase: "bridging assets to the network" },
  { re: /\b(swap)/i,                        phrase: "swapping tokens" },
  { re: /\b(trade|trading|perp|position|long|short)\b/i, phrase: "generating trading volume" },
  { re: /\b(liquidity|vault|\blp\b|pool)\b/i, phrase: "providing liquidity" },
  { re: /\b(lend|borrow|collateral)\b/i,    phrase: "lending or borrowing" },
  { re: /\b(stak|deposit|fund)/i,           phrase: "depositing or staking funds" },
  { re: /\b(mint|nft)\b/i,                  phrase: "minting on-chain" },
  { re: /\b(quest|check.?in|daily|weekly|streak)\b/i, phrase: "completing recurring on-chain quests" },
  { re: /\b(social|twitter|discord|telegram|follow|tweet)\b/i, phrase: "finishing social tasks" },
  { re: /\b(refer|invite)/i,                phrase: "referring new users" },
  { re: /\b(bug|bounty)\b/i,                phrase: "reporting bugs through the bounty program" },
  { re: /\b(testnet|beta|devnet)\b/i,       phrase: "using the testnet or beta" },
  { re: /\b(wallet|connect|sign.?in|log.?in)\b/i, phrase: "connecting a compatible wallet" },
  { re: /\b(point|leaderboard|rank)\b/i,    phrase: "accumulating points on the leaderboard" },
];

/** Parse `N. **Title**` lines out of a generated how_to_claim_md body. */
export function parseStepTitlesFromMarkdown(md: string | null | undefined): string[] {
  if (!md) return [];
  const titles: string[] = [];
  const re = /^\s*\d+\.\s+\*\*(.+?)\*\*\s*$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    const t = m[1].trim();
    if (t) titles.push(t);
  }
  return titles;
}

/** Classify step titles into a deduped, priority-ordered list of action phrases. */
export function deriveQualifyingActions(stepTitles: string[], max = 4): string[] {
  const found: string[] = [];
  for (const rule of ACTION_RULES) {
    if (stepTitles.some((t) => rule.re.test(t)) && !found.includes(rule.phrase)) {
      found.push(rule.phrase);
    }
  }
  return found.slice(0, max);
}

function joinActions(actions: string[]): string {
  if (actions.length === 1) return actions[0];
  return `${actions.slice(0, -1).join(", ")}, and ${actions[actions.length - 1]}`;
}

/**
 * Build an original eligibility paragraph (~350-550 chars) for an airdrop.
 * Returns "" if there's genuinely nothing to say (no name) — callers should
 * skip writing in that case.
 */
export function buildEligibility(facts: EligibilityFacts): string {
  const name = facts.name?.trim();
  if (!name) return "";

  const stepTitles = facts.stepTitles ?? [];
  const stepCount = stepTitles.length;
  const actions = deriveQualifyingActions(stepTitles);

  const parts: string[] = [];

  parts.push(
    `Eligibility for the ${name} airdrop has not been formally confirmed, so there are no fixed snapshot criteria to rely on yet.`,
  );

  const ctx: string[] = [];
  if (facts.chainName) ctx.push(`the campaign runs on ${facts.chainName}`);
  if (facts.categoryName) ctx.push(`it falls in the ${facts.categoryName.toLowerCase()} category`);
  if (ctx.length) {
    const s = ctx.join(" and ");
    parts.push(s.charAt(0).toUpperCase() + s.slice(1) + ".");
  }

  if (actions.length >= 1) {
    parts.push(
      `Based on the current ${stepCount > 0 ? `${stepCount}-step ` : ""}task flow, qualifying activity centres on ${joinActions(actions)}.`,
    );
  } else if (stepCount > 0) {
    parts.push(`Completing every step in the current ${stepCount}-step task flow is how you register activity.`);
  }

  if (facts.kycRequired) {
    parts.push(`Claiming ${name} requires identity verification (KYC).`);
  }

  if (facts.estimatedValue) {
    parts.push(`Reported reward estimates reach up to ${facts.estimatedValue}.`);
  }

  parts.push(
    `Campaigns like this usually weight allocations by genuine, sustained usage rather than one-off interactions, so staying active over time helps your odds. Requirements can change before any token announcement — always confirm the latest rules on ${name}'s official channels before committing funds.`,
  );

  return parts.join(" ");
}
