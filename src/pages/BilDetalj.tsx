import { useState, useEffect, useRef } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlatformContextBanner } from "@/components/layout/PlatformContextBanner";
import { AnimatedSection } from "@/components/layout/AnimatedSection";
import { TimelineSection } from "@/components/car/TimelineSection";
import { OwnerCard } from "@/components/car/OwnerCard";
import { SaveCarButton } from "@/components/car/SaveCarButton";
import { DriveControls } from "@/components/car/DriveControls";
import { useCarOwnerProfile } from "@/hooks/useOwnerProfile";
import { useAuth } from "@/hooks/useAuth";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";
import { PostComposer } from "@/components/feed/PostComposer";
import { PostPublishOnboardingOverlay } from "@/components/car/PostPublishOnboardingOverlay";
import { CommentSection } from "@/components/comments/CommentSection";
import { CarQuestionsSection } from "@/components/questions/CarQuestionsSection";
import { supabase } from "@/integrations/supabase/client";
import { getResponsiveImageProps, IMAGE_SIZES, getThumbnailUrl } from "@/lib/imageUtils";
import { 
  ArrowLeft, Calendar, Wrench, ArrowRight, ChevronLeft, ChevronRight, Car, 
  Facebook, Twitter, Link as LinkIcon, Check, Instagram, X, Youtube, ExternalLink,
  Tag, Gauge, FileText, Share2, ChevronDown, Pencil, Link2
} from "lucide-react";
import { toast } from "sonner";
import { CreateCTA } from "@/components/ui/CreateCTA";
import { BrandLoader } from "@/components/brand/BrandLoader";
import { FEATURES } from "@/config/features";
import { RelationshipRequestDialog } from "@/components/car/relationship/RelationshipRequestDialog";
import { CarKnowledgeDialog } from "@/components/car/knowledge/CarKnowledgeDialog";
import { canEditCarInDashboard, type CarOwnerAccessRow } from "@/lib/carEditAccess";
import { ExploreSectionNav } from "@/components/explore/ExploreSectionNav";
import { resolveCarPageViewMode } from "@/lib/carPageViewMode";
import { buildCarPagePresentation, pickLatestObservationCaption, pickHeroSpottingEventId } from "@/lib/carPagePresentation";
import { SpottingCommentsSheet } from "@/components/car/detail/SpottingCommentsSheet";
import { CarObservationPage } from "@/components/observation/CarObservationPage";
import { resolveCarEnrichment } from "@/lib/carEnrichment";


const SITE_URL = (() => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("bilgarasje.no")) return "https://bilgarasje.no";
    if (host.includes("simcanorge.no")) return "https://simcanorge.no";
  }
  return "https://bilgarasje.no";
})();
interface CarImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
}

interface ExternalLinkData {
  url: string;
  type: 'facebook' | 'instagram' | 'youtube' | 'other';
  title?: string;
}

interface TimelineEvent {
  year?: number;
  date?: string;
  type: 'registrert' | 'ny_eier' | 'restaurering_start' | 'restaurering_ferdig' | 'solgt' | 'flyttet' | 'annet';
  title: string;
  description?: string;
}

