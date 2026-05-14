import type { Metadata } from "next";
import Link from "next/link";
import { listAirdropsWithDeadlines, type AirdropListItem } from "@/lib/db";
import { StatusChip, KycChip } from "@/components/StatusChip";
import { Countdown } from "@/components/Countdown";
import { AAds } from "@/components/AAds";
import { formatValueRange } from "@/lib/format";
import { breadcrumbJsonLd, jsonLdScript, siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Upcoming Crypto Airdrops Calendar — All Deadlines in One Place",
  description:
    "Every upcoming airdrop deadline on one page. Snapshot dates, claim windows, and ending-soon countdowns — sorted by date.",
  alternates: { canonical: "/calendar" },
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()).padStart(2, "0")}`;
}

function monthLabel(d: Date): string {
  return `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function groupByMonth(items: AirdropListItem[]): Array<{ key: string; label: string; items: AirdropListItem[] }> {
  const buckets = new Map<string, { label: string; items: AirdropListItem[] }>();
  for (const a of items) {
    if (!a.end_date) continue;
    const k = monthKey(a.end_date);
    if (!buckets.has(k)) {
      buckets.set(k, { label: monthLabel(a.end_date), items: [] });
    }
    buckets.get(k)!.items.push(a);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({ key, label: v.label, items: v.items }));
}

export default async function CalendarPage() {
  const airdrops = await listAirdropsWithDeadlines(200);
  const months = groupByMonth(airdrops);

  return (
    <div className="mx-auto max-w-page px-4 py-10">
      <nav className="text-xs text-text-faint mb-4" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-text-dim">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-text-dim">Calendar</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-h1-page font-bold tracking-tight">
          Airdrop Calendar
        </h1>
        <p className="mt-2 text-text-dim max-w-2xl">
          Every upcoming deadline we track, sorted by date. Use this to plan
          which farms to prioritize before snapshots close.
        </p>
        <div className="mt-2 text-sm text-text-faint">
          {airdrops.length} upcoming deadline{airdrops.length === 1 ? "" : "s"}
        </div>
      </header>

      <div className="mb-8 flex justify-center">
        <AAds zone="leaderboard" />
      </div>

      {months.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-h2 font-semibold mb-2">No upcoming deadlines</div>
          <p className="text-text-dim text-sm max-w-md mx-auto">
            All tracked airdrops either have no scheduled deadline or have
            already ended. Browse all airdrops on the home page.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center px-3 py-1.5 rounded-btn border border-edge text-sm hover:bg-edge/50"
          >
            Browse all
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {months.map((m) => (
            <section key={m.key}>
              <h2 className="text-h2 font-semibold mb-3 flex items-baseline gap-3">
                {m.label}
                <span className="text-sm text-text-faint font-normal">
                  {m.items.length} drop{m.items.length === 1 ? "" : "s"}
                </span>
              </h2>
              <div className="card divide-y divide-edge/60">
                {m.items.map((a) => (
                  <CalendarRow key={a.id} a={a} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", url: siteUrl("/") },
              { name: "Calendar", url: siteUrl("/calendar") },
            ]),
          ),
        }}
      />
    </div>
  );
}

function CalendarRow({ a }: { a: AirdropListItem }) {
  const day = a.end_date?.getUTCDate();
  const monthAbbr = a.end_date ? MONTH_NAMES[a.end_date.getUTCMonth()].slice(0, 3) : "";
  return (
    <Link
      href={`/airdrops/${a.slug}`}
      className="grid grid-cols-[64px_1fr_auto] items-center gap-4 p-4 hover:bg-ink-soft/40 transition-colors"
    >
      <div className="text-center">
        <div className="text-h2 font-bold leading-none">{day}</div>
        <div className="text-xs uppercase tracking-widest text-text-faint mt-1">{monthAbbr}</div>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-text truncate">{a.name}</span>
          <StatusChip status={a.status} />
          <KycChip required={a.kyc_required} />
        </div>
        <div className="text-xs text-text-faint mt-1 flex items-center gap-2">
          {a.chain_name ? <span>{a.chain_name}</span> : null}
          {a.chain_name && a.category_name ? <span aria-hidden>•</span> : null}
          {a.category_name ? <span>{a.category_name}</span> : null}
          <span aria-hidden>•</span>
          <span>{formatValueRange(a.estimated_value_usd_min, a.estimated_value_usd_max)} est.</span>
        </div>
      </div>
      <div className="text-right">
        <Countdown to={a.end_date} />
      </div>
    </Link>
  );
}
