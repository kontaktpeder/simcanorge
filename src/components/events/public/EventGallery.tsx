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
      <h2 className="text-xl font-bold text-white mb-3">Bilder</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 rounded-2xl overflow-hidden">
        {images.map((img, idx) => (
          <button
            key={img.id}
            onClick={() => setLightboxIndex(idx)}
            className="relative aspect-square overflow-hidden group cursor-pointer bg-white/5"
          >
            <img
              src={getOptimizedImageUrl(img.image_url, { width: 500 })}
              alt={img.alt_text ?? ""}
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-110"
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
