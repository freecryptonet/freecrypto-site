import Link from "next/link";
import type { StoreListItem } from "@/lib/db";
import { CashbackBadge } from "./CashbackBadge";

// Stable per-slug hue for the fallback monogram (mirrors AirdropCard).
function hashHue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffff;
  return h % 360;
}

export function StoreCard({ store }: { store: StoreListItem }) {
  return (
    <Link
      href={`/shop/${store.slug}`}
      className="card flex items-center gap-3 p-4 transition-colors hover:border-accent/60"
    >
      {store.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={store.logo_url}
          alt=""
          width={40}
          height={40}
          loading="lazy"
          className="h-10 w-10 shrink-0 rounded-lg bg-white/5 object-contain p-1"
        />
      ) : (
        <div
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{
            background: `linear-gradient(135deg, hsl(${hashHue(store.slug)} 70% 28%), hsl(${hashHue(store.slug) + 40} 70% 18%))`,
          }}
        >
          {store.name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-text">{store.name}</div>
        <div className="mt-1">
          <CashbackBadge text={store.cashback_text} kind={store.cashback_kind} />
        </div>
      </div>
    </Link>
  );
}
