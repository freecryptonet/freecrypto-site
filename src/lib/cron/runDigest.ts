/**
 * Shared weekly-digest sender. Used by scripts/digest.ts (CLI) and
 * /api/cron/digest (HTTP).
 *
 * Rate-limited to ~2 sends/sec to stay within Resend's free tier.
 */
import type { Pool, RowDataPacket } from "mysql2/promise";
import { sendEmail, isEmailEnabled } from "@/lib/email";

export interface DigestStats {
  itemCount: number;
  subscriberCount: number;
  sent: number;
  failed: number;
  durationMs: number;
  skipped?: string;
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

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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

async function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

export async function runDigest(pool: Pool): Promise<DigestStats> {
  const t0 = Date.now();
  if (!isEmailEnabled()) {
    return {
      itemCount: 0, subscriberCount: 0, sent: 0, failed: 0,
      durationMs: Date.now() - t0,
      skipped: "RESEND_API_KEY not configured",
    };
  }

  const [itemRows] = await pool.query<RowDataPacket[]>(`
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
  const items = itemRows as unknown as DigestAirdrop[];
  const html = renderHtml(items);

  const [subscriberRows] = await pool.query<RowDataPacket[]>(`
    SELECT email FROM newsletter_subscribers
    WHERE unsubscribed_at IS NULL
    ORDER BY id ASC
  `);
  const list = subscriberRows as Array<{ email: string }>;

  let sent = 0, failed = 0;
  for (const { email } of list) {
    const r = await sendEmail({
      to: email,
      subject: `Top ${items.length || 0} airdrops ending this week — freecrypto.net`,
      html,
      unsubscribeFor: email,
    });
    if (r.ok) sent++;
    else failed++;
    await sleep(550);
  }

  return {
    itemCount: items.length,
    subscriberCount: list.length,
    sent,
    failed,
    durationMs: Date.now() - t0,
  };
}
