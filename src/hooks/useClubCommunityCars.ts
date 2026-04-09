import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ClubPageForCars = {
  id: string;
  slug: string;
  brand_key: string | null;
};

/** Still useful for the "Se alle biler" link */
export function clubBrandToken(page: ClubPageForCars): string | null {
  const fromKey = page.brand_key?.trim().toLowerCase();
  if (fromKey && fromKey.length >= 2) return fromKey;
  const fromSlug = page.slug.split("-")[0]?.toLowerCase() ?? "";
  return fromSlug.length >= 2 ? fromSlug : null;
}

/**
 * Fetches cars explicitly linked to a page via page_cars join table.
 * New cars are NOT automatically included — they must be linked manually.
 */
export function useClubCommunityCars(page: ClubPageForCars | null | undefined) {
  return useQuery({
    queryKey: ["club-community-cars", page?.id],
    queryFn: async () => {
      if (!page) return [];

      const { data, error } = await supabase
        .from("page_cars")
        .select("car_id, cars(id, title, slug, brand, year, car_images(image_url, sort_order))")
        .eq("page_id", page.id)
        .limit(6);

      if (error) throw error;
      return (data ?? [])
        .map((row: any) => row.cars)
        .filter(Boolean);
    },
    enabled: !!page?.id,
  });
}

export function firstCarImage(car: {
  car_images?: { image_url: string; sort_order: number | null }[] | null;
}): string | null {
  return [...(car.car_images ?? [])]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.image_url ?? null;
}
