export type CarPageViewMode = "spotting" | "story" | "project";

export type CarPageViewModeInput = {
  source?: string | null;
  category?: string | null;
  story?: string | null;
  carOwners?: { user_id: string; role: string }[] | null;
};

const STORY_GRADUATE_MIN_CHARS = 120;

export function hasCarOwner(carOwners?: CarPageViewModeInput["carOwners"]): boolean {
  return !!carOwners?.some((o) => o.role === "owner" || o.role === "admin");
}

export function hasMeaningfulStory(story?: string | null): boolean {
  return (story?.trim().length ?? 0) >= STORY_GRADUATE_MIN_CHARS;
}

/** Eit objekt kan starte som observasjon og gradvis bli historie. */
export function resolveCarPageViewMode(car: CarPageViewModeInput): CarPageViewMode {
  if (car.category === "prosjekt") return "project";
  if (
    car.source === "spotting" &&
    !hasCarOwner(car.carOwners) &&
    !hasMeaningfulStory(car.story)
  ) {
    return "spotting";
  }
  return "story";
}
