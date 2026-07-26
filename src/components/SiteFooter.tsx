import Link from "next/link";
import { NewsletterForm } from "@/components/NewsletterForm";

export function SiteFooter() {
  return (
    <footer className="border-t border-edge/80 bg-ink-soft/40 mt-16">
      <div className="mx-auto max-w-page px-4 py-10 grid gap-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 font-semibold">
            <span
              aria-hidden
              className="inline-block w-6 h-6 rounded-md"
              style={{
                background:
                  "conic-gradient(from 90deg at 50% 50%, #22D3A8, #7C5CFF, #22D3A8)",
              }}
            />
            freecrypto<span className="text-accent">.net</span>
          </div>
          <p className="mt-3 text-sm text-text-dim max-w-md">
            Earn real Bitcoin without buying it — shopping cashback, exchange
            sign-up bonuses, and verified airdrops. No wallet signatures
            required — paste an address, see what you qualify for.
          </p>
          <p className="mt-4 text-xs text-text-faint max-w-md">
            <strong className="text-text-dim">Disclaimer.</strong>{" "}
            freecrypto.net explicitly disclaims any recommendation or
            endorsement of any project listed. Airdrops carry risk including
            total loss; always verify contracts and team before interacting.
          </p>
        </div>

        <div>
          <div className="text-sm font-semibold mb-3">Explore</div>
          <ul className="space-y-1.5 text-sm text-text-dim">
            <li><Link href="/earn" className="hover:text-text">How to earn Bitcoin</Link></li>
            <li><Link href="/shop" className="hover:text-text">Shop &amp; earn</Link></li>
            <li><Link href="/bonus" className="hover:text-text">Sign-up bonuses</Link></li>
            <li><Link href="/airdrops" className="hover:text-text">Airdrops</Link></li>
            <li><Link href="/check" className="hover:text-text">Wallet checker</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold mb-3">Weekly digest</div>
          <p className="text-xs text-text-faint mb-3">
            Every Sunday: deadlines, snapshots, and the highest-value drops
            of the week.
          </p>
          <NewsletterForm source="footer" />
          <ul className="mt-5 space-y-1.5 text-sm text-text-dim">
            <li><Link href="/feed.xml" className="hover:text-text">RSS feed</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-edge/60">
        <div className="mx-auto max-w-page px-4 py-4 text-xs text-text-faint flex flex-wrap items-center justify-between gap-2">
          <div>
            © {new Date().getFullYear()} freecrypto.net · Not financial advice
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-text-dim">Privacy</Link>
            <Link href="/terms" className="hover:text-text-dim">Terms</Link>
            <Link href="/about" className="hover:text-text-dim">About</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
