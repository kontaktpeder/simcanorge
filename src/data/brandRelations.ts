/**
 * Statisk «slekt» mellom merker, brukt på MerkeHub når
 * `pages.related_brand_keys` ikke er satt.
 * Nøkler og verdier = brand_key (lowercase slug).
 */
export const RELATED_BRANDS: Record<string, string[]> = {
  simca: ["talbot", "matra", "peugeot"],
  talbot: ["simca", "matra", "peugeot"],
  matra: ["simca", "talbot"],
  opel: ["vauxhall", "buick"],
};

export function getRelatedBrandKeys(brandKey: string | null | undefined): string[] {
  if (!brandKey) return [];
  return RELATED_BRANDS[brandKey.toLowerCase()] ?? [];
}
