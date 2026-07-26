"use client";

import { useState } from "react";

// Stable per-slug hue for the fallback monogram (mirrors AirdropCard).
function hashHue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffff;
  return h % 360;
}

/**
 * Store logo with a graceful fallback. Some Satsback CDN logos 404 (e.g.
 * extension-less /l/…-logo URLs); on error we swap to a monogram tile so a
 * broken image never shows.
 */
export function StoreLogo({
  src,
  name,
  slug,
  size = 40,
  className = "",
}: {
  src: string | null;
  name: string;
  slug: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`shrink-0 rounded-lg bg-white/90 object-contain p-1 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-lg font-bold text-white ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.34),
        background: `linear-gradient(135deg, hsl(${hashHue(slug)} 70% 30%), hsl(${hashHue(slug) + 40} 70% 18%))`,
      }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}
