import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { compressImages, generateImageId, getEventImagePath } from "@/lib/imageCompression";
import { toast } from "sonner";

export function useEventImages(eventId: string | undefined) {
  return useQuery({
    queryKey: ["event_images", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from("event_images" as any)
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!eventId,
  });
}

export function useUploadEventImages(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (files: File[]) => {
      const results = await compressImages(files);
      const { data: existing } = await supabase
        .from("event_images" as any)
        .select("id")
        .eq("event_id", eventId);
      let nextOrder = existing?.length ?? 0;
      let successCount = 0;

      for (const result of results) {
        const imageId = generateImageId();
        const filePath = getEventImagePath(eventId, imageId);

        const { error: uploadError } = await supabase.storage
          .from("simca-images")
          .upload(filePath, result.file, { contentType: "image/webp" });
        if (uploadError) {
          toast.error(`Feil: ${result.file.name}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("simca-images")
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from("event_images" as any)
          .insert({
            event_id: eventId,
            image_url: urlData.publicUrl,
            sort_order: nextOrder,
          });

        if (dbError) {
          await supabase.storage.from("simca-images").remove([filePath]);
          toast.error("Kunne ikke lagre bildereferanse");
          continue;
        }
        nextOrder++;
        successCount++;
      }
      if (successCount > 0) toast.success(`${successCount} bilde(r) lastet opp`);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["event_images", eventId] }),
  });
}

export function useDeleteEventImage(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (imageId: string) => {
      const { error } = await supabase
        .from("event_images" as any)
        .delete()
        .eq("id", imageId);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["event_images", eventId] }),
    onError: () => toast.error("Kunne ikke slette bilde"),
  });
}

export function useReorderEventImages(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (images: { id: string; sort_order: number }[]) => {
      await Promise.all(
        images.map((img) =>
          supabase
            .from("event_images" as any)
            .update({ sort_order: img.sort_order })
            .eq("id", img.id)
        )
      );
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["event_images", eventId] }),
  });
}
