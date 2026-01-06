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
  const {
    ref: cardRef,
    isInView
  } = useInView();
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
  return <section className="poster-section poster-section-blue hero-watermark relative overflow-hidden min-h-[70vh] md:min-h-[85vh] flex flex-col justify-start pt-4 md:pt-8">
      {/* Subtle stripes overlay */}
      <div className="absolute inset-0 stripes-diagonal" />
      
      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-6 md:gap-8 items-start">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center mb-3 md:mb-4">
              <img src={simcaBadge} alt="Simca Norge" className="h-40 md:h-72 lg:h-96 xl:h-[28rem] w-auto" style={{
              filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4)) drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
            }} />
            </div>
            <p className="text-base md:text-xl lg:text-3xl font-light mb-4 md:mb-6 max-w-lg mx-auto lg:mx-0 text-white/90 font-serif">
              Din kilde til Simca, Talbot og Matra klassikere. Bildeler og historier fra entusiaster i Norge.
            </p>
            
            {/* Enhanced CTA buttons - smaller on mobile */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start">
              <Link to="/biler" className="btn-enamel-red group">
                <span>Se alle biler</span>
                <ArrowRight className="w-4 h-4 md:w-6 md:h-6 ml-2 md:ml-3 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/deler" className="btn-enamel-blue group">
                <span>Finn deler</span>
                <Car className="w-4 h-4 md:w-6 md:h-6 ml-2 md:ml-3 group-hover:scale-110 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Featured Car - Månedens bil */}
          <div ref={cardRef} className={`relative transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Section Header */}
            <div className="text-center mb-4 relative z-10">
              <h2 className="font-display text-2xl md:text-3xl text-white flex items-center justify-center gap-2">
                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]" />
                Månedens bil
              </h2>
              <p className="font-serif text-sm text-white/50 mt-1">
                {new Date().toLocaleDateString('nb-NO', {
                month: 'long',
                year: 'numeric'
              })}
              </p>
            </div>

            {/* Spotlight/vignette background */}
            <div className="absolute inset-0 -inset-x-8 -inset-y-4 rounded-3xl bg-radial-spotlight pointer-events-none z-0" />

            {isLoading ? <div className="featured-card-premium p-6 relative z-10">
                <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                <div className="mt-4">
                  <Skeleton className="h-6 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
                </div>
              </div> : featuredCar ? <Link to={`/biler/${featuredCar.slug}`} className="block featured-card-premium p-5 transition-all duration-300 group relative overflow-hidden z-10">
                {/* Checkered flag background with wave animation */}
                <div className={`absolute inset-0 pointer-events-none checkered-flag-wave z-[1] ${isInView ? 'animate-flag-fade-in' : 'opacity-0'}`} style={{
              backgroundImage: `url(${checkeredFlag})`,
              backgroundSize: '150%',
              backgroundPosition: 'top left',
              backgroundRepeat: 'no-repeat'
            }} />
                
                {/* Car image with dark gradient for text readability */}
                {getMainImage(featuredCar) ? <div className="overflow-hidden rounded-lg relative z-[2] car-finish-glow">
                    <img src={getMainImage(featuredCar)!.image_url} alt={getMainImage(featuredCar)!.alt_text || featuredCar.title} className="w-full aspect-[16/10] object-cover shadow-lg group-hover:scale-105 transition-transform duration-500" />
                    {/* Dark gradient at bottom for text readability */}
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    {/* Subtle shine overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div> : <div className="aspect-[16/10] bg-white/20 rounded-lg flex items-center justify-center relative z-[2]">
                    <Car className="w-24 h-24 opacity-50" />
                  </div>}
                
                {/* Text content with enhanced contrast */}
                <div className="mt-5 text-center relative z-[2]">
                  <p className="font-display text-3xl font-bold text-white featured-title-glow">{featuredCar.title}</p>
                  <p className="font-serif text-lg text-white/90 mt-1 drop-shadow-md">
                    {featuredCar.year && `${featuredCar.year} · `}{featuredCar.model}
                  </p>
                </div>
              </Link> : <div className="featured-card-premium p-8 relative overflow-hidden z-10">
                {/* Checkered flag background for empty state */}
                <div className="absolute inset-0 pointer-events-none checkered-flag-wave" style={{
              backgroundImage: `url(${checkeredFlag})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }} />
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-black/50 via-transparent to-black/60 z-[1]" />
                
                <div className="aspect-[16/10] bg-white/20 rounded-lg flex items-center justify-center relative z-[2]">
                  <div className="text-center">
                    <Car className="w-24 h-24 mx-auto mb-4 opacity-50" />
                    <p className="font-display text-2xl text-white/75">MÅNEDENS BIL</p>
                    <p className="font-serif italic text-white/60">Kommer snart...</p>
                  </div>
                </div>
              </div>}
            
            {/* Decorative badge - enhanced emblem style */}
            
          </div>
        </div>
      </div>
    </section>;
}