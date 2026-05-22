import { getResponsiveImageProps, IMAGE_SIZES } from "@/lib/imageUtils";
import { Car, Share2 } from "lucide-react";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

type Props = {
  imageUrl: string | null;
  imageAlt: string;
  displayTitle: string;
  caption: string | null;
  onImageClick?: () => void;
  onKnowCar?: () => void;
  onShare?: () => void;
  showKnowCarCta: boolean;
  /** Valgfri: «Takk — observasjonen din er med» etter ?observed=1 */
  landingAck?: string | null;
};

function isUnknownTitle(t: string) {
  if (!t) return true;
  return /^ukjent(\s+bil)?$/i.test(t.trim());
}

export function SpottingCarHero({
  imageUrl,
  imageAlt,
  displayTitle,
  caption,
  onImageClick,
  onKnowCar,
  onShare,
  showKnowCarCta,
  landingAck,
}: Props) {
  const hideTitle = isUnknownTitle(displayTitle);

  return (
    <section className="bg-[#0d141b] text-white">
      <div className="container mx-auto px-4 pt-6 pb-8 md:pt-10 md:pb-12 max-w-3xl">
        {landingAck && (
          <div
            className="mb-5 text-center text-[11px] uppercase tracking-[0.2em] text-[#34eab8] animate-fade-in"
            style={oswald}
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

        {/* Subtle share link under image */}
        {onShare && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={onShare}
              className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-white/45 hover:text-white/85 transition-colors"
              style={oswald}
              aria-label="Del"
            >
              <Share2 className="w-3.5 h-3.5" />
              Del
            </button>
          </div>
        )}

        {!hideTitle && (
          <h1
            className="mt-5 text-2xl md:text-3xl font-bold tracking-wide text-white"
            style={chakra}
          >
            {displayTitle}
          </h1>
        )}

        {caption && (
          <p
            className={`${hideTitle ? "mt-6" : "mt-3"} text-lg md:text-xl leading-relaxed text-white/85 italic`}
            style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 300 }}
          >
            «{caption}»
          </p>
        )}

        {showKnowCarCta && onKnowCar && (
          <button
            type="button"
            onClick={onKnowCar}
            className="mt-6 inline-flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-[#34eab8] hover:text-white transition-colors border-b border-[#34eab8]/40 hover:border-white pb-0.5"
            style={oswald}
          >
            Kjenner du til bilen?
          </button>
        )}
      </div>
    </section>
  );
}
