import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";

export interface EventInsert {
  title: string;
  slug: string;
  event_type: string;
  location: string;
  starts_at: string;
  ends_at?: string | null;
  short_description?: string | null;
  description?: string | null;
  program?: string | null;
  practical_info?: string | null;
  registration_url?: string | null;
  max_attendees?: number | null;
  status?: string;
  owner_profile_id?: string;
  owner_page_id?: string | null;
}

export interface EventUpdate {
  title?: string;
  event_type?: string;
  location?: string;
  starts_at?: string;
  ends_at?: string | null;
  short_description?: string | null;
  description?: string | null;
  program?: string | null;
  practical_info?: string | null;
  registration_url?: string | null;
  max_attendees?: number | null;
  status?: string;
}

export function useCreateEvent() {
  const { data: profile } = useMyPersonProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: Omit<EventInsert, "owner_profile_id">) => {
      if (!profile) throw new Error("Ingen profil");
      const { data, error } = await supabase
        .from("events" as any)
        .insert({ ...values, owner_profile_id: profile.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my_events"] });
    },
  });
}

export function useUpdateEvent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: EventUpdate) => {
      const { data, error } = await supabase
        .from("events" as any)
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["event", "dashboard", id] });
      queryClient.invalidateQueries({ queryKey: ["event", "public", data.slug] });
      queryClient.invalidateQueries({ queryKey: ["my_events"] });
    },
  });
}
