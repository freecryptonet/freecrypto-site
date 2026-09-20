import Link from "next/link";

const NAV = [
  { href: "/earn", label: "Ways to earn" },
  { href: "/bonus", label: "Exchange bonuses" },
  { href: "/shop", label: "Cashback" },
  { href: "/guides", label: "Guides" },
  { href: "/calculator", label: "Calculator" },
];

const LOGO_GRADIENT =
  "conic-gradient(from 90deg at 50% 50%, #0E9C8F, #CF7A22, #0E9C8F)";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur border-b border-edge bg-ink/85">
      <div className="mx-auto max-w-page px-4 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-extrabold tracking-tight text-lg"
        >
          <span
            aria-hidden
            className="inline-block w-7 h-7 rounded-md"
            style={{ background: LOGO_GRADIENT }}
          />
          <span>
            free<span className="text-accent">crypto</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-btn font-semibold text-text-dim hover:text-text hover:bg-ink-muted transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/bonus"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-btn text-sm font-bold bg-text text-ink hover:opacity-90 transition-opacity"
          >
            Compare bonuses
          </Link>
        </div>
      </div>
    </header>
  );
}
