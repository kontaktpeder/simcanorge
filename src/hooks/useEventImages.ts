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
        const storagePath = getEventImagePath(eventId, imageId);

        const { error: uploadError } = await supabase.storage
          .from("simca-images")
          .upload(storagePath, result.file, { contentType: "image/webp" });
        if (uploadError) {
          toast.error(`Feil ved opplasting: ${result.file.name}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("simca-images")
          .getPublicUrl(storagePath);

        const { error: dbError } = await supabase
          .from("event_images" as any)
          .insert({
            event_id: eventId,
            image_url: urlData.publicUrl,
            storage_path: storagePath,
            sort_order: nextOrder,
          });

        if (dbError) {
          await supabase.storage.from("simca-images").remove([storagePath]);
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
    mutationFn: async ({ imageId, storagePath }: { imageId: string; storagePath: string | null }) => {
      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from("simca-images")
          .remove([storagePath]);
        if (storageError) {
          console.warn("Storage deletion failed:", storageError.message);
        }
      }
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
      const results = await Promise.all(
        images.map((img) =>
          supabase
            .from("event_images" as any)
            .update({ sort_order: img.sort_order })
            .eq("id", img.id)
        )
      );
      const failed = results.filter((r) => r.error);
      if (failed.length > 0) {
        throw new Error(`${failed.length} bilder kunne ikke oppdateres`);
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["event_images", eventId] }),
    onError: (err: any) => toast.error(err.message ?? "Feil ved sortering"),
  });
}
