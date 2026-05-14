/**
 * /api/check — wallet airdrop checker.
 *
 * Pipeline:
 *   1. Validate input as EVM / ENS / Solana
 *   2. Look up known_airdrop_contracts rows JOIN-ed with airdrops + chains
 *   3. For each row, run the appropriate strategy via viem
 *   4. Return only eligible matches (with claim CTAs routed through /visit)
 *
 * Strategies live in src/lib/check/strategies.ts. Adding a new airdrop to
 * the checker is just an INSERT into known_airdrop_contracts.
 */
import { NextRequest, NextResponse } from "next/server";
import { getDb, getPool } from "@/lib/db";
import { getClient, isSupportedChain } from "@/lib/check/rpc";
import {
  STRATEGIES,
  isKnownMethod,
  safeAddress,
  type StrategyMethod,
} from "@/lib/check/strategies";

const EVM_RE = /^0x[a-fA-F0-9]{40}$/;
const SOL_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const ENS_RE = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;

interface KacRow {
  airdrop_slug: string;
  airdrop_name: string;
  visit_code: string | null;
  chain_slug: string;
  chain_name: string;
  estimated_value_usd: number | null;
  contract_addr: string;
  method: string;
  snapshot_block: string | null;
  claim_url: string | null;
  notes: string | null;
}

interface CheckMatch {
  airdrop_slug: string;
  airdrop_name: string;
  chain_name: string;
  estimated_value_usd: number | null;
  claim_url: string | null;
  visit_code: string | null;
  notes: string | null;
  amount?: string;
}

function normalize(input: string): { addr: string; kind: "evm" | "solana" | "ens" | null } {
  const t = input.trim();
  if (EVM_RE.test(t)) return { addr: t.toLowerCase(), kind: "evm" };
  if (ENS_RE.test(t)) return { addr: t.toLowerCase(), kind: "ens" };
  if (SOL_RE.test(t)) return { addr: t, kind: "solana" };
  return { addr: t, kind: null };
}

export async function POST(req: NextRequest) {
  let body: { address?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const input = (body.address || "").toString();
  const { addr, kind } = normalize(input);

  if (!kind) {
    return NextResponse.json({
      address: input,
      normalized: input,
      matches: [],
      errorMessage:
        "That doesn't look like an EVM address (0x…), an ENS name (vitalik.eth), or a Solana address.",
    });
  }

  if (kind === "ens") {
    // Best-effort ENS resolution via mainnet client
    try {
      const ensName = addr;
      const ensAddr = await getClient("ethereum").getEnsAddress({ name: ensName });
      if (ensAddr) {
        return runEvmCheck(input, ensAddr.toLowerCase());
      }
    } catch {
      // fall through
    }
    return NextResponse.json({
      address: input,
      normalized: addr,
      matches: [],
      errorMessage: "Couldn't resolve that ENS name. Paste the resolved 0x… address instead.",
    });
  }

  if (kind === "solana") {
    return NextResponse.json({
      address: input,
      normalized: addr,
      matches: [],
      errorMessage:
        "Solana address support is coming soon. EVM addresses (0x…) work today.",
    });
  }

  return runEvmCheck(input, addr);
}

async function runEvmCheck(input: string, addr: string): Promise<NextResponse> {
  const pool = getPool();
  if (!pool) {
    return NextResponse.json({
      address: input,
      normalized: addr,
      matches: [],
      errorMessage: "Checker is offline (no DB connection). Try again in a minute.",
    });
  }

  const userAddr = safeAddress(addr);
  if (!userAddr) {
    return NextResponse.json({
      address: input,
      normalized: addr,
      matches: [],
      errorMessage: "Address didn't pass checksum validation.",
    });
  }

  // Fetch all known contracts. The list is small (<100 rows expected) so we
  // pull everything and dispatch per row rather than constructing fancy WHERE.
  let rows: KacRow[] = [];
  try {
    const [r] = await pool.query(
      `SELECT
         a.slug AS airdrop_slug,
         a.name AS airdrop_name,
         a.primary_cta_visit_code AS visit_code,
         c.slug AS chain_slug,
         c.name AS chain_name,
         a.estimated_value_usd_max AS estimated_value_usd,
         kac.contract_addr,
         kac.method,
         kac.snapshot_block,
         kac.claim_url,
         kac.notes
       FROM known_airdrop_contracts kac
       JOIN airdrops a ON a.id = kac.airdrop_id
       JOIN chains c ON c.id = kac.chain_id
       WHERE a.deleted_at IS NULL`,
    );
    rows = r as KacRow[];
  } catch (e) {
    return NextResponse.json(
      {
        address: input,
        normalized: addr,
        matches: [],
        errorMessage: e instanceof Error ? e.message : "Checker DB read failed.",
      },
      { status: 500 },
    );
  }

  if (rows.length === 0) {
    return NextResponse.json({ address: input, normalized: addr, matches: [] });
  }

  // Run per-row checks in parallel, with a hard timeout so a slow RPC
  // can't block the whole response.
  const checkPromises = rows.map(async (row): Promise<CheckMatch | null> => {
    if (!isSupportedChain(row.chain_slug)) return null;
    if (!isKnownMethod(row.method)) return null;

    const contractAddr = safeAddress(row.contract_addr);
    if (!contractAddr) return null;

    const client = getClient(row.chain_slug);
    const strategy = STRATEGIES[row.method as StrategyMethod];

    try {
      const res = await strategy({
        client,
        contractAddr,
        userAddr,
        snapshotBlock: row.snapshot_block ? BigInt(row.snapshot_block) : null,
        notes: row.notes,
      });
      if (!res.eligible) return null;
      return {
        airdrop_slug: row.airdrop_slug,
        airdrop_name: row.airdrop_name,
        chain_name: row.chain_name,
        estimated_value_usd: row.estimated_value_usd,
        claim_url: row.claim_url,
        visit_code: row.visit_code,
        notes: row.notes,
        amount: res.amount,
      };
    } catch {
      return null;
    }
  });

  const results = await Promise.allSettled(
    checkPromises.map((p) =>
      Promise.race([
        p,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 8_000)),
      ]),
    ),
  );

  const matches: CheckMatch[] = [];
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) matches.push(r.value);
  }

  // Also include legacy address-match rows (used when contract_addr stores
  // the *user* address — for hand-prepared exact-address lists).
  const sql = getDb();
  if (sql) {
    try {
      const legacyRows = await sql`
        SELECT
          a.slug AS airdrop_slug,
          a.name AS airdrop_name,
          a.primary_cta_visit_code AS visit_code,
          c.name AS chain_name,
          a.estimated_value_usd_max AS estimated_value_usd,
          kac.claim_url,
          kac.notes
        FROM known_airdrop_contracts kac
        JOIN airdrops a ON a.id = kac.airdrop_id
        JOIN chains c ON c.id = kac.chain_id
        WHERE kac.method = 'address-list'
          AND LOWER(kac.contract_addr) = ${addr.toLowerCase()}
      `;
      for (const r of legacyRows) {
        matches.push({
          airdrop_slug: r.airdrop_slug as string,
          airdrop_name: r.airdrop_name as string,
          chain_name: r.chain_name as string,
          estimated_value_usd: r.estimated_value_usd as number | null,
          claim_url: r.claim_url as string | null,
          visit_code: r.visit_code as string | null,
          notes: r.notes as string | null,
        });
      }
    } catch {
      // best-effort
    }
  }

  return NextResponse.json({ address: input, normalized: addr, matches });
}
