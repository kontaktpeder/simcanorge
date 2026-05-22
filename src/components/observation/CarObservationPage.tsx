import { Link } from "react-router-dom";
import { ObservationPostCore } from "./ObservationPostCore";
import { CarTimeline } from "@/components/car/timeline/CarTimeline";
import { OwnerCard } from "@/components/car/OwnerCard";
import { AnimatedSection } from "@/components/layout/AnimatedSection";
import { getResponsiveImageProps, IMAGE_SIZES } from "@/lib/imageUtils";
import { oswald, oswaldLight, OBSERVATION_BG } from "@/lib/observationPostTokens";
import type { CarEnrichment } from "@/lib/carEnrichment";

type GalleryImage = {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
};

type Props = {
  carId: string;
  imageUrl: string | null;
  imageAlt: string;
  caption: string | null;
  story: string | null;
  brand: string | null;
  model: string | null;
  variant: string | null;
  body_type: string | null;
  year: number | null;
  galleryImages: GalleryImage[];
  enrichment: CarEnrichment;
  heroCaptionEventId?: string | null;
  carCreatedAt?: string | null;

  onImageClick?: () => void;
  onGalleryImageClick?: (index: number) => void;
  onKnowCar?: () => void;
  onShare: () => void;
  onOpenComments: () => void;
  showKnowCarCta: boolean;
  landingAck?: string | null;
};

const SectionDivider = () => (
  <div className="border-t border-white/[0.06]" />
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div
    className="text-[11px] uppercase tracking-[0.22em] text-white/35 mb-4"
    style={oswald}
  >
    {children}
  </div>
);

export function CarObservationPage(props: Props) {
  const {
    carId,
    imageUrl,
    imageAlt,
    caption,
    story,
    brand,
    model,
    variant,
    body_type,
    year,
    galleryImages,
    enrichment,
    heroCaptionEventId,
    onImageClick,
    onGalleryImageClick,
    onKnowCar,
    onShare,
    onOpenComments,
    showKnowCarCta,
    landingAck,
  } = props;

  const titleParts = [
    brand,
    model,
    year != null ? String(year) : null,
    variant,
    body_type,
  ].filter(Boolean);
  const title = titleParts.join(" ") || null;

  return (
    <div style={{ backgroundColor: OBSERVATION_BG }} className="text-white">
      {/* 1) Observation post core (emotion) — all images swipeable inline */}
      <ObservationPostCore
        carId={carId}
        imageUrl={imageUrl}
        imageAlt={imageAlt}
        caption={caption}
        title={title}
        media={(() => {
          const main = imageUrl
            ? [{ id: "main", image_url: imageUrl, alt_text: imageAlt }]
            : [];
          const rest = galleryImages.map((g) => ({
            id: g.id,
            image_url: g.image_url,
            alt_text: g.alt_text,
          }));
          return [...main, ...rest];
        })()}
        onImageClick={(i) => {
          if (i === 0) onImageClick?.();
          else onGalleryImageClick?.(i);
        }}
        onKnowCar={onKnowCar}
        onShare={onShare}
        onOpenComments={onOpenComments}
        showKnowCarCta={showKnowCarCta}
        landingAck={landingAck}
      />

      <SectionDivider />

      {/* 2) Historikk (archival) */}
      {enrichment.showTimeline && (
        <section className="py-8">
          <div className="container mx-auto px-4 max-w-3xl">
            <AnimatedSection>
              <SectionLabel>Historikk</SectionLabel>
              <CarTimeline carId={carId} heroCaptionEventId={heroCaptionEventId} />
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* 3) Story (only if meaningful) */}
      {enrichment.showStory && story && (
        <>
          <SectionDivider />
          <section className="py-8">
            <div className="container mx-auto px-4 max-w-3xl">
              <SectionLabel>Historien</SectionLabel>
              <p
                className="text-[17px] md:text-[18px] leading-[1.65] text-white/85 whitespace-pre-wrap"
                style={oswaldLight}
              >
                {story}
              </p>

              {enrichment.showQuickFacts && (
                <dl
                  className="mt-6 grid grid-cols-3 gap-x-6 gap-y-2 text-[12px]"
                  style={oswald}
                >
                  {brand && (
                    <div>
                      <dt className="uppercase tracking-[0.18em] text-white/35">Merke</dt>
                      <dd className="text-white/85 mt-0.5">{brand}</dd>
                    </div>
                  )}
                  {model && (
                    <div>
                      <dt className="uppercase tracking-[0.18em] text-white/35">Modell</dt>
                      <dd className="text-white/85 mt-0.5">{model}</dd>
                    </div>
                  )}
                  {year != null && (
                    <div>
                      <dt className="uppercase tracking-[0.18em] text-white/35">År</dt>
                      <dd className="text-white/85 mt-0.5">{year}</dd>
                    </div>
                  )}
                </dl>
              )}
            </div>
          </section>
        </>
      )}

      {/* 4) Gallery er nå inline i hero (swipe) — egen seksjon fjernet */}


      {/* 5) Owner (only if has owner) */}
      {enrichment.showOwnerCard && (
        <>
          <SectionDivider />
          <section className="py-8">
            <div className="container mx-auto px-4 max-w-2xl">
              <OwnerCard carId={carId} heading="Eies av" />
            </div>
          </section>
        </>
      )}

      {/* 6) Identify link (diskret) */}
      {enrichment.showIdentifyLink && (
        <div className="container mx-auto px-4 pb-12 pt-4 text-center">
          <Link
            to="/ukjente-biler"
            className="text-[11px] uppercase tracking-[0.22em] text-white/35 hover:text-white/85 transition-colors"
            style={oswald}
          >
            Hjelp fellesskapet å identifisere bilen
          </Link>
        </div>
      )}
    </div>
  );
}
