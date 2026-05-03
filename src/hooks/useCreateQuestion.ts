import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function randSuffix(n = 6) {
  return Math.random().toString(36).slice(2, 2 + n);
}

export function useCreateQuestion() {
  const qc = useQueryClient();
  const { data: profile } = useMyPersonProfile();

  return useMutation({
    mutationFn: async (input: { title: string; body: string; carId?: string | null }) => {
      if (!profile) throw new Error("Mangler profil");
      const baseSlug = slugify(input.title) || "sporsmal";

      for (let attempt = 0; attempt < 3; attempt++) {
        const slug = `${baseSlug}-${randSuffix()}`;
        const { data, error } = await supabase
          .from("questions")
          .insert({
            title: input.title.trim(),
            body: input.body.trim(),
            slug,
            car_id: input.carId ?? null,
            author_profile_id: profile.id,
          })
          .select("id, slug")
          .single();
        if (!error) return data;
        if (!String(error.message).toLowerCase().includes("duplicate")) throw error;
      }
      throw new Error("Klarte ikke å generere unik slug");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}
