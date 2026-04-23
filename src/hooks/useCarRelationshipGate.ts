import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type GateOwnership = { id: string; role: "owner" | "viewer" };

export interface CarRelationshipGateResult {
  isLoading: boolean;
  ownership: GateOwnership | null;
  pendingRequestId: string | null;
  error: Error | null;
}

/**
 * Sjekker om innlogget bruker allerede har en kobling til bilen
 * (car_owners) eller en pending forespørsel — slik at UI kan unngå
 * å åpne RelationshipRequestDialog for noen som allerede er koblet.
 *
 * Returnerer en imperativ refetch via `resolve(carId)` for engangs-lookup
 * (brukes når bruker klikker "Dette er bilen min").
 */
export function useCarRelationshipGate(opts?: {
  carId?: string | null;
  enabled?: boolean;
}): CarRelationshipGateResult & {
  resolve: (carId: string) => Promise<{
    ownership: GateOwnership | null;
    pendingRequestId: string | null;
  }>;
} {
  const { user } = useAuth();
  const [state, setState] = useState<CarRelationshipGateResult>({
    isLoading: false,
    ownership: null,
    pendingRequestId: null,
    error: null,
  });

  const carId = opts?.carId ?? null;
  const enabled = opts?.enabled !== false && !!user && !!carId;

  useEffect(() => {
    let cancelled = false;
    if (!enabled || !user || !carId) {
      setState({ isLoading: false, ownership: null, pendingRequestId: null, error: null });
      return;
    }
    setState(s => ({ ...s, isLoading: true, error: null }));
    (async () => {
      try {
        const { ownership, pendingRequestId } = await runGate(carId, user.id);
        if (cancelled) return;
        setState({ isLoading: false, ownership, pendingRequestId, error: null });
      } catch (err: any) {
        if (cancelled) return;
        setState({ isLoading: false, ownership: null, pendingRequestId: null, error: err });
      }
    })();
    return () => { cancelled = true; };
  }, [enabled, user, carId]);

  const resolve = async (cid: string) => {
    if (!user) return { ownership: null, pendingRequestId: null };
    return runGate(cid, user.id);
  };

  return { ...state, resolve };
}

async function runGate(carId: string, userId: string) {
  const [ownerRes, pendingRes] = await Promise.all([
    supabase
      .from("car_owners")
      .select("id, role")
      .eq("car_id", carId)
      .eq("user_id", userId)
      .in("role", ["owner", "viewer"])
      .limit(1)
      .maybeSingle(),
    supabase
      .from("car_relationship_requests" as any)
      .select("id")
      .eq("car_id", carId)
      .eq("requester_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const ownership = ownerRes.data
    ? ({ id: (ownerRes.data as any).id, role: (ownerRes.data as any).role as "owner" | "viewer" })
    : null;
  const pendingRequestId = (pendingRes.data as any)?.id ?? null;
  return { ownership, pendingRequestId };
}
