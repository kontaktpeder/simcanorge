import { Car } from "lucide-react";
import { getResponsiveImageProps, IMAGE_SIZES } from "@/lib/imageUtils";
import { SpottingReactionsRow } from "@/components/car/detail/SpottingReactionsRow";
import { oswald, oswaldLight, OBSERVATION_ACCENT } from "@/lib/observationPostTokens";

type Props = {
  carId: string;
  imageUrl: string | null;
  imageAlt: string;
  caption: string | null;
  onImageClick?: () => void;
  onKnowCar?: () => void;
  onShare: () => void;
  onOpenComments: () => void;
  showKnowCarCta: boolean;
  landingAck?: string | null;
};

/**
 * Unified observation post core — used identically on /biler/:slug and
 * (via density="feed") in the explore feed.
 *
 * Never renders: title, brand/model, badges, "Ukjent bil", category overlay.
 * Always renders: image (4/3) → reactions → caption → "Kjenner du til bilen?".
 */
export function ObservationPostCore({
  carId,
  imageUrl,
  imageAlt,
  caption,
  onImageClick,
  onKnowCar,
  onShare,
  onOpenComments,
  showKnowCarCta,
  landingAck,
}: Props) {
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
        {imageUrl ? (
          <button
            type="button"
            onClick={onImageClick}
            className="block w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-black focus:outline-none focus:ring-2 focus:ring-[#34eab8]/40"
          >
            <img
              {...getResponsiveImageProps(imageUrl, imageAlt, {
                sizes: IMAGE_SIZES.hero,
                priority: true,
              })}
              className="w-full aspect-[4/3] object-cover transition-transform duration-500 hover:scale-[1.01]"
            />
          </button>
        ) : (
          <div className="w-full aspect-[4/3] rounded-2xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center">
            <Car className="w-14 h-14 text-white/30" />
          </div>
        )}
      </div>

      <SpottingReactionsRow
        carId={carId}
        onOpenComments={onOpenComments}
        onShare={onShare}
        className="mt-6"
      />

      {caption && (
        <p
          className="mt-3 text-lg md:text-xl leading-relaxed text-white/85"
          style={oswaldLight}
        >
          {caption}
        </p>
      )}

      {showKnowCarCta && onKnowCar && (
        <button
          type="button"
          onClick={onKnowCar}
          className="mt-5 inline-flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-[#34eab8] hover:text-white transition-colors border-b border-[#34eab8]/40 hover:border-white pb-0.5"
          style={oswald}
        >
          Kjenner du til bilen?
        </button>
      )}
    </div>
  );
}
