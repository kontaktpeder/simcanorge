import type { CarOwnerAccessRow } from "./carEditAccess";

export type CarEnrichment = {
  showTimeline: true;
  showGallery: boolean;
  showStory: boolean;
  showOwnerCard: boolean;
  showIdentifyLink: boolean;
  showQuickFacts: boolean;
};

interface CarLike {
  brand?: string | null;
  model?: string | null;
  story?: string | null;
  identification_status?: string | null;
  car_images?: { image_url: string }[] | null;
  car_owners?: CarOwnerAccessRow[] | null;
}

const STORY_MIN = 120;

function hasOwner(car: CarLike): boolean {
  return !!car.car_owners?.some((o) => o.role === "owner" || o.role === "admin");
}

export function resolveCarEnrichment(car: CarLike): CarEnrichment {
  return {
    showTimeline: true,
    showGallery: (car.car_images?.length ?? 0) > 1,
    showStory: (car.story?.trim().length ?? 0) >= STORY_MIN,
    showOwnerCard: hasOwner(car),
    showIdentifyLink:
      car.identification_status === "unknown" ||
      car.identification_status === "needs_review",
    showQuickFacts: !!(car.brand?.trim() && car.model?.trim()),
  };
}
