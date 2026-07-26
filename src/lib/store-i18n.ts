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

/** Dutch-ify a scraped cashback label: "up to 1.3%" -> "tot 1,3%". */
export function nlRate(text: string | null): string {
  return (text || "")
    .replace(/^up to/i, "tot")
    .replace(/discount code/i, "kortingscode")
    .replace(/(\d+)\s*free month/i, "$1 maand gratis")
    .replace(/(\d)\.(\d+)%/g, "$1,$2%");
}
