import { Layout } from "@/components/layout/Layout";
import { SeoHead } from "@/components/seo";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getResponsiveImageProps, IMAGE_SIZES } from "@/lib/imageUtils";
import { applyPublicCarsApprovalFilter } from "@/lib/publicCarsFilter";
import { formatCarHeading } from "@/lib/carTitle";
interface Car {
  id: string;
  slug: string;
  title: string;
  brand?: string | null;
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
      } = await applyPublicCarsApprovalFilter(
        supabase.from("cars").select(`
          *,
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
      } = await applyPublicCarsApprovalFilter(
        supabase.from("cars").select(`
          *,
          car_images (
            image_url,
            alt_text,
            sort_order
          )
        `).not("published_at", "is", null).lte("published_at", new Date().toISOString()).order("published_at", {
          ascending: false
        }).limit(6)
      );
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
  const featuredImage = featuredCar ? getMainImage(featuredCar) : null;

  return (
    <Layout>
      <SeoHead
        title="Månedens bil | Simca Norge"
        description="Hver måned løfter vi frem én bil fra fellesskapet."
        canonicalPath="/manedens-bil"
      />
      <div className="-mt-16 pt-16 min-h-full bg-[#f6f3ee] text-[#1c1917]">
        <section className="border-b border-black/10">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 md:py-12">
            <p className="font-display text-lg tracking-[0.12em] uppercase text-[#C10D0D]">
              Simca Norge
            </p>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl uppercase leading-none text-[#071628] mt-1">
              Månedens bil
            </h1>
            <p className="font-sans text-base md:text-lg text-[#1c1917]/75 mt-3 max-w-xl leading-relaxed">
              Hver måned løfter vi frem én bil fra fellesskapet.
            </p>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-8 md:py-12">
          <div className="max-w-[1100px] mx-auto">
            {isLoading ? (
              <div className="grid lg:grid-cols-2 gap-8">
                <Skeleton className="aspect-[4/3] w-full rounded-xl bg-white" />
                <div className="space-y-4">
                  <Skeleton className="h-12 w-3/4 bg-white" />
                  <Skeleton className="h-6 w-1/2 bg-white" />
                  <Skeleton className="h-32 w-full bg-white" />
                </div>
              </div>
            ) : featuredCar ? (
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
                <div className="relative">
                  {featuredImage ? (
                    <img
                      {...getResponsiveImageProps(featuredImage.image_url, featuredImage.alt_text || featuredCar.title, { sizes: IMAGE_SIZES.hero, priority: true })}
                      className="w-full aspect-[4/3] object-cover rounded-xl border border-black/10 bg-white"
                    />
                  ) : (
                    <div className="w-full aspect-[4/3] rounded-xl border border-black/10 bg-white flex items-center justify-center">
                      <span className="font-sans text-[#1c1917]/40">Ingen bilde</span>
                    </div>
                  )}
                  <span className="absolute top-4 left-4 bg-[#C10D0D] text-white px-3 py-1 font-display text-lg uppercase tracking-wide rounded-lg">
                    Månedens bil
                  </span>
                </div>

                <div>
                  <h2 className="font-display text-4xl md:text-5xl uppercase leading-none text-[#071628]">
                    {formatCarHeading({ title: featuredCar.title, brand: featuredCar.brand, model: featuredCar.model, year: featuredCar.year })}
                  </h2>
                  <p className="font-sans text-base text-[#1c1917]/65 mt-3 flex items-center gap-3">
                    <span>{featuredCar.model}</span>
                    {featuredCar.year && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {featuredCar.year}
                      </span>
                    )}
                  </p>

                  {featuredCar.tags && featuredCar.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-5">
                      {featuredCar.tags.map((tag, index) => (
                        <span key={index} className="bg-white border border-black/10 text-[#071628] px-3 py-1 text-sm font-sans rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {featuredCar.story && (
                    <p className="font-sans text-base md:text-lg leading-relaxed text-[#1c1917]/80 mt-6">
                      {featuredCar.story.length > 500 ? `${featuredCar.story.substring(0, 500)}...` : featuredCar.story}
                    </p>
                  )}

                  <Link to={`/biler/${featuredCar.slug}`} className="btn-enamel-red mt-8">
                    Les hele historien
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl border border-black/10">
                <Star className="w-12 h-12 text-[#1c1917]/25 mx-auto mb-4" />
                <h2 className="font-display text-3xl uppercase text-[#071628]">Ingen månedens bil akkurat nå</h2>
                <p className="font-sans text-base text-[#1c1917]/65 mt-3 mb-6">
                  Vi velger snart en ny bil å løfte frem.
                </p>
                <Link to="/biler" className="btn-enamel-red">
                  Se alle biler
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {previousCars && previousCars.length > 0 && (
          <section className="px-3 sm:px-6 pb-10 md:pb-14">
            <div className="max-w-[1100px] mx-auto">
              <h2 className="font-display text-3xl md:text-4xl uppercase text-[#071628] mb-5">
                Tidligere biler
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {previousCars.map((car) => {
                  const mainImage = getMainImage(car);
                  const meta = [car.year, car.model].filter(Boolean).join(" · ");
                  return (
                    <Link key={car.id} to={`/biler/${car.slug}`} className="group block">
                      {mainImage ? (
                        <img
                          {...getResponsiveImageProps(mainImage.image_url, mainImage.alt_text || car.title, { sizes: IMAGE_SIZES.card, loading: "lazy" })}
                          className="w-full aspect-[4/3] object-cover rounded-xl border border-black/10 bg-white"
                        />
                      ) : (
                        <div className="w-full aspect-[4/3] rounded-xl border border-black/10 bg-white" />
                      )}
                      <p className="font-sans text-sm text-[#1c1917]/60 mt-2">{meta}</p>
                      <h3 className="font-display text-xl sm:text-2xl uppercase leading-none text-[#071628] mt-0.5 line-clamp-2 group-hover:text-[#C10D0D] transition-colors">
                        {formatCarHeading({ title: car.title, brand: car.brand, model: car.model, year: car.year })}
                      </h3>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <section className="border-t border-black/10 bg-white px-4 py-12 md:py-16 text-center">
          <h2 className="font-display text-3xl md:text-5xl uppercase text-[#071628]">
            Har du en bil å dele?
          </h2>
          <p className="font-sans text-base text-[#1c1917]/70 mt-3 mb-6 max-w-md mx-auto">
            Kanskje blir din bil neste månedens bil.
          </p>
          <Link to="/legg-til-bil" className="btn-enamel-red">
            Legg inn bilen din
          </Link>
        </section>
      </div>
    </Layout>
  );
};
export default ManedensBil;