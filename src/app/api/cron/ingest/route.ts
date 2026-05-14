/**
 * HTTP-triggered ingest cron. Called by GitHub Actions on a daily schedule.
 *
 * Auth: `Authorization: Bearer <CRON_SECRET>` header required.
 * The Vercel/serverless `?secret=` pattern is also supported as a fallback.
 *
 * On Hostinger this runs in the same Node.js process as the app, so DB pool
 * is shared (no fresh connection per call).
 */
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { runIngest } from "@/lib/cron/runIngest";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // up to 5 minutes; ingest is usually <30s

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  if (header === `Bearer ${secret}`) return true;
  const qs = req.nextUrl.searchParams.get("secret");
  if (qs && qs === secret) return true;
  return false;
}

async function runCron(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const pool = getPool();
  if (!pool) {
    return NextResponse.json(
      { ok: false, error: "database not configured" },
      { status: 503 },
    );
  }
  const t0 = Date.now();
  try {
    const stats = await runIngest(pool);
    const totals = stats.reduce(
      (acc, s) => ({
        fetched: acc.fetched + s.fetched,
        inserted: acc.inserted + s.inserted,
        updated: acc.updated + s.updated,
        skipped: acc.skipped + s.skipped,
        errors: acc.errors + s.errors,
      }),
      { fetched: 0, inserted: 0, updated: 0, skipped: 0, errors: 0 },
    );
    return NextResponse.json({
      ok: true,
      durationMs: Date.now() - t0,
      totals,
      sources: stats,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "ingest failed" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest)  { return runCron(req); }
export async function POST(req: NextRequest) { return runCron(req); }
