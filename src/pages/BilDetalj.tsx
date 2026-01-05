import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, Wrench, Tag, ChevronLeft, ChevronRight, Car } from "lucide-react";

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

  useEffect(() => {
    const fetchCar = async () => {
      if (!slug) return;

      const { data, error } = await supabase
        .from("cars")
        .select(`
          id, title, slug, model, year, story, overhauled, tags, featured, published_at,
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
          <div className="text-center">
            <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="headline-md mb-4">BIL IKKE FUNNET</h1>
            <p className="text-muted-foreground mb-6">
              Bilen du leter etter eksisterer ikke eller er ikke publisert ennå.
            </p>
            <Link to="/biler" className="btn-retro">
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

      {/* Hero Image Gallery */}
      <section className="bg-foreground">
        <div className="container mx-auto">
          <div className="relative aspect-[16/9] md:aspect-[21/9]">
            {sortedImages.length > 0 ? (
              <>
                <img
                  src={currentImage.image_url}
                  alt={currentImage.alt_text || car.title}
                  className="w-full h-full object-cover"
                />

                {/* Navigation arrows */}
                {sortedImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-card/80 hover:bg-card p-3 rounded-full transition-colors"
                      aria-label="Forrige bilde"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-card/80 hover:bg-card p-3 rounded-full transition-colors"
                      aria-label="Neste bilde"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Dots */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {sortedImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-3 h-3 rounded-full transition-colors ${
                            index === currentImageIndex
                              ? "bg-accent"
                              : "bg-card/60 hover:bg-card"
                          }`}
                          aria-label={`Gå til bilde ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Car className="w-24 h-24 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Thumbnail Strip */}
      {sortedImages.length > 1 && (
        <section className="bg-muted py-4">
          <div className="container mx-auto">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {sortedImages.map((img, index) => (
                <button
                  key={img.id}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded overflow-hidden border-2 transition-colors ${
                    index === currentImageIndex
                      ? "border-accent"
                      : "border-transparent hover:border-primary"
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
        </section>
      )}

      {/* Content */}
      <section className="poster-section">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            {/* Badges */}
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="bg-primary text-primary-foreground px-4 py-2 font-display text-lg">
                {car.model}
              </span>
              {car.year && (
                <span className="bg-accent text-accent-foreground px-4 py-2 font-display text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {car.year}
                </span>
              )}
              {car.overhauled && (
                <span className="bg-green-600 text-white px-4 py-2 font-display text-lg flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  OVERHALT
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="headline-lg mb-8">{car.title}</h1>

            {/* Story */}
            {car.story && (
              <div className="prose prose-lg max-w-none">
                <div className="text-lg leading-relaxed whitespace-pre-wrap">
                  {car.story}
                </div>
              </div>
            )}

            {/* Tags */}
            {car.tags && car.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-border">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-5 h-5 text-muted-foreground" />
                  {car.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-muted px-3 py-1 text-sm text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Back link */}
            <div className="mt-12">
              <Link to="/biler" className="btn-retro bg-primary inline-flex">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Se flere biler
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default BilDetalj;
