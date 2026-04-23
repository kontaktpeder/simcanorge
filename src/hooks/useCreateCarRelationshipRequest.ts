import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { RelationshipType } from "@/lib/relationshipTypes";

export interface CreateRelationshipRequestInput {
  carId: string;
  relationshipType: RelationshipType;
  note?: string;
  startYear?: number | null;
  endYear?: number | null;
  wantsStewardship?: boolean;
}

export function useCreateCarRelationshipRequest() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateRelationshipRequestInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("not_authenticated");

      const { data, error } = await supabase
        .from("car_relationship_requests" as any)
        .insert({
          car_id: input.carId,
          requester_id: user.id,
          relationship_type: input.relationshipType,
          note: input.note?.trim() || null,
          relationship_start_year: input.startYear ?? null,
          relationship_end_year: input.endYear ?? null,
          wants_stewardship: input.wantsStewardship ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Forespørselen er sendt",
        description: "Du får beskjed når den er behandlet.",
      });
    },
    onError: (err: any) => {
      const msg = err?.message || "";
      if (msg.includes("not_authenticated")) {
        toast({
          title: "Du må være logget inn",
          description: "Logg inn for å sende en forespørsel.",
          variant: "destructive",
        });
      } else if (msg.includes("uniq_car_relationship_requests_pending") || err?.code === "23505") {
        toast({
          title: "Allerede sendt",
          description: "Du har allerede en pågående forespørsel for denne bilen.",
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
