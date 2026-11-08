import { Link } from "react-router-dom";
import { ArrowRight, Car } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useInView } from "@/hooks/useInView";
import { useCarOwnerProfile } from "@/hooks/useOwnerProfile";
import { getResponsiveImageProps, IMAGE_SIZES } from "@/lib/imageUtils";
import { applyPublicCarsApprovalFilter } from "@/lib/publicCarsFilter";
import { formatCarHeading } from "@/lib/carTitle";

import simcaSwallow from "@/assets/simca-swallow.png";

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
      } = await applyPublicCarsApprovalFilter(
        supabase.from("cars").select(`
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
        }).limit(1)
      ).maybeSingle();
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
  return <section className="poster-section poster-section-blue relative overflow-hidden flex flex-col justify-start pt-10 md:pt-16 pb-12 md:pb-16">
      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-3 md:gap-8 items-start">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center mb-2 md:mb-4">
              <img 
                src="/simca-badge.png" 
                alt="Simca Norge" 
                className="h-36 sm:h-40 md:h-72 lg:h-96 xl:h-[28rem] w-auto" 
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
            <p className="font-sans text-base md:text-xl leading-relaxed mb-4 md:mb-6 max-w-lg mx-auto lg:mx-0 text-white/95">
              Din kilde til Simca, Talbot og Matra klassikere. Bildeler og historier fra entusiaster i Norge.
            </p>
            
            {/* Featured Car - Månedens bil - MOBILE ONLY above CTA */}
            <div ref={mobileCardRef} className={`lg:hidden mb-4 transition-all duration-700 ${isMobileInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="text-center mb-1.5">
                <h2 className="font-display text-2xl text-white">
                  Månedens bil
                </h2>
                <p className="font-sans text-base text-white/75 mt-1">
                  {new Date().toLocaleDateString('nb-NO', {
                  month: 'long',
                  year: 'numeric'
                })}
                </p>
              </div>

              {isLoading ? <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <Skeleton className="aspect-[4/3] w-full rounded-lg" />
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
                        className="w-full aspect-[4/3] object-cover"
                      />
                    </div> : <div className="aspect-[4/3] bg-white/20 rounded-lg flex items-center justify-center">
                      <Car className="w-16 h-16 opacity-50" />
                    </div>}
                  
                  <div className="mt-1.5 text-center">
                    <p className="font-display text-2xl text-white">{formatCarHeading({ title: featuredCar.title, model: featuredCar.model, year: featuredCar.year })}</p>
                    <p className="font-sans text-base text-white/85 mt-1">
                      {ownerProfile 
                        ? `Lagt ut av ${ownerProfile.display_name}${ownerProfile.location ? `, ${ownerProfile.location}` : ''}` 
                        : `${featuredCar.year ? `${featuredCar.year} · ` : ''}${featuredCar.model}`}
                    </p>
                  </div>
                </Link> : <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="aspect-[4/3] bg-white/20 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Car className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="font-display text-lg text-white/75">MÅNEDENS BIL</p>
                      <p className="font-sans text-base text-white/70">Kommer snart</p>
                    </div>
                  </div>
                </div>}
            </div>
            
            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start">
              <Link to="/biler" className="btn-enamel-red">
                Se alle biler
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/markedsplass" className="btn-secondary btn-secondary-on-dark">
                Markedsplass
              </Link>
            </div>
          </div>

          {/* Featured Car - DESKTOP ONLY */}
          <div ref={desktopCardRef} className={`hidden lg:block relative transition-all duration-700 ${isDesktopInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="text-center mb-4 relative z-10">
              <h2 className="font-display text-3xl text-white">
                Månedens bil
              </h2>
              <p className="font-sans text-base text-white/75 mt-1">
                {new Date().toLocaleDateString('nb-NO', {
                month: 'long',
                year: 'numeric'
              })}
              </p>
            </div>

            {isLoading ? <div className="relative z-10">
                <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                <div className="mt-4">
                  <Skeleton className="h-6 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
                </div>
              </div> : featuredCar ? <Link to={`/biler/${featuredCar.slug}`} className="block group relative z-10">
                {getMainImage(featuredCar) ? <div className="overflow-hidden rounded-xl bg-white/10">
                    <img 
                      {...getResponsiveImageProps(
                        getMainImage(featuredCar)!.image_url,
                        getMainImage(featuredCar)!.alt_text || featuredCar.title,
                        { sizes: IMAGE_SIZES.featured, priority: true }
                      )}
                      className="w-full aspect-[4/3] object-cover"
                    />
                  </div> : <div className="aspect-[4/3] bg-white/10 rounded-xl flex items-center justify-center">
                    <Car className="w-16 h-16 opacity-50" />
                  </div>}
                
                <div className="mt-4 text-center">
                  <p className="font-display text-3xl text-white">{formatCarHeading({ title: featuredCar.title, model: featuredCar.model, year: featuredCar.year })}</p>
                  <p className="font-sans text-base text-white/80 mt-1">
                    {ownerProfile 
                      ? `Lagt ut av ${ownerProfile.display_name}${ownerProfile.location ? `, ${ownerProfile.location}` : ''}` 
                      : `${featuredCar.year ? `${featuredCar.year} · ` : ''}${featuredCar.model}`}
                  </p>
                </div>
              </Link> : <div className="relative z-10">
                <div className="aspect-[4/3] bg-white/10 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <Car className="w-24 h-24 mx-auto mb-4 opacity-50" />
                    <p className="font-display text-2xl text-white/75">MÅNEDENS BIL</p>
                    <p className="font-sans text-base text-white/70">Kommer snart</p>
                  </div>
                </div>
              </div>}
          </div>
        </div>
      </div>
    </section>;
}
