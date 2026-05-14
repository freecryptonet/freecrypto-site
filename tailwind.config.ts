import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B0F19",
          soft: "#11162A",
          muted: "#1A2138",
        },
        edge: {
          DEFAULT: "#1F2A44",
          soft: "#27314E",
        },
        accent: {
          DEFAULT: "#22D3A8",
          alt: "#7C5CFF",
          warm: "#F0B429",
          danger: "#F87171",
        },
        text: {
          DEFAULT: "#E6EAF2",
          dim: "#9AA3B7",
          faint: "#6B7388",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: {
        page: "1280px",
      },
      borderRadius: {
        card: "10px",
        btn: "6px",
        chip: "999px",
      },
      fontSize: {
        "h1-hero": ["3rem", { lineHeight: "1.1", fontWeight: "700" }],
        "h1-page": ["2rem", { lineHeight: "1.2", fontWeight: "700" }],
        h2: ["1.375rem", { lineHeight: "1.3", fontWeight: "700" }],
        h3: ["1.125rem", { lineHeight: "1.4", fontWeight: "600" }],
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 1px 2px rgba(0,0,0,0.4)",
        glow: "0 0 0 1px rgba(34,211,168,0.35), 0 6px 24px rgba(34,211,168,0.18)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
