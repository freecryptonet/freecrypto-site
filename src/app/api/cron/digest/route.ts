import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { runDigest } from "@/lib/cron/runDigest";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

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
  try {
    const stats = await runDigest(pool);
    return NextResponse.json({ ok: true, ...stats });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "digest failed" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest)  { return runCron(req); }
export async function POST(req: NextRequest) { return runCron(req); }
