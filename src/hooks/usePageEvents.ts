import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePageEvents(pageId: string | undefined) {
  return useQuery({
    queryKey: ["page_events", pageId],
    queryFn: async () => {
      if (!pageId) return [];
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("events")
        .select(
          "id, title, slug, starts_at, ends_at, location, event_type, short_description, event_images(image_url, sort_order)"
        )
        .eq("owner_page_id", pageId)
        .eq("status", "published")
        .gte("starts_at", now)
        .order("starts_at", { ascending: true })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!pageId,
  });
}
