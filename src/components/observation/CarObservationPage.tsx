import { Link } from "react-router-dom";
import { ObservationPostCore } from "./ObservationPostCore";
import { ObservationMediaCarousel, type MediaItem } from "./ObservationMediaCarousel";
import { CarTimeline } from "@/components/car/timeline/CarTimeline";
import { OwnerCard } from "@/components/car/OwnerCard";
import { AnimatedSection } from "@/components/layout/AnimatedSection";
import { oswald, oswaldLight, OBSERVATION_BG } from "@/lib/observationPostTokens";
import type { CarEnrichment } from "@/lib/carEnrichment";
import { BrandHubLink } from "@/components/car/BrandHubLink";
import { formatCarHeading } from "@/lib/carTitle";

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


// Vegvesen-inspirert lys palett (matcher /min-garasje og PublishComposer)
const VV_YELLOW = "#fcc419";
const VV_YELLOW_SOFT = "#fff4d1";
const VV_DARK = "#2b2b2b";
const PAPER_BG = "#f6f3ee";

const SectionDivider = ({ isLight }: { isLight: boolean }) =>
  isLight ? null : <div className="border-t border-white/[0.06]" />;

const SectionLabel = ({ children, isLight }: { children: React.ReactNode; isLight: boolean }) => (
  <div
    className={`text-xs uppercase tracking-[0.14em] font-semibold mb-4 font-sans ${
      isLight ? "text-[#071628]/70" : "text-white/35"
    }`}
    style={isLight ? undefined : oswald}
  >
    {children}
  </div>
);

// Lett kortwrapper for lys variant – speiler "white card"-mønsteret fra /min-garasje
const LightCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`rounded-xl bg-white border border-black/10 p-5 sm:p-6 font-sans ${className}`}
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


  const title = formatCarHeading({
    brand,
    model,
    year,
    variant,
    bodyType: body_type,
  }) || null;

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
    <div className={isLight ? "container mx-auto px-4 max-w-3xl lg:px-0 lg:mx-0 lg:max-w-none space-y-3 pb-10 pt-2" : ""}>
      {brand && (
        <section className={isLight ? "" : "pt-2 pb-4"}>
          {isLight ? (
            <div className="px-1">
              <BrandHubLink brand={brand} variant="chip" />
            </div>
          ) : (
            <div className="container mx-auto px-4 max-w-3xl lg:px-0 lg:mx-0 lg:max-w-none">
              <BrandHubLink brand={brand} variant="chip" />
            </div>
          )}
        </section>
      )}

      {enrichment.showTimeline && (
        <>
          <SectionDivider isLight={isLight} />
          {isLight ? (
            <LightCard>
              <AnimatedSection>
                <SectionLabel isLight={isLight}>Historikk</SectionLabel>
                <CarTimeline carId={carId} heroCaptionEventId={heroCaptionEventId} carCreatedAt={carCreatedAt} tone="light" />
              </AnimatedSection>
            </LightCard>
          ) : (
            <section className="py-8">
              <div className="container mx-auto px-4 max-w-3xl lg:px-0 lg:mx-0 lg:max-w-none">
                <AnimatedSection>
                  <SectionLabel isLight={isLight}>Historikk</SectionLabel>
                  <CarTimeline carId={carId} heroCaptionEventId={heroCaptionEventId} carCreatedAt={carCreatedAt} />
                </AnimatedSection>
              </div>
            </section>
          )}
        </>
      )}

      {showStoryBlock && (
        <>
          <SectionDivider isLight={isLight} />
          {(() => {
            const inner = (
              <>
                <SectionLabel isLight={isLight}>Om bilen</SectionLabel>
                {enrichment.showStory && story && (
                  <p
                    className={`text-base md:text-[17px] leading-relaxed whitespace-pre-wrap font-sans ${
                      isLight ? "text-[#1c1917]" : "text-white/85"
                    }`}
                    style={isLight ? undefined : oswaldLight}
                  >
                    {story}
                  </p>
                )}

                {cleanTags.length > 0 && (
                  <div className={`flex flex-wrap items-center gap-2 ${enrichment.showStory && story ? "mt-6" : ""}`}>
                    {cleanTags.map((t) => (
                      <span
                        key={t}
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold font-sans ${
                          isLight
                            ? "border text-[#071628]"
                            : "border border-white/10 bg-white/[0.02] text-white/65"
                        }`}
                        style={
                          isLight
                            ? { backgroundColor: VV_YELLOW_SOFT, borderColor: VV_YELLOW }
                            : oswald
                        }
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </>
            );
            return isLight ? (
              <LightCard>{inner}</LightCard>
            ) : (
              <section className="py-8">
                <div className="container mx-auto px-4 max-w-3xl lg:px-0 lg:mx-0 lg:max-w-none">{inner}</div>
              </section>
            );
          })()}
        </>
      )}

      {enrichment.showOwnerCard && (
        <>
          <SectionDivider isLight={isLight} />
          {isLight ? (
            <LightCard>
              <OwnerCard carId={carId} heading="Forvaltes av" />
            </LightCard>
          ) : (
            <section className="py-8">
              <div className="container mx-auto px-4 max-w-2xl lg:px-0 lg:mx-0 lg:max-w-none">
                <OwnerCard carId={carId} heading="Forvaltes av" />
              </div>
            </section>
          )}
        </>
      )}

      {enrichment.showIdentifyLink && (
        <div
          className={
            isLight
              ? "pt-3 pb-2 text-center lg:text-left px-1"
              : "container mx-auto px-4 pb-12 pt-4 text-center lg:px-0 lg:mx-0 lg:text-left"
          }
        >
          <Link
            to="/ukjente-biler"
            className={`text-sm font-semibold font-sans transition-colors ${
              isLight
                ? "text-[#071628]/75 hover:text-[#071628]"
                : "text-white/35 hover:text-white/85"
            }`}
            style={isLight ? undefined : oswald}
          >
            Hjelp fellesskapet å identifisere bilen
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <div
      style={{ backgroundColor: isLight ? PAPER_BG : OBSERVATION_BG }}
      className={isLight ? "car-paper-theme text-neutral-900" : "text-white"}
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
                <ObservationMediaCarousel
                  items={media}
                  imageAlt={imageAlt}
                  onImageClick={handleMediaClick}
                  aspect="4/3"
                />
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
                theme={theme}
              />
              {RightSections}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
