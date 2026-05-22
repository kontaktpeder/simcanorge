import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Car, Search } from "lucide-react";
import { getResponsiveImageProps, IMAGE_SIZES } from "@/lib/imageUtils";
import { SpottingReactionsRow } from "@/components/car/detail/SpottingReactionsRow";
import { oswald, oswaldLight, OBSERVATION_ACCENT } from "@/lib/observationPostTokens";

type MediaItem = {
  id: string;
  image_url: string;
  alt_text?: string | null;
};

type Props = {
  carId: string;
  imageUrl: string | null;
  imageAlt: string;
  caption: string | null;
  title: string | null;
  /** All images in display order. If omitted, falls back to imageUrl. */
  media?: MediaItem[];
  onImageClick?: (index: number) => void;
  onKnowCar?: () => void;
  onShare: () => void;
  onOpenComments: () => void;
  showKnowCarCta: boolean;
  landingAck?: string | null;
};

/**
 * Unified observation post core. Finn.no-native feel:
 *  - Fixed-aspect viewport (4/5) on black, so both portrait & landscape fit
 *    with object-contain — no cropping, no click-to-open required.
 *  - Horizontal swipe through all images directly in the hero.
 */
export function ObservationPostCore({
  carId,
  imageUrl,
  imageAlt,
  caption,
  title,
  media,
  onImageClick,
  onKnowCar,
  onShare,
  onOpenComments,
  showKnowCarCta,
  landingAck,
}: Props) {
  const items: MediaItem[] =
    media && media.length > 0
      ? media
      : imageUrl
        ? [{ id: "main", image_url: imageUrl, alt_text: imageAlt }]
        : [];

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

  return (
    <div className="container mx-auto px-4 pt-6 pb-8 md:pt-10 md:pb-12 max-w-3xl">
      {landingAck && (
        <div
          className="mb-5 text-center text-[11px] uppercase tracking-[0.2em] animate-fade-in"
          style={{ ...oswald, color: OBSERVATION_ACCENT }}
        >
          {landingAck}
        </div>
      )}

      <div className="relative">
        {total > 0 ? (
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-black">
            <div ref={emblaRef} className="overflow-hidden touch-pan-y">
              <div className="flex">
                {items.map((img, i) => (
                  <div
                    key={img.id}
                    className="relative shrink-0 grow-0 basis-full aspect-[4/5] bg-black"
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
        ) : (
          <div className="w-full aspect-[4/5] rounded-2xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center">
            <Car className="w-14 h-14 text-white/30" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3">
        <SpottingReactionsRow
          carId={carId}
          onOpenComments={onOpenComments}
          onShare={onShare}
        />

        {showKnowCarCta && onKnowCar && (
          <button
            type="button"
            onClick={onKnowCar}
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white transition-colors text-[13px] leading-none"
            style={oswald}
          >
            <Search className="w-6 h-6" strokeWidth={1.75} />
            <span>Kjenner du til bilen?</span>
          </button>
        )}
      </div>

      {title && (
        <h1
          className="mt-3 text-[22px] md:text-[26px] leading-tight text-white"
          style={oswald}
        >
          {title}
        </h1>
      )}

      {caption && (
        <p
          className="mt-3 text-lg md:text-xl leading-relaxed text-white/85"
          style={oswaldLight}
        >
          {caption}
        </p>
      )}
    </div>
  );
}
