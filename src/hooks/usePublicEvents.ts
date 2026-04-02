import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePublicEvents(filters?: { type?: string }) {
  return useQuery({
    queryKey: ["public_events", filters],
    queryFn: async () => {
      // Show events that haven't ended yet (or started today if no end date)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const cutoff = todayStart.toISOString();
      let query = supabase
        .from("events")
        .select(
          `id, title, slug, starts_at, ends_at, location, event_type,
           short_description, event_images(image_url, sort_order),
           owner_page:pages!events_owner_page_id_fkey(id, title, slug, logo_url),
           owner_profile:person_profiles!events_owner_profile_id_fkey(id, display_name, slug)`
        )
        .eq("status", "published")
        .gte("starts_at", cutoff)
        .order("starts_at", { ascending: true })
        .limit(30);

      if (filters?.type) {
        query = query.eq("event_type", filters.type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}
