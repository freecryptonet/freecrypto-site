import Link from "next/link";
import { NewsletterForm } from "@/components/NewsletterForm";

const LOGO_GRADIENT =
  "conic-gradient(from 90deg at 50% 50%, #0E9C8F, #CF7A22, #0E9C8F)";

export function SiteFooter() {
  return (
    <footer className="border-t border-edge bg-ink-muted mt-16">
      <div className="mx-auto max-w-page px-4 py-10 grid gap-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 font-extrabold text-lg">
            <span
              aria-hidden
              className="inline-block w-6 h-6 rounded-md"
              style={{ background: LOGO_GRADIENT }}
            />
            free<span className="text-accent">crypto</span>
          </div>
          <p className="mt-3 text-sm text-text-dim max-w-md">
            The honest guide to earning free crypto. We rank the real ways to
            earn — exchange sign-up bonuses, Bitcoin cashback, learn-and-earn
            and faucets — with straight payout numbers, so you spend time on
            what actually pays.
          </p>
          <p className="mt-4 text-xs text-text-faint max-w-md">
            <strong className="text-text-dim">Disclaimer.</strong>{" "}
            Crypto earnings are small and variable and nothing here is financial
            advice. Some links are affiliate links — we may earn a commission at
            no extra cost to you, and it never changes what you earn.
            Availability varies by country.
          </p>
        </div>

        <div>
          <div className="text-sm font-semibold mb-3">Explore</div>
          <ul className="space-y-1.5 text-sm text-text-dim">
            <li><Link href="/earn" className="hover:text-text">Ways to earn</Link></li>
            <li><Link href="/bonus" className="hover:text-text">Exchange bonuses</Link></li>
            <li><Link href="/shop" className="hover:text-text">Bitcoin cashback</Link></li>
            <li><Link href="/calculator" className="hover:text-text">Earnings calculator</Link></li>
            <li><Link href="/methodology" className="hover:text-text">Our methodology</Link></li>
            <li><Link href="/guides" className="hover:text-text">Guides</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold mb-3">Weekly digest</div>
          <p className="text-xs text-text-faint mb-3">
            One email a week: the highest-value crypto offers and honest reviews.
          </p>
          <NewsletterForm source="footer" />
          <ul className="mt-5 space-y-1.5 text-sm text-text-dim">
            <li><Link href="/feed.xml" className="hover:text-text">RSS feed</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-edge">
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
