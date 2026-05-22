import { Link } from "react-router-dom";
import { ObservationPostCore } from "./ObservationPostCore";
import { ObservationMediaCarousel, type MediaItem } from "./ObservationMediaCarousel";
import { CarTimeline } from "@/components/car/timeline/CarTimeline";
import { OwnerCard } from "@/components/car/OwnerCard";
import { AnimatedSection } from "@/components/layout/AnimatedSection";
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
  category?: string | null;
  tags?: string[] | null;
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
    category,
    tags,
    galleryImages,
    enrichment,
    heroCaptionEventId,
    carCreatedAt,
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

  const media: MediaItem[] = (() => {
    const main = imageUrl
      ? [{ id: "main", image_url: imageUrl, alt_text: imageAlt }]
      : [];
    const rest = galleryImages.map((g) => ({
      id: g.id,
      image_url: g.image_url,
      alt_text: g.alt_text,
    }));
    return [...main, ...rest];
  })();

  const handleMediaClick = (i: number) => {
    if (i === 0) onImageClick?.();
    else onGalleryImageClick?.(i);
  };

  // Shared right-column sections (timeline, story, owner, identify) – used in both layouts
  const RightSections = (
    <>
      {enrichment.showTimeline && (
        <>
          <SectionDivider />
          <section className="py-8">
            <div className="container mx-auto px-4 max-w-3xl lg:px-0 lg:mx-0 lg:max-w-none">
              <AnimatedSection>
                <SectionLabel>Historikk</SectionLabel>
                <CarTimeline carId={carId} heroCaptionEventId={heroCaptionEventId} carCreatedAt={carCreatedAt} />
              </AnimatedSection>
            </div>
          </section>
        </>
      )}

      {enrichment.showStory && story && (
        <>
          <SectionDivider />
          <section className="py-8">
            <div className="container mx-auto px-4 max-w-3xl lg:px-0 lg:mx-0 lg:max-w-none">
              <SectionLabel>Om bilen</SectionLabel>
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

      {enrichment.showOwnerCard && (
        <>
          <SectionDivider />
          <section className="py-8">
            <div className="container mx-auto px-4 max-w-2xl lg:px-0 lg:mx-0 lg:max-w-none">
              <OwnerCard carId={carId} heading="Eies av" />
            </div>
          </section>
        </>
      )}

      {enrichment.showIdentifyLink && (
        <div className="container mx-auto px-4 pb-12 pt-4 text-center lg:px-0 lg:mx-0 lg:text-left">
          <Link
            to="/ukjente-biler"
            className="text-[11px] uppercase tracking-[0.22em] text-white/35 hover:text-white/85 transition-colors"
            style={oswald}
          >
            Hjelp fellesskapet å identifisere bilen
          </Link>
        </div>
      )}
    </>
  );

  return (
    <div style={{ backgroundColor: OBSERVATION_BG }} className="text-white">
      {/* Mobile / tablet: original stacked layout */}
      <div className="lg:hidden">
        <ObservationPostCore
          carId={carId}
          imageUrl={imageUrl}
          imageAlt={imageAlt}
          caption={caption}
          title={title}
          media={media}
          onImageClick={handleMediaClick}
          onKnowCar={onKnowCar}
          onShare={onShare}
          onOpenComments={onOpenComments}
          showKnowCarCta={showKnowCarCta}
          landingAck={landingAck}
        />
        {RightSections}
      </div>

      {/* Desktop: Finn-style split — sticky images left, scrollable details right */}
      <div className="hidden lg:block">
        <div className="mx-auto max-w-7xl px-6 pt-8 pb-12">
          <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-10 xl:gap-14">
            {/* Left: sticky image carousel */}
            <div>
              <div className="sticky top-24">
                <div className="h-[calc(100vh-8rem)] max-h-[820px] min-h-[520px]">
                  <ObservationMediaCarousel
                    items={media}
                    imageAlt={imageAlt}
                    onImageClick={handleMediaClick}
                    aspect="auto"
                  />
                </div>
              </div>
            </div>

            {/* Right: scrollable content */}
            <div className="min-w-0">
              <ObservationPostCore
                carId={carId}
                imageUrl={imageUrl}
                imageAlt={imageAlt}
                caption={caption}
                title={title}
                media={media}
                onKnowCar={onKnowCar}
                onShare={onShare}
                onOpenComments={onOpenComments}
                showKnowCarCta={showKnowCarCta}
                landingAck={landingAck}
                hideMedia
                className="pb-2"
              />
              {RightSections}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
