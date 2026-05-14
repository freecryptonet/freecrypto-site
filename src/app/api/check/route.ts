/**
 * /api/check — wallet airdrop checker (MVP).
 *
 * MVP scope (Phase 1):
 *   - Validate EVM (0x + 40 hex) or basic Solana (base58, 32-44 chars) input.
 *   - Look up known_airdrop_contracts joined with airdrops to surface any
 *     matches we have pre-loaded (e.g. known Merkle distributor leaf lookups
 *     that have been hand-seeded).
 *   - Return primary CTA via the /visit redirector when available.
 *
 * Phase 2 will add live on-chain RPC lookups using EVM_RPC_URL — calling
 * isClaimed() / balanceOf() / Merkle leaf checks against snapshotted contracts.
 */
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const EVM_RE = /^0x[a-fA-F0-9]{40}$/;
const SOL_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const ENS_RE = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;

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

  // ENS resolution intentionally deferred to Phase 2 (needs an RPC).
  if (kind === "ens") {
    return NextResponse.json({
      address: input,
      normalized: input,
      matches: [],
      errorMessage:
        "ENS lookups are coming soon. Paste the resolved 0x… address for now.",
    });
  }

  const sql = getDb();
  if (!sql) {
    return NextResponse.json({
      address: input,
      normalized: addr,
      matches: [],
      errorMessage:
        "Checker is offline (no DB connection). Try again in a minute.",
    });
  }

  try {
    const rows = await sql`
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
      WHERE LOWER(kac.contract_addr) = ${addr}
         OR kac.contract_addr = ${addr}
      ORDER BY a.updated_at DESC
      LIMIT 20
    `;

    return NextResponse.json({
      address: input,
      normalized: addr,
      matches: rows.map((r) => ({
        airdrop_slug: r.airdrop_slug,
        airdrop_name: r.airdrop_name,
        chain_name: r.chain_name,
        estimated_value_usd: r.estimated_value_usd,
        claim_url: r.claim_url,
        visit_code: r.visit_code,
        notes: r.notes,
      })),
    });
  } catch (e) {
    return NextResponse.json(
      {
        address: input,
        normalized: addr,
        matches: [],
        errorMessage: e instanceof Error ? e.message : "Checker failed.",
      },
      { status: 500 },
    );
  }
}
