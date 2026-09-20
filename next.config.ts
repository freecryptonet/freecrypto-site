import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // /bonus is superseded by the premium exchange comparison page.
      { source: "/bonus", destination: "/programs/category/exchange", permanent: true },
      { source: "/bonus/:slug", destination: "/programs/:slug", permanent: true },
      // Airdrop-era surfaces are off-concept — fold into the earn guide.
      { source: "/guides", destination: "/earn", permanent: true },
      { source: "/guides/:slug", destination: "/earn", permanent: true },
      { source: "/airdrops", destination: "/earn", permanent: true },
      { source: "/airdrops/:slug", destination: "/earn", permanent: true },
      { source: "/calendar", destination: "/earn", permanent: true },
      { source: "/categories/:slug", destination: "/programs", permanent: true },
      { source: "/chains/:slug", destination: "/programs", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
