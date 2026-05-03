import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useRecentQuestions(limit = 5) {
  return useQuery({
    queryKey: ["questions", "recent", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("id, slug, title, created_at, car_id, author_profile_id")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useQuestionBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["questions", "slug", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select(`
          id, slug, title, body, car_id, author_profile_id, created_at, updated_at, is_deleted,
          author:author_profile_id ( id, display_name, slug, avatar_url ),
          car:car_id ( id, slug, title )
        `)
        .eq("slug", slug!)
        .eq("is_deleted", false)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useQuestionsByCarId(carId: string | undefined) {
  return useQuery({
    queryKey: ["questions", "car", carId],
    enabled: !!carId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("id, slug, title, created_at")
        .eq("car_id", carId!)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
