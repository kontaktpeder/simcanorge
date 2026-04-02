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

function toSlug(v: string) {
  return v.toLowerCase()
    .replace(/æ/g, "ae").replace(/ø/g, "oe").replace(/å/g, "aa")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let attempt = 0;
  while (true) {
    const { data } = await supabase
      .from("events" as any)
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return slug;
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }
}

export function useCreateEvent() {
  const { data: profile } = useMyPersonProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: Omit<EventInsert, "owner_profile_id">) => {
      if (!profile) throw new Error("Ingen profil");
      const uniqueSlug = await ensureUniqueSlug(values.slug ?? toSlug(values.title));
      const { data, error } = await supabase
        .from("events" as any)
        .insert({ ...values, slug: uniqueSlug, owner_profile_id: profile.id })
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
