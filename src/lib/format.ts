export function formatUsd(value: number | null | undefined, opts?: { compact?: boolean }): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const compact = opts?.compact ?? value >= 10_000;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: compact ? 1 : 0,
    notation: compact ? "compact" : "standard",
  }).format(value);
}

export function formatValueRange(min: number | null | undefined, max: number | null | undefined): string {
  if (min == null && max == null) return "—";
  if (min != null && max != null && min !== max) {
    return `${formatUsd(min, { compact: true })} – ${formatUsd(max, { compact: true })}`;
  }
  return formatUsd(max ?? min);
}

const TIME_UNITS: Array<[string, number]> = [
  ["y", 365 * 24 * 60 * 60],
  ["mo", 30 * 24 * 60 * 60],
  ["d", 24 * 60 * 60],
  ["h", 60 * 60],
  ["m", 60],
];

export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  for (const [unit, secs] of TIME_UNITS) {
    if (diff >= secs) {
      const n = Math.floor(diff / secs);
      return `${n}${unit} ago`;
    }
  }
  return `${diff}s ago`;
}

export function countdownTo(date: Date | string | null | undefined): {
  label: string;
  ended: boolean;
  urgent: boolean;
} {
  if (!date) return { label: "—", ended: false, urgent: false };
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Math.floor((d.getTime() - Date.now()) / 1000);
  if (diff <= 0) return { label: "Ended", ended: true, urgent: false };
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const mins = Math.floor((diff % 3600) / 60);
  if (days >= 1) {
    return { label: `${days}d ${hours}h`, ended: false, urgent: days < 3 };
  }
  if (hours >= 1) {
    return { label: `${hours}h ${mins}m`, ended: false, urgent: true };
  }
  return { label: `${mins}m`, ended: false, urgent: true };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
