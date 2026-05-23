import type { FeedPost } from "@/hooks/useFeedPosts";
import { resolveSpottingCoverFromRow } from "@/lib/spottingMedia";

export type FeedImage = { url: string; alt?: string };

/** Kun disse får synlig type-badge i feed. */
export const SYSTEM_POST_TYPES = new Set<string>([
  "car_published",
  "event_published",
  "marketplace_published",
  "car_update",
]);

export const SYSTEM_TYPE_LABELS: Record<string, string> = {
  car_published: "Ny bil",
  car_update: "Bil oppdatert",
  event_published: "Arrangement",
  marketplace_published: "Til salgs",
};

export function shouldShowTypeBadge(postType: string): boolean {
  return SYSTEM_POST_TYPES.has(postType);
}

export function getTypeBadgeLabel(postType: string): string | null {
  return SYSTEM_TYPE_LABELS[postType] ?? null;
}

export function isUserContentPost(postType: string): boolean {
  return !SYSTEM_POST_TYPES.has(postType);
}

type ImgRow = { image_url: string; sort_order?: number | null; alt_text?: string | null };

function sortedImgs(rows: ImgRow[] | null | undefined): FeedImage[] {
  if (!rows?.length) return [];
  return rows
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((i) => ({ url: i.image_url, alt: i.alt_text ?? undefined }));
}

export function getPostImages(post: FeedPost): FeedImage[] {
  const p = post as unknown as {
    snapshot_image_url?: string | null;
    car?: {
      car_images?: ImgRow[] | null;
      car_events?: unknown;
      source?: string | null;
    } | null;
    marketplace_item?: { marketplace_images?: ImgRow[] | null } | null;
    event?: { event_images?: ImgRow[] | null } | null;
    source_event?: {
      car_event_images?: ImgRow[] | null;
      data?: { image_url?: string } | null;
    } | null;
  };

  if (p.snapshot_image_url) return [{ url: p.snapshot_image_url }];

  if (p.source_event) {
    const evImgs = sortedImgs(p.source_event.car_event_images);
    if (evImgs.length > 0) return evImgs;
    const dataUrl = p.source_event.data?.image_url;
    if (dataUrl) return [{ url: dataUrl }];
  }

  let imgs =
    sortedImgs(p.car?.car_images) ||
    sortedImgs(p.marketplace_item?.marketplace_images) ||
    sortedImgs(p.event?.event_images) ||
    [];

  if (imgs.length === 0 && p.car) {
    const cover = resolveSpottingCoverFromRow(p.car as Parameters<typeof resolveSpottingCoverFromRow>[0]);
    if (cover?.image_url) imgs = [{ url: cover.image_url, alt: cover.alt_text ?? undefined }];
  }
  return imgs;
}

export function postHasMedia(post: FeedPost): boolean {
  return getPostImages(post).length > 0;
}

export function getPostBody(post: FeedPost): string | null {
  const trimmed = post.body?.trim();
  if (trimmed) return trimmed;
  const sourceEvent = (post as { source_event?: { description?: string | null } }).source_event;
  const fromEvent = sourceEvent?.description?.trim();
  return fromEvent || null;
}

export type CarRow = {
  id?: string;
  title?: string | null;
  slug?: string | null;
  published_at?: string | null;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  source?: string | null;
};

export function resolveCarPublicHref(car: CarRow | null | undefined): string | null {
  if (!car?.slug?.trim() || !car.published_at) return null;
  return `/biler/${car.slug}`;
}

/** Upublisert bil i feed: vis nøytral «Ukjent bil» i stedet for å avsløre utkast. */
export function getCarUnknownPrimaryLabel(car: CarRow | null | undefined): string | null {
  if (!car?.id) return null;
  if (car.published_at) return null;
  return "Ukjent bil";
}

export const CAR_UNKNOWN_SECONDARY_LABEL = "Kjenner du bilen?";

export function isCarUnknown(car: CarRow | null | undefined): boolean {
  return !!car?.id && !car.published_at;
}

export function getEntityHref(post: FeedPost): string | null {
  const p = post as unknown as {
    car?: CarRow | null;
    marketplace_item?: { slug?: string } | null;
    event?: { slug?: string } | null;
  };
  const carHref = resolveCarPublicHref(p.car);
  if (carHref) return carHref;
  if (p.marketplace_item?.slug) return `/markedsplass/${p.marketplace_item.slug}`;
  if (p.event?.slug) return `/e/${p.event.slug}`;
  return null;
}

export function getEntityTitle(post: FeedPost): string | null {
  const p = post as unknown as {
    car?: CarRow | null;
    marketplace_item?: { title?: string } | null;
    event?: { title?: string } | null;
    snapshot_title?: string | null;
  };
  if (p.car) {
    const c = p.car;
    const parts = [c.brand, c.model, c.year != null ? String(c.year) : null].filter(Boolean);
    if (parts.length > 0) return parts.join(" ");
    return c.title ?? p.snapshot_title ?? null;
  }
  return p.marketplace_item?.title ?? p.event?.title ?? p.snapshot_title ?? null;
}

export function getCarSubline(post: FeedPost): string | null {
  const car = (post as { car?: CarRow }).car;
  if (!car) return null;
  const parts = [car.brand, car.model, car.year != null ? String(car.year) : null].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}
