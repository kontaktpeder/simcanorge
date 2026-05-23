/**
 * Brand key/slug normalisering.
 * Konvensjon: pages.brand_key = car_brands.slug = URL-segment (lowercase, slugified).
 */

const DIACRITIC_MAP: Record<string, string> = {
  æ: "ae", ø: "o", å: "a",
  ä: "a", ö: "o", ü: "u", ß: "ss", é: "e", è: "e", ê: "e", ë: "e",
  à: "a", á: "a", â: "a", í: "i", ì: "i", î: "i", ï: "i",
  ó: "o", ò: "o", ô: "o", ú: "u", ù: "u", û: "u", ç: "c", ñ: "n",
};

export function toBrandKey(input: string | null | undefined): string {
  if (!input) return "";
  let s = String(input).trim().toLowerCase();
  s = s.replace(/[æøåäöüßéèêëàáâíìîïóòôúùûçñ]/g, (c) => DIACRITIC_MAP[c] ?? c);
  s = s.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return s;
}

export function brandHubPath(brandKeyOrName: string | null | undefined): string {
  return `/merker/${toBrandKey(brandKeyOrName)}`;
}
