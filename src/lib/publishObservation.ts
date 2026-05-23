/**
 * publishObservation — central publish motor for PublishComposer v1.
 *
 * Ansvar:
 *   1. Last opp media
 *   2. Resolve car_id (valgt bil → opprett tynn spotting-bil hvis ikke)
 *   3. Opprett car_event (DB-trigger oppretter feed_post når visibility=public)
 *   4. Hvis type === "question": opprett questions-rad koblet til car_id
 *
 * Ingen UI. Ingen toasts. Ren motor — kall fra hook/komponent.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  compressImage,
  generateImageId,
  getCarEventImagePath,
} from "@/lib/imageCompression";
import { buildSpottingCarInsertMeta } from "@/lib/spottingCarInsertMeta";
import { publishCarOnObservation } from "@/lib/carPublishOnObservation";

export type PublishType = "moment" | "question";
export type PublishVisibility = "public" | "private";

export interface PublishObservationInput {
  userId: string;
  imageFile: File;
  caption?: string | null;
  type?: PublishType;
  visibility?: PublishVisibility;
  /** Valgt eksisterende bil. */
  carId?: string | null;
  /** Hvis false: ikke knytt til bil — publiser kun feed_post med bilde. Standard true. */
  attachCar?: boolean;
  /** Valgfritt regnr for å matche/opprette bil hvis carId ikke er satt. */
  registrationNumber?: string | null;
  /** Valgfri tittel/modell brukt ved opprettelse av ny bil. */
  titleOrModel?: string | null;
  /** Valgfri kobling til aktiv tur. */
  activitySessionId?: string | null;
}

export interface PublishObservationResult {
  /** null når feed-only. */
  carId: string | null;
  /** null når feed-only. */
  eventId: string | null;
  questionId: string | null;
  questionSlug: string | null;
  carSlug: string | null;
  feedPostId: string | null;
  matchedExistingCar: boolean;
  createdNewCar: boolean;
  visibility: PublishVisibility;
  type: PublishType;
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
      .replace(/^-+|-+$/g, "") || "observasjon"
  );
}

function randSuffix(n = 6) {
  return Math.random().toString(36).slice(2, 2 + n);
}

