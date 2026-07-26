/** Dutch labels for the shared (English-stored) store category taxonomy. */
export const NL_CATEGORY_LABEL: Record<string, string> = {
  "bitcoin-gear": "Bitcoin-hardware",
  "travel": "Reizen & vluchten",
  "fashion": "Kleding & mode",
  "tech-electronics": "Tech & elektronica",
  "marketplaces": "Warenhuizen",
  "services": "Diensten & software",
  "groceries-food": "Boodschappen & eten",
  "health-beauty": "Gezondheid & beauty",
  "home-garden": "Huis & tuin",
  "pets": "Huisdieren",
  "toys-games": "Speelgoed & games",
};

export function nlCategoryLabel(slug: string, fallback: string): string {
  return NL_CATEGORY_LABEL[slug] ?? fallback;
}

/**
 * Dutch URL slugs for category hubs. The DB keeps English category slugs
 * (shared with the EN cluster); these translate only the /nl/shop/category URL
 * so it targets Dutch keywords (e.g. /nl/shop/category/elektronica).
 */
export const NL_CATEGORY_SLUG: Record<string, string> = {
  "bitcoin-gear": "bitcoin-hardware",
  "travel": "reizen",
  "fashion": "kleding",
  "tech-electronics": "elektronica",
  "marketplaces": "warenhuizen",
  "services": "diensten",
  "groceries-food": "boodschappen",
  "health-beauty": "gezondheid-beauty",
  "home-garden": "huis-tuin",
  "pets": "huisdieren",
  "toys-games": "speelgoed-games",
};

const EN_FROM_NL_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(NL_CATEGORY_SLUG).map(([en, nl]) => [nl, en]),
);

/** English (DB) category slug → Dutch URL slug. */
export function nlCategorySlug(enSlug: string): string {
  return NL_CATEGORY_SLUG[enSlug] ?? enSlug;
}

/** Dutch URL slug → English (DB) category slug, or null if unknown. */
export function enCategorySlugFromNl(nlSlug: string): string | null {
  return EN_FROM_NL_SLUG[nlSlug] ?? null;
}

/** Dutch-ify a scraped cashback label: "up to 1.3%" -> "tot 1,3%". */
export function nlRate(text: string | null): string {
  return (text || "")
    .replace(/^up to/i, "tot")
    .replace(/discount code/i, "kortingscode")
    .replace(/(\d+)\s*free month/i, "$1 maand gratis")
    .replace(/(\d)\.(\d+)%/g, "$1,$2%");
}
