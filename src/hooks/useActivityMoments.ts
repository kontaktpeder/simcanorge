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
  data: { image_url?: string | null; note?: string | null; registration_number_internal?: string | null } | null;
  visibility: string;
  activity_session_id: string | null;
  car_id: string | null;
}

function normalizeRegnr(regnr: string): string {
  return regnr.toLowerCase().replace(/\s|-/g, "").trim();
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[æÆ]/g, "ae")
      .replace(/[øØ]/g, "o")
      .replace(/[åÅ]/g, "a")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "moment"
  );
}

export function useActivityMoments(sessionId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: moments = [], isLoading } = useQuery({
    queryKey: ["activity-moments", sessionId],
    queryFn: async (): Promise<ActivityMoment[]> => {
      if (!sessionId) return [];
      try {
        const { data, error } = await supabase
          .from("car_events")
          .select("id, occurred_at, data, visibility, activity_session_id, car_id")
          .eq("activity_session_id", sessionId)
          .order("occurred_at", { ascending: false });
        if (error) throw error;
        return (data ?? []) as ActivityMoment[];
      } catch (err) {
        console.warn("useActivityMoments fetch failed (returning []):", err);
        return [];
      }
    },
    enabled: !!sessionId && !!user,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const addMutation = useMutation({
    mutationFn: async (input: {
      sessionId: string;
      imageFile?: File | null;
      note?: string | null;
      visibility?: ActivityVisibility;
      carId?: string | null;
      registrationNumber?: string | null;
    }) => {
      if (!user) throw new Error("not_authenticated");

      // 1) Resolve car_id via regnr if provided and no explicit carId
      let carId: string | null = input.carId ?? null;
      const regnrNormalized = input.registrationNumber ? normalizeRegnr(input.registrationNumber) : "";
      if (!carId && regnrNormalized.length >= 2) {
        const { data: matches } = await supabase.rpc("find_cars_by_registration_number", {
          p_normalized: regnrNormalized,
        });
        if (matches && Array.isArray(matches) && matches.length > 0) {
          carId = (matches[0] as { id: string }).id;
        } else {
          // Create minimal unclaimed car
          const titleBase = "Bil sett underveis";
          const baseSlug = slugify(`${titleBase}-${Date.now()}`);
          const { data: created, error: createErr } = await supabase
            .from("cars")
            .insert({
              title: titleBase,
              model: "Ukjent",
              slug: baseSlug,
              source: "spotting",
              status: "submitted",
              category: "registrert",
              created_by_user_id: user.id,
            })
            .select("id")
            .single();
          if (createErr || !created) throw createErr ?? new Error("Kunne ikke opprette bil");
          carId = (created as { id: string }).id;
        }
      }

      // 2) Upload optional image
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

      // 3) Insert car_event
      const now = new Date();
      const { error } = await supabase.from("car_events").insert({
        car_id: carId,
        activity_session_id: input.sessionId,
        category: "bruk",
        event_type: "moment",
        title: input.note?.slice(0, 80) || "Øyeblikk",
        visibility: input.visibility ?? "private",
        occurred_at: now.toISOString(),
        year: now.getFullYear(),
        description: input.note ?? null,
        created_by: user.id,
        data: {
          image_url: imageUrl,
          note: input.note ?? null,
          // Internal only — never rendered publicly
          registration_number_internal: regnrNormalized || null,
        },
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
