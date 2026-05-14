/**
 * Newsletter signup. Stores email + hashed IP in newsletter_subscribers.
 * No email delivery yet — Phase 2 wires up Resend/Postmark.
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getDb } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export async function POST(req: NextRequest) {
  let body: { email?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email) || email.length > 320) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const source = (body.source || "footer").slice(0, 60);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const sql = getDb();
  if (!sql) {
    return NextResponse.json(
      { ok: false, error: "Signup temporarily unavailable." },
      { status: 503 },
    );
  }

  try {
    await sql`
      INSERT INTO newsletter_subscribers (email, source, ip_hash)
      VALUES (${email}, ${source}, ${sha256(ip)})
      ON DUPLICATE KEY UPDATE source = VALUES(source)
    `;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Couldn't save your subscription. Try again." },
      { status: 500 },
    );
  }
}
