import Link from "next/link";

/**
 * Static panel that uses the visit_codes table for affiliate cloaking.
 * As soon as Tim pastes real referral codes into seeds/visit_codes.json
 * and re-runs `npm run seed`, every click here becomes attributable revenue.
 *
 * The component itself never talks to the DB — it just links to /visit/[code]
 * which does the resolution at request time.
 */

const EXCHANGES = [
  {
    code: "binance",
    name: "Binance",
    bullets: ["170M+ users", "Most airdrops list here first", "Free deposit USDT"],
    accent: "#F0B90B",
  },
  {
    code: "bybit",
    name: "Bybit",
    bullets: ["Strong derivatives", "Frequent Launchpool drops", "$30k+ welcome bonus"],
    accent: "#F7A600",
  },
  {
    code: "okx",
    name: "OKX",
    bullets: ["Jumpstart MEGAdrop", "Best L2 onramps", "EU + global"],
    accent: "#7C5CFF",
  },
] as const;

export function ExchangeCTA({ variant = "row" }: { variant?: "row" | "card" }) {
  if (variant === "card") {
    return (
      <aside className="card p-4 bg-ink-soft/40">
        <div className="text-[10px] tracking-widest text-text-faint uppercase mb-3">
          Need a CEX to qualify?
        </div>
        <ul className="space-y-2">
          {EXCHANGES.map((ex) => (
            <li key={ex.code}>
              <Link
                href={`/visit/${ex.code}`}
                rel="noopener nofollow sponsored"
                className="flex items-center justify-between gap-3 p-2 -m-2 rounded-btn hover:bg-edge/40 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold text-white"
                    style={{ background: ex.accent }}
                  >
                    {ex.name.slice(0, 2)}
                  </span>
                  <span className="text-sm font-medium text-text">{ex.name}</span>
                </span>
                <span className="text-xs text-accent">Sign up →</span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    );
  }

  return (
    <section className="card p-5 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-h2 font-semibold">Need a CEX to qualify for airdrops?</h2>
          <p className="text-sm text-text-dim mt-1">
            Most retroactive drops require KYC&apos;d on-ramp activity. These
            three rank highest for airdrop coverage in 2026.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {EXCHANGES.map((ex) => (
          <Link
            key={ex.code}
            href={`/visit/${ex.code}`}
            rel="noopener nofollow sponsored"
            className="card p-4 flex flex-col gap-2 hover:border-accent/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                style={{ background: ex.accent }}
              >
                {ex.name.slice(0, 2)}
              </span>
              <span className="font-semibold text-text">{ex.name}</span>
            </div>
            <ul className="text-xs text-text-dim space-y-1 mt-1">
              {ex.bullets.map((b) => (
                <li key={b}>· {b}</li>
              ))}
            </ul>
            <div className="mt-1 text-xs text-accent">Sign up →</div>
          </Link>
        ))}
      </div>
      <div className="text-[10px] text-text-faint mt-3">
        Sponsored affiliate links. We may earn a commission on signups; this
        never affects which airdrops we list.
      </div>
    </section>
  );
}
