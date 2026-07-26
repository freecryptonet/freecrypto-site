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
  let t = text;
  if (lang === "nl") {
    t = t
      .replace(/^up to/i, "tot")
      .replace(/discount code/i, "kortingscode")
      .replace(/(\d+)\s*free month/i, "$1 maand gratis");
  }
  const suffix = kind === "discount" ? "" : lang === "nl" ? " terug" : " back";
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-edge bg-ink-soft/60 px-2.5 py-1 font-mono text-xs text-accent">
      <span aria-hidden>₿</span> {t}{suffix}
    </span>
  );
}
