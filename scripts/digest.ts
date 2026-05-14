/**
 * Weekly digest sender. Run via cron (Sunday 14:00 UTC recommended).
 *
 * Usage:
 *   ~/start-mariadb-tunnel.bat
 *   RESEND_API_KEY=… NEWSLETTER_FROM_ADDRESS="freecrypto.net <hi@freecrypto.net>" npm run digest
 *
 * Behavior:
 *   - Selects every newsletter_subscribers row where unsubscribed_at IS NULL.
 *   - Builds a digest of airdrops with end_date in [now, now+14d] sorted by
 *     ending-soon, capped at 12 entries.
 *   - Sends one email per subscriber with per-recipient unsubscribe token.
 *   - Rate-limits to 2 requests/sec to stay under Resend's free tier.
 */
import { config as loadEnv } from "dotenv";
import mysql, { type RowDataPacket } from "mysql2/promise";
import { sendEmail, isEmailEnabled } from "../src/lib/email";

loadEnv({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set in .env.local");
  process.exit(1);
}
if (!isEmailEnabled()) {
  console.error("RESEND_API_KEY not set — refusing to run digest with no delivery configured.");
  process.exit(1);
}

interface DigestAirdrop {
  slug: string;
  name: string;
  status: string;
  chain_name: string | null;
  category_name: string | null;
  estimated_value_usd_max: number | null;
  end_date: string;
}

async function loadDigest(pool: mysql.Pool): Promise<DigestAirdrop[]> {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT a.slug, a.name, a.status, c.name AS chain_name, cat.name AS category_name,
           a.estimated_value_usd_max, a.end_date
    FROM airdrops a
    LEFT JOIN chains c ON c.id = a.chain_id
    LEFT JOIN categories cat ON cat.id = a.category_id
    WHERE a.deleted_at IS NULL
      AND a.end_date IS NOT NULL
      AND a.end_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 14 DAY)
      AND a.status != 'ended'
    ORDER BY a.end_date ASC
    LIMIT 12
  `);
  return rows as unknown as DigestAirdrop[];
}

function renderHtml(items: DigestAirdrop[]): string {
  if (items.length === 0) {
    return `<p>Quiet week — no major airdrops are closing in the next 14 days. We'll be back next Sunday with the latest.</p>`;
  }
  const rows = items.map((a) => {
    const end = new Date(a.end_date);
    const endStr = end.toUTCString().slice(0, 16);
    const value = a.estimated_value_usd_max ? `~$${a.estimated_value_usd_max.toLocaleString()}` : "—";
    return `<tr>
      <td style="padding:10px 8px;border-bottom:1px solid #eee">
        <a href="https://freecrypto.net/airdrops/${a.slug}" style="color:#0B0F19;text-decoration:none;font-weight:600">${escapeHtml(a.name)}</a>
        <div style="color:#666;font-size:12px">${escapeHtml(a.chain_name ?? "")} ${a.category_name ? "· " + escapeHtml(a.category_name) : ""}</div>
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;color:#666;font-size:13px;text-align:right">${endStr}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;color:#0a8a5f;font-weight:600;text-align:right">${value}</td>
    </tr>`;
  }).join("");
  return `<p>Here are the top ${items.length} airdrops closing in the next two weeks:</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0">
  <thead>
    <tr>
      <th style="text-align:left;padding:8px;font-size:11px;text-transform:uppercase;color:#888">Airdrop</th>
      <th style="text-align:right;padding:8px;font-size:11px;text-transform:uppercase;color:#888">Ends</th>
      <th style="text-align:right;padding:8px;font-size:11px;text-transform:uppercase;color:#888">Est. value</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<p style="font-size:13px;color:#666">See every deadline on the <a href="https://freecrypto.net/calendar">freecrypto.net calendar</a>.</p>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  const pool = mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 4 });

  const items = await loadDigest(pool);
  const html = renderHtml(items);

  const [subscribers] = await pool.query<RowDataPacket[]>(`
    SELECT email FROM newsletter_subscribers
    WHERE unsubscribed_at IS NULL
    ORDER BY id ASC
  `);
  const list = subscribers as Array<{ email: string }>;
  console.log(`→ digest: ${items.length} airdrops, ${list.length} subscribers`);

  let sent = 0;
  let failed = 0;
  for (const { email } of list) {
    const r = await sendEmail({
      to: email,
      subject: `Top ${items.length || 0} airdrops ending this week — freecrypto.net`,
      html,
      unsubscribeFor: email,
    });
    if (r.ok) sent++;
    else {
      failed++;
      console.warn(`  fail ${email}: ${r.reason}`);
    }
    // ~2 req/sec rate limit
    await sleep(550);
  }

  console.log(`✓ digest sent=${sent} failed=${failed}`);
  await pool.end();
  if (failed > 0 && sent === 0) process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
