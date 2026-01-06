import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, Wrench, Tag, ChevronLeft, ChevronRight, Car, Share2, Facebook, Twitter, Linkedin, Link as LinkIcon, Check, Instagram } from "lucide-react";
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

      {/* Content - Mobile optimized */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-5 md:py-10">
          <div className="max-w-4xl mx-auto">
            {/* Title first on mobile */}
            <h1 className="font-display text-xl md:text-4xl mb-3 md:mb-4">{car.title}</h1>
            
            {/* Compact badges row */}
            <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
              <span className="bg-primary text-primary-foreground px-2.5 py-1 md:px-4 md:py-2 font-display text-xs md:text-base rounded-full">
                {car.model}
              </span>
              {car.year && (
                <span className="bg-accent text-accent-foreground px-2.5 py-1 md:px-4 md:py-2 font-display text-xs md:text-base flex items-center gap-1.5 rounded-full">
                  <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                  {car.year}
                </span>
              )}
              {car.overhauled && (
                <span className="bg-green-600 text-white px-2.5 py-1 md:px-4 md:py-2 font-display text-xs md:text-base flex items-center gap-1.5 rounded-full">
                  <Wrench className="w-3 h-3 md:w-4 md:h-4" />
                  Overhalt
                </span>
              )}
            </div>

            {/* Story */}
            {car.story && (
              <div className="bg-card rounded-xl p-4 md:p-6 mb-4 md:mb-6 border border-border">
                <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap text-foreground/90">
                  {car.story}
                </p>
              </div>
            )}

            {/* Tags - horizontal scroll on mobile */}
            {car.tags && car.tags.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 md:mb-6 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
                {car.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex-shrink-0 bg-muted px-2.5 py-1 text-xs md:text-sm text-muted-foreground rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Share section - inline icons on mobile */}
            <div className="border-t border-border pt-4 md:pt-6">
              <p className="text-xs text-muted-foreground mb-3">Del på sosiale medier</p>
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={shareOnFacebook}
                  className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-blue-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                  aria-label="Del på Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    const text = `Sjekk ut denne ${car.title}!`;
                    window.open(`https://www.instagram.com/`, "_blank");
                  }}
                  className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                  aria-label="Del på Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    window.open(`https://www.tiktok.com/`, "_blank");
                  }}
                  className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-black text-white flex items-center justify-center hover:opacity-90 transition-opacity border border-white/20"
                  aria-label="Del på TikTok"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </button>
                <button
                  onClick={() => {
                    window.open(`https://www.snapchat.com/`, "_blank");
                  }}
                  className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-yellow-400 text-black flex items-center justify-center hover:opacity-90 transition-opacity"
                  aria-label="Del på Snapchat"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301a.603.603 0 0 1 .243-.045c.158 0 .315.045.45.135.165.12.255.285.27.465.015.285-.135.45-.345.585-.09.06-.24.12-.42.18-.63.195-1.365.315-1.545.645-.18.315.06.705.165.87.93 1.455 2.16 2.58 3.57 3.255.21.105.39.27.435.495.045.3-.09.555-.315.735-.3.225-.645.375-1.05.465-.27.06-.57.09-.885.12-.06.015-.12.015-.18.03-.18.03-.36.075-.57.15-.27.09-.495.24-.66.45-.21.27-.3.555-.33.81-.03.225.015.45.09.645.12.3.315.525.525.69.24.18.525.315.825.39.315.075.66.12 1.02.12.525 0 1.035-.09 1.5-.24.285-.09.54-.195.765-.33a.89.89 0 0 1 .48-.135c.255 0 .51.105.69.3.21.225.27.525.195.78-.12.39-.405.675-.795.885-.705.375-1.56.6-2.52.675-.21.015-.435.03-.66.03-.27 0-.54-.015-.81-.045a6.84 6.84 0 0 1-1.29-.24c-.375-.105-.75-.24-1.11-.42-.39-.195-.78-.435-1.14-.735-.51-.42-.975-.93-1.38-1.545-.285-.435-.525-.9-.72-1.395-.12-.3-.21-.615-.285-.945-.075-.345-.12-.705-.12-1.08 0-.495.075-.975.225-1.425.18-.555.465-1.065.855-1.5.27-.3.585-.555.945-.75-.24-.615-.36-1.275-.36-1.965 0-2.13 1.23-4.02 3.15-4.92z"/>
                  </svg>
                </button>
                <button
                  onClick={shareOnTwitter}
                  className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-black text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                  aria-label="Del på X"
                >
                  <Twitter className="w-5 h-5" />
                </button>
                <button
                  onClick={copyLink}
                  className={`w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all ${
                    copied ? "bg-green-600 text-white" : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                  aria-label="Kopier lenke"
                >
                  {copied ? <Check className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Back button */}
            <Link 
              to="/biler" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Tilbake til galleriet
            </Link>
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
