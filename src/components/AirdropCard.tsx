import Link from "next/link";
import type { AirdropListItem } from "@/lib/db";
import { StatusChip, KycChip } from "@/components/StatusChip";
import { Countdown } from "@/components/Countdown";
import { formatUsd, formatValueRange, timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";

export function AirdropCard({ a }: { a: AirdropListItem }) {
  const detailHref = `/airdrops/${a.slug}`;
  return (
    <article className="card relative flex flex-col p-5 transition-shadow hover:shadow-card">
      <Link href={detailHref} className="absolute inset-0" aria-label={`View ${a.name} airdrop`}>
        <span className="sr-only">{a.name}</span>
      </Link>

      <header className="flex items-start justify-between gap-3 relative">
        <div className="flex items-center gap-3 min-w-0">
          <div
            aria-hidden
            className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-sm font-bold"
            style={{
              background: `linear-gradient(135deg, hsl(${hashHue(a.slug)} 70% 28%), hsl(${hashHue(a.slug) + 40} 70% 18%))`,
              color: "white",
            }}
          >
            {a.token_symbol?.slice(0, 3) ?? a.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-text leading-tight truncate">{a.name}</h2>
            <div className="text-xs text-text-faint flex items-center gap-2 mt-0.5">
              {a.chain_name ? <span>{a.chain_name}</span> : null}
              {a.chain_name && a.category_name ? <span aria-hidden>•</span> : null}
              {a.category_name ? <span>{a.category_name}</span> : null}
            </div>
          </div>
        </div>
        <StatusChip status={a.status} />
      </header>

      {a.short_description ? (
        <p className="mt-3 text-sm text-text-dim line-clamp-2">{a.short_description}</p>
      ) : null}

      <dl className="mt-4 grid grid-cols-2 gap-y-2 text-xs">
        <dt className="text-text-faint">Est. value</dt>
        <dd className="text-text font-medium text-right">
          {formatValueRange(a.estimated_value_usd_min, a.estimated_value_usd_max)}
        </dd>
        <dt className="text-text-faint">Funding raised</dt>
        <dd className="text-text font-medium text-right">
          {a.funding_raised_usd ? formatUsd(a.funding_raised_usd, { compact: true }) : "—"}
        </dd>
        <dt className="text-text-faint">Social score</dt>
        <dd className="text-text font-medium text-right">
          {a.social_score != null ? `${a.social_score}/100` : "—"}
        </dd>
        <dt className="text-text-faint">Ends in</dt>
        <dd className="text-right">
          {a.end_date ? <Countdown to={a.end_date} /> : <span className="text-text-faint">—</span>}
        </dd>
      </dl>

      <footer className="mt-4 pt-3 border-t border-edge/60 flex items-center justify-between gap-2 relative">
        <div className="flex items-center gap-2">
          <KycChip required={a.kyc_required} />
        </div>
        <div className="text-[11px] text-text-faint font-mono" title={a.updated_at.toISOString?.()}>
          Updated {timeAgo(a.updated_at)}
        </div>
      </footer>
    </article>
  );
}

export function SponsoredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn("card p-5 flex flex-col items-center justify-center min-h-[260px] bg-ink-soft/60")}>
      <div className="text-[10px] tracking-widest text-text-faint uppercase mb-3">
        Sponsored
      </div>
      {children}
    </div>
  );
}

// Stable per-slug hue for the auto-generated logo gradient.
function hashHue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) & 0xffff;
  }
  return h % 360;
}
