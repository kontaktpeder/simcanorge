import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { RelationshipType } from "@/lib/relationshipTypes";

export type RelationshipRequestSource =
  | "manual"
  | "regnr_gate"
  | "spotting"
  | "activity_moment";

export interface CreateRelationshipRequestInput {
  carId: string;
  relationshipType: RelationshipType;
  note?: string;
  startYear?: number | null;
  endYear?: number | null;
  wantsStewardship?: boolean;
  source?: RelationshipRequestSource;
  sourceEventId?: string | null;
}

export type RelationshipRequestResultCode =
  | "created"
  | "already_pending"
  | "already_linked"
  | "not_authenticated";

export interface CreateRelationshipRequestResult {
  success: boolean;
  code: RelationshipRequestResultCode;
  /** Present for created / already_pending */
  id?: string;
  /** Present for already_linked */
  role?: string;
}

export function useCreateCarRelationshipRequest() {
  const { toast } = useToast();

  return useMutation<CreateRelationshipRequestResult, Error, CreateRelationshipRequestInput>({
    mutationFn: async (input) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("not_authenticated");

      const { data, error } = await supabase.rpc(
        "create_car_relationship_request_safe" as never,
        {
          p_car_id: input.carId,
          p_relationship_type: input.relationshipType,
          p_note: input.note?.trim() || null,
          p_start_year: input.startYear ?? null,
          p_end_year: input.endYear ?? null,
          p_wants_stewardship: input.wantsStewardship ?? false,
          p_source: input.source ?? "manual",
          p_source_event_id: input.sourceEventId ?? null,
        } as never,
      );

      if (error) throw error;

      const payload = (data ?? {}) as {
        success?: boolean;
        code?: RelationshipRequestResultCode;
        request_id?: string;
        role?: string;
      };

      const code = (payload.code ?? "created") as RelationshipRequestResultCode;

      if (code === "not_authenticated") {
        throw new Error("not_authenticated");
      }

      return {
        success: payload.success ?? code !== "already_linked",
        code,
        id: payload.request_id,
        role: payload.role,
      };
    },
    onSuccess: (result) => {
      if (result.code === "created") {
        toast({ title: "Forespørselen er sendt" });
      } else if (result.code === "already_pending") {
        toast({
          title: "Du har allerede en pågående forespørsel",
          description: "Vi tar kontakt så snart en ansvarlig har vurdert den.",
        });
      } else if (result.code === "already_linked") {
        toast({
          title: "Du er allerede koblet til denne bilen",
          description: "Bilen ligger allerede i garasjen din.",
        });
      }
    },
    onError: (err: any) => {
      const msg = err?.message || "";
      if (msg.includes("not_authenticated")) {
        toast({
          title: "Du må være logget inn",
          description: "Logg inn for å sende en forespørsel.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Kunne ikke sende",
          description: msg || "Prøv igjen senere.",
          variant: "destructive",
        });
      }
    },
  });
}
