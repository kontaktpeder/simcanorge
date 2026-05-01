import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { compressImage, generateImageId } from "@/lib/imageCompression";
import { toast } from "sonner";
import type { ActivityVisibility } from "./useActivitySession";

export interface ActivityMoment {
  id: string;
  occurred_at: string;
  data: { image_url?: string | null; note?: string | null } | null;
  visibility: string;
  activity_session_id: string | null;
  car_id: string | null;
}

export function useActivityMoments(sessionId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: moments = [], isLoading } = useQuery({
    queryKey: ["activity-moments", sessionId],
    queryFn: async (): Promise<ActivityMoment[]> => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from("car_events")
        .select("id, occurred_at, data, visibility, activity_session_id, car_id")
        .eq("activity_session_id", sessionId)
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ActivityMoment[];
    },
    enabled: !!sessionId,
  });

  const addMutation = useMutation({
    mutationFn: async (input: {
      sessionId: string;
      imageFile?: File | null;
      note?: string | null;
      visibility?: ActivityVisibility;
      carId?: string | null;
    }) => {
      if (!user) throw new Error("not_authenticated");
      let imageUrl: string | null = null;
      if (input.imageFile) {
        const { file } = await compressImage(input.imageFile);
        const path = `activity-moments/${input.sessionId}/${generateImageId()}.webp`;
        const { error: upErr } = await supabase.storage
          .from("simca-images")
          .upload(path, file, { contentType: "image/webp" });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("simca-images").getPublicUrl(path);
        imageUrl = pub.publicUrl;
      }
      const now = new Date();
      const { error } = await supabase.from("car_events").insert({
        car_id: input.carId ?? null,
        activity_session_id: input.sessionId,
        category: "bruk",
        event_type: "moment",
        title: input.note?.slice(0, 80) || "Øyeblikk",
        visibility: input.visibility ?? "private",
        occurred_at: now.toISOString(),
        year: now.getFullYear(),
        description: input.note ?? null,
        created_by: user.id,
        data: { image_url: imageUrl, note: input.note ?? null },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity-moments", sessionId] });
      toast.success("Øyeblikk lagret");
    },
    onError: (err) => {
      console.error("addMoment error", err);
      toast.error("Kunne ikke lagre øyeblikk");
    },
  });

  const addMoment = useCallback(
    (input: Parameters<typeof addMutation.mutateAsync>[0]) => addMutation.mutateAsync(input),
    [addMutation]
  );

  return {
    moments,
    isLoading,
    addMoment,
    isAdding: addMutation.isPending,
  };
}
