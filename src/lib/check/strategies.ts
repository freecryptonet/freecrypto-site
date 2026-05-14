/**
 * Eligibility-check strategies. Each strategy answers:
 *   "does this address qualify for this airdrop's distributor?"
 *
 * Strategies:
 *   - claimable-view: call a view function (default `claimableTokens(address)`)
 *     on the distributor; eligible if return value > 0. The most reliable
 *     pattern — works for ARB, OP Merit rounds, many modern drops.
 *   - erc20-balance: call `balanceOf(address)` on the token contract at
 *     `snapshot_block`. Eligible if balance >= 1 wei. Requires the public
 *     RPC to honor archival reads at that block; if not, falls back to
 *     latest and skips on failure.
 *
 * Add a new strategy by appending to STRATEGY_REGISTRY.
 */
import { type Address, getAddress, formatUnits } from "viem";
import type { AnyPublicClient } from "./rpc";

export type StrategyMethod = "claimable-view" | "erc20-balance";

export interface StrategyContext {
  client: AnyPublicClient;
  contractAddr: Address;
  userAddr: Address;
  snapshotBlock: bigint | null;
  notes: string | null;
}

export interface StrategyResult {
  eligible: boolean;
  /** Optional friendly amount string for the UI. */
  amount?: string;
}

const CLAIMABLE_ABI = [
  {
    inputs: [{ name: "user", type: "address" }],
    name: "claimableTokens",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "claimable",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const ERC20_ABI = [
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

async function claimableView(ctx: StrategyContext): Promise<StrategyResult> {
  // Try the two common function names. Most modern distributors expose one or
  // the other; we don't know which without the ABI, so try claimableTokens first.
  const tryRead = async (fn: "claimableTokens" | "claimable"): Promise<bigint | null> => {
    try {
      const result = await ctx.client.readContract({
        address: ctx.contractAddr,
        abi: CLAIMABLE_ABI,
        functionName: fn,
        args: [ctx.userAddr],
      });
      return result as bigint;
    } catch {
      return null;
    }
  };
  const amount = (await tryRead("claimableTokens")) ?? (await tryRead("claimable"));
  if (amount === null) return { eligible: false };
  if (amount === 0n) return { eligible: false };
  return { eligible: true, amount: formatUnits(amount, 18) };
}

async function erc20Balance(ctx: StrategyContext): Promise<StrategyResult> {
  try {
    const balance = (await ctx.client.readContract({
      address: ctx.contractAddr,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [ctx.userAddr],
      ...(ctx.snapshotBlock ? { blockNumber: ctx.snapshotBlock } : {}),
    })) as bigint;
    if (balance === 0n) return { eligible: false };
    let decimals = 18;
    try {
      decimals = Number(
        await ctx.client.readContract({
          address: ctx.contractAddr,
          abi: ERC20_ABI,
          functionName: "decimals",
        }),
      );
    } catch {
      // Best-effort
    }
    return { eligible: true, amount: formatUnits(balance, decimals) };
  } catch {
    return { eligible: false };
  }
}

export const STRATEGIES: Record<StrategyMethod, (ctx: StrategyContext) => Promise<StrategyResult>> = {
  "claimable-view": claimableView,
  "erc20-balance":  erc20Balance,
};

export function isKnownMethod(m: string): m is StrategyMethod {
  return m === "claimable-view" || m === "erc20-balance";
}

export function safeAddress(input: string): Address | null {
  try {
    return getAddress(input);
  } catch {
    return null;
  }
}
