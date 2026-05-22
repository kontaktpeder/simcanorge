import type { CarPageViewMode } from "./carPageViewMode";

export type SpottingEventRow = {
  id: string;
  description: string | null;
  occurred_at: string | null;
  category: string;
  event_type: string;
  visibility: string;
  data?: Record<string, unknown> | null;
};

function pickHeroSpottingEvent(
  events: SpottingEventRow[] | null | undefined,
): SpottingEventRow | null {
  if (!events?.length) return null;
  const publicSpotting = events
    .filter((e) => e.visibility === "public")
    .filter(
      (e) =>
        e.category === "gjenoppdagelse" ||
        (e.data &&
          typeof e.data === "object" &&
          (e.data as { source?: string }).source === "spotting"),
    )
    .sort(
      (a, b) =>
        new Date(b.occurred_at ?? 0).getTime() - new Date(a.occurred_at ?? 0).getTime(),
    );
  return publicSpotting[0] ?? null;
}

export function pickLatestObservationCaption(
  events: SpottingEventRow[] | null | undefined,
): string | null {
  const text = pickHeroSpottingEvent(events)?.description?.trim();
  return text || null;
}

export function pickHeroSpottingEventId(
  events: SpottingEventRow[] | null | undefined,
): string | null {
  return pickHeroSpottingEvent(events)?.id ?? null;
}

export function buildCarDisplayTitle(car: {
  brand: string | null;
  model: string;
  variant: string | null;
  year: number | null;
  title: string;
}): string {
  const fromFields = [car.brand, car.model, car.variant].filter(Boolean).join(" ");
  if (fromFields) return fromFields;
  if (car.title && !/^ukjent bil$/i.test(car.title)) return car.title;
  return car.model || car.title || "Ukjent bil";
}

export type CarPagePresentation = {
  mode: CarPageViewMode;
  displayTitle: string;
  observationCaption: string | null;
  showPageHeader: boolean;
  showPlatformBanner: boolean;
  showExploreSectionNav: boolean;
  showCategoryImageBadge: boolean;
  showSpottingBadges: boolean;
  showHeroRelationshipCta: boolean;
  showHeroEditAccessCta: boolean;
  heroRelationshipCtaLabel: string;
};

export function buildCarPagePresentation(args: {
  mode: CarPageViewMode;
  car: Parameters<typeof buildCarDisplayTitle>[0];
  observationCaption: string | null;
  isLinkedToCar: boolean;
  relationshipRequestsEnabled: boolean;
}): CarPagePresentation {
  const { mode, car, observationCaption, isLinkedToCar, relationshipRequestsEnabled } = args;
  const isSpotting = mode === "spotting";

  return {
    mode,
    displayTitle: buildCarDisplayTitle(car),
    observationCaption,
    showPageHeader: !isSpotting,
    showPlatformBanner: !isSpotting,
    showExploreSectionNav: !isSpotting,
    showCategoryImageBadge: !isSpotting,
    showSpottingBadges: false,
    showHeroRelationshipCta: relationshipRequestsEnabled && !isLinkedToCar,
    showHeroEditAccessCta: false,
    heroRelationshipCtaLabel: "Kjenner du denne bilen?",
  };
}
