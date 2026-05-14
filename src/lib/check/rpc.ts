/**
 * Per-chain viem public clients with env-driven RPC override + public fallback.
 *
 * Override any chain via env: EVM_RPC_URL_ETHEREUM, EVM_RPC_URL_ARBITRUM, etc.
 * Falls back to viem's bundled public endpoints when no override is set.
 *
 * Reads run-time only — never imported from client code.
 */
import { createPublicClient, http } from "viem";
import {
  mainnet, arbitrum, optimism, base, scroll, linea,
} from "viem/chains";

// viem's PublicClient<Transport, Chain> generics don't unify across heterogeneous
// chains. We don't care — every call site only uses the public read API.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyPublicClient = any;

type SupportedChain =
  | "ethereum"
  | "arbitrum"
  | "optimism"
  | "base"
  | "scroll"
  | "linea";

const VIEM_CHAIN_BY_SLUG = {
  ethereum: mainnet,
  arbitrum,
  optimism,
  base,
  scroll,
  linea,
} as const;

const ENV_VAR_BY_SLUG: Record<SupportedChain, string> = {
  ethereum: "EVM_RPC_URL_ETHEREUM",
  arbitrum: "EVM_RPC_URL_ARBITRUM",
  optimism: "EVM_RPC_URL_OPTIMISM",
  base:     "EVM_RPC_URL_BASE",
  scroll:   "EVM_RPC_URL_SCROLL",
  linea:    "EVM_RPC_URL_LINEA",
};

const cache = new Map<SupportedChain, AnyPublicClient>();

export function isSupportedChain(slug: string): slug is SupportedChain {
  return slug in VIEM_CHAIN_BY_SLUG;
}

export function getClient(slug: SupportedChain): AnyPublicClient {
  if (cache.has(slug)) return cache.get(slug)!;
  const chain = VIEM_CHAIN_BY_SLUG[slug];
  const overrideUrl = process.env[ENV_VAR_BY_SLUG[slug]];
  const client = createPublicClient({
    chain,
    transport: http(overrideUrl || undefined, {
      timeout: 10_000,
      retryCount: 1,
    }),
  });
  cache.set(slug, client);
  return client;
}
