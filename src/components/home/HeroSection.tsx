import { Link } from "react-router-dom";
import { ArrowRight, Car, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useInView } from "@/hooks/useInView";
import { useCarOwnerProfile } from "@/hooks/useOwnerProfile";
import { getResponsiveImageProps, IMAGE_SIZES } from "@/lib/imageUtils";

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

  const { data: ownerProfile } = useCarOwnerProfile(featuredCar?.id);

  const getMainImage = (car: FeaturedCar) => {
    if (!car.car_images || car.car_images.length === 0) return null;
    const sorted = [...car.car_images].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    return sorted[0];
  };
  return <section className="poster-section poster-section-blue hero-watermark relative overflow-hidden min-h-[60vh] md:min-h-[70vh] flex flex-col justify-start pt-2 md:pt-4">
      {/* Gradient transition from sky header into deep navy hero */}
      <div className="absolute inset-x-0 top-0 h-24 md:h-32 bg-gradient-to-b from-[#1a4a7a]/60 via-[#0B2A55]/80 to-transparent z-[1] pointer-events-none" />
      <div className="absolute inset-0 stripes-diagonal" />
      
      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-3 md:gap-8 items-start">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center mb-1 md:mb-4">
              <img 
                src="/simca-badge.png" 
                alt="Simca Norge" 
                className="h-32 md:h-44 lg:h-56 xl:h-64 w-auto" 
                loading="eager"
                fetchPriority="high"
                onError={(e) => {
                  const el = e.currentTarget;
                  el.onerror = null;
                  el.src = '/favicon.png';
                }}
                style={{
                  filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4)) drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                }}
              />
            </div>
            <p className="text-sm md:text-lg lg:text-2xl font-light mb-2 md:mb-4 max-w-lg mx-auto lg:mx-0 text-white/90 font-serif">
              Din kilde til Simca, Talbot og Matra klassikere. Bildeler og historier fra entusiaster i Norge.
            </p>
            
            {/* Featured Car - Månedens bil - MOBILE ONLY above CTA */}
            <div ref={mobileCardRef} className={`lg:hidden mb-3 transition-all duration-700 ${isMobileInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="text-center mb-1.5">
                <h2 className="font-display text-base text-white flex items-center justify-center gap-2">
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
                </div> : featuredCar ? <Link to={`/biler/${featuredCar.slug}`} className="block bg-white/10 backdrop-blur-sm rounded-xl p-2 transition-all duration-300 group overflow-hidden">
                  {getMainImage(featuredCar) ? <div className="overflow-hidden rounded-lg relative">
                      <img 
                        {...getResponsiveImageProps(
                          getMainImage(featuredCar)!.image_url,
                          getMainImage(featuredCar)!.alt_text || featuredCar.title,
                          { sizes: IMAGE_SIZES.featured, priority: true }
                        )}
                        className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div> : <div className="aspect-[16/10] bg-white/20 rounded-lg flex items-center justify-center">
                      <Car className="w-16 h-16 opacity-50" />
                    </div>}
                  
                  <div className="mt-1.5 text-center">
                    <p className="font-display text-sm font-bold text-white">{featuredCar.title}</p>
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
            
            {/* CTA buttons */}
            <div className="flex flex-row gap-2 md:gap-4 justify-center lg:justify-start">
              <Link 
                to="/biler" 
                className="group inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 md:min-h-[48px] md:px-8 md:py-4 font-display text-xs md:text-xl uppercase tracking-wide text-white rounded-full active:scale-[0.97] transition-all hover:brightness-110"
                style={{
                  background: 'linear-gradient(135deg, #E52020 0%, #B80C0C 100%)',
                  boxShadow: '0 4px 20px rgba(229,32,32,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
                }}
              >
                <span className="drop-shadow-sm font-bold">Se alle biler</span>
                <ArrowRight className="w-3.5 h-3.5 md:w-5 md:h-5 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              
              <Link 
                to="/markedsplass" 
                className="group inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 md:min-h-[48px] md:px-6 md:py-3.5 font-display text-xs md:text-lg uppercase tracking-wide text-white rounded-full active:scale-[0.97] transition-all hover:brightness-110"
                style={{
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  boxShadow: '0 4px 20px rgba(37,99,235,0.45), inset 0 1px 0 rgba(255,255,255,0.2)',
                }}
              >
                <span className="drop-shadow-sm font-bold">Markedsplass</span>
                <Car className="w-3.5 h-3.5 md:w-5 md:h-5 ml-1.5 group-hover:scale-110 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Featured Car - DESKTOP ONLY */}
          <div ref={desktopCardRef} className={`hidden lg:block relative transition-all duration-700 ${isDesktopInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
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

            <div className="absolute inset-0 -inset-x-8 -inset-y-4 rounded-3xl bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none z-0" />

            {isLoading ? <div className="featured-card-premium p-6 relative z-10">
                <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                <div className="mt-4">
                  <Skeleton className="h-6 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
                </div>
              </div> : featuredCar ? <Link to={`/biler/${featuredCar.slug}`} className="block featured-card-premium p-5 transition-all duration-300 group relative overflow-hidden z-10">
                <div className={`absolute inset-0 pointer-events-none checkered-flag-wave z-[1] ${isDesktopInView ? 'animate-flag-fade-in' : 'opacity-0'}`} style={{
              backgroundImage: `url(${checkeredFlag})`,
              backgroundSize: '150%',
              backgroundPosition: 'top left',
              backgroundRepeat: 'no-repeat'
            }} />
                
                {getMainImage(featuredCar) ? <div className="overflow-hidden rounded-lg relative z-[2] car-finish-glow">
                    <img 
                      {...getResponsiveImageProps(
                        getMainImage(featuredCar)!.image_url,
                        getMainImage(featuredCar)!.alt_text || featuredCar.title,
                        { sizes: IMAGE_SIZES.featured, priority: true }
                      )}
                      className="w-full aspect-[16/10] object-cover shadow-lg group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div> : <div className="aspect-[16/10] bg-white/20 rounded-lg flex items-center justify-center relative z-[2]">
                    <Car className="w-24 h-24 opacity-50" />
                  </div>}
                
                <div className="mt-5 text-center relative z-[2] bg-black/50 backdrop-blur-sm rounded-lg px-4 py-3">
                  <p className="font-display text-3xl font-bold text-white featured-title-glow">{featuredCar.title}</p>
                  <p className="font-serif text-lg text-white mt-1" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                    {ownerProfile 
                      ? `Lagt ut av ${ownerProfile.display_name}${ownerProfile.location ? `, ${ownerProfile.location}` : ''}` 
                      : `${featuredCar.year ? `${featuredCar.year} · ` : ''}${featuredCar.model}`}
                  </p>
                </div>
              </Link> : <div className="featured-card-premium p-8 relative overflow-hidden z-10">
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
