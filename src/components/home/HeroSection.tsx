import { Link } from "react-router-dom";
import { ArrowRight, Car, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import simcaBadge from "@/assets/simca-badge.png";
import simcaSwallow from "@/assets/simca-swallow.png";

interface FeaturedCar {
  id: string;
  slug: string;
  title: string;
  model: string;
  year: number | null;
  story: string | null;
  car_images: { image_url: string; alt_text: string | null; sort_order: number | null }[];
}

export function HeroSection() {
  const { data: featuredCar, isLoading } = useQuery({
    queryKey: ["featured-car-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select(`
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
        `)
        .eq("featured", true)
        .not("published_at", "is", null)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as FeaturedCar | null;
    },
  });

  const getMainImage = (car: FeaturedCar) => {
    if (!car.car_images || car.car_images.length === 0) return null;
    const sorted = [...car.car_images].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    return sorted[0];
  };

  return (
    <section className="poster-section poster-section-blue hero-watermark relative overflow-hidden min-h-[85vh] flex items-center">
      {/* Subtle stripes overlay */}
      <div className="absolute inset-0 stripes-diagonal" />
      
      {/* Large swallow watermark */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${simcaSwallow})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: '75% 50%',
          backgroundSize: '800px',
          opacity: 0.10,
          filter: 'blur(0.5px)',
          transform: 'rotate(-8deg)',
        }}
      />
      
      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-4 mb-6">
              <img 
                src={simcaBadge} 
                alt="Simca Norge badge" 
                className="h-24 md:h-32 w-auto drop-shadow-2xl"
              />
            </div>
            
            <span className="inline-block font-serif italic text-xl md:text-2xl mb-4 text-white/90">
              Bienvenue chez
            </span>
            <h1 className="headline-xl mb-6 text-shadow-retro">
              <span className="text-metal">SIMCA</span><br />
              <span className="text-metal">NORGE</span>
            </h1>
            <p className="text-xl md:text-2xl font-light mb-10 max-w-lg mx-auto lg:mx-0 text-white/90">
              Din kilde til franske klassikere, deler og historier fra Simca-entusiaster i Norge.
            </p>
            
            {/* Enhanced CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/biler" className="btn-enamel-red group text-lg md:text-xl px-10 py-5">
                <span>Se alle biler</span>
                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/deler" 
                className="btn-enamel-blue group text-lg md:text-xl px-10 py-5"
              >
                <span>Finn deler</span>
                <Car className="w-6 h-6 ml-3 group-hover:scale-110 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Featured Car - Månedens bil */}
          <div className="relative">
            {isLoading ? (
              <div className="border-chrome-dark card-enamel bg-white/10 backdrop-blur-sm p-6">
                <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                <div className="mt-4">
                  <Skeleton className="h-6 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
                </div>
              </div>
            ) : featuredCar ? (
              <Link 
                to={`/biler/${featuredCar.slug}`}
                className="block border-chrome-dark card-enamel bg-white/10 backdrop-blur-sm p-5 hover-lift transition-all hover:shadow-2xl group"
              >
                {getMainImage(featuredCar) ? (
                  <div className="overflow-hidden rounded-lg">
                    <img
                      src={getMainImage(featuredCar)!.image_url}
                      alt={getMainImage(featuredCar)!.alt_text || featuredCar.title}
                      className="w-full aspect-[4/3] object-cover shadow-lg group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-white/20 rounded-lg flex items-center justify-center">
                    <Car className="w-24 h-24 opacity-50" />
                  </div>
                )}
                <div className="mt-5 text-center">
                  <p className="font-display text-3xl text-white">
                    {featuredCar.year && `${featuredCar.year} `}{featuredCar.model.toUpperCase()}
                  </p>
                  <p className="font-serif italic text-lg text-white/80">{featuredCar.title}</p>
                </div>
              </Link>
            ) : (
              <div className="border-chrome-dark card-enamel bg-white/10 backdrop-blur-sm p-8">
                <div className="aspect-[4/3] bg-white/20 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Car className="w-24 h-24 mx-auto mb-4 opacity-50" />
                    <p className="font-display text-2xl text-white/75">MÅNEDENS BIL</p>
                    <p className="font-serif italic text-white/60">Kommer snart...</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Decorative badge */}
            <Link
              to="/manedens-bil"
              className="absolute -top-5 -right-5 px-6 py-3 font-display text-xl rotate-12 flex items-center gap-2 hover:scale-110 transition-transform btn-enamel-red shadow-2xl"
            >
              <Star className="w-5 h-5 fill-current" />
              MÅNEDENS BIL
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
