"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

interface Option {
  value: string;
  label: string;
}

interface FilterBarProps {
  chains: Option[];
  categories: Option[];
  totalCount: number;
}

const STATUS_OPTIONS: Option[] = [
  { value: "", label: "All statuses" },
  { value: "confirmed", label: "Confirmed" },
  { value: "live", label: "Live" },
  { value: "potential", label: "Potential" },
  { value: "snapshot", label: "Snapshot" },
];

const SORT_OPTIONS: Option[] = [
  { value: "newest", label: "Newest" },
  { value: "ending-soon", label: "Ending soon" },
  { value: "highest-value", label: "Highest value" },
  { value: "highest-funding", label: "Highest funding" },
];

const KYC_OPTIONS: Option[] = [
  { value: "", label: "Any KYC" },
  { value: "no", label: "No KYC" },
  { value: "yes", label: "KYC required" },
];

export function FilterBar({ chains, categories, totalCount }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  return (
    <div className="card p-4 mb-6 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label="Chain"
          value={params.get("chain") || ""}
          onChange={(v) => setParam("chain", v)}
          options={[{ value: "", label: "All chains" }, ...chains]}
        />
        <Select
          aria-label="Category"
          value={params.get("category") || ""}
          onChange={(v) => setParam("category", v)}
          options={[{ value: "", label: "All categories" }, ...categories]}
        />
        <Select
          aria-label="Status"
          value={params.get("status") || ""}
          onChange={(v) => setParam("status", v)}
          options={STATUS_OPTIONS}
        />
        <Select
          aria-label="KYC"
          value={params.get("kyc") || ""}
          onChange={(v) => setParam("kyc", v)}
          options={KYC_OPTIONS}
        />
      </div>
      <div className="flex items-center gap-3 justify-between md:justify-end">
        <span className="text-xs text-text-faint">
          {totalCount} {totalCount === 1 ? "airdrop" : "airdrops"}
        </span>
        <Select
          aria-label="Sort"
          value={params.get("sort") || "newest"}
          onChange={(v) => setParam("sort", v === "newest" ? "" : v)}
          options={SORT_OPTIONS}
        />
      </div>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value">) {
  return (
    <select
      {...rest}
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      className="bg-ink-soft border border-edge text-text text-sm rounded-btn px-2.5 py-1.5 hover:border-edge-soft focus:outline-none focus:ring-1 focus:ring-accent/60"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
