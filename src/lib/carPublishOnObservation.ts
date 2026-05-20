import { supabase } from "@/integrations/supabase/client";

export type PublishCarOnObservationResult =
  | { ok: true; slug: string; alreadyPublished?: boolean }
  | { ok: false; error: string };

export async function publishCarOnObservation(
  carId: string,
): Promise<PublishCarOnObservationResult> {
  const { data, error } = await supabase.rpc(
    "publish_car_on_observation" as never,
    { p_car_id: carId } as never,
  );

  if (error) {
    console.error("publish_car_on_observation", error);
    return { ok: false, error: error.message };
  }

  const row = data as {
    ok?: boolean;
    slug?: string;
    error?: string;
    already_published?: boolean;
  } | null;

  if (!row?.ok || !row.slug) {
    return { ok: false, error: row?.error ?? "publish_failed" };
  }

  return {
    ok: true,
    slug: row.slug,
    alreadyPublished: row.already_published === true,
  };
}
