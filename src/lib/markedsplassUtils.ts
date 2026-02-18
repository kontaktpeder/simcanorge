import { getThumbnailUrl } from "@/lib/imageUtils";

// Normalized feed item for the unified marketplace
export interface FeedItem {
  type: "part" | "listing";
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  price: string | null;
  priceNote: string | null;
  condition: string | null;
  categoryName: string | null;
  location: string | null;
  ownerName: string | null;
  ownerId: string | null;
  publishedAt: string;
  status?: string;
}

export function formatPartPrice(priceMin: number | null, priceMax: number | null): string | null {
  if (priceMin != null && priceMax != null) return `${priceMin}–${priceMax} kr`;
  if (priceMin != null) return `${priceMin} kr`;
  if (priceMax != null) return `${priceMax} kr`;
  return null;
}

export function formatListingPrice(price: number | null): string | null {
  if (price == null) return null;
  return `${Number(price).toLocaleString("nb-NO")} kr`;
}

export function getPartCoverImage(part: any): string | null {
  if (part.part_images?.length) {
    const sorted = [...part.part_images].sort((a: any, b: any) => a.sort_order - b.sort_order);
    return sorted[0]?.image_url ?? null;
  }
  return part.image_url;
}

export function getListingCoverImage(item: any): string | null {
  if (item.marketplace_images?.length) {
    const sorted = [...item.marketplace_images].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
    return sorted[0]?.image_url ?? null;
  }
  return null;
}

export function normalizePart(part: any, categories: any[]): FeedItem {
  const cat = categories.find((c) => c.id === part.category_id);
  return {
    type: "part",
    id: part.id,
    slug: part.slug || part.id,
    title: part.title,
    description: part.description,
    coverImage: getPartCoverImage(part),
    price: formatPartPrice(part.price_min, part.price_max),
    priceNote: part.price_note,
    condition: part.condition,
    categoryName: cat?.name || null,
    location: null,
    ownerName: null,
    ownerId: null,
    publishedAt: part.created_at,
    status: undefined,
  };
}

export function normalizeListing(item: any): FeedItem {
  const cat = item.categories as any;
  const owner = item.owners as any;
  return {
    type: "listing",
    id: item.id,
    slug: item.slug,
    title: item.title,
    description: item.description,
    coverImage: getListingCoverImage(item),
    price: formatListingPrice(item.price),
    priceNote: item.price_note,
    condition: null,
    categoryName: cat?.name || null,
    location: item.location,
    ownerName: owner?.display_name || null,
    ownerId: owner?.id || null,
    publishedAt: item.published_at || item.created_at,
    status: item.status ?? 'published',
  };
}

export const CONDITION_COLORS: Record<string, string> = {
  "Ny": "bg-green-700/90 text-white",
  "NOS": "bg-amber-700/90 text-white",
  "Brukt": "bg-muted-foreground/80 text-white",
  "Original": "bg-foreground/80 text-white",
  "Repro": "bg-primary/80 text-white",
};