export async function publishObservation(
  input: PublishObservationInput,
): Promise<PublishObservationResult> {
  if (!input.userId) throw new Error("not_authenticated");
  if (!input.imageFile) throw new Error("image_required");

  const type: PublishType = input.type ?? "moment";
  const visibility: PublishVisibility = input.visibility ?? "public";
  const caption = (input.caption ?? "").trim();
  const attachCar = input.attachCar !== false; // default true

  // ─── Feed-only modus (ingen bil knyttet) ─────────────────────────────
  if (!attachCar && !input.carId) {
    const compressed = await compressImage(input.imageFile);
    const imageId = generateImageId();
    const storagePath = `feed-posts/${input.userId}/${imageId}.webp`;
    const { error: upErr } = await supabase.storage
      .from("simca-images")
      .upload(storagePath, compressed.file, {
        contentType: "image/webp",
        upsert: false,
      });
    if (upErr) throw upErr;
    const { data: urlData } = supabase.storage
      .from("simca-images")
      .getPublicUrl(storagePath);

    const { data: profile } = await supabase
      .from("person_profiles")
      .select("id")
      .eq("user_id", input.userId)
      .maybeSingle();
    if (!profile?.id) throw new Error("profile_required");

    const { data: feedRow, error: feedErr } = await supabase
      .from("feed_posts")
      .insert({
        author_profile_id: profile.id,
        post_type: "manual",
        body: caption || null,
        snapshot_image_url: urlData.publicUrl,
        snapshot_title: caption.slice(0, 80) || "Innlegg",
        snapshot_entity_type: "manual",
      })
      .select("id")
      .single();
    if (feedErr || !feedRow) throw feedErr ?? new Error("feed_post_failed");

    return {
      carId: null,
      eventId: null,
      questionId: null,
      questionSlug: null,
      carSlug: null,
      feedPostId: (feedRow as { id: string }).id,
      matchedExistingCar: false,
      createdNewCar: false,
      visibility,
      type,
    };
  }

  // ─── 1) Resolve car_id ────────────────────────────────────────────────
  let carId: string | null = input.carId ?? null;
  let carSlug: string | null = null;
  let matchedExistingCar = false;
  let createdNewCar = false;

  if (carId) {
    const { data: existing, error } = await supabase
      .from("cars")
      .select("id, slug")
      .eq("id", carId)
      .maybeSingle();
    if (error || !existing) throw error ?? new Error("car_not_found");
    carSlug = (existing as { slug: string | null }).slug ?? null;
    matchedExistingCar = true;
  } else {
    const regnrNormalized = input.registrationNumber
      ? normalizeRegnr(input.registrationNumber)
      : "";

    // Forsøk regnr-match først
    if (regnrNormalized.length >= 2) {
      const { data: matches } = await supabase.rpc(
        "find_cars_by_registration_number",
        { p_normalized: regnrNormalized },
      );
      if (matches && Array.isArray(matches) && matches.length > 0) {
        const row = matches[0] as { id: string; slug: string | null };
        carId = row.id;
        carSlug = row.slug ?? null;
        matchedExistingCar = true;
        const pub = await publishCarOnObservation(carId);
        if (pub.ok) carSlug = pub.slug;
      }
    }

    // Opprett tynn spotting-bil
    if (!carId) {
      const meta = buildSpottingCarInsertMeta({
        registrationNumberRaw: input.registrationNumber,
        registrationNumberNormalized: regnrNormalized,
        titleOrModel: input.titleOrModel ?? caption.slice(0, 60) ?? null,
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
          created_by_user_id: input.userId,
          identification_status: meta.identification_status,
          published_at: new Date().toISOString(),
          ...(meta.registration_number
            ? { registration_number: meta.registration_number }
            : {}),
        })
        .select("id, slug")
        .single();
      if (createErr || !created)
        throw createErr ?? new Error("car_create_failed");
      const row = created as { id: string; slug: string | null };
      carId = row.id;
      carSlug = row.slug ?? null;
      createdNewCar = true;
      const pub = await publishCarOnObservation(carId);
      if (pub.ok) carSlug = pub.slug;
    }
  }

  if (!carId) throw new Error("car_resolve_failed");

  // ─── 2) Opprett car_event ────────────────────────────────────────────
  const eventCategory = type === "question" ? "kunnskap" : "bruk";
  const eventType = type === "question" ? "sporsmal" : "moment";
  const eventTitle =
    type === "question"
      ? caption.slice(0, 80) || "Spørsmål"
      : caption.slice(0, 80) || "Øyeblikk";

  const { data: eventRow, error: eventErr } = await supabase
    .from("car_events")
    .insert({
      car_id: carId,
      activity_session_id: input.activitySessionId ?? null,
      category: eventCategory,
      event_type: eventType,
      title: eventTitle,
      visibility,
      occurred_at: new Date().toISOString(),
      year: new Date().getFullYear(),
      description: caption || null,
      created_by: input.userId,
      data: {
        source: "publish_composer_v1",
        composer_type: type,
        spotted_by_user_id: input.userId,
      },
    })
    .select("id")
    .single();
  if (eventErr || !eventRow) throw eventErr ?? new Error("event_create_failed");
  const eventId = (eventRow as { id: string }).id;

  // ─── 3) Last opp og koble bilde ──────────────────────────────────────
  const compressed = await compressImage(input.imageFile);
  const imageId = generateImageId();
  const storagePath = getCarEventImagePath(carId, eventId, imageId);
  const { error: upErr } = await supabase.storage
    .from("simca-images")
    .upload(storagePath, compressed.file, {
      contentType: "image/webp",
      upsert: false,
    });
  if (upErr) throw upErr;
  const { data: urlData } = supabase.storage
    .from("simca-images")
    .getPublicUrl(storagePath);

  const { error: imgErr } = await supabase.from("car_event_images").insert({
    car_event_id: eventId,
    image_url: urlData.publicUrl,
    sort_order: 0,
    alt_text: caption.slice(0, 120) || "Observasjon",
  });
  if (imgErr) throw imgErr;

  // ─── 4) Spørsmål-kobling (kunnskap på bilen) ─────────────────────────
  let questionId: string | null = null;
  let questionSlug: string | null = null;
  if (type === "question") {
    // Hent author_profile_id
    const { data: profile } = await supabase
      .from("person_profiles")
      .select("id")
      .eq("user_id", input.userId)
      .maybeSingle();

    if (profile?.id) {
      const baseSlug = slugify(eventTitle) || "sporsmal";
      for (let attempt = 0; attempt < 3; attempt++) {
        const slug = `${baseSlug}-${randSuffix()}`;
        const { data: qRow, error: qErr } = await supabase
          .from("questions")
          .insert({
            title: eventTitle,
            body: caption || eventTitle,
            slug,
            car_id: carId,
            author_profile_id: profile.id,
          })
          .select("id, slug")
          .single();
        if (!qErr && qRow) {
          questionId = (qRow as { id: string }).id;
          questionSlug = (qRow as { slug: string }).slug;
          break;
        }
        if (!String(qErr?.message ?? "").toLowerCase().includes("duplicate")) {
          // Ikke fatal — spørsmål-raden er en bonus, car_event finnes allerede.
          console.warn("question insert failed", qErr);
          break;
        }
      }
    }
  }

  return {
    carId,
    eventId,
    questionId,
    questionSlug,
    carSlug,
    matchedExistingCar,
    createdNewCar,
    visibility,
    type,
  };
}
