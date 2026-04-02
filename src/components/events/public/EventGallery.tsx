import { useState } from "react";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { getOptimizedImageUrl } from "@/lib/imageUtils";

interface GalleryImage {
  id: string;
  image_url: string;
  alt_text?: string | null;
}

interface EventGalleryProps {
  images: GalleryImage[];
}

export function EventGallery({ images }: EventGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  const lightboxImages = images.map((img) => ({
    url: img.image_url,
    alt: img.alt_text ?? undefined,
  }));

  return (
    <section>
      <h2 className="text-2xl font-bold text-foreground mb-4">Bilder</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {images.map((img, idx) => (
          <button
            key={img.id}
            onClick={() => setLightboxIndex(idx)}
            className="relative aspect-[4/3] overflow-hidden rounded-xl group cursor-pointer ring-1 ring-border hover:ring-amber-400 transition-all"
          >
            <img
              src={getOptimizedImageUrl(img.image_url, { width: 600 })}
              alt={img.alt_text ?? ""}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex ?? 0}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
      />
    </section>
  );
}