interface CarDetail {
  id: string;
  title: string;
  slug: string;
  brand: string | null;
  model: string;
  variant: string | null;
  body_type: string | null;
  year: number | null;
  story: string | null;
  overhauled: boolean;
  tags: string[];
  featured: boolean;
  published_at: string | null;
  created_at?: string;
  updated_at?: string | null;
  category: string | null;
  external_links: ExternalLinkData[] | null;
  timeline_events: TimelineEvent[] | null;
  car_images: CarImage[];
  owner_profile_id: string | null;
  source?: string | null;
  identification_status?: "unknown" | "needs_review" | "identified" | null;
  car_events?: Array<{
    id: string;
    description: string | null;
    occurred_at: string | null;
    category: string;
    event_type: string;
    visibility: string;
    data?: Record<string, unknown> | null;
    car_event_images?: { image_url: string; alt_text: string | null; sort_order: number }[];
  }>;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  registrert: { label: 'Registrert', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  prosjekt: { label: 'Prosjektbil', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  historisk: { label: 'Historisk', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  vrak: { label: 'Vrak', color: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200' },
};

const getLinkIcon = (type: ExternalLinkData['type']) => {
  switch (type) {
    case 'facebook': return Facebook;
    case 'instagram': return Instagram;
    case 'youtube': return Youtube;
    default: return ExternalLink;
  }
};

const getLinkColor = (type: ExternalLinkData['type']) => {
  switch (type) {
    case 'facebook': return 'bg-blue-600 hover:bg-blue-700';
    case 'instagram': return 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 hover:opacity-90';
    case 'youtube': return 'bg-red-600 hover:bg-red-700';
    default: return 'bg-muted hover:bg-muted/80';
  }
};

const BilDetalj = () => {
  const { slug } = useParams<{ slug: string }>();
  const [car, setCar] = useState<CarDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const ctaSectionRef = useRef<HTMLElement>(null);
  const { data: ownerProfile } = useCarOwnerProfile(car?.id ?? undefined);
  const { user } = useAuth();
  const { data: myProfile } = useMyPersonProfile();
  const [showFeedComposer, setShowFeedComposer] = useState(false);
  const [composerInitialBody, setComposerInitialBody] = useState<string | undefined>(undefined);
  const [showPostPublishOverlay, setShowPostPublishOverlay] = useState(false);
  const [relationshipDialogOpen, setRelationshipDialogOpen] = useState(false);
  const [knowledgeDialogOpen, setKnowledgeDialogOpen] = useState(false);
  const [commentsSheetOpen, setCommentsSheetOpen] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();

  // Owner / edit access detection: car_owners join from query
  const carOwners = (car as { car_owners?: CarOwnerAccessRow[] } | null)?.car_owners;
  const canEditCar = canEditCarInDashboard(user?.id, carOwners);
  const userHasAnyCarOwnerRow = !!(
    user && carOwners?.some((r) => r.user_id === user.id)
  );
  const isLinkedToCar =
    !!(myProfile && car?.owner_profile_id === myProfile.id) || userHasAnyCarOwnerRow;
  const firstCarImage = car ? [...car.car_images].sort((a, b) => a.sort_order - b.sort_order)[0]?.image_url ?? null : null;

  const viewMode = car
    ? resolveCarPageViewMode({
        source: car.source,
        category: car.category,
        story: car.story,
        carOwners,
      })
    : "story";
  const observationCaption = pickLatestObservationCaption(car?.car_events);
  const heroCaptionEventId = pickHeroSpottingEventId(car?.car_events);
  const presentation = car
    ? buildCarPagePresentation({
        mode: viewMode,
        car,
        observationCaption,
        isLinkedToCar,
        relationshipRequestsEnabled: FEATURES.relationshipRequestsV1,
      })
    : null;
  const isSpottingView = viewMode === "spotting";
  const landingAck =
    isSpottingView && searchParams.get("observed") === "1"
      ? "Takk — observasjonen din er med."
      : null;

  useEffect(() => {
    if (searchParams.get("observed") !== "1") return;
    const t = window.setTimeout(() => {
      searchParams.delete("observed");
      setSearchParams(searchParams, { replace: true });
    }, 4000);
    return () => window.clearTimeout(t);
  }, [searchParams, setSearchParams]);

  // Show post-publish overlay once per car for users with edit access
  useEffect(() => {
    if (
      car?.published_at &&
      canEditCar &&
      localStorage.getItem(`bilgarasje_post_publish_seen_${car.id}`) !== "1"
    ) {
      setShowPostPublishOverlay(true);
    }
  }, [car?.id, car?.published_at, canEditCar]);

  // First-time toast when user gains edit access to this car
  useEffect(() => {
    if (!car?.id || !user?.id || !canEditCar) return;
    const key = `seen_edit_access_${car.id}`;
    if (localStorage.getItem(key) === "1") return;
    localStorage.setItem(key, "1");
    toast.success("Du har fått tilgang til denne bilen 🚗", {
      duration: 12000,
      description:
        "Du kan nå redigere, legge til bilder og oppdatere historien når du vil. Finn den alltid igjen i Garasjen din.",
    });
  }, [car?.id, user?.id, canEditCar]);

  // Hide scroll indicator when CTA section is visible
  useEffect(() => {
    const handleScroll = () => {
      if (ctaSectionRef.current) {
        const rect = ctaSectionRef.current.getBoundingClientRect();
        // Hide when CTA section enters viewport
        setShowScrollIndicator(rect.top > window.innerHeight);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  useEffect(() => {
    const fetchCar = async () => {
      if (!slug) return;

      const { data, error } = await supabase
        .from("cars")
        .select(`
          id, title, slug, brand, model, variant, body_type, year, story, 
          overhauled, tags, featured, published_at, created_at, updated_at, category,
          external_links, timeline_events, source, identification_status,
          car_images(id, image_url, alt_text, sort_order),
          car_events(id, description, category, event_type, visibility, occurred_at, data, car_event_images(image_url, alt_text, sort_order)),
          car_owners!car_owners_car_id_fkey(user_id, role)
        `)
        .eq("slug", slug)
        .not("published_at", "is", null)
        .maybeSingle();

      if (error) {
        console.error("Error fetching car:", error);
      } else {
        // Parse JSONB fields
        const parsed = data ? {
          ...data,
          external_links: (data.external_links as unknown) as ExternalLinkData[] | null,
          timeline_events: (data.timeline_events as unknown) as TimelineEvent[] | null,
          owner_profile_id: null as string | null,
        } : null;
        // Resolve owner_profile_id from car_owners join
        if (parsed && (data as any).car_owners?.length > 0) {
          // Look up person_profile by user_id
          const ownerUserId = (data as any).car_owners[0].user_id;
          const { data: pp } = await supabase
            .from("public_person_profiles")
            .select("id")
            .eq("user_id", ownerUserId)
            .maybeSingle();
          if (pp) parsed.owner_profile_id = pp.id;
        }
        // Spotting fallback: if no car_images, build a synthetic one from latest public car_event image
        if (parsed) {
          const hasCarImages = Array.isArray(parsed.car_images) && parsed.car_images.length > 0;
          if (!hasCarImages && (parsed as any).source === "spotting") {
            const { resolveSpottingCoverFromRow } = await import("@/lib/spottingMedia");
            const cover = resolveSpottingCoverFromRow(parsed as any);
            if (cover?.image_url) {
              (parsed as any).car_images = [
                {
                  id: "spotting-event-cover",
                  image_url: cover.image_url,
                  alt_text: cover.alt_text ?? parsed.title,
                  sort_order: 0,
                },
              ];
            }
          }
        }
        setCar(parsed as CarDetail | null);
      }
      setIsLoading(false);
    };

    fetchCar();
  }, [slug]);

  const cleanShareUrl = car ? `${SITE_URL}/biler/${car.slug}` : currentUrl;
  const crawlerShareUrl = car
    ? `${(import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "")}/functions/v1/share-biler?slug=${encodeURIComponent(car.slug)}`
    : currentUrl;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(cleanShareUrl);
      setCopied(true);
      toast.success("Lenke kopiert!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kunne ikke kopiere lenke");
    }
  };

  const handleNativeShare = async () => {
    if (!car) return;

    const shareData = {
      title: car.title,
      text: car.story 
        ? car.story.substring(0, 200) + (car.story.length > 200 ? '...' : '')
        : `${car.brand || ''} ${car.model} ${car.variant || ''} ${car.year ? `(${car.year})` : ''}`.trim(),
      url: cleanShareUrl,
    };

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        toast.success("Delt!");
      } else {
        await copyLink();
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error sharing:', error);
        await copyLink();
      }
    }
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(crawlerShareUrl)}`, "_blank", "width=600,height=400");
  };

  const shareOnTwitter = () => {
    const text = car ? `Sjekk ut denne ${car.title}!` : "Sjekk ut denne bilen!";
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(crawlerShareUrl)}&text=${encodeURIComponent(text)}`, "_blank", "width=600,height=400");
  };

  const nextImage = () => {
    if (car && selectedImageIndex !== null) {
      const sortedImages = [...car.car_images].sort((a, b) => a.sort_order - b.sort_order);
      setSelectedImageIndex((prev) => 
        prev === sortedImages.length - 1 ? 0 : (prev ?? 0) + 1
      );
    }
  };

  const prevImage = () => {
    if (car && selectedImageIndex !== null) {
      const sortedImages = [...car.car_images].sort((a, b) => a.sort_order - b.sort_order);
      setSelectedImageIndex((prev) => 
        prev === 0 ? sortedImages.length - 1 : (prev ?? 0) - 1
      );
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <ExploreSectionNav />
        <div className="min-h-[60vh] flex items-center justify-center">
          <BrandLoader size={220} />
        </div>
      </Layout>
    );
  }

  if (!car) {
    return (
      <Layout>
        <ExploreSectionNav />
        <section className="poster-section min-h-[60vh] flex items-center justify-center">
          <div className="text-center animate-fade-in">
            <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="headline-md mb-4">BIL IKKE FUNNET</h1>
            <p className="text-muted-foreground mb-6">
              Bilen du leter etter eksisterer ikke eller er ikke publisert ennå.
            </p>
            <Link to="/biler" className="btn-enamel-blue">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Tilbake til galleriet
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  const sortedImages = [...car.car_images].sort((a, b) => a.sort_order - b.sort_order);
  const mainImage = sortedImages[0];
  const galleryImages = sortedImages.slice(1);

  const storyExcerpt = car.story && car.story.length > 800 
    ? `${car.story.substring(0, 800)}...` 
    : car.story;
  const hasMoreStory = car.story && car.story.length > 800;

  // Quick facts data
  const quickFacts = [
    { label: 'Merke', value: car.brand, icon: Tag },
    { label: 'Modell', value: car.model, icon: Car },
    { label: 'Variant', value: car.variant, icon: Gauge },
    { label: 'Karosseri', value: car.body_type?.replace('-', ' '), icon: Car },
    { label: 'Årsmodell', value: car.year, icon: Calendar },
  ].filter(fact => fact.value);

  // External links
  const externalLinks = car.external_links || [];

  // Timeline - create fallback if no events
  const timelineEvents = car.timeline_events && car.timeline_events.length > 0 
    ? car.timeline_events 
    : [
        ...(car.created_at ? [{ 
          type: 'annet' as const, 
          title: 'Innsendt til registeret', 
          date: car.created_at,
          year: new Date(car.created_at).getFullYear()
        }] : []),
        ...(car.published_at ? [{ 
          type: 'annet' as const, 
          title: 'Publisert', 
          date: car.published_at,
          year: new Date(car.published_at).getFullYear()
        }] : []),
      ];

  // Build OG meta data
  const displayYear = car.year != null ? ` (${car.year})` : "";
  const ogTitle = isSpottingView
    ? `${presentation?.displayTitle ?? car.title} – observert | Bilgarasje.no`
    : `${car.title}${displayYear} – Bilhistorie fra Norge | Bilgarasje.no`;
  const yearLabel = car.year != null ? ` fra ${car.year}` : "";
  const storySnippet = car.story?.trim();
  const ogDescription = isSpottingView && observationCaption
    ? observationCaption.slice(0, 160)
    : storySnippet
    ? `Les historien om ${car.title}${yearLabel}. ${storySnippet.slice(0, 150).trim()}${storySnippet.length > 150 ? "…" : ""}`
    : `Les historien om ${car.title}${yearLabel} på Bilgarasje.no.`;
  const functionsHost = (import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
  const ogImageFromEdge = functionsHost
    ? `${functionsHost}/functions/v1/og-bil?slug=${encodeURIComponent(car.slug)}${car.updated_at ? `&v=${encodeURIComponent(car.updated_at)}` : ""}`
    : null;
  const rawOgImage = mainImage?.image_url ?? "";
  const fallbackOgImage = rawOgImage.startsWith("http")
    ? rawOgImage
    : rawOgImage
      ? `${SITE_URL}${rawOgImage.startsWith("/") ? "" : "/"}${rawOgImage}`
      : `${SITE_URL}/favicon.png`;
  const ogImage = ogImageFromEdge ?? fallbackOgImage;
  const canonicalUrl = `${SITE_URL}/biler/${car.slug}`;
  const decade = car.year != null ? Math.floor(car.year / 10) * 10 : null;

  const breadcrumbItemName = car.title?.trim() || [car.brand, car.model, car.year].filter(Boolean).join(" ").trim() || "Bil";
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Forside", "item": `${SITE_URL}/` },
      { "@type": "ListItem", "position": 2, "name": "Biler", "item": `${SITE_URL}/biler` },
      { "@type": "ListItem", "position": 3, "name": breadcrumbItemName, "item": `${SITE_URL}/biler/${car.slug}` },
    ],
  };

  return (
    <Layout>
      <ExploreSectionNav />
      {showPostPublishOverlay && (
        <PostPublishOnboardingOverlay
          carTitle={car.title}
          carSlug={car.slug}
          carId={car.id}
          firstImageUrl={firstCarImage}
          siteUrl={SITE_URL}
          hasPersonProfile={!!myProfile}
          onDismiss={() => setShowPostPublishOverlay(false)}
          onOpenComposer={() => {
            setComposerInitialBody("Hva er historien bak denne bilen? ");
            setShowFeedComposer(true);
          }}
        />
      )}
      <Helmet>
        <title>{ogTitle}</title>
        <meta name="description" content={ogDescription} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Bilgarasje.no" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImage} />

        {/* JSON-LD Structured Data – Article */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": car.year != null ? `${car.title} (${car.year})` : car.title,
            "description": ogDescription,
            "image": ogImage,
            "mainEntityOfPage": canonicalUrl,
            "author": {
              "@type": "Organization",
              "name": "Bilgarasje.no",
            },
            "publisher": {
              "@type": "Organization",
              "name": "Bilgarasje.no",
              "logo": {
                "@type": "ImageObject",
                "url": `${SITE_URL}/simca-norge-badge.png`,
              },
            },
            "datePublished": car.published_at ?? car.created_at ?? null,
            "dateModified": car.updated_at ?? car.published_at ?? car.created_at ?? null,
          })}
        </script>

        {/* JSON-LD BreadcrumbList */}
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbJsonLd)}
        </script>
      </Helmet>

