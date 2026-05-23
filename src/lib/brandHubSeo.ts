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

// ============================================================
// SEO readiness — brukes både i admin og av indexing-gate
// ============================================================

export type BrandHubSeoCheck = {
  id: string;
  label: string;
  ok: boolean;
  detail?: string;
};

export type BrandHubSeoReadinessInput = {
  title?: string | null;
  brandKey?: string | null;
  about?: string | null;
  carCount: number;
};

export function evaluateBrandHubSeoReadiness(
  input: BrandHubSeoReadinessInput,
): { ready: boolean; checks: BrandHubSeoCheck[] } {
  const aboutLen = (input.about ?? "").trim().length;
  const checks: BrandHubSeoCheck[] = [
    {
      id: "title",
      label: "Merkenavn (title)",
      ok: !!input.title?.trim(),
    },
    {
      id: "brand_key",
      label: "Brand key",
      ok: !!input.brandKey?.trim(),
    },
    {
      id: "about",
      label: "Historietekst minst 400 tegn",
      ok: aboutLen >= 400,
      detail: `${aboutLen} / 400 tegn`,
    },
    {
      id: "cars",
      label: "Minst 3 publiserte biler",
      ok: input.carCount >= 3,
      detail: `Fant ${input.carCount} bil${input.carCount === 1 ? "" : "er"}`,
    },
  ];
  return { ready: checks.every((c) => c.ok), checks };
}
