import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useIsQuestionSaved(questionId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["question_saves", user?.id, questionId],
    enabled: !!user && !!questionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("question_saves")
        .select("question_id")
        .eq("user_id", user!.id)
        .eq("question_id", questionId!)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}

export function useToggleQuestionSave(questionId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (currentlySaved: boolean) => {
      if (!user || !questionId) throw new Error("Ikke innlogget");
      if (currentlySaved) {
        const { error } = await supabase
          .from("question_saves")
          .delete()
          .eq("user_id", user.id)
          .eq("question_id", questionId);
        if (error) throw error;
        return false;
      }
      const { error } = await supabase
        .from("question_saves")
        .insert({ user_id: user.id, question_id: questionId });
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["question_saves"] });
      qc.invalidateQueries({ queryKey: ["my_saved_questions"] });
    },
  });
}

export function useMySavedQuestions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my_saved_questions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("question_saves")
        .select(`
          created_at,
          questions:question_id ( id, slug, title, created_at, is_deleted )
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? [])
        .map((r: any) => r.questions)
        .filter((q: any) => q && !q.is_deleted);
    },
  });
}