      <CarObservationPage
        carId={car.id}
        imageUrl={mainImage?.image_url ?? null}
        imageAlt={mainImage?.alt_text || presentation?.displayTitle || car.title}
        caption={observationCaption ?? null}
        story={car.story}
        brand={car.brand}
        model={car.model}
        variant={car.variant}
        body_type={car.body_type}
        year={car.year}
        category={car.category}
        tags={car.tags}

        galleryImages={galleryImages}
        enrichment={resolveCarEnrichment({
          brand: car.brand,
          model: car.model,
          story: car.story,
          identification_status: car.identification_status,
          car_images: car.car_images,
          car_owners: carOwners,
        })}
        heroCaptionEventId={heroCaptionEventId}
        carCreatedAt={car.created_at ?? null}
        onImageClick={() => mainImage && setSelectedImageIndex(0)}
        onGalleryImageClick={(i) => setSelectedImageIndex(i)}
        onKnowCar={() =>
          FEATURES.knowledgeHubV1
            ? setKnowledgeDialogOpen(true)
            : setRelationshipDialogOpen(true)
        }
        onShare={handleNativeShare}
        onOpenComments={() => setCommentsSheetOpen(true)}
        showKnowCarCta={
          presentation?.showHeroRelationshipCta ??
          (!isLinkedToCar && FEATURES.relationshipRequestsV1)
        }
        landingAck={landingAck}
      />
      <SpottingCommentsSheet
        carId={car.id}
        open={commentsSheetOpen}
        onOpenChange={setCommentsSheetOpen}
      />


