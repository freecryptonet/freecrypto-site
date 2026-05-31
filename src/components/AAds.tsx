/**
 * A-Ads zone embed. Reads zone IDs from public env vars so paste-in works
 * without redeploying templates. Renders a clearly-marked dev placeholder
 * when no zone is configured.
 *
 * Get zone IDs from https://a-ads.com/publishers after creating each zone.
 */
import { cn } from "@/lib/cn";

type ZoneKey = "leaderboard" | "sidebar" | "inline" | "footer";

const SIZES: Record<ZoneKey, { w: number; h: number; label: string }> = {
  leaderboard: { w: 728, h: 90, label: "728×90 leaderboard" },
  sidebar:     { w: 300, h: 600, label: "300×600 sidebar" },
  inline:      { w: 300, h: 250, label: "300×250 in-listing" },
  footer:      { w: 728, h: 90, label: "728×90 footer" },
};

const ENV_VAR: Record<ZoneKey, string> = {
  leaderboard: "NEXT_PUBLIC_AADS_ZONE_LEADERBOARD",
  sidebar:     "NEXT_PUBLIC_AADS_ZONE_SIDEBAR",
  inline:      "NEXT_PUBLIC_AADS_ZONE_INLINE",
  footer:      "NEXT_PUBLIC_AADS_ZONE_FOOTER",
};

function getZoneId(zone: ZoneKey): string | null {
  // Next inlines these at build time when prefixed with NEXT_PUBLIC_.
  switch (zone) {
    case "leaderboard": return process.env.NEXT_PUBLIC_AADS_ZONE_LEADERBOARD || null;
    case "sidebar":     return process.env.NEXT_PUBLIC_AADS_ZONE_SIDEBAR || null;
    case "inline":      return process.env.NEXT_PUBLIC_AADS_ZONE_INLINE || null;
    case "footer":      return process.env.NEXT_PUBLIC_AADS_ZONE_FOOTER || null;
  }
}

export function AAds({ zone, className }: { zone: ZoneKey; className?: string }) {
  const id = getZoneId(zone);
  const { w, h, label } = SIZES[zone];

  if (!id) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center text-text-faint text-xs w-full",
          "rounded-card border border-dashed border-edge bg-ink-soft/40",
          className,
        )}
        style={{ maxWidth: w, aspectRatio: `${w} / ${h}` }}
        aria-hidden
      >
        <div className="font-mono">A-Ads placeholder</div>
        <div className="opacity-70 mt-1">{label}</div>
        <div className="opacity-50 mt-1">set {ENV_VAR[zone]}</div>
      </div>
    );
  }

  // Standard A-Ads iframe embed. The outer wrapper uses aspect-ratio so the
  // intrinsic 728/300 width never pushes its grid track wider than the
  // viewport on mobile (would otherwise cause horizontal page scroll).
  //
  // NOT lazy-loaded: A-Ads' verifier requires the unit to appear immediately
  // after page load, otherwise it flags "ad unit is partly or fully hidden"
  // and pays nothing. A below-the-fold lazy iframe never loads for the bot.
  const src = `//acceptable.a-ads.com/${id}/?size=${w}x${h}`;
  return (
    <div
      className={cn("relative w-full", className)}
      style={{ maxWidth: w, aspectRatio: `${w} / ${h}` }}
    >
      <iframe
        data-aa={id}
        title={`Sponsored — ${label}`}
        src={src}
        style={{ border: 0, padding: 0, width: "100%", height: "100%", overflow: "hidden", display: "block" }}
        scrolling="no"
      />
    </div>
  );
}
