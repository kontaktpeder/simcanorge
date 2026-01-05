import { Link } from "react-router-dom";
import { ArrowRight, Car, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useInView } from "@/hooks/useInView";
import simcaBadge from "@/assets/simca-badge.png";
import simcaSwallow from "@/assets/simca-swallow.png";
import checkeredFlag from "@/assets/checkered-flag.png";
interface FeaturedCar {
  id: string;
  slug: string;
  title: string;
  model: string;
  year: number | null;
  story: string | null;
  car_images: {
    image_url: string;
    alt_text: string | null;
    sort_order: number | null;
  }[];
}
export function HeroSection() {
  const { ref: cardRef, isInView } = useInView();
  
  const {
    data: featuredCar,
    isLoading
  } = useQuery({
    queryKey: ["featured-car-home"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("cars").select(`
          id,
          slug,
          title,
          model,
          year,
          story,
          car_images (
            image_url,
            alt_text,
            sort_order
          )
        `).eq("featured", true).not("published_at", "is", null).lte("published_at", new Date().toISOString()).order("published_at", {
        ascending: false
      }).limit(1).maybeSingle();
      if (error) throw error;
      return data as FeaturedCar | null;
    }
  });
  const getMainImage = (car: FeaturedCar) => {
    if (!car.car_images || car.car_images.length === 0) return null;
    const sorted = [...car.car_images].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    return sorted[0];
  };
  return <section className="poster-section poster-section-blue hero-watermark relative overflow-hidden min-h-[85vh] flex items-center">
      {/* Subtle stripes overlay */}
      <div className="absolute inset-0 stripes-diagonal" />
      
      {/* Large swallow watermark */}
      <div className="absolute inset-0 pointer-events-none" style={{
      backgroundImage: `url(${simcaSwallow})`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: '50% 50%',
      backgroundSize: '800px',
      opacity: 0.10,
      filter: 'blur(0.5px)',
      transform: 'rotate(-8deg)'
    }} />
      
      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start mb-8">
              <img 
                src={simcaBadge} 
                alt="Simca Norge" 
                className="h-56 md:h-72 lg:h-96 w-auto"
                style={{
                  filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4)) drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                }}
              />
            </div>
            <p className="text-xl font-light mb-10 max-w-lg mx-auto lg:mx-0 text-white/90 font-serif md:text-3xl">
              Din kilde til Simca, Talbot og Matra klassikere. Bildeler og historier fra entusiaster i Norge.
            </p>
            
            {/* Enhanced CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/biler" className="btn-enamel-red group text-lg md:text-xl px-10 py-5">
                <span>Se alle biler</span>
                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/deler" className="btn-enamel-blue group text-lg md:text-xl px-10 py-5">
                <span>Finn deler</span>
                <Car className="w-6 h-6 ml-3 group-hover:scale-110 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Featured Car - Månedens bil */}
          <div 
            ref={cardRef}
            className={`relative transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            {isLoading ? (
              <div className="featured-car-frame p-6">
                <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                <div className="mt-4">
                  <Skeleton className="h-6 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
                </div>
              </div>
            ) : featuredCar ? (
              <Link 
                to={`/biler/${featuredCar.slug}`} 
                className="block featured-car-frame p-5 hover-lift transition-all group relative overflow-hidden"
              >
                {/* Checkered flag background with wave animation */}
                <div 
                  className={`absolute inset-0 pointer-events-none checkered-flag-wave z-[1] ${isInView ? 'animate-flag-fade-in' : 'opacity-0'}`}
                  style={{
                    backgroundImage: `url(${checkeredFlag})`,
                    backgroundSize: '150%',
                    backgroundPosition: 'top left',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
                {/* No overlay - flag shows clearly */}
                
                {/* Car image with finish line glow */}
                {getMainImage(featuredCar) ? (
                  <div className="overflow-hidden rounded-lg relative z-[2] car-finish-glow">
                    <img 
                      src={getMainImage(featuredCar)!.image_url} 
                      alt={getMainImage(featuredCar)!.alt_text || featuredCar.title} 
                      className="w-full aspect-[16/10] object-cover shadow-lg group-hover:scale-105 transition-transform duration-500" 
                    />
                    {/* Subtle shine overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                ) : (
                  <div className="aspect-[16/10] bg-white/20 rounded-lg flex items-center justify-center relative z-[2]">
                    <Car className="w-24 h-24 opacity-50" />
                  </div>
                )}
                
                {/* Text content */}
                <div className="mt-5 text-center relative z-[2]">
                  <p className="font-display text-3xl font-bold text-white drop-shadow-lg">{featuredCar.title}</p>
                  <p className="font-serif text-lg text-white/90 mt-1 drop-shadow-md">
                    {featuredCar.year && `${featuredCar.year} · `}{featuredCar.model}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="featured-car-frame p-8 relative overflow-hidden">
                {/* Checkered flag background for empty state */}
                <div 
                  className="absolute inset-0 pointer-events-none checkered-flag-wave"
                  style={{
                    backgroundImage: `url(${checkeredFlag})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-black/50 via-transparent to-black/60 z-[1]" />
                
                <div className="aspect-[16/10] bg-white/20 rounded-lg flex items-center justify-center relative z-[2]">
                  <div className="text-center">
                    <Car className="w-24 h-24 mx-auto mb-4 opacity-50" />
                    <p className="font-display text-2xl text-white/75">MÅNEDENS BIL</p>
                    <p className="font-serif italic text-white/60">Kommer snart...</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Decorative badge - enhanced emblem style */}
            <Link 
              to="/manedens-bil" 
              className="absolute -top-3 -right-3 manedens-bil-badge px-4 py-2 font-display text-sm rotate-12 flex items-center gap-1.5 hover:scale-110 transition-transform z-20"
            >
              <Star className="w-4 h-4 fill-current" />
              MÅNEDENS BIL
            </Link>
          </div>
        </div>
      </div>
    </section>;
}