import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UseCommentsProps {
  carId?: string;
  eventId?: string;
  marketplaceItemId?: string;
  feedPostId?: string;
}

export function useComments({ carId, eventId, marketplaceItemId, feedPostId }: UseCommentsProps) {
  const entityKey = carId ?? eventId ?? marketplaceItemId ?? feedPostId;

  return useQuery({
    queryKey: ["comments", { carId, eventId, marketplaceItemId, feedPostId }],
    queryFn: async () => {
      let query = supabase
        .from("comments")
        .select(`
          id, created_at, updated_at, body, parent_id, is_deleted,
          author:person_profiles!comments_author_profile_id_fkey(
            id, display_name, slug, avatar_url
          ),
          comment_likes(user_id)
        `)
        .order("created_at", { ascending: true });

      if (carId) query = query.eq("car_id", carId);
      else if (eventId) query = query.eq("event_id", eventId);
      else if (marketplaceItemId) query = query.eq("marketplace_item_id", marketplaceItemId);
      else if (feedPostId) query = query.eq("feed_post_id", feedPostId);
      else return [];

      const { data, error } = await query;
      if (error) throw error;

      const all = data ?? [];
      const topLevel = all.filter((c) => !c.parent_id);
      const replies = all.filter((c) => !!c.parent_id);

      return topLevel.map((c) => ({
        ...c,
        replies: replies.filter((r) => r.parent_id === c.id),
      }));
    },
    enabled: !!entityKey,
  });
}

export type CommentWithReplies = NonNullable<
  Awaited<ReturnType<typeof useComments>>["data"]
>[number];
