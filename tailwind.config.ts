import type { Config } from "tailwindcss";

// Light design system (2026-09-20 rebuild).
// Token NAMES are preserved from the old dark theme so existing components
// inherit automatically; only the VALUES changed. Semantics on light:
//   ink   = light page/surface backgrounds (was dark bg)
//   text  = dark foreground text (was light)
//   accent = teal (EARN), accent.warm = amber (SHOP/cashback)
//   edge  = hairline borders
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#FBFCFC", // page background (paper)
          soft: "#FFFFFF",    // raised surface / cards
          muted: "#F1F5F4",   // subtle fill / secondary surface
        },
        edge: {
          DEFAULT: "#E2E9E8", // hairline border
          soft: "#CFDAD8",    // hover / stronger border
        },
        accent: {
          DEFAULT: "#0E9C8F", // teal — EARN / claim / primary
          alt: "#0A6F65",     // deep teal-ink
          warm: "#CF7A22",    // amber — SHOP / cashback
          danger: "#DC4C4C",  // red — warnings / KYC
        },
        text: {
          DEFAULT: "#0E1B1E", // primary text (near-black, teal bias)
          dim: "#55666A",     // secondary text
          faint: "#8A999B",   // tertiary / captions
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: {
        page: "1120px",
      },
      borderRadius: {
        card: "14px",
        btn: "10px",
        chip: "999px",
      },
      fontSize: {
        "h1-hero": ["3.25rem", { lineHeight: "1.02", fontWeight: "800" }],
        "h1-page": ["2.25rem", { lineHeight: "1.1", fontWeight: "800" }],
        h2: ["1.6rem", { lineHeight: "1.2", fontWeight: "800" }],
        h3: ["1.15rem", { lineHeight: "1.35", fontWeight: "700" }],
      },
      boxShadow: {
        card: "0 1px 2px rgba(14,27,30,0.05), 0 8px 24px -12px rgba(14,27,30,0.14)",
        glow: "0 2px 6px rgba(14,27,30,0.06), 0 24px 48px -22px rgba(14,27,30,0.28)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
