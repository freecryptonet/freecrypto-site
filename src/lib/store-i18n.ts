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
};

export function nlCategoryLabel(slug: string, fallback: string): string {
  return NL_CATEGORY_LABEL[slug] ?? fallback;
}
