import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toBrandKey } from "@/lib/brandSlug";
import { getRelatedBrandKeys } from "@/data/brandRelations";

/** Brand hub page (pages where page_type_variant = 'brand') */
export function useBrandHubPage(brandKey: string | undefined) {
  return useQuery({
    queryKey: ["brand-hub-page", brandKey],
    queryFn: async () => {
      if (!brandKey) return null;
      const key = toBrandKey(brandKey);
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("is_public", true)
        .eq("status", "active")
        .limit(20);
      if (error) throw error;
      const list = (data ?? []) as any[];
      const exact = list.find(
        (p) => p.page_type_variant === "brand" && p.brand_key?.toLowerCase() === key,
      );
      if (exact) return exact;
      return list.find((p) => p.brand_key?.toLowerCase() === key) ?? null;
    },
    enabled: !!brandKey,
  });
}

export function useBrandHubCars(brandKey: string | undefined, limit = 25) {
  return useQuery({
    queryKey: ["brand-hub-cars", brandKey, limit],
    queryFn: async () => {
      if (!brandKey) return [];
      const { data, error } = await supabase
        .from("cars")
        .select(`id, title, slug, brand, model, year, car_images(image_url, sort_order)`)
        .ilike("brand", brandKey)
        .not("published_at", "is", null)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!brandKey,
  });
}

export interface BrandHubModel {
  model: string;
  count: number;
  sampleImage: string | null;
  sampleSlug: string | null;
}

export function useBrandHubModels(brandKey: string | undefined) {
  return useQuery({
    queryKey: ["brand-hub-models", brandKey],
    queryFn: async (): Promise<BrandHubModel[]> => {
      if (!brandKey) return [];
      const { data, error } = await supabase
        .from("cars")
        .select(`model, slug, car_images(image_url, sort_order)`)
        .ilike("brand", brandKey)
        .not("model", "is", null)
        .not("published_at", "is", null)
        .lte("published_at", new Date().toISOString());
      if (error) throw error;
      const grouped = new Map<string, BrandHubModel>();
      for (const row of data ?? []) {
        const m = (row as any).model?.trim();
        if (!m) continue;
        const key = m.toLowerCase();
        const entry = grouped.get(key);
        const images = ((row as any).car_images ?? []) as { image_url: string; sort_order: number }[];
        const sorted = [...images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        const img = sorted[0]?.image_url ?? null;
        if (entry) {
          entry.count += 1;
          if (!entry.sampleImage && img) {
            entry.sampleImage = img;
            entry.sampleSlug = (row as any).slug ?? null;
          }
        } else {
          grouped.set(key, {
            model: m,
            count: 1,
            sampleImage: img,
            sampleSlug: (row as any).slug ?? null,
          });
        }
      }
      return Array.from(grouped.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);
    },
    enabled: !!brandKey,
  });
}

export function useBrandHubClubs(brandKey: string | undefined) {
  return useQuery({
    queryKey: ["brand-hub-clubs", brandKey],
    queryFn: async () => {
      if (!brandKey) return [];
      const key = toBrandKey(brandKey);
      const { data, error } = await supabase
        .from("pages")
        .select("id, slug, title, tagline, logo_url, cover_url, page_type_variant, brand_key, location")
        .eq("is_public", true)
        .eq("status", "active")
        .ilike("brand_key", key)
        .in("page_type_variant", ["local", "community"])
        .limit(12);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!brandKey,
  });
}

export function useBrandHubRelated(brandKey: string | undefined, dbRelated?: string[] | null) {
  return useQuery({
    queryKey: ["brand-hub-related", brandKey, dbRelated],
    queryFn: async () => {
      if (!brandKey) return [];
      const keys = (dbRelated && dbRelated.length > 0)
        ? dbRelated.map((k) => toBrandKey(k)).filter(Boolean)
        : getRelatedBrandKeys(brandKey);
      if (keys.length === 0) return [];
      const { data, error } = await supabase
        .from("pages")
        .select("id, slug, title, tagline, logo_url, brand_key")
        .eq("is_public", true)
        .eq("status", "active")
        .eq("page_type_variant", "brand")
        .in("brand_key", keys);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!brandKey,
  });
}
