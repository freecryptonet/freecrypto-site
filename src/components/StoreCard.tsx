import Link from "next/link";
import type { StoreListItem } from "@/lib/db";
import { CashbackBadge } from "./CashbackBadge";
import { StoreLogo } from "./StoreLogo";

export function StoreCard({ store, lang = "en" }: { store: StoreListItem; lang?: "en" | "nl" }) {
  const href = lang === "nl" ? `/nl/shop/${store.slug}` : `/shop/${store.slug}`;
  return (
    <Link
      href={href}
      className="card flex items-center gap-3 p-4 transition-all hover:border-accent-warm/60 hover:shadow-glow"
    >
      <span className="grid place-items-center w-12 h-12 rounded-xl bg-white border border-edge shrink-0 overflow-hidden shadow-sm">
        <StoreLogo src={store.logo_url} name={store.name} slug={store.slug} size={32} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold text-text">{store.name}</div>
        <div className="mt-1.5">
          <CashbackBadge text={store.cashback_text} kind={store.cashback_kind} lang={lang} />
        </div>
      </div>
    </Link>
  );
}
