import Link from "next/link";
import type { StoreListItem } from "@/lib/db";
import { CashbackBadge } from "./CashbackBadge";
import { StoreLogo } from "./StoreLogo";

export function StoreCard({ store, lang = "en" }: { store: StoreListItem; lang?: "en" | "nl" }) {
  const href = lang === "nl" ? `/nl/shop/${store.slug}` : `/shop/${store.slug}`;
  return (
    <Link
      href={href}
      className="card flex items-center gap-3 p-4 transition-colors hover:border-accent/60"
    >
      <StoreLogo src={store.logo_url} name={store.name} slug={store.slug} size={40} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-text">{store.name}</div>
        <div className="mt-1">
          <CashbackBadge text={store.cashback_text} kind={store.cashback_kind} lang={lang} />
        </div>
      </div>
    </Link>
  );
}
