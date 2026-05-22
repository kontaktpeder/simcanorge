import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { compressImage, generateImageId, getCarEventImagePath } from "@/lib/imageCompression";
import { toast } from "sonner";

export interface AddCarObservationInput {
  carId: string;
  imageFile: File;
  note?: string;
}

export interface AddCarObservationResult {
  carId: string;
  eventId: string;
  slug: string | null;
}

export function useAddCarObservation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addObservation = async (
    input: AddCarObservationInput,
  ): Promise<AddCarObservationResult | null> => {
    if (!user) {
      toast.error("Du må være innlogget");
      return null;
    }
    if (!input.imageFile) {
      toast.error("Bilde er påkrevd");
      return null;
    }

    setIsSubmitting(true);
    try {
      const { data: carRow, error: carErr } = await supabase
        .from("cars")
        .select("id, slug")
        .eq("id", input.carId)
        .maybeSingle();
      if (carErr || !carRow) throw carErr ?? new Error("Bilen finnes ikke");

      const { data: eventRow, error: eventErr } = await supabase
        .from("car_events")
        .insert({
          car_id: input.carId,
          category: "gjenoppdagelse",
          event_type: "dokumentert",
          title: "Observasjon",
          visibility: "public",
          occurred_at: new Date().toISOString(),
          year: new Date().getFullYear(),
          description: input.note?.trim() || null,
          created_by: user.id,
          data: { source: "spotting", spotted_by_user_id: user.id },
        })
        .select("id")
        .single();
      if (eventErr || !eventRow) throw eventErr ?? new Error("Kunne ikke lagre");

      const eventId = (eventRow as { id: string }).id;
      const compressed = await compressImage(input.imageFile);
      const imageId = generateImageId();
      const storagePath = getCarEventImagePath(input.carId, eventId, imageId);
      const { error: upErr } = await supabase.storage
        .from("simca-images")
        .upload(storagePath, compressed.file, { contentType: "image/webp", upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("simca-images").getPublicUrl(storagePath);

      const { error: imgErr } = await supabase.from("car_event_images").insert({
        car_event_id: eventId,
        image_url: urlData.publicUrl,
        sort_order: 0,
        alt_text: "Observasjon",
      });
      if (imgErr) throw imgErr;

      queryClient.invalidateQueries({ queryKey: ["car-events", input.carId] });
      queryClient.invalidateQueries({ queryKey: ["car", carRow.slug] });

      return {
        carId: input.carId,
        eventId,
        slug: (carRow as { slug: string | null }).slug,
      };
    } catch (e) {
      console.error(e);
      toast.error("Kunne ikke legge til observasjon");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { addObservation, isSubmitting };
}
