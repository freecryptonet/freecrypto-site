import { nlRate } from "@/lib/store-i18n";

export function CashbackBadge({
  text,
  kind,
  lang = "en",
}: {
  text: string | null;
  kind: string;
  lang?: "en" | "nl";
}) {
  if (!text) return null;
  const t = lang === "nl" ? nlRate(text) : text;
  const suffix = kind === "discount" ? "" : lang === "nl" ? " terug" : " back";
  return (
    <span className="inline-flex items-center gap-1 rounded-chip bg-accent-warm/10 px-2.5 py-1 font-mono text-xs font-bold text-accent-warm">
      <span aria-hidden>₿</span> {t}{suffix}
    </span>
  );
}
