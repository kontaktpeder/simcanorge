import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePublicEventBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["event", "public", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("events" as any)
        .select(`*, event_images(*)`)
        .eq("slug", slug)
        .eq("status", "published")
        .order("sort_order", { referencedTable: "event_images", ascending: true })
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
}

export function useEventByIdForDashboard(id: string | undefined) {
  return useQuery({
    queryKey: ["event", "dashboard", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("events" as any)
        .select(`*, event_images(*)`)
        .eq("id", id)
        .order("sort_order", { referencedTable: "event_images", ascending: true })
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}
