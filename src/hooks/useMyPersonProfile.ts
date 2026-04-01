import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type PersonProfile = Database["public"]["Tables"]["person_profiles"]["Row"];
type PersonProfileUpdate = Database["public"]["Tables"]["person_profiles"]["Update"];

export function useMyPersonProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["person_profile", "me", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("person_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as PersonProfile | null;
    },
    enabled: !!user,
  });
}

export function useUpsertPersonProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: Omit<PersonProfileUpdate, "user_id"> & { display_name: string; slug: string }) => {
      if (!user) throw new Error("Ikke innlogget");
      const { data, error } = await supabase
        .from("person_profiles")
        .upsert({ ...values, user_id: user.id }, { onConflict: "user_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["person_profile", "me", user?.id] });
    },
  });
}
