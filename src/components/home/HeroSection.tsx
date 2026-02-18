import { Link } from "react-router-dom";
import { ArrowRight, Car, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useInView } from "@/hooks/useInView";
import { useCarOwnerProfile } from "@/hooks/useOwnerProfile";
import { getResponsiveImageProps, IMAGE_SIZES } from "@/lib/imageUtils";
import { FadeImage } from "@/components/ui/FadeImage";
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
    ref: mobileCardRef,
    isInView: isMobileInView
  } = useInView();
  const {
    ref: desktopCardRef,
    isInView: isDesktopInView
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

  // Fetch owner profile for the featured car
  const { data: ownerProfile } = useCarOwnerProfile(featuredCar?.id);

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
              <FadeImage 
                src={simcaBadge} 
                alt="Simca Norge" 
                className="h-40 md:h-72 lg:h-96 xl:h-[28rem] w-auto" 
                fadeDuration={500}
                style={{
                  filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4)) drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                }} 
              />
            </div>
            <p className="text-base md:text-xl lg:text-3xl font-light mb-4 md:mb-6 max-w-lg mx-auto lg:mx-0 text-white/90 font-serif">
              Din kilde til Simca, Talbot og Matra klassikere. Bildeler og historier fra entusiaster i Norge.
            </p>
            
            {/* Featured Car - Månedens bil - MOBILE ONLY above CTA */}
            <div ref={mobileCardRef} className={`lg:hidden mb-6 transition-all duration-700 ${isMobileInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              {/* Section Header */}
              <div className="text-center mb-3">
                <h2 className="font-display text-xl text-white flex items-center justify-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]" />
                  Månedens bil
                </h2>
                <p className="font-serif text-xs text-white/50 mt-0.5">
                  {new Date().toLocaleDateString('nb-NO', {
                  month: 'long',
                  year: 'numeric'
                })}
                </p>
              </div>

              {isLoading ? <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <Skeleton className="aspect-[16/10] w-full rounded-lg" />
                  <div className="mt-3">
                    <Skeleton className="h-5 w-3/4 mx-auto" />
                    <Skeleton className="h-4 w-1/2 mx-auto mt-1.5" />
                  </div>
                </div> : featuredCar ? <Link to={`/biler/${featuredCar.slug}`} className="block bg-white/10 backdrop-blur-sm rounded-xl p-3 transition-all duration-300 group overflow-hidden">
                  {/* Car image */}
                  {getMainImage(featuredCar) ? <div className="overflow-hidden rounded-lg relative">
                      <FadeImage 
                        {...getResponsiveImageProps(
                          getMainImage(featuredCar)!.image_url,
                          getMainImage(featuredCar)!.alt_text || featuredCar.title,
                          { sizes: IMAGE_SIZES.featured, loading: 'lazy' }
                        )}
                        fadeDuration={400}
                        className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    </div> : <div className="aspect-[16/10] bg-white/20 rounded-lg flex items-center justify-center">
                      <Car className="w-16 h-16 opacity-50" />
                    </div>}
                  
                  {/* Text content */}
                  <div className="mt-3 text-center">
                    <p className="font-display text-lg font-bold text-white">{featuredCar.title}</p>
                    <p className="font-serif text-sm text-white/80 mt-0.5">
                      {ownerProfile 
                        ? `Lagt ut av ${ownerProfile.display_name}${ownerProfile.location ? `, ${ownerProfile.location}` : ''}` 
                        : `${featuredCar.year ? `${featuredCar.year} · ` : ''}${featuredCar.model}`}
                    </p>
                  </div>
                </Link> : <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="aspect-[16/10] bg-white/20 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Car className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="font-display text-lg text-white/75">MÅNEDENS BIL</p>
                      <p className="font-serif italic text-sm text-white/60">Kommer snart...</p>
                    </div>
                  </div>
                </div>}
            </div>
            
            {/* Enhanced CTA buttons with enamel effect */}
            <div className="flex flex-row gap-3 md:gap-4 justify-center lg:justify-start">
              {/* Primary CTA - Red enamel, larger - min 48px touch target */}
              <Link 
                to="/biler" 
                className="group relative inline-flex items-center justify-center min-h-[48px] px-6 py-3 md:px-8 md:py-4 font-display text-sm md:text-xl uppercase tracking-wide text-white overflow-hidden active:scale-[0.98] transition-transform"
                style={{
                  background: 'linear-gradient(180deg, #E52020 0%, #D41515 25%, #C10D0D 50%, #9A0A0A 100%)',
                  borderRadius: '10px',
                  boxShadow: `
                    inset 0 1px 0 rgba(255,255,255,0.35),
                    inset 0 -2px 6px rgba(0,0,0,0.25),
                    0 4px 16px rgba(154,10,10,0.4),
                    0 0 0 2px rgba(255,255,255,0.15)
                  `,
                }}
              >
                {/* Chrome border effect */}
                <span 
                  className="absolute inset-0 rounded-[10px] pointer-events-none"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
                  }}
                />
                <span className="relative z-10 drop-shadow-md">SE ALLE BILER</span>
                <ArrowRight className="relative z-10 w-4 h-4 md:w-5 md:h-5 ml-2 group-hover:translate-x-1 transition-transform drop-shadow-md" />
              </Link>
              
              {/* Secondary CTA - Blue metallic, slightly smaller - min 48px touch target */}
              <Link 
                to="/markedsplass" 
                className="group relative inline-flex items-center justify-center min-h-[48px] px-5 py-3 md:px-6 md:py-3.5 font-display text-xs md:text-lg uppercase tracking-wide text-white overflow-hidden active:scale-[0.98] transition-transform"
                style={{
                  background: 'linear-gradient(180deg, #3A8AE3 0%, #2B7BD4 25%, #1F66B5 50%, #0F3E7A 100%)',
                  borderRadius: '10px',
                  boxShadow: `
                    inset 0 1px 0 rgba(255,255,255,0.3),
                    inset 0 -2px 6px rgba(0,0,0,0.2),
                    0 4px 12px rgba(15,62,122,0.35),
                    0 0 0 2px rgba(255,255,255,0.1)
                  `,
                }}
              >
                {/* Chrome border effect */}
                <span 
                  className="absolute inset-0 rounded-[10px] pointer-events-none"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
                  }}
                />
                <span className="relative z-10 drop-shadow-md">MARKEDSPLASS</span>
                <Car className="relative z-10 w-3.5 h-3.5 md:w-5 md:h-5 ml-2 group-hover:scale-110 transition-transform drop-shadow-md" />
              </Link>
            </div>
          </div>

          {/* Featured Car - Månedens bil - DESKTOP ONLY */}
          <div ref={desktopCardRef} className={`hidden lg:block relative transition-all duration-700 ${isDesktopInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
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
                <div className={`absolute inset-0 pointer-events-none checkered-flag-wave z-[1] ${isDesktopInView ? 'animate-flag-fade-in' : 'opacity-0'}`} style={{
              backgroundImage: `url(${checkeredFlag})`,
              backgroundSize: '150%',
              backgroundPosition: 'top left',
              backgroundRepeat: 'no-repeat'
            }} />
                
                {/* Car image with dark gradient for text readability */}
                {getMainImage(featuredCar) ? <div className="overflow-hidden rounded-lg relative z-[2] car-finish-glow">
                    <FadeImage 
                      {...getResponsiveImageProps(
                        getMainImage(featuredCar)!.image_url,
                        getMainImage(featuredCar)!.alt_text || featuredCar.title,
                        { sizes: IMAGE_SIZES.featured, priority: true }
                      )}
                      fadeDuration={500}
                      className="w-full aspect-[16/10] object-cover shadow-lg group-hover:scale-105 transition-transform duration-500" 
                    />
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
                    {ownerProfile 
                      ? `Lagt ut av ${ownerProfile.display_name}${ownerProfile.location ? `, ${ownerProfile.location}` : ''}` 
                      : `${featuredCar.year ? `${featuredCar.year} · ` : ''}${featuredCar.model}`}
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
          </div>
        </div>
      </div>
    </section>;
}