// Twitter card image — identical to the default Open Graph card. The image
// component is shared; the route config below must be declared statically
// (Next can't statically parse re-exported segment config).
export { default } from "./opengraph-image";

export const runtime = "nodejs";
export const alt = "freecrypto.net — earn Bitcoin from what you already do";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
