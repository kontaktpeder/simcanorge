import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Car, Plus, ChevronRight, ArrowLeft, User, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { BrandLoader } from "@/components/brand/BrandLoader";
import { track, trackScreenViewOnce } from "@/lib/analytics";
import { SITE_NAME } from "@/config/site";

const SCREEN = "garage";

// Vegvesen-inspirert palett (samme som PublishComposer)
const VV_BG = "#f3f3f3";
const VV_YELLOW = "#fcc419";
const VV_YELLOW_SOFT = "#fff4d1";
const VV_DARK = "#2b2b2b";

const fontStack = { fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" } as const;

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
        <div className="min-h-[60vh] flex items-center justify-center" style={{ backgroundColor: VV_BG }}>
          <BrandLoader />
        </div>
      </Layout>
    );
  }
  if (!user) return null;

  const cars = (myCars ?? []).map((c) => c.cars).filter(Boolean);
  const published = cars.filter((c) => !!c.published_at).length;
  const drafts = cars.length - published;

  return (
    <Layout>
      <Helmet>
        <title>Min garasje — {SITE_NAME}</title>
      </Helmet>

      <div className="min-h-screen pb-32 text-neutral-900" style={{ backgroundColor: VV_BG, ...fontStack }}>
        {/* Topbar */}
        <div className="bg-white border-b border-black/[0.06]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-9 h-9 -ml-2 inline-flex items-center justify-center rounded-full hover:bg-black/5 text-neutral-700"
              aria-label="Tilbake"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2} />
            </button>
            <h1 className="text-[15px] font-semibold tracking-tight">Min garasje</h1>
            <div className="ml-auto flex items-center gap-2">
              <Link
                to="/dashboard/min-profil"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold text-neutral-700 bg-black/[0.04] hover:bg-black/[0.07] transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                Profil
              </Link>
              <Link
                to="/konto"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold text-neutral-700 bg-black/[0.04] hover:bg-black/[0.07] transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                Konto
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5">
          {/* Heading + stats */}
          <div className="mb-5">
            <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-neutral-500">
              Mine biler
            </p>
            <h2 className="text-[26px] sm:text-[30px] font-bold leading-tight mt-1">
              {cars.length === 0 ? "Garasjen din er tom" : `${cars.length} ${cars.length === 1 ? "bil" : "biler"} i garasjen`}
            </h2>
            {cars.length > 0 && (
              <p className="text-sm text-neutral-600 mt-1.5">
                {published} publisert · {drafts} kladd
              </p>
            )}
          </div>

          {/* Primary action card */}
          <Link
            to="/legg-til-bil"
            onClick={() => void track("garage_add_car_click", "garage", { intent: "add_car", source: "primary_card" })}
            className="group flex items-center gap-4 rounded-2xl bg-white border border-black/[0.08] p-4 sm:p-5 mb-6 hover:border-black/20 transition-colors"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-black/5"
              style={{ backgroundColor: VV_YELLOW_SOFT }}
            >
              <Plus className="w-6 h-6" style={{ color: VV_DARK }} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold leading-snug">Legg til en bil</p>
              <p className="text-[13px] text-neutral-600 mt-0.5">Start historien til en ny bil i garasjen.</p>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-700 transition-colors shrink-0" />
          </Link>

          {/* Cars */}
          {cars.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-neutral-500 mb-2.5 px-1">
                Bilene dine
              </p>
              <div className="grid grid-cols-2 gap-3">
                {cars.map((car, i) => (
                  <CarTile key={car.id} car={car} index={i} />
                ))}
              </div>
            </>
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
        onClick={() => void track("garage_car_click", "garage", { car_id: car.id, published: isPublished })}
        className="group block rounded-2xl overflow-hidden border border-black/[0.08] bg-white hover:border-black/20 transition-colors"
      >
        <div className="aspect-[4/3] relative overflow-hidden bg-neutral-100">
          {img ? (
            <img
              src={img.image_url}
              alt={car.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Car className="w-8 h-8 text-neutral-300" />
            </div>
          )}
          {!isPublished && (
            <span
              className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border border-black/5"
              style={{ backgroundColor: VV_YELLOW, color: VV_DARK }}
            >
              Kladd
            </span>
          )}
        </div>
        <div className="p-3">
          <p className="text-[13px] font-semibold text-neutral-900 truncate leading-snug">
            {car.title}
          </p>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            {car.year ?? (isPublished ? "Publisert" : "Kladd")}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-black/15 bg-white p-8 text-center">
      <div
        className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 border border-black/5"
        style={{ backgroundColor: VV_YELLOW_SOFT }}
      >
        <Car className="w-7 h-7" style={{ color: VV_DARK }} />
      </div>
      <h3 className="text-[17px] font-bold text-neutral-900">Ingen biler ennå</h3>
      <p className="text-[13px] text-neutral-600 mt-1.5 mb-5 max-w-xs mx-auto">
        Legg inn din første bil og bygg historien dens her i garasjen.
      </p>
      <Link
        to="/legg-til-bil"
        onClick={() => void track("garage_add_car_click", "garage", { intent: "add_car", source: "empty_state" })}
        className="inline-flex items-center gap-2 px-5 h-11 rounded-full text-[14px] font-bold"
        style={{ backgroundColor: VV_DARK, color: VV_YELLOW }}
      >
        <Plus className="w-4 h-4" strokeWidth={2.5} />
        Legg inn bilen din
      </Link>
    </div>
  );
}
