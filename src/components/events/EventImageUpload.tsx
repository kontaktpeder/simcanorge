import { ImageUploadWithOrder } from "@/components/shared/ImageUploadWithOrder";
import {
  useEventImages,
  useUploadEventImages,
  useDeleteEventImage,
  useReorderEventImages,
} from "@/hooks/useEventImages";

export function EventImageUpload({ eventId }: { eventId: string }) {
  const { data: images = [] } = useEventImages(eventId);
  const { mutate: upload, isPending: isUploading } = useUploadEventImages(eventId);
  const { mutate: deleteImage } = useDeleteEventImage(eventId);
  const { mutate: reorder, isPending: isReordering } = useReorderEventImages(eventId);

  const sorted = [...(images as any[])].sort(
    (a: any, b: any) => a.sort_order - b.sort_order
  );

  return (
    <ImageUploadWithOrder
      images={sorted}
      maxImages={20}
      mainLabel="Forsidebilde"
      isUploading={isUploading}
      isReordering={isReordering}
      onUpload={(files) => upload(files)}
      onDelete={(id) => {
        const img = sorted.find((i: any) => i.id === id);
        deleteImage({ imageId: id, storagePath: img?.storage_path ?? null });
      }}
      onReorder={(imgs) =>
        reorder(imgs.map((img, i) => ({ id: img.id, sort_order: i })))
      }
      onSetMain={(index) => {
        const next = [...sorted];
        const [picked] = next.splice(index, 1);
        next.unshift(picked);
        reorder(next.map((img: any, i: number) => ({ id: img.id, sort_order: i })));
      }}
      emptyTitle="Ingen bilder ennå"
      emptyDescription="Last opp bilder fra eventet. Første bilde brukes som forsidebilde."
    />
  );
}
