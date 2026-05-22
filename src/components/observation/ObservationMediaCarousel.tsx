import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Car } from "lucide-react";
import { getResponsiveImageProps, IMAGE_SIZES } from "@/lib/imageUtils";
import { oswald } from "@/lib/observationPostTokens";

export type MediaItem = {
  id: string;
  image_url: string;
  alt_text?: string | null;
};

type Props = {
  items: MediaItem[];
  imageAlt: string;
  onImageClick?: (index: number) => void;
  /** Aspect ratio of each slide. Defaults to 4/5 (mobile post). Use "auto" to fill parent height. */
  aspect?: "4/5" | "auto";
};

export function ObservationMediaCarousel({
  items,
  imageAlt,
  onImageClick,
  aspect = "4/5",
}: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    containScroll: "trimSnaps",
    dragFree: false,
  });
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  const total = items.length;
  const slideClass =
    aspect === "auto"
      ? "relative shrink-0 grow-0 basis-full h-full bg-black"
      : "relative shrink-0 grow-0 basis-full aspect-[4/5] bg-black";

  if (total === 0) {
    return (
      <div className="w-full aspect-[4/5] rounded-2xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center">
        <Car className="w-14 h-14 text-white/30" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-black h-full">
      <div ref={emblaRef} className="overflow-hidden touch-pan-y h-full">
        <div className="flex h-full">
          {items.map((img, i) => (
            <div
              key={img.id}
              className={slideClass}
              onClick={() => onImageClick?.(i)}
              role="button"
              aria-label={`Bilde ${i + 1} av ${total}`}
            >
              <img
                {...getResponsiveImageProps(
                  img.image_url,
                  img.alt_text || `${imageAlt} – bilde ${i + 1}`,
                  {
                    sizes: IMAGE_SIZES.hero,
                    priority: i === 0,
                    loading: i === 0 ? undefined : "lazy",
                  },
                )}
                draggable={false}
                className="w-full h-full object-contain pointer-events-none select-none"
              />
            </div>
          ))}
        </div>
      </div>

      {total > 1 && (
        <div
          className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/65 backdrop-blur-sm px-3 py-1 text-[11px] tracking-[0.14em] text-white/90"
          style={oswald}
        >
          {selected + 1} / {total}
        </div>
      )}
    </div>
  );
}
