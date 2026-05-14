"use client";

import { useState } from "react";

interface CheckResult {
  address: string;
  normalized: string;
  matches: Array<{
    airdrop_slug: string;
    airdrop_name: string;
    chain_name: string;
    estimated_value_usd: number | null;
    claim_url: string | null;
    visit_code: string | null;
    notes: string | null;
  }>;
  errorMessage?: string;
}

export function CheckerForm() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: value.trim() }),
      });
      const json = (await res.json()) as CheckResult;
      setResult(json);
    } catch {
      setResult({
        address: value,
        normalized: value,
        matches: [],
        errorMessage: "Couldn't reach the checker. Try again in a moment.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          aria-label="Wallet address"
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
          placeholder="0xAbC… or vitalik.eth or Solana address"
          className="flex-1 bg-ink-soft border border-edge rounded-btn px-3 py-2.5 text-sm font-mono placeholder:text-text-faint focus:outline-none focus:ring-1 focus:ring-accent/60"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-btn bg-accent text-ink-soft font-semibold disabled:opacity-50 hover:bg-accent/90 transition-colors"
        >
          {loading ? "Checking…" : "Check wallet"}
        </button>
      </form>

      <p className="mt-3 text-xs text-text-faint">
        Read-only. We never ask for a signature or a wallet connection. Your
        address is hashed before being logged.
      </p>

      {result ? <ResultBlock r={result} /> : null}
    </>
  );
}

function ResultBlock({ r }: { r: CheckResult }) {
  if (r.errorMessage) {
    return (
      <div className="mt-6 card p-4 border-accent-danger/40">
        <div className="text-accent-danger text-sm font-medium">
          {r.errorMessage}
        </div>
      </div>
    );
  }
  if (r.matches.length === 0) {
    return (
      <div className="mt-6 card p-6 text-center">
        <div className="text-text font-medium">
          No matching snapshots for{" "}
          <span className="font-mono text-text-dim">{r.normalized}</span> yet.
        </div>
        <p className="text-text-dim text-sm mt-2">
          We only check finalized snapshots. Active points programs and
          testnets are tracked off-chain — see the airdrop list to qualify for
          those.
        </p>
      </div>
    );
  }
  return (
    <div className="mt-6 space-y-3">
      <div className="text-sm text-text-dim">
        Found <strong className="text-accent">{r.matches.length}</strong>{" "}
        {r.matches.length === 1 ? "match" : "matches"} for{" "}
        <span className="font-mono">{r.normalized}</span>:
      </div>
      {r.matches.map((m, i) => (
        <a
          key={i}
          href={m.visit_code ? `/visit/${m.visit_code}` : m.claim_url ?? "#"}
          className="card p-4 flex items-center justify-between hover:border-accent/60 transition-colors"
          rel="noopener nofollow"
        >
          <div>
            <div className="font-semibold text-text">{m.airdrop_name}</div>
            <div className="text-xs text-text-faint mt-0.5">{m.chain_name}</div>
            {m.notes ? <div className="text-xs text-text-dim mt-1">{m.notes}</div> : null}
          </div>
          <div className="text-right">
            <div className="text-sm text-accent font-semibold">
              {m.estimated_value_usd != null
                ? `~$${m.estimated_value_usd}`
                : "Claim →"}
            </div>
            <div className="text-[11px] text-text-faint">Click to claim</div>
          </div>
        </a>
      ))}
    </div>
  );
}
