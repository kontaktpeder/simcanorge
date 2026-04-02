import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";

export function useMyEvents() {
  const { data: profile } = useMyPersonProfile();

  return useQuery({
    queryKey: ["my_events", profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data, error } = await supabase
        .from("events" as any)
        .select("*")
        .eq("owner_profile_id", profile.id)
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!profile,
  });
}
