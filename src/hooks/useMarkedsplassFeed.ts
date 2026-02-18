import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FeedItem, normalizePart, normalizeListing } from "@/lib/markedsplassUtils";

export type FeedFilter = "all" | "parts" | string; // string = marketplace category id

export function useMarkedsplassFeed(filter: FeedFilter, search?: string) {
  return useQuery({
    queryKey: ["markedsplass-feed", filter, search],
    queryFn: async () => {
      // Fetch parts
      let partsQuery = supabase
        .from("parts")
        .select("id, title, slug, description, image_url, category_id, price_min, price_max, price_note, condition, created_at, part_images(id, image_url, sort_order)")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (search) {
        partsQuery = partsQuery.ilike("title", `%${search}%`);
      }

      // Fetch part categories
      const categoriesQuery = supabase.from("categories").select("id, name, slug");

      // Fetch marketplace items
      let listingsQuery = supabase
        .from("marketplace_items")
        .select(`
          *,
          marketplace_images(id, image_url, sort_order, alt_text),
          categories(id, name, slug),
          owners!inner(id, display_name, slug, location)
        `)
        .not("published_at", "is", null)
        .order("published_at", { ascending: false });

      if (search) {
        listingsQuery = listingsQuery.ilike("title", `%${search}%`);
      }

      if (filter !== "all" && filter !== "parts" && filter !== "") {
        // It's a marketplace category id – only fetch listings for that category
        listingsQuery = listingsQuery.eq("category_id", filter);
      }

      const [partsRes, categoriesRes, listingsRes] = await Promise.all([
        partsQuery,
        categoriesQuery,
        listingsQuery,
      ]);

      const partCategories = categoriesRes.data || [];
      const parts: FeedItem[] = (partsRes.data || []).map((p: any) => normalizePart(p, partCategories));
      const listings: FeedItem[] = (listingsRes.data || []).map((l: any) => normalizeListing(l));

      // Apply filter
      if (filter === "parts") return parts;
      if (filter !== "all" && filter !== "") {
        // Marketplace category filter – only return listings (already filtered in query)
        return listings;
      }

      // "all" – merge and sort by publishedAt desc
      const merged = [...parts, ...listings];
      merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      return merged;
    },
  });
}

// Fetch marketplace categories for filter tabs
export function useMarkedsplassCategories() {
  return useQuery({
    queryKey: ["markedsplass-all-categories"],
    queryFn: async () => {
      const partCats = await supabase.from("categories").select("id, name, slug").order("name");
      return {
        partCategories: partCats.data || [],
        marketplaceCategories: partCats.data || [],
      };
    },
  });
}
