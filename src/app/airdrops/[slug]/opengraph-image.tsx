/**
 * Dynamic OG image for /airdrops/[slug] — every Twitter / Telegram share
 * gets a branded preview card with the airdrop name, status, chain, and
 * estimated value.
 *
 * 1200×630 is the canonical size for both Twitter summary_large_image
 * and Open Graph defaults.
 */
import { ImageResponse } from "next/og";
import { getAirdropBySlug } from "@/lib/db";
import { formatValueRange } from "@/lib/format";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const STATUS_COLOR: Record<string, { bg: string; fg: string; label: string }> = {
  confirmed: { bg: "rgba(34,211,168,0.15)", fg: "#22D3A8", label: "Confirmed" },
  live:      { bg: "rgba(34,211,168,0.15)", fg: "#22D3A8", label: "Live" },
  potential: { bg: "rgba(240,180,41,0.15)", fg: "#F0B429", label: "Potential" },
  snapshot:  { bg: "rgba(240,180,41,0.15)", fg: "#F0B429", label: "Snapshot" },
  ended:     { bg: "rgba(107,115,136,0.20)", fg: "#9AA3B7", label: "Ended" },
};

function hashHue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffff;
  return h % 360;
}

export default async function Image({ params }: { params: { slug: string } }) {
  const a = await getAirdropBySlug(params.slug);
  if (!a) {
    return new ImageResponse(
      (
        <div style={{
          width: "100%", height: "100%",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "#0B0F19", color: "#E6EAF2", fontSize: 48,
        }}>
          freecrypto.net
        </div>
      ),
      { ...size },
    );
  }

  const status = STATUS_COLOR[a.status] ?? STATUS_COLOR.potential;
  const hue = hashHue(a.slug);
  const value = formatValueRange(a.estimated_value_usd_min, a.estimated_value_usd_max);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0B0F19",
          color: "#E6EAF2",
          padding: 64,
          position: "relative",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Radial glow */}
        <div style={{
          position: "absolute", top: -200, left: -200, width: 800, height: 800,
          background: `radial-gradient(circle, hsla(${hue}, 70%, 40%, 0.25), transparent 60%)`,
        }} />
        <div style={{
          position: "absolute", bottom: -200, right: -200, width: 800, height: 800,
          background: "radial-gradient(circle, rgba(124,92,255,0.18), transparent 60%)",
        }} />

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 28, fontWeight: 600 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: `conic-gradient(from 90deg at 50% 50%, #22D3A8, #7C5CFF, #22D3A8)`,
          }} />
          <div>
            freecrypto<span style={{ color: "#22D3A8" }}>.net</span>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 36, marginTop: 24 }}>
          <div style={{
            width: 140, height: 140, borderRadius: 28, flexShrink: 0,
            background: `linear-gradient(135deg, hsl(${hue} 70% 32%), hsl(${hue + 40} 70% 18%))`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 56, fontWeight: 800, color: "white",
          }}>
            {(a.token_symbol ?? a.name.slice(0, 2)).slice(0, 3).toUpperCase()}
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 16 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{
                padding: "6px 14px", borderRadius: 999, fontSize: 18, fontWeight: 600,
                background: status.bg, color: status.fg,
                border: `1px solid ${status.fg}55`,
              }}>
                {status.label}
              </div>
              {a.kyc_required ? (
                <div style={{
                  padding: "6px 14px", borderRadius: 999, fontSize: 18, fontWeight: 600,
                  background: "rgba(248,113,113,0.12)", color: "#F87171",
                  border: "1px solid #F8717155",
                }}>
                  KYC
                </div>
              ) : (
                <div style={{
                  padding: "6px 14px", borderRadius: 999, fontSize: 18, fontWeight: 600,
                  background: "rgba(34,211,168,0.10)", color: "#22D3A8",
                  border: "1px solid #22D3A855",
                }}>
                  No KYC
                </div>
              )}
            </div>
            <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>
              {a.name}
            </div>
            <div style={{ fontSize: 26, color: "#9AA3B7" }}>
              {a.chain_name ?? "—"}{a.category_name ? ` · ${a.category_name}` : ""}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          paddingTop: 24, borderTop: "1px solid #1F2A44",
          fontSize: 22,
        }}>
          <div style={{ color: "#9AA3B7" }}>
            Estimated value
          </div>
          <div style={{ color: "#22D3A8", fontWeight: 700, fontSize: 28, fontFamily: "ui-monospace, monospace" }}>
            {value}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
