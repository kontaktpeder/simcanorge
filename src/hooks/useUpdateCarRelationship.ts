import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { RelationshipType } from "@/lib/relationshipTypes";

type UpdateRelationshipArgs = {
  carId: string;
  userId: string;
  relationshipType: RelationshipType;
  relationshipNote?: string | null;
  startYear?: number | null;
  endYear?: number | null;
  isPublic?: boolean;
};

export function useUpdateCarRelationship() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      carId,
      userId,
      relationshipType,
      relationshipNote,
      startYear,
      endYear,
      isPublic,
    }: UpdateRelationshipArgs) => {
      const note = relationshipNote?.trim() || null;

      const { error } = await supabase
        .from("car_owners")
        .update({
          relationship_type: relationshipType,
          relationship_note: relationshipType === "other" ? note : null,
          relationship_start_year: startYear ?? null,
          relationship_end_year: endYear ?? null,
          relationship_is_public: isPublic ?? true,
          relationship_is_verified: relationshipType === "current_owner",
        } as never)
        .eq("car_id", carId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["car-detail", vars.carId] });
      qc.invalidateQueries({ queryKey: ["my-cars"] });
    },
  });
}
