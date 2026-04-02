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
      <h2 className="text-xl font-semibold text-white mb-4 tracking-tight">
        Bilder
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 rounded-xl overflow-hidden">
        {images.map((img, idx) => (
          <button
            key={img.id}
            onClick={() => setLightboxIndex(idx)}
            className="relative aspect-[4/3] overflow-hidden group cursor-pointer"
          >
            <img
              src={getOptimizedImageUrl(img.image_url, { width: 600 })}
              alt={img.alt_text ?? ""}
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
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
