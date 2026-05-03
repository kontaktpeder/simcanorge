import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Car, Eye, Warehouse, ChevronRight, Plus, Footprints, Users, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFeatures } from "@/hooks/useFeatures";
import { Layout } from "@/components/layout/Layout";
import { BrandLoader } from "@/components/brand/BrandLoader";
import { LastTripCard } from "@/components/activity/LastTripCard";
import { SpotCarDialog } from "@/components/car/SpotCarDialog";
import { useLatestCompletedSession } from "@/hooks/useLatestCompletedSession";
import { useActivitySession, type ActivityType } from "@/hooks/useActivitySession";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { track, trackScreenViewOnce } from "@/lib/analytics";
import { resolveSpottingCoverFromRow } from "@/lib/spottingMedia";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

const ACTIVITY_TYPES: {
  value: ActivityType;
  label: string;
  desc: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "drive", label: "Kjøretur", desc: "Du kjører en bil", Icon: Car },
  { value: "walk_spotting", label: "Spotting", desc: "Til fots, ser biler", Icon: Footprints },
  { value: "meetup", label: "Treff", desc: "Du er på et arrangement", Icon: Users },
];

interface CarImageMini {
  id?: string;
  image_url: string;
  sort_order: number | null;
}
interface CarEventMini {
  visibility: string;
  occurred_at: string;
  car_event_images: { image_url: string; sort_order: number }[] | null;
}
interface CarMini {
  id: string;
  title: string;
  slug: string;
  year: number | null;
  brand: string | null;
  published_at: string | null;
  source?: string | null;
  identification_status?: string | null;
  car_images: CarImageMini[];
  car_events?: CarEventMini[] | null;
}


/**
 * Start.tsx — ny default landing for innloggede brukere.
 *
 * Seksjoner:
 *   1. Intensjon (Kjør tur / Spot bil / Gå til garasjen)
 *   2. Siste aktivitet
 *   3. Mine biler — preview, maks 2
 *   4. Utforsk verden — preview, maks 2
 *
 * Selve garasjen ligger på /min-garasje (egen side, urørt).
 */
