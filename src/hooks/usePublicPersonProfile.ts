import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PersonProfile = Database["public"]["Views"]["public_person_profiles"]["Row"];

const PUBLIC_PERSON_PROFILE_COLUMNS =
  "id, user_id, display_name, slug, bio, avatar_url, cover_url, location, favorite_brands, is_public, can_create_pages, visible_public, approved_at, created_at, updated_at";

export function usePublicPersonProfile(slug: string | undefined) {
  return useQuery({
    queryKey: ["person_profile", "public", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("public_person_profiles")
        .select(PUBLIC_PERSON_PROFILE_COLUMNS)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as PersonProfile | null;
    },
    enabled: !!slug,
  });
}
