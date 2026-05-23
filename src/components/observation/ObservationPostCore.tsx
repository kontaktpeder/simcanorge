import { Search } from "lucide-react";
import { SpottingReactionsRow } from "@/components/car/detail/SpottingReactionsRow";
import { oswald, oswaldLight, OBSERVATION_ACCENT } from "@/lib/observationPostTokens";
import { ObservationMediaCarousel, type MediaItem } from "./ObservationMediaCarousel";

const VV_YELLOW = "#fcc419";
const VV_ORANGE = "#ff8a00";
const VV_DARK = "#2b2b2b";
const inter = { fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" } as const;

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
  theme?: "dark" | "light";
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
  theme = "dark",
}: Props) {
  const cleanCategory = category && category.trim().length > 0 ? category.trim() : null;
  const isLight = theme === "light";

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
          className="mb-5 text-center text-[11px] uppercase tracking-[0.2em] font-semibold animate-fade-in"
          style={isLight ? { ...inter, color: VV_ORANGE } : { ...oswald, color: OBSERVATION_ACCENT }}
        >
          {landingAck}
        </div>
      )}

      {!hideMedia && (
        <div className={`relative ${isLight ? "rounded-2xl overflow-hidden border border-black/[0.08] bg-white" : ""}`}>
          <ObservationMediaCarousel
            items={items}
            imageAlt={imageAlt}
            onImageClick={onImageClick}
          />
          {cleanCategory && (
            <span
              className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] font-bold"
              style={
                isLight
                  ? { ...inter, color: VV_DARK, backgroundColor: VV_YELLOW, boxShadow: "0 2px 6px rgba(0,0,0,0.12)" }
                  : { ...oswald, color: "#ffffff", background: "rgba(74,85,96,0.92)", boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }
              }
            >
              {!isLight && (
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ background: OBSERVATION_ACCENT }}
                />
              )}
              {cleanCategory}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <SpottingReactionsRow
          carId={carId}
          onOpenComments={onOpenComments}
          onShare={onShare}
          theme={theme}
        />

        {showKnowCarCta && onKnowCar && (
          <button
            type="button"
            onClick={onKnowCar}
            className={`inline-flex items-center gap-1.5 transition-colors text-[13px] leading-none font-semibold ${
              isLight
                ? "text-neutral-700 hover:text-neutral-950"
                : "text-white/80 hover:text-white"
            }`}
            style={isLight ? inter : oswald}
          >
            <Search className="w-5 h-5" strokeWidth={1.75} />
            <span>Kjenner du til bilen?</span>
          </button>
        )}
      </div>

      {title && (
        <div className="mt-3">
          <h1
            className={`leading-tight ${
              isLight
                ? "text-[24px] md:text-[28px] font-bold text-neutral-950 tracking-tight"
                : "text-[22px] md:text-[26px] text-white"
            }`}
            style={isLight ? inter : oswald}
          >
            {title}
          </h1>
        </div>
      )}

      {caption && (
        <p
          className={`mt-3 leading-relaxed ${
            isLight ? "text-[16px] md:text-[17px] text-neutral-700" : "text-lg md:text-xl text-white/85"
          }`}
          style={isLight ? inter : oswaldLight}
        >
          {caption}
        </p>
      )}
    </div>
  );
}
