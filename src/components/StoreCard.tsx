import Link from "next/link";
import type { StoreListItem } from "@/lib/db";
import { CashbackBadge } from "./CashbackBadge";
import { StoreLogo } from "./StoreLogo";

export function StoreCard({ store }: { store: StoreListItem }) {
  return (
    <Link
      href={`/shop/${store.slug}`}
      className="card flex items-center gap-3 p-4 transition-colors hover:border-accent/60"
    >
      <StoreLogo src={store.logo_url} name={store.name} slug={store.slug} size={40} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-text">{store.name}</div>
        <div className="mt-1">
          <CashbackBadge text={store.cashback_text} kind={store.cashback_kind} />
        </div>
      </div>
    </Link>
  );
}
