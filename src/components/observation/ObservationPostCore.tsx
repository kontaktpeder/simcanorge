import { Search } from "lucide-react";
import { SpottingReactionsRow } from "@/components/car/detail/SpottingReactionsRow";
import { oswald, oswaldLight, OBSERVATION_ACCENT } from "@/lib/observationPostTokens";
import { ObservationMediaCarousel, type MediaItem } from "./ObservationMediaCarousel";

type Props = {
  carId: string;
  imageUrl: string | null;
  imageAlt: string;
  caption: string | null;
  title: string | null;
  category?: string | null;
  /** All images in display order. If omitted, falls back to imageUrl. */
  media?: MediaItem[];
  onImageClick?: (index: number) => void;
  onKnowCar?: () => void;
  onShare: () => void;
  onOpenComments: () => void;
  showKnowCarCta: boolean;
  landingAck?: string | null;
  /** When true, the media carousel is rendered outside this component (desktop split layout). */
  hideMedia?: boolean;
  /** Container className override (mobile uses default centered max-w-3xl). */
  className?: string;
};


export function ObservationPostCore({
  carId,
  imageUrl,
  imageAlt,
  caption,
  title,
  category,
  media,
  onImageClick,
  onKnowCar,
  onShare,
  onOpenComments,
  showKnowCarCta,
  landingAck,
  hideMedia = false,
  className,
}: Props) {
  const cleanCategory = category && category.trim().length > 0 ? category.trim() : null;

  const items: MediaItem[] =
    media && media.length > 0
      ? media
      : imageUrl
        ? [{ id: "main", image_url: imageUrl, alt_text: imageAlt }]
        : [];

  const wrapperClass =
    className ??
    "container mx-auto px-4 pt-6 pb-8 md:pt-10 md:pb-12 max-w-3xl";

  return (
    <div className={wrapperClass}>
      {landingAck && (
        <div
          className="mb-5 text-center text-[11px] uppercase tracking-[0.2em] animate-fade-in"
          style={{ ...oswald, color: OBSERVATION_ACCENT }}
        >
          {landingAck}
        </div>
      )}

      {!hideMedia && (
        <div className="relative">
          <ObservationMediaCarousel
            items={items}
            imageAlt={imageAlt}
            onImageClick={onImageClick}
          />
        </div>
      )}

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
