/**
 * Email sending via Resend. Dormant when RESEND_API_KEY is unset — every
 * call no-ops gracefully so newsletter signups still record to the DB
 * even before the email integration is configured.
 *
 * Env:
 *   RESEND_API_KEY              — re_… key from resend.com/api-keys
 *   NEWSLETTER_FROM_ADDRESS     — defaults to "freecrypto.net <hi@freecrypto.net>"
 *                                 (Resend requires a verified domain to send)
 *   NEWSLETTER_UNSUBSCRIBE_SECRET — HMAC secret for one-click unsubscribe links
 */
import crypto from "node:crypto";
import { Resend } from "resend";

const FROM = process.env.NEWSLETTER_FROM_ADDRESS || "freecrypto.net <hi@freecrypto.net>";
const SECRET = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET || "dev-only-do-not-ship";

let cached: Resend | null = null;
function client(): Resend | null {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  cached = new Resend(key);
  return cached;
}

export function isEmailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** Renders an "Unsubscribe" footer + List-Unsubscribe header. */
  unsubscribeFor?: string;
}

export async function sendEmail(args: SendEmailArgs): Promise<{ ok: boolean; reason?: string }> {
  const c = client();
  if (!c) {
    return { ok: false, reason: "RESEND_API_KEY not configured — skipping send" };
  }
  const unsub = args.unsubscribeFor ? unsubscribeUrl(args.unsubscribeFor) : null;
  const html = unsub
    ? `${args.html}<hr style="margin:24px 0;border:none;border-top:1px solid #ddd"/><p style="font-size:12px;color:#666">You're receiving this because you subscribed at freecrypto.net. <a href="${unsub}">Unsubscribe</a>.</p>`
    : args.html;
  const text = args.text ?? stripHtml(html);
  try {
    const result = await c.emails.send({
      from: FROM,
      to: args.to,
      subject: args.subject,
      html,
      text,
      headers: unsub
        ? {
            "List-Unsubscribe": `<${unsub}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          }
        : undefined,
    });
    if (result.error) return { ok: false, reason: result.error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "send failed" };
  }
}

export function unsubscribeToken(email: string): string {
  return crypto.createHmac("sha256", SECRET).update(email.toLowerCase()).digest("base64url").slice(0, 16);
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = unsubscribeToken(email);
  // constant-time compare
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export function unsubscribeUrl(email: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://freecrypto.net";
  return `${base}/unsubscribe?email=${encodeURIComponent(email)}&t=${unsubscribeToken(email)}`;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}
