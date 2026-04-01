import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PersonProfile = Database["public"]["Tables"]["person_profiles"]["Row"];

export function usePublicPersonProfile(slug: string | undefined) {
  return useQuery({
    queryKey: ["person_profile", "public", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("person_profiles")
        .select("*")
        .eq("slug", slug)
        .eq("is_public", true)
        .maybeSingle();
      if (error) throw error;
      return data as PersonProfile | null;
    },
    enabled: !!slug,
  });
}
