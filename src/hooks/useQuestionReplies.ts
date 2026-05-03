import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";

export function useQuestionReplies(questionId: string | undefined) {
  return useQuery({
    queryKey: ["question_replies", questionId],
    enabled: !!questionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("question_replies")
        .select(`
          id, body, created_at, author_profile_id,
          author:author_profile_id ( id, display_name, slug, avatar_url )
        `)
        .eq("question_id", questionId!)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddQuestionReply(questionId: string | undefined) {
  const qc = useQueryClient();
  const { data: profile } = useMyPersonProfile();

  return useMutation({
    mutationFn: async (body: string) => {
      if (!profile) throw new Error("Mangler profil");
      if (!questionId) throw new Error("Mangler spørsmål-id");
      const { data, error } = await supabase
        .from("question_replies")
        .insert({
          question_id: questionId,
          body: body.trim(),
          author_profile_id: profile.id,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["question_replies", questionId] });
    },
  });
}
