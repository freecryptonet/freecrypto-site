"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

/**
 * Honest earnings calculator — the site's "Reality Metric" tool.
 * Deliberately conservative: the point is to show that active grinding
 * (faucets/PTC) pays almost nothing, while one-time exchange bonuses and
 * cashback are where real value is. No hype.
 */

// Realistic effective $/hour for time-based methods (conservative).
const HOURLY: Record<string, number> = {
  faucets: 0.05,
  ptc: 0.1,
  surveys: 1.5,
  offerwalls: 2.0,
};

// Typical one-time payouts (paid once, not per hour).
const ONE_TIME = {
  exchangeBonuses: 60, // across ~2-3 EU exchanges
  learnAndEarn: 25, // Coinbase-style lessons etc.
};

function money(n: number): string {
  return n >= 100 ? `$${Math.round(n)}` : `$${n.toFixed(2)}`;
}

export function EarningsCalculator() {
  const [hours, setHours] = useState(5); // hours/week on active grinding
  const [spend, setSpend] = useState(300); // monthly online spend for cashback
  const [cashbackPct, setCashbackPct] = useState(4);
  const [includeBonuses, setIncludeBonuses] = useState(true);

  const r = useMemo(() => {
    const weeklyActiveBlend =
      // assume time split across the better active methods, not faucets
      hours * ((HOURLY.offerwalls + HOURLY.surveys) / 2);
    const monthlyActive = weeklyActiveBlend * 4.33;
    const monthlyFaucets = hours * HOURLY.faucets * 4.33; // for contrast
    const monthlyCashback = (spend * cashbackPct) / 100;
    const oneTime = includeBonuses ? ONE_TIME.exchangeBonuses + ONE_TIME.learnAndEarn : 0;

    const monthlyRecurring = monthlyActive + monthlyCashback;
    const firstMonth = monthlyRecurring + oneTime;
    const effHourly = hours > 0 ? monthlyActive / (hours * 4.33) : 0;

    return { monthlyActive, monthlyFaucets, monthlyCashback, oneTime, monthlyRecurring, firstMonth, effHourly };
  }, [hours, spend, cashbackPct, includeBonuses]);

  return (
    <div className="card p-6 md:p-8">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Inputs */}
        <div className="space-y-6">
          <Field
            label="Hours per week on active earning"
            hint="Offerwalls, surveys, tasks — not passive."
            value={`${hours} h`}
          >
            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full accent-[#0E9C8F]"
              aria-label="Hours per week"
            />
          </Field>

          <Field
            label="Monthly online spending"
            hint="Used to estimate Bitcoin cashback."
            value={money(spend)}
          >
            <input
              type="range"
              min={0}
              max={2000}
              step={50}
              value={spend}
              onChange={(e) => setSpend(Number(e.target.value))}
              className="w-full accent-[#CF7A22]"
              aria-label="Monthly spend"
            />
          </Field>

          <Field
            label="Average cashback rate"
            hint="Varies by store; 3–5% is typical."
            value={`${cashbackPct}%`}
          >
            <input
              type="range"
              min={0}
              max={12}
              step={0.5}
              value={cashbackPct}
              onChange={(e) => setCashbackPct(Number(e.target.value))}
              className="w-full accent-[#CF7A22]"
              aria-label="Cashback rate"
            />
          </Field>

          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={includeBonuses}
              onChange={(e) => setIncludeBonuses(e.target.checked)}
              className="w-4 h-4 accent-[#0E9C8F]"
            />
            Include one-time exchange &amp; learn-and-earn bonuses
          </label>
        </div>

        {/* Results */}
        <div className="rounded-card bg-ink-muted border border-edge p-6">
          <div className="font-mono text-xs uppercase tracking-[0.12em] text-text-faint">
            Realistic estimate
          </div>

          <div className="mt-3">
            <div className="text-sm text-text-dim">Recurring, every month</div>
            <div className="font-mono text-4xl font-extrabold tabular-nums text-accent-alt">
              {money(r.monthlyRecurring)}
            </div>
          </div>

          <dl className="mt-5 space-y-2.5 text-sm">
            <Row label="Active earning (offerwalls/surveys)" value={`${money(r.monthlyActive)}/mo`} />
            <Row label="Bitcoin cashback on spend" value={`${money(r.monthlyCashback)}/mo`} tone="shop" />
            <Row label="One-time bonuses (first month)" value={r.oneTime ? `+${money(r.oneTime)}` : "—"} />
            <div className="h-px bg-edge my-2" />
            <Row label="First-month total" value={money(r.firstMonth)} strong />
          </dl>

          <div className="mt-5 rounded-btn bg-ink-soft border border-edge p-3">
            <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-faint">
              Reality check
            </div>
            <p className="mt-1 text-[13px] text-text-dim">
              Effective active rate:{" "}
              <span className="font-mono font-bold text-text">{money(r.effHourly)}/hour</span>. Grinding
              faucets alone would earn just{" "}
              <span className="font-mono font-bold text-text">{money(r.monthlyFaucets)}/mo</span> — which is
              why the one-time bonuses and cashback do most of the real work.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/bonus" className="inline-flex px-4 py-2.5 rounded-btn bg-text text-ink font-bold text-sm hover:opacity-90 transition-opacity">
              Grab the bonuses →
            </Link>
            <Link href="/shop" className="inline-flex px-4 py-2.5 rounded-btn border border-edge font-semibold text-sm hover:bg-ink-soft transition-colors">
              Set up cashback
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  children,
}: {
  label: string;
  hint: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-semibold">{label}</label>
        <span className="font-mono text-sm font-bold tabular-nums text-accent-alt">{value}</span>
      </div>
      <div className="mt-2">{children}</div>
      <p className="mt-1 text-xs text-text-faint">{hint}</p>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "shop";
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={`text-text-dim ${strong ? "font-bold text-text" : ""}`}>{label}</dt>
      <dd
        className={`font-mono tabular-nums ${strong ? "font-extrabold text-text" : "font-bold"} ${
          tone === "shop" ? "text-accent-warm" : "text-accent-alt"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
