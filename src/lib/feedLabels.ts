/** Bruker-facing labels for feed — DB post_type uendret. */
export const FEED_TYPE_LABELS: Record<string, string> = {
  manual: "Innlegg",
  car_moment: "Innlegg",
  car_spotting: "Innlegg",
  car_update: "Bil oppdatert",
  car_published: "Ny bil",
  marketplace_published: "Til salgs",
  event_published: "Arrangement",
};

export function getFeedTypeLabel(postType: string): string {
  return FEED_TYPE_LABELS[postType] ?? "Innlegg";
}
