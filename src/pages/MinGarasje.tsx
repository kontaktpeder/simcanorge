import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Car, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { BrandLoader } from "@/components/brand/BrandLoader";
import { track, trackScreenViewOnce } from "@/lib/analytics";

const SCREEN = "garage";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

interface CarImage {
  id: string;
  image_url: string;
  sort_order: number | null;
}
interface CarData {
  id: string;
  title: string;
  slug: string;
  status: string;
  year: number | null;
  brand: string | null;
  model: string;
  published_at: string | null;
  car_images: CarImage[];
}
interface MyCar {
  car_id: string;
  role: string;
  cars: CarData;
}

export default function MinGarasje() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate("/login?returnUrl=/min-garasje");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    trackScreenViewOnce(SCREEN);
  }, []);

  const { data: myCars, isLoading } = useQuery({
    queryKey: ["my-cars-min-garasje", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("car_owners")
        .select(
          `car_id, role,
           cars:car_id (id, title, slug, status, year, brand, model, published_at,
             car_images(id, image_url, sort_order))`
        )
        .eq("user_id", user.id)
        .eq("role", "owner")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as MyCar[]) || [];
    },
    enabled: !!user,
  });

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center bg-[#070b10]">
          <BrandLoader />
        </div>
      </Layout>
    );
  }
  if (!user) return null;

  const cars = (myCars ?? []).map((c) => c.cars).filter(Boolean);

  return (
    <Layout>
      <Helmet>
        <title>Min garasje — Bilgarasje.no</title>
      </Helmet>

      <div className="min-h-screen bg-[#070b10] pb-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
          {/* Page heading */}
          <div className="mb-6">
            <div className="text-[10px] uppercase tracking-[0.22em] text-white/40" style={oswald}>
              Mine biler
            </div>
            <div className="flex items-end justify-between gap-4 mt-1">
              <h1 className="text-2xl sm:text-3xl text-white font-bold" style={chakra}>
                Min garasje
              </h1>
              <Link
                to="/legg-til-bil"
                onClick={() => void track("garage_intent_click", "start", { intent: "add_car", source: "header" })}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[11px] tracking-[0.1em] uppercase font-bold text-[#070b10]"
                style={{
                  ...chakra,
                  background: "linear-gradient(135deg, #34eab8 0%, #2ab89a 100%)",
                  boxShadow: "0 0 18px rgba(45,212,168,0.28)",
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                Ny bil
              </Link>
            </div>
            <p className="text-[12px] text-white/45 mt-1.5" style={oswald}>
              {cars.length === 0
                ? "Garasjen er tom — legg inn din første bil."
                : `${cars.length} ${cars.length === 1 ? "bil" : "biler"} i garasjen din.`}
            </p>
          </div>

          {/* Cars grid */}
          {cars.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {cars.map((car, i) => (
                <CarTile key={car.id} car={car} index={i} />
              ))}
              <Link
                to="/legg-til-bil"
                onClick={() => void track("garage_intent_click", "start", { intent: "add_car", source: "tile" })}
                className="group flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] hover:border-[#2dd4a8]/40 transition-all aspect-[16/11]"
              >
                <Plus className="w-5 h-5 text-white/20 group-hover:text-[#2dd4a8]/70 mb-1 transition-colors" />
                <span
                  className="text-[10px] uppercase tracking-[0.12em] text-white/30 group-hover:text-white/55"
                  style={oswald}
                >
                  Legg til bil
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function CarTile({ car, index }: { car: CarData; index: number }) {
  const img = car.car_images?.sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99))[0];
  const isPublished = !!car.published_at;
  const to = isPublished ? `/biler/${car.slug}` : `/dashboard/bil/${car.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.25) }}
    >
      <Link
        to={to}
        onClick={() => void track("start_car_preview_click", "start", { car_id: car.id, published: isPublished })}
        className="group block rounded-xl overflow-hidden border border-white/[0.06] hover:border-[#2dd4a8]/40 transition-all"
        style={{ background: "hsl(215 25% 10%)" }}
      >
        <div className="aspect-[16/11] relative overflow-hidden bg-black/30">
          {img ? (
            <img
              src={img.image_url}
              alt={car.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Car className="w-7 h-7 text-white/10" />
            </div>
          )}
          {!isPublished && (
            <span
              className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold bg-amber-500/20 text-amber-300 backdrop-blur-sm"
              style={oswald}
            >
              Kladd
            </span>
          )}
        </div>
        <div className="p-2.5">
          <p className="text-[12px] text-white/80 font-semibold truncate" style={chakra}>
            {car.title}
          </p>
          {car.year && (
            <p className="text-[10px] text-white/35 mt-0.5" style={oswald}>
              {car.year}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-2xl border border-dashed border-white/10 p-10 text-center"
      style={{ background: "hsl(215 25% 9%)" }}
    >
      <Car className="w-10 h-10 text-white/10 mx-auto mb-4" />
      <h2 className="text-white font-bold text-[16px]" style={chakra}>
        Ingen biler ennå
      </h2>
      <p className="text-[12px] text-white/45 mt-1.5 mb-5 max-w-xs mx-auto" style={oswald}>
        Legg inn din første bil og start historien.
      </p>
      <Link
        to="/legg-til-bil"
        onClick={() => void track("garage_intent_click", "start", { intent: "add_car", source: "empty_state" })}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-[12px] tracking-[0.1em] uppercase font-bold text-[#070b10]"
        style={{
          ...chakra,
          background: "linear-gradient(135deg, #34eab8 0%, #2ab89a 100%)",
          boxShadow: "0 0 20px rgba(45,212,168,0.3)",
        }}
      >
        <Plus className="w-4 h-4" />
        Legg inn bilen din
      </Link>
    </div>
  );
}
