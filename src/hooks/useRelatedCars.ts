import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { applyPublicCarsApprovalFilter } from "@/lib/publicCarsFilter";

export interface RelatedCar {
  id: string;
  title: string;
  slug: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  car_images: { image_url: string; sort_order: number }[];
}

interface Input {
  carId: string | undefined;
  brand: string | null | undefined;
  model: string | null | undefined;
}

export function useRelatedCars({ carId, brand, model }: Input) {
  return useQuery({
    queryKey: ["related-cars", carId, brand, model],
    queryFn: async (): Promise<{ sameModel: RelatedCar[]; sameBrand: RelatedCar[] }> => {
      if (!carId || !brand) return { sameModel: [], sameBrand: [] };

      const baseSelect = `id, title, slug, brand, model, year, car_images(image_url, sort_order)`;
      const nowIso = new Date().toISOString();

      let sameModel: RelatedCar[] = [];
      if (model) {
        const { data } = await applyPublicCarsApprovalFilter(
          supabase
            .from("cars")
            .select(baseSelect)
            .ilike("brand", brand)
            .ilike("model", model)
            .neq("id", carId)
            .not("published_at", "is", null)
            .lte("published_at", nowIso)
            .order("published_at", { ascending: false })
            .limit(4),
        );
        sameModel = (data ?? []) as RelatedCar[];
      }

      const excludeIds = [carId, ...sameModel.map((c) => c.id)];
      const { data: brandData } = await applyPublicCarsApprovalFilter(
        supabase
          .from("cars")
          .select(baseSelect)
          .ilike("brand", brand)
          .not("id", "in", `(${excludeIds.map((id) => `"${id}"`).join(",")})`)
          .not("published_at", "is", null)
          .lte("published_at", nowIso)
          .order("published_at", { ascending: false })
          .limit(4),
      );

      return {
        sameModel,
        sameBrand: (brandData ?? []) as RelatedCar[],
      };
    },
    enabled: !!carId && !!brand,
  });
}
