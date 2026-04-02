import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePublicEventBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["event", "public", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("events" as any)
        .select(`
          *,
          event_images (id, image_url, alt_text, sort_order, storage_path),
          owner_page:pages (id, title, slug, logo_url, tagline, contact_email, website),
          owner_profile:person_profiles (id, display_name, slug, avatar_url)
        `)
        .eq("slug", slug)
        .eq("status", "published")
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
        .select(`
          *,
          event_images (id, image_url, alt_text, sort_order, storage_path),
          owner_page:pages (id, title, slug, logo_url),
          owner_profile:person_profiles (id, display_name, slug, avatar_url)
        `)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}
