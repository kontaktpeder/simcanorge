/**
 * Indexing-gate for brand hubs. Hindrer tynne sider i Google
 * inntil hub-en faktisk har innhold + biler.
 */

export interface BrandHubGateInput {
  about?: string | null;
}

export function isBrandHubIndexable(
  hub: BrandHubGateInput | null | undefined,
  carCount: number,
): boolean {
  if (!hub) return false;
  const about = (hub.about ?? "").trim();
  return about.length >= 400 && carCount >= 3;
}

export function brandHubSeoTitle(title: string): string {
  return `${title} – historie og biler i Norge | Bilgarasje.no`;
}

export function brandHubSeoDescription(
  title: string,
  tagline?: string | null,
  about?: string | null,
): string {
  const intro =
    tagline?.trim() ||
    about?.trim().slice(0, 155) ||
    "";
  const full = `Utforsk ${title} i Norge: ${intro} Se dokumenterte biler og historier på Bilgarasje.no.`;
  return full.slice(0, 160);
}
