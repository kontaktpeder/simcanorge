import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ClubPageForCars = {
  id: string;
  slug: string;
  brand_key: string | null;
};

/** Normalise brand token for matching against cars.brand */
export function clubBrandToken(page: ClubPageForCars): string | null {
  const fromKey = page.brand_key?.trim().toLowerCase();
  if (fromKey && fromKey.length >= 2) return fromKey;
  const fromSlug = page.slug.split("-")[0]?.toLowerCase() ?? "";
  return fromSlug.length >= 2 ? fromSlug : null;
}

export function useClubCommunityCars(page: ClubPageForCars | null | undefined) {
  return useQuery({
    queryKey: ["club-community-cars", page?.id, page?.slug, page?.brand_key],
    queryFn: async () => {
      if (!page) return [];
      const token = clubBrandToken(page);
      if (!token) return [];

      const { data, error } = await supabase
        .from("cars")
        .select("id, title, slug, brand, year, car_images(image_url, sort_order)")
        .ilike("brand", token)
        .not("published_at", "is", null)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!page && !!clubBrandToken(page),
  });
}

export function firstCarImage(car: {
  car_images?: { image_url: string; sort_order: number | null }[] | null;
}): string | null {
  return [...(car.car_images ?? [])]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.image_url ?? null;
}
