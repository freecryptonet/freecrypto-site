"use client";

import { useEffect, useState } from "react";
import { countdownTo } from "@/lib/format";
import { cn } from "@/lib/cn";

export function Countdown({ to, className }: { to: Date | string | null | undefined; className?: string }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  const { label, ended, urgent } = countdownTo(to);
  // tick is read to keep the linter happy and to force re-renders
  void tick;
  if (!to) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-mono",
        ended ? "text-text-faint" : urgent ? "text-accent-warm" : "text-text-dim",
        className,
      )}
      title={typeof to === "string" ? to : to?.toISOString?.()}
    >
      <span aria-hidden>{ended ? "✓" : "⏳"}</span>
      {label}
    </span>
  );
}
