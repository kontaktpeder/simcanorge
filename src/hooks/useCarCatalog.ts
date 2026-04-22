import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CatalogBrand {
  id: number;
  name: string;
  slug: string;
  country: string | null;
}

export interface CatalogModel {
  id: number;
  brand_id: number | null;
  name: string;
  slug: string;
  year_from: number | null;
  year_to: number | null;
}

export function useCarBrands() {
  return useQuery({
    queryKey: ["car-catalog", "brands"],
    queryFn: async (): Promise<CatalogBrand[]> => {
      const { data, error } = await supabase
        .from("car_brands")
        .select("id, name, slug, country")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CatalogBrand[];
    },
    staleTime: 1000 * 60 * 60,
  });
}

export function useCarModels(brandId: number | null | undefined) {
  return useQuery({
    queryKey: ["car-catalog", "models", brandId ?? null],
    enabled: !!brandId,
    queryFn: async (): Promise<CatalogModel[]> => {
      if (!brandId) return [];
      const { data, error } = await supabase
        .from("car_models")
        .select("id, brand_id, name, slug, year_from, year_to")
        .eq("brand_id", brandId)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CatalogModel[];
    },
    staleTime: 1000 * 60 * 60,
  });
}

export function formatYearRange(model: Pick<CatalogModel, "year_from" | "year_to"> | null | undefined): string | null {
  if (!model) return null;
  const from = model.year_from;
  const to = model.year_to;
  if (from && to) return `${from}–${to}`;
  if (from) return `fra ${from}`;
  if (to) return `til ${to}`;
  return null;
}
