import { useToast } from "@/hooks/use-toast";
import { ImageUploadWithOrder, type ImageItem } from "@/components/shared/ImageUploadWithOrder";
import type { WizardData } from "./WizardTypes";

interface StepImagesProps {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
}

const MAX_IMAGES = 10;

export function StepImages({ data, onChange }: StepImagesProps) {
  const { toast } = useToast();

  // Adapt File[] + previews into ImageItem[] for the shared component
  const items: ImageItem[] = data.imagePreviews.map((preview, i) => ({
    id: String(i),
    image_url: preview,
    sort_order: i,
  }));

  const handleUpload = (files: File[]) => {
    const remaining = MAX_IMAGES - data.images.length;
    if (remaining <= 0) {
      toast({ title: `Maks ${MAX_IMAGES} bilder`, variant: "destructive" });
      return;
    }
    const sliced = files.slice(0, remaining);
    const valid = sliced.filter((f) => {
      if (!f.type.startsWith("image/")) {
        toast({ title: `${f.name} er ikke et bilde`, variant: "destructive" });
        return false;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast({ title: `${f.name} er over 10 MB`, variant: "destructive" });
        return false;
      }
      return true;
    });
    if (!valid.length) return;

    const newPreviews: string[] = new Array(valid.length);
    let loaded = 0;
    valid.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews[idx] = reader.result as string;
        loaded++;
        if (loaded === valid.length) {
          onChange({
            images: [...data.images, ...valid],
            imagePreviews: [...data.imagePreviews, ...newPreviews],
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleReorder = (next: ImageItem[]) => {
    // Each id is the original index as string – use that to map back to File/preview
    const nextImages = next.map((it) => data.images[Number(it.id)]);
    const nextPreviews = next.map((it) => data.imagePreviews[Number(it.id)]);
    onChange({ images: nextImages, imagePreviews: nextPreviews });
  };

  const handleDelete = (id: string) => {
    const idx = Number(id);
    onChange({
      images: data.images.filter((_, i) => i !== idx),
      imagePreviews: data.imagePreviews.filter((_, i) => i !== idx),
    });
  };

  const handleSetMain = (index: number) => {
    if (index <= 0) return;
    const nextImages = [...data.images];
    const nextPreviews = [...data.imagePreviews];
    const [pickedImg] = nextImages.splice(index, 1);
    const [pickedPrev] = nextPreviews.splice(index, 1);
    nextImages.unshift(pickedImg);
    nextPreviews.unshift(pickedPrev);
    onChange({ images: nextImages, imagePreviews: nextPreviews });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl sm:text-3xl text-foreground">Vis oss bilen din</h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          Start med bilder – det gjør resten morsommere. Du kan endre rekkefølge og sette hovedbilde.
        </p>
      </div>

      <ImageUploadWithOrder
        images={items}
        maxImages={MAX_IMAGES}
        isUploading={false}
        isReordering={false}
        onUpload={handleUpload}
        onReorder={handleReorder}
        onSetMain={handleSetMain}
        onDelete={handleDelete}
        emptyTitle="Ingen bilder ennå"
        emptyDescription={`Maks ${MAX_IMAGES} bilder, 10 MB per bilde.`}
        altFallback="Bil"
      />

      <p className="text-xs text-muted-foreground text-center">
        {data.images.length}/{MAX_IMAGES} bilder valgt
      </p>
    </div>
  );
}
