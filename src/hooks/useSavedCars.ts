import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SavedCarRow {
  car_id: string;
}

export function useSavedCars() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  const queryKey = ["saved-cars", userId];

  const { data, isLoading } = useQuery({
    queryKey,
    enabled: !!userId,
    queryFn: async (): Promise<Set<string>> => {
      if (!userId) return new Set();
      const { data, error } = await supabase
        .from("saved_cars")
        .select("car_id")
        .eq("user_id", userId);
      if (error) throw error;
      return new Set((data as SavedCarRow[]).map((r) => r.car_id));
    },
  });

  const savedCarIds = data ?? new Set<string>();

  const toggleMutation = useMutation({
    mutationFn: async (carId: string) => {
      if (!userId) throw new Error("not_authenticated");
      const isCurrentlySaved = savedCarIds.has(carId);
      if (isCurrentlySaved) {
        const { error } = await supabase
          .from("saved_cars")
          .delete()
          .eq("car_id", carId)
          .eq("user_id", userId);
        if (error) throw error;
        return { carId, saved: false };
      } else {
        const { error } = await supabase
          .from("saved_cars")
          .insert({ car_id: carId, user_id: userId });
        if (error) throw error;
        return { carId, saved: true };
      }
    },
    onMutate: async (carId: string) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<Set<string>>(queryKey);
      const next = new Set(prev ?? new Set<string>());
      if (next.has(carId)) next.delete(carId);
      else next.add(carId);
      queryClient.setQueryData(queryKey, next);
      return { prev };
    },
    onError: (_err, _carId, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
      toast.error("Kunne ikke oppdatere lagret bil");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    savedCarIds,
    isSaved: (carId: string) => savedCarIds.has(carId),
    toggleSave: async (carId: string) => {
      await toggleMutation.mutateAsync(carId);
    },
    loading: isLoading || toggleMutation.isPending,
  };
}
