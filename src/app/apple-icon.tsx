import { ImageResponse } from "next/og";

// Apple touch icon (180×180). Mirrors the brand mark used in icon.svg.
// Uses a plain "B" monogram — the ₿ glyph isn't in next/og's bundled font
// and would require a network font fetch at generation time.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 40,
          background: "linear-gradient(135deg, #22D3A8, #7C5CFF)",
          color: "#0B0F19",
          fontSize: 120,
          fontWeight: 700,
        }}
      >
        B
      </div>
    ),
    { ...size },
  );
}
