import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { AnimatedSection } from "@/components/layout/AnimatedSection";
import { TimelineSection } from "@/components/car/TimelineSection";
import { OwnerCard } from "@/components/car/OwnerCard";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, Calendar, Wrench, ArrowRight, ChevronLeft, ChevronRight, Car, 
  Facebook, Twitter, Link as LinkIcon, Check, Instagram, X, Youtube, ExternalLink,
  Tag, Gauge, FileText, Share2, ChevronDown
} from "lucide-react";
import { toast } from "sonner";

const SITE_URL = "https://simcanorge.lovable.app";
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
  category: string | null;
  external_links: ExternalLinkData[] | null;
  timeline_events: TimelineEvent[] | null;
  car_images: CarImage[];
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
          overhauled, tags, featured, published_at, created_at, category,
          external_links, timeline_events,
          car_images(id, image_url, alt_text, sort_order)
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
        } : null;
        setCar(parsed);
      }
      setIsLoading(false);
    };

    fetchCar();
  }, [slug]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
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
      url: currentUrl,
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
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, "_blank", "width=600,height=400");
  };

  const shareOnTwitter = () => {
    const text = car ? `Sjekk ut denne ${car.title}!` : "Sjekk ut denne bilen!";
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(text)}`, "_blank", "width=600,height=400");
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
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <Car className="w-12 h-12 text-muted-foreground" />
            <p className="font-display">Laster bilprofil...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!car) {
    return (
      <Layout>
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

  const storyExcerpt = car.story && car.story.length > 500 
    ? `${car.story.substring(0, 500)}...` 
    : car.story;
  const hasMoreStory = car.story && car.story.length > 500;

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
  const ogTitle = `${car.title} | Simca Norge`;
  const ogDescription = car.story 
    ? car.story.substring(0, 155).trim() + (car.story.length > 155 ? '...' : '')
    : `${car.brand || ''} ${car.model} ${car.variant || ''} ${car.year ? `(${car.year})` : ''} – Se historien og bildene.`.trim();
  const ogImage = mainImage?.image_url || `${SITE_URL}/favicon.png`;
  const canonicalUrl = `${SITE_URL}/biler/${car.slug}`;

  return (
    <Layout>
      <Helmet>
        <title>{ogTitle}</title>
        <meta name="description" content={ogDescription} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Simca Norge" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>

      <PageHeader 
        title="BILHISTORIE" 
        subtitle="En unik historie fra vårt fellesskap" 
      />

      {/* Hero Section */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Main Image */}
            <AnimatedSection>
              <div className="relative">
                {mainImage ? (
                  <img 
                    src={mainImage.image_url} 
                    alt={mainImage.alt_text || car.title} 
                    className="w-full aspect-[4/3] object-cover border-4 border-foreground shadow-brutal cursor-pointer hover:scale-[1.02] transition-transform duration-300" 
                    onClick={() => setSelectedImageIndex(0)}
                    loading="eager"
                  />
                ) : (
                  <div className="w-full aspect-[4/3] bg-muted border-4 border-foreground flex items-center justify-center">
                    <Car className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {car.featured && (
                    <div className="bg-accent text-accent-foreground px-4 py-2 font-display uppercase text-sm border-2 border-foreground shadow-brutal">
                      Månedens bil
                    </div>
                  )}
                  {car.category && CATEGORY_LABELS[car.category] && (
                    <div className={`${CATEGORY_LABELS[car.category].color} px-4 py-2 font-display uppercase text-sm border-2 border-foreground shadow-brutal`}>
                      {CATEGORY_LABELS[car.category].label}
                    </div>
                  )}
                </div>
              </div>
            </AnimatedSection>

            {/* Content */}
            <AnimatedSection delay={100}>
              <div>
                <h2 className="headline-md mb-3">{car.title}</h2>
                
                {/* Subtitle line */}
                <p className="font-display text-xl text-accent mb-4">
                  {[car.brand, car.model, car.variant].filter(Boolean).join(' ')}
                  {car.year && <span className="text-muted-foreground"> • {car.year}</span>}
                </p>

                {/* Status badges */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  {car.overhauled && (
                    <span className="flex items-center gap-1.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1.5 font-display text-sm border-2 border-green-600">
                      <Wrench className="w-4 h-4" />
                      Overhalt
                    </span>
                  )}
                </div>

                {/* Tags */}
                {car.tags && car.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6 stagger-children">
                    {car.tags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="bg-secondary text-secondary-foreground px-3 py-1.5 text-sm font-display uppercase border border-border hover:scale-105 transition-transform cursor-default"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Story excerpt */}
                {car.story && (
                  <div className="mb-6">
                    <h3 className="font-display text-sm uppercase text-muted-foreground mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Historien
                    </h3>
                    <div className="prose prose-lg">
                      <p className="font-serif text-lg leading-relaxed whitespace-pre-wrap">
                        {isExpanded ? car.story : storyExcerpt}
                      </p>
                    </div>
                  </div>
                )}

                {hasMoreStory && !isExpanded && (
                  <button 
                    onClick={() => setIsExpanded(true)}
                    className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 py-3 font-display uppercase text-lg border-2 border-foreground shadow-brutal hover-lift mb-6"
                  >
                    Les hele historien
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}


              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Quick Facts Section */}
      {quickFacts.length > 0 && (
        <section className="py-8 md:py-12 bg-muted/50">
          <div className="container mx-auto px-4">
            <AnimatedSection delay={200}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 stagger-children">
                {quickFacts.map((fact, index) => {
                  const Icon = fact.icon;
                  return (
                    <div 
                      key={fact.label}
                      className="bg-card border-4 border-foreground shadow-brutal p-4 hover-lift"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <dt className="text-xs font-display uppercase text-muted-foreground mb-1 flex items-center gap-1.5">
                        <Icon className="w-3 h-3" />
                        {fact.label}
                      </dt>
                      <dd className="font-serif text-lg capitalize">{fact.value}</dd>
                    </div>
                  );
                })}
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* Timeline Section */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          <AnimatedSection delay={400}>
            <h3 className="headline-sm mb-8 text-center">Bilens reise</h3>
            <div className="max-w-2xl mx-auto">
              <TimelineSection 
                carId={car.id} 
                createdAt={car.created_at} 
                publishedAt={car.published_at} 
              />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Owner Card Section */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <OwnerCard carId={car.id} />
          </div>
        </div>
      </section>

      {/* External Links Section */}
      {externalLinks.length > 0 && (
        <section className="py-8 md:py-12 bg-muted/50">
          <div className="container mx-auto px-4">
            <AnimatedSection delay={500}>
              <h3 className="headline-sm mb-6 text-center">Eksterne lenker</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto stagger-children">
                {externalLinks.map((link, index) => {
                  const Icon = getLinkIcon(link.type);
                  return (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-card border-4 border-foreground shadow-brutal p-4 hover-lift flex flex-col items-center gap-3 text-center group"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className={`w-12 h-12 rounded-full ${getLinkColor(link.type)} text-white flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-display text-xs uppercase truncate w-full">
                        {link.title || link.type}
                      </span>
                    </a>
                  );
                })}
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* Image Gallery Section */}
      {galleryImages.length > 0 && (
        <section className="py-8 md:py-16 bg-muted">
          <div className="container mx-auto px-4">
            <AnimatedSection delay={600}>
              <h2 className="headline-sm mb-8 text-center">Flere bilder</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 stagger-children">
                {galleryImages.map((img, index) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIndex(index + 1)}
                    className={`aspect-square overflow-hidden border-4 border-foreground shadow-brutal hover-lift focus:outline-none focus:ring-2 focus:ring-accent group relative ${
                      index === 0 ? 'md:col-span-2 md:row-span-2' : ''
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <img
                      src={img.image_url}
                      alt={img.alt_text || `Bilde ${index + 2}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white font-display text-sm uppercase">
                        Se bilde
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* Share Section - moved below images */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <AnimatedSection delay={650}>
              <div className="bg-card border-4 border-foreground shadow-brutal p-6 text-center">
                <p className="text-sm font-display uppercase text-muted-foreground mb-4">Del denne historien</p>
                <div className="flex items-center justify-center gap-3">
                  {/* Native share button - primary on mobile/mac */}
                  {typeof navigator !== 'undefined' && navigator.share && (
                    <button
                      onClick={handleNativeShare}
                      className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-110 hover:shadow-lg transition-all"
                      aria-label="Del"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  )}
                  
                  {/* Fallback buttons for desktop without Web Share API */}
                  {typeof navigator !== 'undefined' && !navigator.share && (
                    <>
                      <button
                        onClick={shareOnFacebook}
                        className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center hover:scale-110 hover:shadow-lg transition-all"
                        aria-label="Del på Facebook"
                      >
                        <Facebook className="w-5 h-5" />
                      </button>
                      <button
                        onClick={shareOnTwitter}
                        className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center hover:scale-110 hover:shadow-lg transition-all"
                        aria-label="Del på X"
                      >
                        <Twitter className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  
                  {/* Copy link - always available */}
                  <button
                    onClick={copyLink}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                      copied ? "bg-green-600 text-white" : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                    aria-label="Kopier lenke"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                  </button>
                </div>
                
                {typeof navigator !== 'undefined' && navigator.share && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Trykk for å åpne systemets delingsmeny
                  </p>
                )}
              </div>
            </AnimatedSection>
            
            {/* Back to gallery link */}
            <Link 
              to="/biler" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Tilbake til galleriet
            </Link>
          </div>
        </div>
      </section>

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

      {/* Fixed Scroll Indicator - follows user until CTA section */}
      {showScrollIndicator && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div className="flex flex-col items-center bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-border">
            <p className="text-xs text-muted-foreground font-display uppercase tracking-wide mb-1">
              Bla ned
            </p>
            <div className="animate-bounce">
              <ChevronDown className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section ref={ctaSectionRef} className="py-16 bg-accent">
        <div className="container mx-auto px-4 text-center">
          <AnimatedSection delay={700}>
            <h2 className="headline-md text-accent-foreground mb-4">Har du en Simca?</h2>
            <p className="font-serif text-xl text-accent-foreground/90 mb-8 max-w-xl mx-auto">
              Kanskje blir din bil neste månedens bil! Send inn historien din og la oss løfte frem din Simca.
            </p>
            <Link 
              to="/send-inn" 
              className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 font-display uppercase text-lg border-2 border-foreground hover-lift"
            >
              Send inn din bil
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-accent-foreground/70 mt-6">
              Eier du denne bilen?{' '}
              <Link to="/login" className="underline hover:text-accent-foreground transition-colors">
                Logg inn i din bil
              </Link>
            </p>
          </AnimatedSection>
        </div>
      </section>
    </Layout>
  );
};

export default BilDetalj;
