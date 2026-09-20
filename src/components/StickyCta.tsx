"use client";

import { useEffect, useState } from "react";

/**
 * Slim mobile-only sticky CTA. Appears after the user scrolls past the hero so
 * the primary affiliate action stays reachable on long review/compare pages.
 * Desktop keeps the inline CTAs (hidden here via md:hidden).
 */
export function StickyCta({
  name,
  url,
  tone = "earn",
}: {
  name: string;
  url: string;
  tone?: "earn" | "shop";
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const bg = tone === "shop" ? "bg-accent-warm" : "bg-accent";

  return (
    <div
      className={`md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-edge bg-ink/95 backdrop-blur px-4 py-3 transition-transform duration-200 ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <a
        href={url}
        target="_blank"
        rel="sponsored nofollow noopener"
        className={`flex items-center justify-center gap-1.5 w-full px-5 py-3 rounded-btn text-ink font-bold ${bg}`}
      >
        Visit {name} ↗
      </a>
      <p className="mt-1 text-center text-[10px] text-text-faint">18+ · T&amp;Cs apply · affiliate link</p>
    </div>
  );
}
