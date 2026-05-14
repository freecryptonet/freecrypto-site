import Link from "next/link";

const NAV = [
  { href: "/", label: "Airdrops" },
  { href: "/categories/retroactive", label: "Retroactive" },
  { href: "/categories/testnet", label: "Testnets" },
  { href: "/check", label: "Wallet Check" },
  { href: "/guides", label: "Guides" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur border-b border-edge/80 bg-ink/80">
      <div className="mx-auto max-w-page px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span
            aria-hidden
            className="inline-block w-7 h-7 rounded-md"
            style={{
              background:
                "conic-gradient(from 90deg at 50% 50%, #22D3A8, #7C5CFF, #22D3A8)",
            }}
          />
          <span>
            freecrypto<span className="text-accent">.net</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 rounded-btn text-text-dim hover:text-text hover:bg-edge/50 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/check"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-sm font-medium bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 transition-colors"
          >
            Check wallet
          </Link>
        </div>
      </div>
    </header>
  );
}
