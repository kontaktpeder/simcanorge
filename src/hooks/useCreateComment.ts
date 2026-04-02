import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";

interface CreateCommentInput {
  body: string;
  parentId?: string;
  carId?: string;
  eventId?: string;
  marketplaceItemId?: string;
  feedPostId?: string;
}

export function useCreateComment() {
  const qc = useQueryClient();
  const { data: profile } = useMyPersonProfile();

  return useMutation({
    mutationFn: async (input: CreateCommentInput) => {
      if (!profile) throw new Error("Ikke innlogget");
      const { data, error } = await supabase
        .from("comments")
        .insert({
          author_profile_id: profile.id,
          body: input.body.trim(),
          parent_id: input.parentId ?? null,
          car_id: input.carId ?? null,
          event_id: input.eventId ?? null,
          marketplace_item_id: input.marketplaceItemId ?? null,
          feed_post_id: input.feedPostId ?? null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments"] });
    },
  });
}
