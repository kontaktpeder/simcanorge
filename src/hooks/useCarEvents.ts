import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CarEvent {
  id: string;
  car_id: string;
  category: string;
  event_type: string;
  title: string | null;
  year: number | null;
  year_from: number | null;
  year_to: number | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  car_event_images?: CarEventImage[];
}

export interface CarEventImage {
  id: string;
  car_event_id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
}

export interface CreateCarEventInput {
  car_id: string;
  category: string;
  event_type: string;
  title?: string | null;
  year?: number | null;
  year_from?: number | null;
  year_to?: number | null;
  description?: string | null;
}

export interface UpdateCarEventInput {
  id: string;
  category?: string;
  event_type?: string;
  title?: string | null;
  year?: number | null;
  year_from?: number | null;
  year_to?: number | null;
  description?: string | null;
}

export function useCarEvents(carId: string | undefined) {
  return useQuery({
    queryKey: ["car-events", carId],
    queryFn: async () => {
      if (!carId) return [];
      
      const { data, error } = await supabase
        .from("car_events")
        .select(`
          *,
          car_event_images (*)
        `)
        .eq("car_id", carId);
      
      if (error) throw error;
      
      // Sort by year or year_from (oldest first)
      return (data as CarEvent[]).sort((a, b) => {
        const yearA = a.year ?? a.year_from ?? 0;
        const yearB = b.year ?? b.year_from ?? 0;
        return yearA - yearB;
      });
    },
    enabled: !!carId,
  });
}

export function useCreateCarEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateCarEventInput) => {
      const { data, error } = await supabase
        .from("car_events")
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["car-events", data.car_id] });
      toast.success("Hendelse lagt til");
    },
    onError: (error) => {
      console.error("Error creating car event:", error);
      toast.error("Kunne ikke legge til hendelse");
    },
  });
}

export function useUpdateCarEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: UpdateCarEventInput) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from("car_events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["car-events", data.car_id] });
      toast.success("Hendelse oppdatert");
    },
    onError: (error) => {
      console.error("Error updating car event:", error);
      toast.error("Kunne ikke oppdatere hendelse");
    },
  });
}

export function useDeleteCarEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ eventId, carId }: { eventId: string; carId: string }) => {
      const { error } = await supabase
        .from("car_events")
        .delete()
        .eq("id", eventId);
      
      if (error) throw error;
      return { eventId, carId };
    },
    onSuccess: ({ carId }) => {
      queryClient.invalidateQueries({ queryKey: ["car-events", carId] });
      toast.success("Hendelse slettet");
    },
    onError: (error) => {
      console.error("Error deleting car event:", error);
      toast.error("Kunne ikke slette hendelse");
    },
  });
}

export function useAddCarEventImage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ eventId, imageUrl, altText, carId }: { eventId: string; imageUrl: string; altText?: string; carId: string }) => {
      // Get current max sort order
      const { data: existing } = await supabase
        .from("car_event_images")
        .select("sort_order")
        .eq("car_event_id", eventId)
        .order("sort_order", { ascending: false })
        .limit(1);
      
      const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;
      
      const { data, error } = await supabase
        .from("car_event_images")
        .insert({
          car_event_id: eventId,
          image_url: imageUrl,
          alt_text: altText,
          sort_order: nextOrder,
        })
        .select()
        .single();
      
      if (error) throw error;
      return { data, carId };
    },
    onSuccess: ({ carId }) => {
      queryClient.invalidateQueries({ queryKey: ["car-events", carId] });
    },
    onError: (error) => {
      console.error("Error adding car event image:", error);
      toast.error("Kunne ikke legge til bilde");
    },
  });
}

export function useDeleteCarEventImage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ imageId, carId }: { imageId: string; carId: string }) => {
      const { error } = await supabase
        .from("car_event_images")
        .delete()
        .eq("id", imageId);
      
      if (error) throw error;
      return { imageId, carId };
    },
    onSuccess: ({ carId }) => {
      queryClient.invalidateQueries({ queryKey: ["car-events", carId] });
    },
    onError: (error) => {
      console.error("Error deleting car event image:", error);
      toast.error("Kunne ikke slette bilde");
    },
  });
}

export function useReorderCarEventImages() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ images, carId }: { images: { id: string; sort_order: number }[]; carId: string }) => {
      // Update each image's sort_order
      for (const img of images) {
        const { error } = await supabase
          .from("car_event_images")
          .update({ sort_order: img.sort_order })
          .eq("id", img.id);
        
        if (error) throw error;
      }
      return { carId };
    },
    onSuccess: ({ carId }) => {
      queryClient.invalidateQueries({ queryKey: ["car-events", carId] });
    },
    onError: (error) => {
      console.error("Error reordering images:", error);
      toast.error("Kunne ikke endre rekkefølge");
    },
  });
}
