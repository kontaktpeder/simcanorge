import { supabase } from "@/integrations/supabase/client";

type Payload = Record<string, unknown>;

const seenScreenViews = new Set<string>();

/**
 * Fire-and-forget product event logging.
 * Never throws — analytics failures must not break UX.
 */
export async function track(
  eventName: string,
  screen?: string,
  payload: Payload = {}
): Promise<void> {
  if (!eventName?.trim()) return;
  try {
    await supabase.rpc("log_product_event", {
      p_event_name: eventName,
      p_screen: screen ?? null,
      p_payload: payload as never,
    });
  } catch {
    // swallow — analytics must never affect UX
  }
}

/**
 * Logs a `screen_view_<screen>` event at most once per page-load
 * (per screen key). Safe to call from useEffect on mount.
 */
export function trackScreenViewOnce(screen: string): void {
  if (!screen?.trim()) return;
  const key = `screen_view:${screen}`;
  if (seenScreenViews.has(key)) return;
  seenScreenViews.add(key);
  void track(`screen_view_${screen}`, screen);
}
