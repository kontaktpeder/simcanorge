import { useRef } from "react";
import { ChevronLeft, ChevronRight, Star, Trash2, Upload, Wrench } from "lucide-react";

export interface ImageItem {
  id: string;
  image_url: string;
  alt_text?: string | null;
  sort_order: number;
}

interface ImageUploadWithOrderProps {
  images: ImageItem[];
  maxImages?: number;
  mainLabel?: string;
  isUploading: boolean;
  isReordering: boolean;
  onReorder: (images: ImageItem[]) => void | Promise<void>;
  onSetMain: (index: number) => void | Promise<void>;
  onDelete: (imageId: string) => void | Promise<void>;
  onUpload: (files: File[]) => void | Promise<void>;
  emptyTitle?: string;
  emptyDescription?: string;
  altFallback?: string;
}

export function ImageUploadWithOrder({
  images,
  maxImages = 20,
  mainLabel = "Hovedbilde",
  isUploading,
  isReordering,
  onReorder,
  onSetMain,
  onDelete,
  onUpload,
  emptyTitle = "Ingen bilder ennå",
  emptyDescription = "Last opp bilder.",
  altFallback = "",
}: ImageUploadWithOrderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const remaining = maxImages - sorted.length;
    if (remaining <= 0) return;
    const toAdd = Array.from(files).slice(0, remaining);
    onUpload(toAdd);
    e.target.value = "";
  };

  const moveLeft = async (index: number) => {
    if (index <= 0) return;
    const next = [...sorted];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    await onReorder(next.map((img, i) => ({ ...img, sort_order: i })));
  };

  const moveRight = async (index: number) => {
    if (index >= sorted.length - 1) return;
    const next = [...sorted];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    await onReorder(next.map((img, i) => ({ ...img, sort_order: i })));
  };

  const setMain = async (index: number) => {
    if (index <= 0) return;
    const next = [...sorted];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    await onReorder(next.map((img, i) => ({ ...img, sort_order: i })));
  };

  if (sorted.length === 0) {
    return (
      <div className="border-2 border-dashed border-muted-foreground rounded-lg p-8 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <Wrench className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="font-medium text-sm">{emptyTitle}</p>
        <p className="text-xs text-muted-foreground mt-1">{emptyDescription}</p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {isUploading ? "Laster opp..." : "Last opp"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex flex-wrap gap-3">
        {sorted.map((img, index) => (
          <div
            key={img.id}
            className="relative group w-[calc(33.333%-0.5rem)] sm:w-32 aspect-square rounded-lg overflow-hidden border-2 border-border bg-muted"
          >
            <img
              src={img.image_url}
              alt={img.alt_text || altFallback || `Bilde ${index + 1}`}
              className="w-full h-full object-cover"
            />

            {/* Main badge */}
            {index === 0 && (
              <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Star className="w-3 h-3" />
                {mainLabel}
              </span>
            )}

            {/* Overlay actions */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center gap-1 pb-1.5">
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => moveLeft(index)}
                  disabled={isReordering}
                  className="bg-white/20 hover:bg-white/40 text-white p-1.5 rounded-full"
                  aria-label="Flytt til venstre"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              {index !== 0 && (
                <button
                  type="button"
                  onClick={() => setMain(index)}
                  disabled={isReordering}
                  className="bg-white/20 hover:bg-white/40 text-white p-1.5 rounded-full"
                  aria-label="Sett som hovedbilde"
                  title="Sett som hovedbilde"
                >
                  <Star className="w-4 h-4" />
                </button>
              )}
              {index < sorted.length - 1 && (
                <button
                  type="button"
                  onClick={() => moveRight(index)}
                  disabled={isReordering}
                  className="bg-white/20 hover:bg-white/40 text-white p-1.5 rounded-full"
                  aria-label="Flytt til høyre"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Delete button */}
            <button
              type="button"
              onClick={() => onDelete(img.id)}
              className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Slett bilde"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {sorted.length < maxImages && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          <Upload className="w-4 h-4" />
          {isUploading ? "Laster opp..." : "Legg til flere bilder"}
        </button>
      )}
    </div>
  );
}
