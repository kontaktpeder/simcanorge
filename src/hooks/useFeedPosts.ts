import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFeedPosts() {
  return useQuery({
    queryKey: ["feed_posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feed_posts")
        .select(`
          id, created_at, post_type, body,
          snapshot_title, snapshot_image_url, snapshot_entity_type,
          author:person_profiles!feed_posts_author_profile_id_fkey(
            id, display_name, slug, avatar_url
          ),
          car:cars!feed_posts_car_id_fkey(
            id, title, slug,
            car_images(image_url, sort_order)
          ),
          marketplace_item:marketplace_items!feed_posts_marketplace_item_id_fkey(
            id, title, slug,
            marketplace_images(image_url, sort_order)
          ),
          event:events!feed_posts_event_id_fkey(
            id, title, slug, starts_at, location,
            event_images(image_url, sort_order),
            owner_profile:person_profiles!events_owner_profile_id_fkey(display_name, slug, avatar_url),
            owner_page:pages!events_owner_page_id_fkey(title, slug, logo_url)
          ),
          feed_post_likes(id, user_id)
        `)
        .eq("is_visible", true)
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

export type FeedPost = NonNullable<
  Awaited<ReturnType<typeof useFeedPosts>>["data"]
>[number];
