import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { compressImage, generateImageId, getCarEventImagePath } from "@/lib/imageCompression";
import { toast } from "sonner";
import { buildSpottingCarInsertMeta } from "@/lib/spottingCarInsertMeta";
import { publishCarOnObservation } from "@/lib/carPublishOnObservation";

export interface SpotCarInput {
  imageFile: File;
  registrationNumber?: string;
  titleOrModel?: string;
  note?: string;
}

export type SpotIdentificationStatus = "unknown" | "needs_review" | "identified" | null;

export interface SpotCarResult {
  carId: string;
  eventId: string;
  /** Backwards-compat alias for createdNewCar */
  isNewCar: boolean;
  createdNewCar: boolean;
  matchedExistingCar: boolean;
  identificationStatus: SpotIdentificationStatus;
  slug: string | null;
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
      .replace(/^-+|-+$/g, "") || "spotting"
  );
}

export function useSpotCar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const spotCar = async (input: SpotCarInput): Promise<SpotCarResult | null> => {
    if (!user) {
      toast.error("Du må være innlogget for å spotte en bil");
      return null;
    }
    if (!input.imageFile) {
      toast.error("Bilde er påkrevd");
      return null;
    }

    setIsSubmitting(true);
    try {
      // 1) Try to find existing car by registration number
      let carId: string | null = null;
      let slug: string | null = null;
      let matchedExistingCar = false;
      let createdNewCar = false;
      let identificationStatus: SpotIdentificationStatus = null;
      const regnrNormalized = input.registrationNumber ? normalizeRegnr(input.registrationNumber) : "";

      if (regnrNormalized.length >= 2) {
        const { data: matches } = await supabase.rpc("find_cars_by_registration_number", {
          p_normalized: regnrNormalized,
        });
        if (matches && Array.isArray(matches) && matches.length > 0) {
          const row = matches[0] as { id: string; slug: string | null };
          carId = row.id;
          slug = row.slug ?? null;
          matchedExistingCar = true;

          const pub = await publishCarOnObservation(carId);
          if (!pub.ok) throw new Error(pub.error);
          slug = pub.slug;
        }
      }

      // 2) If no match, create minimal "spotting" car
      if (!carId) {
        const meta = buildSpottingCarInsertMeta({
          registrationNumberRaw: input.registrationNumber,
          registrationNumberNormalized: regnrNormalized,
          titleOrModel: input.titleOrModel,
        });
        const baseSlug = slugify(`${meta.displayTitle}-${Date.now()}`);

        const { data: created, error: createErr } = await supabase
          .from("cars")
          .insert({
            title: meta.displayTitle,
            model: meta.displayModel,
            slug: baseSlug,
            source: "spotting",
            status: "submitted",
            category: "registrert",
            created_by_user_id: user.id,
            identification_status: meta.identification_status,
            published_at: new Date().toISOString(),
            ...(meta.registration_number ? { registration_number: meta.registration_number } : {}),
          })
          .select("id, slug, identification_status")
          .single();
        if (createErr || !created) throw createErr ?? new Error("Kunne ikke opprette bil");
        const createdRow = created as { id: string; slug: string | null; identification_status: string | null };
        carId = createdRow.id;
        slug = createdRow.slug ?? null;
        identificationStatus =
          (createdRow.identification_status as SpotIdentificationStatus) ?? meta.identification_status;
        createdNewCar = true;

        const pub = await publishCarOnObservation(carId);
        if (pub.ok) slug = pub.slug;
      }

      // 3) Create the spotting car_event (public)
      const { data: eventRow, error: eventErr } = await supabase
        .from("car_events")
        .insert({
          car_id: carId,
          category: "gjenoppdagelse",
          event_type: "dokumentert",
          title: "Spotting",
          visibility: "public",
          occurred_at: new Date().toISOString(),
          year: new Date().getFullYear(),
          description: input.note ?? null,
          created_by: user.id,
          data: {
            source: "spotting",
            spotted_by_user_id: user.id,
            spotting_note: input.note ?? null,
            // Stored internally only — never rendered publicly
            registration_number_internal: regnrNormalized || null,
          },
        })
        .select("id")
        .single();
      if (eventErr || !eventRow) throw eventErr ?? new Error("Kunne ikke lagre spotting");
      const eventId = (eventRow as { id: string }).id;

      // 4) Upload image
      const compressed = await compressImage(input.imageFile);
      const imageId = generateImageId();
      const storagePath = getCarEventImagePath(carId, eventId, imageId);
      const { error: upErr } = await supabase.storage
        .from("simca-images")
        .upload(storagePath, compressed.file, { contentType: "image/webp", upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("simca-images").getPublicUrl(storagePath);

      // 5) Insert car_event_images row
      const { error: imgErr } = await supabase.from("car_event_images").insert({
        car_event_id: eventId,
        image_url: urlData.publicUrl,
        sort_order: 0,
        alt_text: input.titleOrModel ?? "Spottet bil",
      });
      if (imgErr) throw imgErr;

      queryClient.invalidateQueries({ queryKey: ["car-events", carId] });
      queryClient.invalidateQueries({ queryKey: ["unknown-cars"] });
      queryClient.invalidateQueries({ queryKey: ["feed_posts"] });
      // Success-toast intentionally omitted — SpotCarDialog renders a success panel.
      return {
        carId,
        eventId,
        isNewCar: createdNewCar,
        createdNewCar,
        matchedExistingCar,
        identificationStatus,
        slug,
      };
    } catch (err) {
      console.error("spotCar error", err);
      toast.error("Kunne ikke lagre spotting");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { spotCar, isSubmitting };
}
