/**
 * Social-proof block: a redacted screenshot of freecrypto.net's OWN Satsback
 * payout history (9 Bitcoin withdrawals, all paid, 2022–present). Used on the
 * highest-intent Satsback conversion surfaces (/shop, /earn) to show the
 * cashback actually pays out. Payout IDs are blurred in the image for privacy.
 */
export function PayoutProof({ className = "" }: { className?: string }) {
  return (
    <section className={`card p-5 sm:p-6 ${className}`}>
      <div className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">
        ⚡ Proof — our own account
      </div>
      <h2 className="text-h2 font-semibold tracking-tight">
        Satsback really pays out in Bitcoin
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-text-dim">
        We don&apos;t just recommend Satsback — we use it. Here are the withdrawals
        from <span className="text-text">our own account</span>: nine Bitcoin
        payouts over the Lightning Network, every one marked paid, going back to
        2022.
      </p>

      <figure className="mt-4">
        <img
          src="/proof/satsback-payouts.png"
          alt="freecrypto.net's own Satsback payout history — nine Bitcoin withdrawals from 2022 to 2026, each marked Paid over the Lightning Network"
          width={1337}
          height={521}
          loading="lazy"
          className="w-full h-auto rounded-lg border border-edge bg-ink-soft"
        />
        <figcaption className="mt-2 text-xs text-text-faint">
          Our own Satsback account. Payout IDs blurred for privacy. What you earn
          depends on how much you shop — treat cashback as a bonus, not a salary.
        </figcaption>
      </figure>
    </section>
  );
}
