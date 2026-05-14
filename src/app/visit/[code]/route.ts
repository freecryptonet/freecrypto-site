/**
 * Affiliate redirector with click logging.
 *   GET /visit/{code}  → 302 to target_url after logging the click.
 *
 * Codes resolve via the visit_codes table. Unknown codes 404.
 * Logging is best-effort and never blocks the redirect.
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { resolveVisitCode, logVisitClick } from "@/lib/db";

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  const notFound = () => {
    const r = new NextResponse("Not found", { status: 404 });
    r.headers.set("X-Robots-Tag", "noindex, nofollow");
    return r;
  };
  if (!/^[A-Za-z0-9_-]{4,20}$/.test(code)) return notFound();

  const target = await resolveVisitCode(code);
  if (!target) return notFound();

  // Fire-and-forget log
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";
  const referrer = req.headers.get("referer");
  void logVisitClick({
    code,
    ipHash: sha256(ip),
    referrer,
    uaHash: sha256(ua),
  });

  // Belt-and-braces: robots.txt already disallows /visit/, but if Google
  // hits this URL anyway (e.g. via an external link), tell it not to index
  // the redirect URL itself and not to crawl the affiliate target either.
  const res = NextResponse.redirect(target.target_url, 302);
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}
