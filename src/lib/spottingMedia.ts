/** Thumbnail / hero når spotting lagrer bilder på car_events, ikke car_images. */

export type CarEventImageRow = {
  image_url: string;
  alt_text?: string | null;
  sort_order: number;
};

export type CarEventWithImages = {
  visibility: string;
  occurred_at: string;
  car_event_images: CarEventImageRow[] | null;
};

export type CarWithSpottingMedia = {
  car_images?: CarEventImageRow[] | null;
  car_events?: CarEventWithImages[] | null;
};

export function firstSortedEventImage(
  images: CarEventImageRow[] | null | undefined,
): CarEventImageRow | null {
  if (!images?.length) return null;
  return [...images].sort((a, b) => a.sort_order - b.sort_order)[0] ?? null;
}

/** Prefer car_images; ellers første bilde fra nyeste offentlige car_event. */
export function resolveSpottingCoverFromRow(
  row: CarWithSpottingMedia,
): CarEventImageRow | null {
  const fromCar = firstSortedEventImage(row.car_images as CarEventImageRow[] | null);
  if (fromCar?.image_url) return fromCar;

  const events = [...(row.car_events ?? [])]
    .filter((e) => e.visibility === "public")
    .sort(
      (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
    );

  for (const ev of events) {
    const img = firstSortedEventImage(ev.car_event_images);
    if (img?.image_url) return img;
  }
  return null;
}

/** Convenience: returns the cover URL only. */
export function resolveCoverUrl(row: CarWithSpottingMedia): string | null {
  return resolveSpottingCoverFromRow(row)?.image_url ?? null;
}

/** Nested select fragment to use in supabase queries that need spotting fallback. */
export const SPOTTING_COVER_SELECT =
  "car_images(image_url, alt_text, sort_order), car_events(visibility, occurred_at, car_event_images(image_url, sort_order))";

