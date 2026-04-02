import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";
import { useMyPages } from "@/hooks/useMyPages";

export function useMyEvents() {
  const { data: profile } = useMyPersonProfile();
  const { data: myPages } = useMyPages();

  return useQuery({
    queryKey: ["my_events", profile?.id, myPages?.map((p) => p.id)],
    queryFn: async () => {
      if (!profile) return [];

      const pageIds = (myPages ?? []).map((p) => p.id);

      let query = supabase
        .from("events")
        .select("*")
        .order("starts_at", { ascending: true });

      if (pageIds.length > 0) {
        query = query.or(
          `owner_profile_id.eq.${profile.id},owner_page_id.in.(${pageIds.join(",")})`
        );
      } else {
        query = query.eq("owner_profile_id", profile.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!profile,
  });
}
