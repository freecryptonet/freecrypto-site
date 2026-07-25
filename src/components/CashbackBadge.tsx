export function CashbackBadge({ text, kind }: { text: string | null; kind: string }) {
  if (!text) return null;
  const label = kind === "discount" ? text : `${text} back`;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-edge bg-ink-soft/60 px-2.5 py-1 font-mono text-xs text-accent">
      <span aria-hidden>₿</span> {label}
    </span>
  );
}
