/**
 * Default Open Graph / Twitter card for every page that does not define its
 * own image (the airdrop detail route overrides this with a per-airdrop card).
 * 1200×630 is the canonical size for og:image and twitter summary_large_image.
 *
 * Note: avoids the ₿ glyph — it isn't in next/og's bundled font and would
 * trigger a network font fetch at generation time. Every <div> with more than
 * one child sets display:flex, as Satori requires.
 */
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "freecrypto.net — earn Bitcoin from what you already do";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0B0F19",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #22D3A8, #7C5CFF)",
              color: "#0B0F19",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            B
          </div>
          <div style={{ display: "flex", color: "#E6EAF2", fontSize: 34, fontWeight: 600 }}>
            <span>freecrypto</span>
            <span style={{ color: "#22D3A8" }}>.net</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              color: "#E6EAF2",
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -1,
            }}
          >
            <span>Earn Bitcoin from what</span>
            <span>you already do.</span>
          </div>
          <div style={{ display: "flex", color: "#9AA3B7", fontSize: 32 }}>
            Shopping cashback, sign-up bonuses, and verified airdrops — paid in real BTC.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            color: "#22D3A8",
            fontSize: 26,
            fontFamily: "monospace",
            textTransform: "uppercase",
            letterSpacing: 3,
          }}
        >
          Stack sats · no purchase required
        </div>
      </div>
    ),
    { ...size },
  );
}
