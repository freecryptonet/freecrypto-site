import Link from "next/link";

interface PaginationProps {
  page: number;             // 1-indexed
  hasNext: boolean;         // true if a next page likely exists
  /** Base URL without page/offset params, e.g. `/` or `/chains/ethereum` */
  basePath: string;
  /** Search params to preserve on next/prev links (excluding page). */
  preserveParams: Record<string, string>;
}

function buildUrl(basePath: string, preserve: Record<string, string>, page: number): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(preserve)) {
    if (v) qs.set(k, v);
  }
  if (page > 1) qs.set("page", String(page));
  const q = qs.toString();
  return q ? `${basePath}?${q}` : basePath;
}

export function Pagination({ page, hasNext, basePath, preserveParams }: PaginationProps) {
  const hasPrev = page > 1;
  if (!hasPrev && !hasNext) return null;

  const prevHref = buildUrl(basePath, preserveParams, page - 1);
  const nextHref = buildUrl(basePath, preserveParams, page + 1);

  return (
    <nav className="mt-8 flex items-center justify-between text-sm" aria-label="Pagination">
      {hasPrev ? (
        <Link
          href={prevHref}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-btn border border-edge hover:bg-edge/50 transition-colors"
          rel="prev"
        >
          ← Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-text-faint">Page {page}</span>
      {hasNext ? (
        <Link
          href={nextHref}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-btn border border-edge hover:bg-edge/50 transition-colors"
          rel="next"
        >
          Next →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