export default function Start() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const features = useFeatures();
  const activitiesEnabled = !!features.activitySessions;
  const navigate = useNavigate();
  const { startSession, isStarting } = useActivitySession({ enabled: activitiesEnabled });
  const [drivePickerOpen, setDrivePickerOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login?returnUrl=%2Fapp", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    trackScreenViewOnce("start");
  }, []);

  const handleStartActivity = async (type: ActivityType) => {
    const intent = type === "drive" ? "drive" : type === "walk_spotting" ? "spot" : "meetup";
    void track(`${intent}_intent_click`, "start", { intent, activity_type: type });
    const result = await startSession(type);
    if (result) {
      void track("session_started", "start", { activity_type: type, source: "start_intent" });
      setDrivePickerOpen(false);
      navigate("/aktiv");
    }
  };

  // ── Mine biler (2 stk preview) ───────────────────────────────────────────
  const { data: myCars } = useQuery({
    queryKey: ["start-my-cars-preview", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("car_owners")
        .select(
          `car_id, role,
           cars:car_id (id, title, slug, year, brand, published_at,
             car_images(id, image_url, sort_order))`
        )
        .eq("user_id", user.id)
        .eq("role", "owner")
        .order("created_at", { ascending: false })
        .limit(2);
      if (error) throw error;
      return ((data as unknown as { cars: CarMini }[]) ?? [])
        .map((r) => r.cars)
        .filter(Boolean);
    },
    enabled: !!user,
  });

  // ── Mine biler total (for "Se alle X biler") ─────────────────────────────
  const { data: myCarsCount } = useQuery({
    queryKey: ["start-my-cars-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("car_owners")
        .select("car_id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("role", "owner");
      return count ?? 0;
    },
    enabled: !!user,
  });

  // ── Utforsk verden — 2 publiserte biler, ferskeste først ─────────────────
  const { data: worldCars } = useQuery({
    queryKey: ["start-world-preview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select(
          `id, title, slug, year, brand, published_at, source, identification_status,
           car_images(id, image_url, sort_order),
           car_events(visibility, occurred_at, car_event_images(image_url, sort_order))`
        )
        .not("published_at", "is", null)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false })
        .limit(2);
      if (error) throw error;
      return (data ?? []) as unknown as CarMini[];
    },
  });

  // ── Siste fullførte aktivitet ────────────────────────────────────────────
  const { data: lastSession } = useLatestCompletedSession();

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 6) return "God natt";
    if (h < 11) return "God morgen";
    if (h < 17) return "Hei";
    return "God kveld";
  }, []);

  if (authLoading || !user) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center bg-[#070b10]">
          <BrandLoader />
        </div>
      </Layout>
    );
  }

  const carsTotal = myCarsCount ?? myCars?.length ?? 0;

  return (
    <Layout>
      <Helmet>
        <title>Hjem — Bilgarasje.no</title>
        <meta name="description" content="Din startskjerm — kjør, spot, og hold styr på garasjen." />
      </Helmet>

      <div className="min-h-screen bg-[#070b10] pb-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 space-y-8">
          {/* ── Header ─────────────────────────────────────────── */}
          <header>
            <div
              className="text-[10px] uppercase tracking-[0.22em] text-white/40"
              style={oswald}
            >
              {greeting}
            </div>
            <h1
              className="text-2xl sm:text-3xl text-white font-bold mt-1"
              style={chakra}
            >
              Hva vil du gjøre i dag?
            </h1>
          </header>

          {/* ── 1. Intensjon ───────────────────────────────────── */}
          <section aria-label="Hva vil du gjøre">
            <div className={`grid ${isAdmin ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"} gap-2.5`}>
              {/* Kjør tur — åpner aktivitets-picker */}
              {activitiesEnabled ? (
                <button
                  type="button"
                  onClick={() => {
                    void track("drive_intent_click", "start", { intent: "drive" });
                    setDrivePickerOpen(true);
                  }}
                  className="block w-full"
                >
                  <IntentBody icon={<Car className="w-5 h-5" />} label="Kjør tur" />
                </button>
              ) : (
                <DisabledIntentTile icon={<Car className="w-5 h-5" />} label="Kjør tur" />
              )}

              {/* Spotting */}
              {activitiesEnabled ? (
                <SpotCarDialog
                  trigger={
                    <button type="button" className="block w-full">
                      <IntentBody icon={<Eye className="w-5 h-5" />} label="Spot bil" />
                    </button>
                  }
                />
              ) : (
                <DisabledIntentTile icon={<Eye className="w-5 h-5" />} label="Spot bil" />
              )}

              {/* Garasjen */}
              <Link
                to="/min-garasje"
                onClick={() =>
                  void track("garage_intent_click", "start", { intent: "garage" })
                }
                className="block"
              >
                <IntentBody icon={<Warehouse className="w-5 h-5" />} label="Garasje" />
              </Link>

              {/* Admin-snarvei (kun for admins) */}
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  onClick={() =>
                    void track("admin_intent_click", "start", { intent: "admin" })
                  }
                  className="block"
                >
                  <IntentBody icon={<Shield className="w-5 h-5" />} label="Admin" />
                </Link>
              )}
            </div>
          </section>

          {/* Aktivitets-/handlingsmeny */}
          <StartActionSheet
            open={drivePickerOpen}
            onOpenChange={setDrivePickerOpen}
            activitiesEnabled={activitiesEnabled}
          />

          {/* ── 2. Siste aktivitet ─────────────────────────────── */}
          {lastSession && (
            <section aria-label="Siste tur">
              <SectionHeader title="Siste aktivitet" />
              <LastTripCard
                summary={lastSession}
                onOpen={() => {
                  void track("start_recent_activity_open", "start", {
                    session_id: lastSession.session.id,
                  });
                  navigate(`/turer`);
                }}
              />
            </section>
          )}

          {/* ── 3. Mine biler — preview ────────────────────────── */}
          <section aria-label="Mine biler">
            <SectionHeader
              title="Mine biler"
              actionLabel={carsTotal > 2 ? `Se alle (${carsTotal})` : "Se garasjen"}
              actionHref="/min-garasje"
              onAction={() =>
                void track("start_my_cars_see_all_click", "start", { total: carsTotal })
              }
            />
            {(myCars?.length ?? 0) === 0 ? (
              <EmptyMyCars />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {myCars!.map((car, i) => (
                  <PreviewCarTile
                    key={car.id}
                    car={car}
                    index={i}
                    onClick={() =>
                      void track("start_car_preview_click", "start", {
                        car_id: car.id,
                        published: !!car.published_at,
                      })
                    }
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── 4. Utforsk verden ──────────────────────────────── */}
          <section aria-label="Utforsk verden">
            <SectionHeader
              title="Utforsk verden"
              actionLabel="Se alle"
              actionHref="/biler"
              onAction={() => void track("start_explore_see_all_click", "start")}
            />
            {(worldCars?.length ?? 0) === 0 ? (
              <p className="text-[12px] text-white/30" style={oswald}>
                Ingen biler å vise enda.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {worldCars!.map((car, i) => (
                  <PreviewCarTile
                    key={car.id}
                    car={car}
                    index={i}
                    hrefOverride={`/biler/${car.slug}`}
                    onClick={() =>
                      void track("start_world_preview_click", "start", { car_id: car.id })
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}

/* ─────────────────────────── helpers ─────────────────────────── */

function SectionHeader({
  title,
  actionLabel,
  actionHref,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-end justify-between mb-3">
      <h2
        className="text-[11px] uppercase tracking-[0.18em] font-bold text-white/55"
        style={chakra}
      >
        {title}
      </h2>
      {actionLabel && actionHref && (
        <Link
          to={actionHref}
          onClick={onAction}
          className="inline-flex items-center gap-0.5 text-[11px] uppercase tracking-[0.12em] font-bold text-[#34eab8] hover:text-[#5aedc4] transition-colors"
          style={chakra}
        >
          {actionLabel}
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

function IntentBody({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-1 rounded-xl border border-white/[0.08] hover:border-[#2dd4a8]/40 hover:bg-white/[0.02] transition-all h-[68px] px-2 py-2"
      style={{ background: "hsl(215 25% 10%)" }}
    >
      <span className="text-[#34eab8]">{icon}</span>
      <span
        className="text-[10px] uppercase tracking-[0.08em] text-white/85 font-bold text-center leading-tight"
        style={chakra}
      >
        {label}
      </span>
    </div>
  );
}


function DisabledIntentTile({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-1 rounded-xl border border-white/[0.04] h-[68px] px-2 py-2 opacity-40 cursor-not-allowed"
      style={{ background: "hsl(215 25% 9%)" }}
      aria-disabled="true"
      title="Kommer snart"
    >
      <span className="text-white/40">{icon}</span>
      <span
        className="text-[10px] uppercase tracking-[0.08em] text-white/40 font-bold text-center leading-tight"
        style={chakra}
      >
        {label}
      </span>
    </div>
  );
}

function PreviewCarTile({
  car,
  index,
  onClick,
  hrefOverride,
}: {
  car: CarMini;
  index: number;
  onClick?: () => void;
  hrefOverride?: string;
}) {
  const sortedImg = car.car_images?.slice().sort(
    (a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99),
  )[0];
  let coverUrl: string | undefined = sortedImg?.image_url;
  if (!coverUrl) {
    coverUrl = resolveSpottingCoverFromRow(car as any)?.image_url ?? undefined;
  }
  const isUnknownSpotting =
    car.source === "spotting" &&
    (car.identification_status === "unknown" || car.identification_status === "needs_review");
  const isPublished = !!car.published_at;
  const href = hrefOverride ?? (isPublished ? `/biler/${car.slug}` : `/dashboard/bil/${car.id}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.2) }}
    >
      <Link
        to={href}
        onClick={onClick}
        className="group block rounded-xl overflow-hidden border border-white/[0.06] hover:border-[#2dd4a8]/40 transition-all"
        style={{ background: "hsl(215 25% 10%)" }}
      >
        <div className="aspect-[16/11] relative overflow-hidden bg-black/30">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={car.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Car className="w-7 h-7 text-white/10" />
            </div>
          )}
          {!isPublished && !hrefOverride && (
            <span
              className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold bg-amber-500/20 text-amber-300 backdrop-blur-sm"
              style={oswald}
            >
              Kladd
            </span>
          )}
        </div>
        <div className="p-2.5">
          <p
            className="text-[12px] text-white/85 font-semibold truncate"
            style={chakra}
          >
            {isUnknownSpotting ? "Ukjent bil" : car.title}
          </p>
          {isUnknownSpotting ? (
            <p className="text-[10px] text-[#34eab8] mt-0.5 uppercase tracking-wider" style={oswald}>
              Hjelp med å identifisere bil
            </p>
          ) : car.year && (
            <p className="text-[10px] text-white/35 mt-0.5" style={oswald}>
              {car.year}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

function EmptyMyCars() {
  return (
    <Link
      to="/legg-til-bil"
      onClick={() =>
        void track("garage_intent_click", "start", { intent: "add_car", source: "start_empty" })
      }
      className="flex items-center gap-3 rounded-xl border border-dashed border-white/10 hover:border-[#2dd4a8]/40 transition-all p-4"
      style={{ background: "hsl(215 25% 9%)" }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #34eab8 0%, #2ab89a 100%)",
        }}
      >
        <Plus className="w-5 h-5 text-[#070b10]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-white font-semibold" style={chakra}>
          Legg inn din første bil
        </p>
        <p className="text-[11px] text-white/45 mt-0.5" style={oswald}>
          Start historien om bilen din
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-white/30" />
    </Link>
  );
}
