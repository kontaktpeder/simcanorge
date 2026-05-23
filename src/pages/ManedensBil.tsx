import { Layout } from "@/components/layout/Layout";
import { SeoHead } from "@/components/seo";
import { PageHeader } from "@/components/layout/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getResponsiveImageProps, IMAGE_SIZES } from "@/lib/imageUtils";
interface Car {
  id: string;
  slug: string;
  title: string;
  model: string;
  year: number | null;
  story: string | null;
  tags: string[] | null;
  featured: boolean | null;
  overhauled: boolean | null;
  published_at: string | null;
  car_images: {
    image_url: string;
    alt_text: string | null;
    sort_order: number | null;
  }[];
}
const ManedensBil = () => {
  // Fetch the featured car (månedens bil)
  const {
    data: featuredCar,
    isLoading
  } = useQuery({
    queryKey: ["manedens-bil"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("cars").select(`
          *,
          car_images (
            image_url,
            alt_text,
            sort_order
          )
        `).eq("featured", true).not("published_at", "is", null).lte("published_at", new Date().toISOString()).order("published_at", {
        ascending: false
      }).limit(1).maybeSingle();
      if (error) throw error;
      return data as Car | null;
    }
  });

  // Fetch previous featured cars
  const {
    data: previousCars
  } = useQuery({
    queryKey: ["previous-featured-cars"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("cars").select(`
          *,
          car_images (
            image_url,
            alt_text,
            sort_order
          )
        `).not("published_at", "is", null).lte("published_at", new Date().toISOString()).order("published_at", {
        ascending: false
      }).limit(6);
      if (error) throw error;

      // Filter out the current featured car if it exists
      const cars = data as Car[];
      if (featuredCar) {
        return cars.filter(car => car.id !== featuredCar.id).slice(0, 5);
      }
      return cars.slice(1, 6);
    },
    enabled: true
  });
  const getMainImage = (car: Car) => {
    if (!car.car_images || car.car_images.length === 0) return null;
    const sorted = [...car.car_images].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    return sorted[0];
  };
  return <Layout contained>
      <SeoHead
        title="Månedens bil | Bilgarasje.no"
        description="Hver måned løfter vi frem én bil fra vårt fellesskap."
        canonicalPath="/manedens-bil"
      />
      <PageHeader 
        title="MÅNEDENS BIL" 
        subtitle="Hver måned løfter vi frem én bil fra vårt fellesskap – en kilde til inspirasjon, glede og ekte kjøreglede" 
      />

      {/* Featured Car */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {isLoading ? <div className="grid lg:grid-cols-2 gap-12">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="space-y-4">
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div> : featuredCar ? <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Image */}
              <div className="relative">
                {getMainImage(featuredCar) ? <img 
                    {...getResponsiveImageProps(getMainImage(featuredCar)!.image_url, getMainImage(featuredCar)!.alt_text || featuredCar.title, { sizes: IMAGE_SIZES.hero, priority: true })}
                    className="w-full aspect-[4/3] object-cover border-4 border-foreground shadow-brutal" 
                  /> : <div className="w-full aspect-[4/3] bg-muted border-4 border-foreground flex items-center justify-center">
                    <span className="text-muted-foreground font-display">Ingen bilde</span>
                  </div>}
                <div className="absolute top-4 left-4 bg-accent text-accent-foreground px-4 py-2 font-display uppercase text-sm border-2 border-foreground">
                  Månedens bil
                </div>
              </div>

              {/* Content */}
              <div>
                <h2 className="headline-md mb-2">{featuredCar.title}</h2>
                <div className="flex items-center gap-4 mb-6">
                  <span className="font-display text-xl text-accent">{featuredCar.model}</span>
                  {featuredCar.year && <span className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {featuredCar.year}
                    </span>}
                </div>

                {/* Tags */}
                {featuredCar.tags && featuredCar.tags.length > 0 && <div className="flex flex-wrap gap-2 mb-6">
                    {featuredCar.tags.map((tag, index) => <span key={index} className="bg-secondary text-secondary-foreground px-3 py-1 text-sm font-display uppercase">
                        {tag}
                      </span>)}
                  </div>}

                {/* Story excerpt */}
                {featuredCar.story && <div className="prose prose-lg mb-8">
                    <p className="font-serif text-lg leading-relaxed">
                      {featuredCar.story.length > 500 ? `${featuredCar.story.substring(0, 500)}...` : featuredCar.story}
                    </p>
                  </div>}

                <Link to={`/biler/${featuredCar.slug}`} className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 py-3 font-display uppercase text-lg border-2 border-foreground shadow-brutal hover-lift">
                  Les hele historien
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div> : <div className="text-center py-16 bg-card border-4 border-foreground">
              <Star className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="headline-sm mb-4">Ingen månedens bil akkurat nå</h2>
              <p className="font-serif text-lg text-muted-foreground mb-6">
                Vi velger snart en ny bil å løfte frem. Kom tilbake snart!
              </p>
              <Link to="/biler" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 font-display uppercase border-2 border-foreground shadow-brutal hover-lift">
                Se alle biler
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>}
        </div>
      </section>

      {/* Previous Cars */}
      {previousCars && previousCars.length > 0 && <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="headline-md mb-8 text-center">Tidligere biler</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {previousCars.map(car => {
            const mainImage = getMainImage(car);
            return <Link key={car.id} to={`/biler/${car.slug}`} className="bg-card border-4 border-foreground shadow-brutal hover-lift block">
                    {mainImage ? <img 
                        {...getResponsiveImageProps(mainImage.image_url, mainImage.alt_text || car.title, { sizes: IMAGE_SIZES.card, loading: 'lazy' })}
                        className="w-full aspect-[3/2] object-cover border-b-4 border-foreground" 
                      /> : <div className="w-full aspect-[3/2] bg-muted flex items-center justify-center border-b-4 border-foreground">
                        <span className="text-muted-foreground font-display">Ingen bilde</span>
                      </div>}
                    <div className="p-4">
                      <h3 className="font-display text-lg uppercase mb-1">{car.title}</h3>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <span>{car.model}</span>
                        {car.year && <>
                            <span>•</span>
                            <span>{car.year}</span>
                          </>}
                      </div>
                    </div>
                  </Link>;
          })}
            </div>
          </div>
        </section>}

      {/* CTA */}
      <section className="py-16 bg-accent">
        <div className="container mx-auto px-4 text-center">
          <h2 className="headline-md text-accent-foreground mb-4">Har du en bil å dele?</h2>
          <p className="font-serif text-xl text-accent-foreground/90 mb-8 max-w-xl mx-auto">
            Kanskje blir din bil neste månedens bil! Send inn historien din og la oss løfte den frem.
          </p>
          <Link to="/legg-til-bil" className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 font-display uppercase text-lg border-2 border-foreground hover-lift">
            Legg inn bilen din
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </Layout>;
};
export default ManedensBil;