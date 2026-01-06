import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, Wrench, ArrowRight, ChevronLeft, ChevronRight, Car, Facebook, Twitter, Linkedin, Link as LinkIcon, Check, Instagram, X } from "lucide-react";
import { toast } from "sonner";

interface CarImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
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
  car_images: CarImage[];
}

const BilDetalj = () => {
  const { slug } = useParams<{ slug: string }>();
  const [car, setCar] = useState<CarDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  useEffect(() => {
    const fetchCar = async () => {
      if (!slug) return;

      const { data, error } = await supabase
        .from("cars")
        .select(`
          id, title, slug, brand, model, variant, body_type, year, story, overhauled, tags, featured, published_at,
          car_images(id, image_url, alt_text, sort_order)
        `)
        .eq("slug", slug)
        .not("published_at", "is", null)
        .maybeSingle();

      if (error) {
        console.error("Error fetching car:", error);
      } else {
        setCar(data);
      }
      setIsLoading(false);
    };

    fetchCar();
  }, [slug]);

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, "_blank", "width=600,height=400");
  };

  const shareOnTwitter = () => {
    const text = car ? `Sjekk ut denne ${car.title}!` : "Sjekk ut denne bilen!";
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(text)}`, "_blank", "width=600,height=400");
  };

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

  // Lightbox navigation
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
          <p>Laster...</p>
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

  // Story excerpt logic
  const storyExcerpt = car.story && car.story.length > 500 
    ? `${car.story.substring(0, 500)}...` 
    : car.story;
  const hasMoreStory = car.story && car.story.length > 500;

  return (
    <Layout>
      <PageHeader 
        title="BILHISTORIE" 
        subtitle="En unik historie fra vårt fellesskap" 
      />

      {/* Main Content Section - Same as Månedens Bil */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Main Image */}
            <div className="relative">
              {mainImage ? (
                <img 
                  src={mainImage.image_url} 
                  alt={mainImage.alt_text || car.title} 
                  className="w-full aspect-[4/3] object-cover border-4 border-foreground shadow-brutal cursor-pointer hover:opacity-95 transition-opacity" 
                  onClick={() => setSelectedImageIndex(0)}
                />
              ) : (
                <div className="w-full aspect-[4/3] bg-muted border-4 border-foreground flex items-center justify-center">
                  <Car className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
              {car.featured && (
                <div className="absolute top-4 left-4 bg-accent text-accent-foreground px-4 py-2 font-display uppercase text-sm border-2 border-foreground">
                  Månedens bil
                </div>
              )}
            </div>

            {/* Content */}
            <div>
              <h2 className="headline-md mb-2">{car.title}</h2>
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <span className="font-display text-xl text-accent">{car.model}</span>
                {car.variant && (
                  <span className="text-muted-foreground font-medium">{car.variant}</span>
                )}
                {car.year && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {car.year}
                  </span>
                )}
                {car.overhauled && (
                  <span className="flex items-center gap-1 text-green-600">
                    <Wrench className="w-4 h-4" />
                    Overhalt
                  </span>
                )}
              </div>
              
              {/* Car specs row */}
              {(car.brand || car.body_type) && (
                <div className="flex flex-wrap gap-2 mb-6 text-sm">
                  {car.brand && (
                    <span className="bg-muted px-3 py-1 rounded-full">{car.brand}</span>
                  )}
                  {car.body_type && (
                    <span className="bg-muted px-3 py-1 rounded-full capitalize">{car.body_type.replace('-', ' ')}</span>
                  )}
                </div>
              )}

              {/* Tags */}
              {car.tags && car.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {car.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="bg-secondary text-secondary-foreground px-3 py-1 text-sm font-display uppercase"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Story excerpt or full story */}
              {car.story && (
                <div className="prose prose-lg mb-8">
                  <p className="font-serif text-lg leading-relaxed whitespace-pre-wrap">
                    {isExpanded ? car.story : storyExcerpt}
                  </p>
                </div>
              )}

              {/* Expand button or always show if short story */}
              {hasMoreStory && !isExpanded && (
                <button 
                  onClick={() => setIsExpanded(true)}
                  className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 py-3 font-display uppercase text-lg border-2 border-foreground shadow-brutal hover-lift mb-8"
                >
                  Les hele historien
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}

              {/* Share section */}
              <div className="border-t border-border pt-6">
                <p className="text-sm text-muted-foreground mb-3">Del denne historien</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={shareOnFacebook}
                    className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                    aria-label="Del på Facebook"
                  >
                    <Facebook className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => window.open(`https://www.instagram.com/`, "_blank")}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                    aria-label="Del på Instagram"
                  >
                    <Instagram className="w-5 h-5" />
                  </button>
                  <button
                    onClick={shareOnTwitter}
                    className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                    aria-label="Del på X"
                  >
                    <Twitter className="w-5 h-5" />
                  </button>
                  <button
                    onClick={copyLink}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      copied ? "bg-green-600 text-white" : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                    aria-label="Kopier lenke"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Back link */}
              <Link 
                to="/biler" 
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Tilbake til galleriet
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Image Gallery Section */}
      {galleryImages.length > 0 && (
        <section className="py-8 md:py-16 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="headline-md mb-8 text-center">Flere bilder</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryImages.map((img, index) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImageIndex(index + 1)}
                  className="aspect-square overflow-hidden border-4 border-foreground shadow-brutal hover-lift focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <img
                    src={img.image_url}
                    alt={img.alt_text || `Bilde ${index + 2}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lightbox */}
      {selectedImageIndex !== null && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setSelectedImageIndex(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setSelectedImageIndex(null)}
            className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors"
            aria-label="Lukk"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Navigation arrows */}
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

          {/* Image */}
          <img
            src={sortedImages[selectedImageIndex].image_url}
            alt={sortedImages[selectedImageIndex].alt_text || car.title}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm">
            {selectedImageIndex + 1} / {sortedImages.length}
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-accent">
        <div className="container mx-auto px-4 text-center">
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
        </div>
      </section>
    </Layout>
  );
};

export default BilDetalj;
