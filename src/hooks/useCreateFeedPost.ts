import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";

export interface CreateFeedPostInput {
  post_type?: string;
  body?: string;
  car_id?: string | null;
  marketplace_item_id?: string | null;
  event_id?: string | null;
  snapshot_title?: string | null;
  snapshot_image_url?: string | null;
  snapshot_entity_type?: string | null;
}

export function useCreateFeedPost() {
  const qc = useQueryClient();
  const { data: profile } = useMyPersonProfile();

  return useMutation({
    mutationFn: async (input: CreateFeedPostInput) => {
      if (!profile) throw new Error("Ikke innlogget");

      const { data, error } = await supabase
        .from("feed_posts")
        .insert({
          author_profile_id: profile.id,
          post_type: input.post_type ?? "manual",
          body: input.body?.trim() || null,
          car_id: input.car_id ?? null,
          marketplace_item_id: input.marketplace_item_id ?? null,
          event_id: input.event_id ?? null,
          snapshot_title: input.snapshot_title ?? null,
          snapshot_image_url: input.snapshot_image_url ?? null,
          snapshot_entity_type: input.snapshot_entity_type ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed_posts"] });
    },
  });
}