      {/* Lightbox */}

      {selectedImageIndex !== null && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-fade-in"
          onClick={() => setSelectedImageIndex(null)}
        >
          <button
            onClick={() => setSelectedImageIndex(null)}
            className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors"
            aria-label="Lukk"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {sortedImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors"
                aria-label="Forrige bilde"
              >
                <ChevronLeft className="w-8 h-8 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors"
                aria-label="Neste bilde"
              >
                <ChevronRight className="w-8 h-8 text-white" />
              </button>
            </>
          )}

          <img
            src={sortedImages[selectedImageIndex].image_url}
            alt={sortedImages[selectedImageIndex].alt_text || car.title}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-display">
            {selectedImageIndex + 1} / {sortedImages.length}
          </div>
        </div>
      )}




      {!isLinkedToCar && FEATURES.relationshipRequestsV1 && (
        FEATURES.knowledgeHubV1 ? (
          <CarKnowledgeDialog
            open={knowledgeDialogOpen}
            onOpenChange={setKnowledgeDialogOpen}
            carId={car.id}
            carTitle={presentation?.displayTitle ?? car.title}
            carSlug={car.slug}
            source="bil_detalj"
          />
        ) : (
          <RelationshipRequestDialog
            open={relationshipDialogOpen}
            onOpenChange={setRelationshipDialogOpen}
            carId={car.id}
            carTitle={car.title}
            source="bil_detalj"
          />
        )
      )}
    </Layout>
  );
};

export default BilDetalj;
