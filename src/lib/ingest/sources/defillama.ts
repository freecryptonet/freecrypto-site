/**
 * DefiLlama tokenless-protocols adapter.
 *
 * DefiLlama exposes /protocols (free, no key, no rate limit beyond fair use).
 * Every protocol with no listed token AND no CoinGecko gecko_id is a candidate
 * for an eventual airdrop. We filter aggressively to keep only protocols that
 * plausibly distribute via airdrop, not CEX wrapped assets / bridges / etc.
 *
 * Endpoint reference: https://api.llama.fi/protocols
 */
import { slugify } from "@/lib/format";
import type { NormalizedAirdrop, SourceAdapter } from "../types";

interface DefiLlamaProtocol {
  id: string;
  name: string;
  symbol: string | null;
  url: string | null;
  description: string | null;
  chain: string | null;
  logo: string | null;
  tvl: number | null;
  twitter: string | null;
  category: string | null;
  // gecko_id is non-null when DefiLlama has paired the protocol with a token
  // on CoinGecko — i.e. the protocol already has a token. We want those gone.
  gecko_id: string | null;
}

// DefiLlama uses long descriptive chain names; map them to our short slugs.
const CHAIN_MAP: Record<string, string> = {
  Ethereum: "ethereum",
  Solana: "solana",
  Base: "base",
  Arbitrum: "arbitrum",
  Optimism: "optimism",
  Scroll: "scroll",
  Linea: "linea",
  Berachain: "berachain",
  Monad: "monad",
  Sui: "sui",
  TON: "ton",
  Starknet: "starknet",
  // common aliases
  "Arbitrum One": "arbitrum",
  "OP Mainnet": "optimism",
};

function mapChain(name: string | null): string | null {
  if (!name) return null;
  if (CHAIN_MAP[name]) return CHAIN_MAP[name];
  return CHAIN_MAP[name.toLowerCase()] ?? null;
}

// Min TVL to consider — raised from $1M to $5M to focus on serious protocols.
// At $1M we were getting too much long-tail noise.
const MIN_TVL_USD = 5_000_000;

// Hard cap on rows emitted per run.
const MAX_ROWS = 40;

// DefiLlama categories that are NOT airdrop candidates:
// - CEX / Bridge / Liquid Staking / Liquid Restaking → already-token-issuing services
// - RWA / Banking / Insurance / Coins / Stablecoins / Indexes → no airdrop tradition
const CATEGORY_DENY = new Set([
  "Cex",
  "CEX",
  "Bridge",
  "Cross Chain Bridge",
  "Liquid Staking",
  "Liquid Restaking",
  "Restaking",
  "Restaked ETH",
  "RWA",
  "RWA Lending",
  "Banking",
  "Insurance",
  "Coins",
  "Stablecoins",
  "Algo-Stables",
  "Indexes",
  "Synthetics",
  "Wallets",
  "Reserve Currency",
  "Liquidity Manager",
  "Yield Tokens",
  "Treasury Manager",
  "Anchor BTC",
]);

// Protocol-name patterns we never want to ingest, even when category is missing.
// Match is case-insensitive substring.
const NAME_DENY_PATTERNS = [
  // Major CEXes (they're never going to airdrop to retail wallets via on-chain claim)
  "binance",
  "bybit",
  "coinbase",
  "okx",
  "kraken",
  "bitfinex",
  "bitget",
  "bitstamp",
  "bingx",
  "mexc",
  "kucoin",
  "huobi",
  "htx",
  "upbit",
  "gate.io",
  "gemini",
  "crypto.com",
  "bitmex",
  "deribit",
  "phemex",
  "bittrex",
  "robinhood",
  "revolut",
  "figure markets",
  // Wrapped-asset and bridge name patterns
  "bridge",
  "wrapped",
  "staked eth",
  "staked sol",
  "staked btc",
  "liquid staking",
  "lst",
  // Stablecoin-issuer products (not airdrop targets)
  "usdt0",
  "usyc",
  "usdc.",
  // Generic exchange/listing services
  " ico ",
];

function nameLooksLikeAirdropCandidate(name: string): boolean {
  const lower = name.toLowerCase();
  for (const pat of NAME_DENY_PATTERNS) {
    if (lower.includes(pat)) return false;
  }
  return true;
}

function isCandidate(p: DefiLlamaProtocol): boolean {
  if (!p) return false;
  // Already has a token (CoinGecko-paired)
  if (p.gecko_id) return false;
  // DefiLlama uses "-" or "" for tokenless; anything else means "has a token"
  if (p.symbol && p.symbol.trim() !== "-" && p.symbol.trim() !== "") return false;
  // Minimum TVL
  if ((p.tvl ?? 0) < MIN_TVL_USD) return false;
  // Category-level denylist
  if (p.category && CATEGORY_DENY.has(p.category)) return false;
  // Name-pattern denylist
  if (!nameLooksLikeAirdropCandidate(p.name)) return false;
  return true;
}

// Map DefiLlama categories to our internal category slugs so the
// ingested rows land somewhere sensible in /categories/*.
function mapCategory(cat: string | null): string {
  if (!cat) return "points";
  const c = cat.toLowerCase();
  if (c.includes("derivatives") || c.includes("options") || c.includes("perp")) return "points";
  if (c.includes("dex") || c.includes("aggregator")) return "points";
  if (c.includes("lending") || c.includes("yield") || c.includes("farm")) return "points";
  if (c.includes("launchpad")) return "task";
  return "points";
}

export const defiLlamaSource: SourceAdapter = {
  slug: "defillama",
  name: "DefiLlama tokenless protocols",

  async fetch(): Promise<NormalizedAirdrop[]> {
    try {
      const res = await fetch("https://api.llama.fi/protocols", {
        headers: { "user-agent": "freecrypto.net/1.0" },
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) {
        console.warn(`defillama: HTTP ${res.status}`);
        return [];
      }
      const protocols = (await res.json()) as DefiLlamaProtocol[];
      if (!Array.isArray(protocols)) return [];

      const filtered = protocols.filter(isCandidate);
      const top = filtered
        .sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0))
        .slice(0, MAX_ROWS);

      return top.map((p): NormalizedAirdrop => ({
        external_id: `defillama-${p.id}`,
        suggested_slug: slugify(p.name),
        name: p.name,
        token_symbol: null,
        logo_url: p.logo ?? null,
        short_description: p.description ? p.description.slice(0, 280) : null,
        description_md: p.description ? p.description : "",
        chain_slug: mapChain(p.chain),
        category_slug: mapCategory(p.category),
        status: "potential",
        kyc_required: false,
        funding_raised_usd: null,
        estimated_value_usd_min: null,
        estimated_value_usd_max: null,
        social_score: null,
        project_url: p.url ?? null,
        twitter_url: p.twitter ? `https://x.com/${p.twitter.replace(/^@/, "")}` : null,
        discord_url: null,
        started_at: null,
        snapshot_date: null,
        end_date: null,
      }));
    } catch (e) {
      console.error("defillama fetch failed:", e instanceof Error ? e.message : e);
      return [];
    }
  },
};
