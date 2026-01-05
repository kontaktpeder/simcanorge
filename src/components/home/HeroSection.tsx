import { Link } from "react-router-dom";
import { ArrowRight, Car, Star, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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
    <section className="poster-section poster-section-blue hero-watermark relative overflow-hidden">
      {/* Subtle stripes overlay */}
      <div className="absolute inset-0 stripes-diagonal" />
      
      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <span className="inline-block font-serif italic text-xl mb-4 opacity-90">
              Bienvenue chez
            </span>
            <h1 className="headline-xl mb-6 text-metal text-shadow-retro">
              SIMCA<br />NORGE
            </h1>
            <p className="text-xl md:text-2xl font-light mb-8 max-w-lg mx-auto lg:mx-0 text-white/90">
              Din kilde til franske klassikere, deler og historier fra Simca-entusiaster i Norge.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/biler" className="btn-enamel-red">
                Se alle biler
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link 
                to="/deler" 
                className="btn-enamel-blue"
              >
                Finn deler
                <Car className="w-5 h-5 ml-2" />
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
                className="block border-chrome-dark card-enamel bg-white/10 backdrop-blur-sm p-4 hover-lift transition-all hover:shadow-2xl"
              >
                {getMainImage(featuredCar) ? (
                  <img
                    src={getMainImage(featuredCar)!.image_url}
                    alt={getMainImage(featuredCar)!.alt_text || featuredCar.title}
                    className="w-full aspect-[4/3] object-cover rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="aspect-[4/3] bg-white/20 rounded-lg flex items-center justify-center">
                    <Car className="w-24 h-24 opacity-50" />
                  </div>
                )}
                <div className="mt-4 text-center">
                  <p className="font-display text-2xl text-white">
                    {featuredCar.year && `${featuredCar.year} `}{featuredCar.model.toUpperCase()}
                  </p>
                  <p className="font-serif italic text-white/80">{featuredCar.title}</p>
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
              className="absolute -top-4 -right-4 px-5 py-2 font-display text-lg rotate-12 flex items-center gap-2 hover:scale-105 transition-transform btn-enamel-red shadow-xl"
            >
              <Star className="w-4 h-4 fill-current" />
              MÅNEDENS BIL
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
