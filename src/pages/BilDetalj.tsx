import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, Wrench, Tag, ChevronLeft, ChevronRight, Car, Share2, Facebook, Twitter, Linkedin, Link as LinkIcon, Check } from "lucide-react";
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  useEffect(() => {
    const fetchCar = async () => {
      if (!slug) return;

      const { data, error } = await supabase
        .from("cars")
        .select(`
          id, title, slug, brand, model, year, story, overhauled, tags, featured, published_at,
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

  const nextImage = () => {
    if (car && car.car_images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === car.car_images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (car && car.car_images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? car.car_images.length - 1 : prev - 1
      );
    }
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, "_blank", "width=600,height=400");
  };

  const shareOnTwitter = () => {
    const text = car ? `Sjekk ut denne ${car.title}!` : "Sjekk ut denne bilen!";
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(text)}`, "_blank", "width=600,height=400");
  };

  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`, "_blank", "width=600,height=400");
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

  const sortedImages = [...car.car_images].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const currentImage = sortedImages[currentImageIndex];

  return (
    <Layout>
      <PageHeader 
        title={car.title} 
        subtitle={car.year ? `${car.model} · ${car.year}` : car.model} 
      />

      {/* Breadcrumb */}
      <div className="bg-muted border-b border-border">
        <div className="container mx-auto py-3">
          <Link
            to="/biler"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tilbake til galleriet</span>
          </Link>
        </div>
      </div>

      {/* Hero Image Gallery - Mobile swipe style */}
      <section className="bg-black">
        {sortedImages.length > 0 ? (
          <>
            {/* Full-width mobile gallery */}
            <div className="relative">
              {/* Main image - edge to edge on mobile */}
              <div 
                className="relative w-full"
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  (e.currentTarget as HTMLElement).dataset.touchStartX = touch.clientX.toString();
                }}
                onTouchEnd={(e) => {
                  const touchStartX = parseFloat((e.currentTarget as HTMLElement).dataset.touchStartX || "0");
                  const touchEndX = e.changedTouches[0].clientX;
                  const diff = touchStartX - touchEndX;
                  if (Math.abs(diff) > 50) {
                    if (diff > 0) nextImage();
                    else prevImage();
                  }
                }}
              >
                <img
                  key={currentImageIndex}
                  src={currentImage.image_url}
                  alt={currentImage.alt_text || car.title}
                  className="w-full max-h-[60vh] md:max-h-[70vh] object-contain"
                />
                
                {/* Gradient overlay for counter visibility */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                
                {/* Image counter - bottom right pill style */}
                {sortedImages.length > 1 && (
                  <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium">
                    {currentImageIndex + 1} / {sortedImages.length}
                  </div>
                )}
              </div>

              {/* Navigation arrows - only on desktop */}
              {sortedImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-110"
                    aria-label="Forrige bilde"
                  >
                    <ChevronLeft className="w-6 h-6 text-foreground" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-110"
                    aria-label="Neste bilde"
                  >
                    <ChevronRight className="w-6 h-6 text-foreground" />
                  </button>
                </>
              )}
            </div>

            {/* Dot indicators for mobile */}
            {sortedImages.length > 1 && (
              <div className="md:hidden flex justify-center gap-1.5 py-3 bg-black">
                {sortedImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex
                        ? "bg-white w-4"
                        : "bg-white/40"
                    }`}
                    aria-label={`Gå til bilde ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Thumbnail strip - desktop only */}
            {sortedImages.length > 1 && (
              <div className="hidden md:block bg-muted/50 py-3">
                <div className="container mx-auto">
                  <div className="flex gap-2 overflow-x-auto pb-1 justify-center">
                    {sortedImages.map((img, index) => (
                      <button
                        key={img.id}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          index === currentImageIndex
                            ? "border-accent ring-2 ring-accent/30"
                            : "border-transparent hover:border-white/50 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={img.image_url}
                          alt={img.alt_text || `Bilde ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full aspect-[4/3] bg-muted flex items-center justify-center">
            <Car className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
      </section>

      {/* Content */}
      <section className="poster-section">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto animate-fade-in">
            {/* Badges */}
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="bg-primary text-primary-foreground px-4 py-2 font-display text-lg rounded-lg">
                {car.model}
              </span>
              {car.year && (
                <span className="bg-accent text-accent-foreground px-4 py-2 font-display text-lg flex items-center gap-2 rounded-lg">
                  <Calendar className="w-5 h-5" />
                  {car.year}
                </span>
              )}
              {car.overhauled && (
                <span className="bg-green-600 text-white px-4 py-2 font-display text-lg flex items-center gap-2 rounded-lg">
                  <Wrench className="w-5 h-5" />
                  OVERHALT
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="headline-lg mb-8">{car.title}</h1>

            {/* Story */}
            {car.story && (
              <div className="border-chrome card-enamel bg-card p-8 mb-8">
                <div className="text-lg leading-relaxed whitespace-pre-wrap">
                  {car.story}
                </div>
              </div>
            )}

            {/* Tags */}
            {car.tags && car.tags.length > 0 && (
              <div className="pt-8 border-t border-border">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-5 h-5 text-muted-foreground" />
                  {car.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-muted px-3 py-1 text-sm text-muted-foreground rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-12 flex flex-wrap gap-4 items-center">
              <Link to="/biler" className="btn-enamel-blue inline-flex">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Se flere biler
              </Link>

              {/* Share button */}
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="btn-enamel-red inline-flex items-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  Del denne bilen
                </button>

                {showShareMenu && (
                  <div className="absolute bottom-full left-0 mb-2 bg-card border-2 border-foreground rounded-lg shadow-xl p-2 min-w-[180px] z-10">
                    <button
                      onClick={shareOnFacebook}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-lg transition-colors text-left"
                    >
                      <Facebook className="w-5 h-5 text-blue-600" />
                      Facebook
                    </button>
                    <button
                      onClick={shareOnTwitter}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-lg transition-colors text-left"
                    >
                      <Twitter className="w-5 h-5 text-sky-500" />
                      X (Twitter)
                    </button>
                    <button
                      onClick={shareOnLinkedIn}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-lg transition-colors text-left"
                    >
                      <Linkedin className="w-5 h-5 text-blue-700" />
                      LinkedIn
                    </button>
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={copyLink}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-lg transition-colors text-left"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <LinkIcon className="w-5 h-5 text-muted-foreground" />
                      )}
                      {copied ? "Kopiert!" : "Kopier lenke"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="poster-section poster-section-red relative overflow-hidden">
        <div className="absolute inset-0 stripes-diagonal opacity-50" />
        <div className="container mx-auto text-center relative z-10">
          <h2 className="headline-md mb-4">HAR DU EN SIMCA?</h2>
          <p className="text-xl mb-6 opacity-90">
            Del historien om din franske klassiker med oss!
          </p>
          <Link to="/send-inn" className="btn-retro bg-accent-foreground text-primary-foreground">
            Send inn din bil
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default BilDetalj;
