import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Page = Database["public"]["Tables"]["pages"]["Row"];
type PageUpdate = Database["public"]["Tables"]["pages"]["Update"];

export function usePageById(id: string | undefined) {
  return useQuery({
    queryKey: ["page", "id", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as Page | null;
    },
    enabled: !!id,
  });
}

export function useUpdatePage(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: PageUpdate) => {
      const { data, error } = await supabase
        .from("pages")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["page", "id", id] });
      queryClient.invalidateQueries({ queryKey: ["page", "slug", data.slug] });
      queryClient.invalidateQueries({ queryKey: ["my_pages"] });
    },
  });
}
