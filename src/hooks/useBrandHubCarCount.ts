import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toBrandKey } from "@/lib/brandSlug";

/** Antall publiserte biler for et gitt brand_key. Brukes i SEO-readiness. */
export function useBrandHubCarCount(brandKey: string | undefined) {
  const normalized = brandKey ? toBrandKey(brandKey) : "";
  return useQuery({
    queryKey: ["brand-hub-car-count", normalized],
    enabled: normalized.length > 0,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("cars")
        .select("id", { count: "exact", head: true })
        .ilike("brand", normalized)
        .not("published_at", "is", null)
        .lte("published_at", new Date().toISOString());
      if (error) throw error;
      return count ?? 0;
    },
  });
}
