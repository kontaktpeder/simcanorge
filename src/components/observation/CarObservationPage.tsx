import { Link } from "react-router-dom";
import { ObservationPostCore } from "./ObservationPostCore";
import { ObservationMediaCarousel, type MediaItem } from "./ObservationMediaCarousel";
import { CarTimeline } from "@/components/car/timeline/CarTimeline";
import { OwnerCard } from "@/components/car/OwnerCard";
import { AnimatedSection } from "@/components/layout/AnimatedSection";
import { oswald, oswaldLight, OBSERVATION_BG } from "@/lib/observationPostTokens";
import type { CarEnrichment } from "@/lib/carEnrichment";
import { BrandHubLink } from "@/components/car/BrandHubLink";

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
  theme?: "dark" | "light";
};


const PAPER_BG = "#f1ede4";

const SectionDivider = ({ isLight }: { isLight: boolean }) => (
  <div className={isLight ? "border-t border-neutral-900/10" : "border-t border-white/[0.06]"} />
);

const SectionLabel = ({ children, isLight }: { children: React.ReactNode; isLight: boolean }) => (
  <div
    className={`text-[11px] uppercase tracking-[0.22em] mb-4 ${
      isLight ? "text-neutral-500" : "text-white/35"
    }`}
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
    theme = "dark",
  } = props;
  const isLight = theme === "light";


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
  const cleanTags = (tags ?? []).filter((t) => typeof t === "string" && t.trim().length > 0);
  const showStoryBlock = (enrichment.showStory && !!story) || cleanTags.length > 0;

  const RightSections = (
    <>
      {brand && (
        <section className="pt-2 pb-4">
          <div className="container mx-auto px-4 max-w-3xl lg:px-0 lg:mx-0 lg:max-w-none">
            <BrandHubLink brand={brand} variant="chip" />
          </div>
        </section>
      )}
      {enrichment.showTimeline && (
        <>
          <SectionDivider isLight={isLight} />
          <section className="py-8">
            <div className="container mx-auto px-4 max-w-3xl lg:px-0 lg:mx-0 lg:max-w-none">
              <AnimatedSection>
                <SectionLabel isLight={isLight}>Historikk</SectionLabel>
                <CarTimeline carId={carId} heroCaptionEventId={heroCaptionEventId} carCreatedAt={carCreatedAt} />
              </AnimatedSection>
            </div>
          </section>
        </>
      )}


      {showStoryBlock && (
        <>
          <SectionDivider isLight={isLight} />
          <section className="py-8">
            <div className="container mx-auto px-4 max-w-3xl lg:px-0 lg:mx-0 lg:max-w-none">
              <SectionLabel isLight={isLight}>Om bilen</SectionLabel>
              {enrichment.showStory && story && (
                <p
                  className={`text-[17px] md:text-[18px] leading-[1.65] whitespace-pre-wrap ${
                    isLight ? "text-neutral-800" : "text-white/85"
                  }`}
                  style={oswaldLight}
                >
                  {story}
                </p>
              )}

              {cleanTags.length > 0 && (
                <div className={`flex flex-wrap items-center gap-2 ${enrichment.showStory && story ? "mt-6" : ""}`}>
                  {cleanTags.map((t) => (
                    <span
                      key={t}
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${
                        isLight
                          ? "border border-neutral-900/15 bg-neutral-900/[0.03] text-neutral-700"
                          : "border border-white/10 bg-white/[0.02] text-white/65"
                      }`}
                      style={oswald}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

        </>
      )}


      {enrichment.showOwnerCard && (
        <>
          <SectionDivider isLight={isLight} />
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
            className={`text-[11px] uppercase tracking-[0.22em] transition-colors ${
              isLight
                ? "text-neutral-500 hover:text-neutral-900"
                : "text-white/35 hover:text-white/85"
            }`}
            style={oswald}
          >
            Hjelp fellesskapet å identifisere bilen
          </Link>
        </div>
      )}
    </>
  );

  return (
    <div
      style={{ backgroundColor: isLight ? PAPER_BG : OBSERVATION_BG }}
      className={isLight ? "text-neutral-900" : "text-white"}
    >
      {/* Mobile / tablet: original stacked layout */}
      <div className="lg:hidden">
        <ObservationPostCore
          carId={carId}
          imageUrl={imageUrl}
          imageAlt={imageAlt}
          caption={caption}
          title={title}
          category={category}

          media={media}
          onImageClick={handleMediaClick}
          onKnowCar={onKnowCar}
          onShare={onShare}
          onOpenComments={onOpenComments}
          showKnowCarCta={showKnowCarCta}
          landingAck={landingAck}
          theme={theme}
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
                category={category}

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
