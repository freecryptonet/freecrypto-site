/**
 * DefiLlama tokenless-protocols adapter.
 *
 * DefiLlama exposes /protocols (free, no key, no rate limit beyond fair use).
 * Every protocol with no listed token is a candidate for an eventual airdrop,
 * which is the universe their /airdrops page tracks.
 *
 * We pull the protocol list, filter to tokenless protocols, map their
 * primary chain to our chain slug, and emit a NormalizedAirdrop per row.
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
  // best-effort lower-snake match
  return CHAIN_MAP[name.toLowerCase()] ?? null;
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

      const tokenless = protocols.filter((p) => {
        if (!p) return false;
        // Tokenless heuristic: no gecko_id and no symbol (DefiLlama uses "-" for tokenless)
        if (p.gecko_id) return false;
        if (p.symbol && p.symbol.trim() !== "-" && p.symbol.trim() !== "") return false;
        // TVL > $1M filter — keeps the list useful
        if ((p.tvl ?? 0) < 1_000_000) return false;
        return true;
      });

      // Cap at 60 — we don't want to flood the listing with low-quality candidates.
      const top = tokenless
        .sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0))
        .slice(0, 60);

      return top.map((p): NormalizedAirdrop => ({
        external_id: `defillama-${p.id}`,
        suggested_slug: slugify(p.name),
        name: p.name,
        token_symbol: null,
        logo_url: p.logo ?? null,
        short_description: p.description ? p.description.slice(0, 280) : null,
        description_md: p.description ? p.description : "",
        chain_slug: mapChain(p.chain),
        category_slug: "points",
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
