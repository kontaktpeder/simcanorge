import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Page = Database["public"]["Tables"]["pages"]["Row"];

/** Public pages only — used on /s/:slug */
export function usePublicPageBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["page", "public", "slug", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("slug", slug)
        .eq("is_public", true)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data as Page | null;
    },
    enabled: !!slug,
  });
}

/** For dashboard — RLS handles access control */
export function usePageBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["page", "slug", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as Page | null;
    },
    enabled: !!slug,
  });
}
