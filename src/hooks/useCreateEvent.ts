import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type EventInsert = TablesInsert<"events">;
type EventUpdate = TablesUpdate<"events">;

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
      .from("events")
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
        .from("events")
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
        .from("events")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["event", "dashboard", id] });
      queryClient.invalidateQueries({ queryKey: ["event", "public", data.slug] });
      queryClient.invalidateQueries({ queryKey: ["my_events"] });
    },
  });
}
