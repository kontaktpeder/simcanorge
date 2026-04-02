import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type Page = Database["public"]["Tables"]["pages"]["Row"];
type Membership = Database["public"]["Tables"]["page_memberships"]["Row"];

export type PageWithRole = Page & { role: Membership["role"] };

export function useMyPages() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my_pages", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Steg 1: hent profil-id separat
      const { data: profile, error: profileError } = await supabase
        .from("person_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) return [];

      const { data, error } = await supabase
        .from("page_memberships")
        .select(`
          role,
          pages (*)
        `)
        .eq("person_profile_id", profile.id);

      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        ...row.pages,
        role: row.role,
      })) as PageWithRole[];
    },
    enabled: !!user,
  });
}
