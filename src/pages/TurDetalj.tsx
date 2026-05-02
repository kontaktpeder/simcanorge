import { useEffect, useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  ArrowRight,
  Car as CarIcon,
  Footprints,
  Users,
  Clock,
  Image as ImageIcon,
  Lock,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Layout } from "@/components/layout/Layout";

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;
const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

type ActivityType = "drive" | "walk_spotting" | "meetup";

interface Session {
  id: string;
  type: ActivityType;
  started_at: string;
  ended_at: string | null;
  summary_note: string | null;
  visibility: string;
  user_id: string;
}

interface Moment {
  id: string;
  occurred_at: string;
  car_id: string | null;
  data: { image_url?: string | null; note?: string | null } | null;
}

interface CarInfo {
  id: string;
  title: string | null;
  brand: string | null;
  model: string | null;
  slug: string | null;
  source: string | null;
  identification_status: string | null;
}

const META: Record<ActivityType, { label: string; Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; tone: string }> = {
  drive: { label: "Kjøretur", Icon: CarIcon, tone: "#34eab8" },
  walk_spotting: { label: "Spotting", Icon: Footprints, tone: "#7dd3fc" },
  meetup: { label: "Treff", Icon: Users, tone: "#fbbf24" },
};

function formatDuration(start: string, end: string | null) {
  if (!end) return "Pågår";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const m = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h > 0) return `${h}t ${mm.toString().padStart(2, "0")}m`;
  return `${m}m`;
}

function formatLongDate(iso: string) {
  return new Date(iso).toLocaleDateString("no-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const UNKNOWN_KEY = "__unknown__";

export default function TurDetalj() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [moments, setMoments] = useState<Moment[] | null>(null);
  const [cars, setCars] = useState<Record<string, CarInfo>>({});
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!id || !user) return;
    let cancelled = false;
    (async () => {
      const { data: s } = await supabase
        .from("activity_sessions")
        .select("id, type, started_at, ended_at, summary_note, visibility, user_id")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!s) {
        setSession(null);
        setMoments([]);
        return;
      }
      setSession(s as Session);

      const { data: ev } = await supabase
        .from("car_events")
        .select("id, occurred_at, car_id, data")
        .eq("activity_session_id", id)
        .order("occurred_at", { ascending: true });
      if (cancelled) return;
      const list = (ev ?? []) as Moment[];
      setMoments(list);

      const carIds = Array.from(new Set(list.map((m) => m.car_id).filter(Boolean))) as string[];
      if (carIds.length > 0) {
        const { data: cs } = await supabase
          .from("cars")
          .select("id, title, brand, model, slug, source, identification_status")
          .in("id", carIds);
        if (cancelled) return;
        const map: Record<string, CarInfo> = {};
        for (const c of (cs ?? []) as CarInfo[]) map[c.id] = c;
        setCars(map);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  const allImages = useMemo(
    () => (moments ?? []).filter((m) => !!m.data?.image_url).map((m) => m.data!.image_url as string),
    [moments]
  );

  const groups = useMemo(() => {
    const map = new Map<string, Moment[]>();
    for (const m of moments ?? []) {
      const key = m.car_id ?? UNKNOWN_KEY;
      const arr = map.get(key) ?? [];
      arr.push(m);
      map.set(key, arr);
    }
    // Sort: groups with most moments first, unknown last
    return Array.from(map.entries()).sort((a, b) => {
      if (a[0] === UNKNOWN_KEY) return 1;
      if (b[0] === UNKNOWN_KEY) return -1;
      return b[1].length - a[1].length;
    });
  }, [moments]);

  const carCount = useMemo(
    () => groups.filter(([k]) => k !== UNKNOWN_KEY).length + (groups.some(([k]) => k === UNKNOWN_KEY) ? 1 : 0),
    [groups]
  );

  if (!user) return <Navigate to={`/login?returnUrl=/tur/${id ?? ""}`} replace />;

  return (
    <Layout>
      <Helmet>
        <title>Tur — Bilgarasje.no</title>
      </Helmet>

      <div className="min-h-screen bg-[#070b10]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-10">
          <Link
            to="/turer"
            className="inline-flex items-center gap-1.5 text-[12px] text-white/55 hover:text-white/85 transition-colors"
            style={oswald}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Mine turer
          </Link>

          {session === undefined || moments === null ? (
            <div className="mt-5 space-y-4">
              <Skeleton className="h-64 w-full bg-white/[0.04]" />
              <Skeleton className="h-16 w-full bg-white/[0.04]" />
              <Skeleton className="h-32 w-full bg-white/[0.04]" />
            </div>
          ) : session === null ? (
            <div className="mt-10 text-center text-white/60" style={oswald}>
              Fant ikke turen.
            </div>
          ) : (
            <>
              <Header session={session} />

              <HeroGallery images={allImages} onOpen={(i) => setLightboxIndex(i)} />

              <Summary
                durationLabel={formatDuration(session.started_at, session.ended_at)}
                moments={moments.length}
                cars={carCount}
              />

              {session.summary_note && (
                <div
                  className="rounded-xl border border-white/[0.06] p-4 mt-4 text-[13px] text-white/75 leading-relaxed"
                  style={{ background: "hsl(215 25% 8%)", ...oswald }}
                >
                  {session.summary_note}
                </div>
              )}

              {moments.length === 0 ? (
                <EmptyMoments />
              ) : (
                <div className="mt-6 space-y-6">
                  {groups.map(([key, list]) => (
                    <CarGroup
                      key={key}
                      car={key === UNKNOWN_KEY ? null : cars[key] ?? null}
                      moments={list}
                      onOpenImage={(url) => {
                        const idx = allImages.indexOf(url);
                        if (idx >= 0) setLightboxIndex(idx);
                      }}
                    />
                  ))}
                </div>
              )}

              <div
                className="rounded-lg border border-white/[0.06] p-3 mt-6 flex items-center gap-3"
                style={{ background: "hsl(215 25% 8%)" }}
              >
                <Lock className="w-3.5 h-3.5 text-[#34eab8]" />
                <div className="text-[11px] text-white/55" style={oswald}>
                  Kun synlig for deg.
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {lightboxIndex !== null && allImages.length > 0 && (
        <Lightbox
          images={allImages}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChange={(i) => setLightboxIndex(i)}
        />
      )}
    </Layout>
  );
}

function Header({ session }: { session: Session }) {
  const meta = META[session.type] ?? META.drive;
  const Icon = meta.Icon;
  const ongoing = !session.ended_at;
  return (
    <div className="mt-4 mb-4 flex items-start gap-3">
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${meta.tone}1a`, border: `1px solid ${meta.tone}33` }}
      >
        <Icon className="w-5 h-5" style={{ color: meta.tone }} />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl text-white font-bold leading-tight" style={chakra}>
            {meta.label}
          </h1>
          {ongoing && (
            <span
              className="text-[9px] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-full font-bold"
              style={{ background: "#34eab826", color: "#34eab8", border: "1px solid #34eab84d" }}
            >
              Pågår
            </span>
          )}
        </div>
        <div className="text-[12px] text-white/45 mt-1 capitalize" style={oswald}>
          {formatLongDate(session.started_at)}
        </div>
      </div>
    </div>
  );
}

function HeroGallery({ images, onOpen }: { images: string[]; onOpen: (i: number) => void }) {
  if (images.length === 0) {
    return (
      <div
        className="rounded-2xl border border-dashed border-white/10 aspect-[16/10] flex items-center justify-center"
        style={{ background: "hsl(215 25% 8%)" }}
      >
        <div className="text-center text-white/40" style={oswald}>
          <ImageIcon className="w-7 h-7 mx-auto mb-2 opacity-60" />
          <div className="text-[12px]">Ingen bilder i denne turen</div>
        </div>
      </div>
    );
  }

  const main = images[0];
  const side = images.slice(1, 3);
  const remaining = Math.max(0, images.length - 3);

  return (
    <div className="grid grid-cols-3 gap-2 rounded-2xl overflow-hidden">
      <button
        onClick={() => onOpen(0)}
        className={`relative ${images.length === 1 ? "col-span-3 aspect-[16/10]" : "col-span-2 row-span-2 aspect-square"} overflow-hidden bg-white/[0.04]`}
      >
        <img src={main} alt="" className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500" loading="eager" />
      </button>
      {side.map((url, i) => {
        const absoluteIndex = i + 1;
        const isLastWithMore = i === side.length - 1 && remaining > 0;
        return (
          <button
            key={absoluteIndex}
            onClick={() => onOpen(absoluteIndex)}
            className="relative aspect-square overflow-hidden bg-white/[0.04]"
          >
            <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
            {isLastWithMore && (
              <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                <span className="text-white font-bold text-lg" style={chakra}>
                  +{remaining}
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Summary({ durationLabel, moments, cars }: { durationLabel: string; moments: number; cars: number }) {
  return (
    <div className="grid grid-cols-3 gap-2 mt-4">
      <SummaryStat icon={<Clock className="w-3.5 h-3.5" />} label="Varighet" value={durationLabel} />
      <SummaryStat icon={<ImageIcon className="w-3.5 h-3.5" />} label="Øyeblikk" value={String(moments)} />
      <SummaryStat icon={<CarIcon className="w-3.5 h-3.5" />} label="Biler" value={String(cars)} />
    </div>
  );
}

function SummaryStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      className="rounded-lg p-3 border border-white/[0.06]"
      style={{ background: "hsl(215 25% 8%)" }}
    >
      <div className="flex items-center gap-1.5 text-white/35" style={oswald}>
        {icon}
        <span className="text-[9px] uppercase tracking-[0.18em]">{label}</span>
      </div>
      <div className="text-[18px] font-bold text-white mt-0.5" style={chakra}>
        {value}
      </div>
    </div>
  );
}

function CarGroup({
  car,
  moments,
  onOpenImage,
}: {
  car: CarInfo | null;
  moments: Moment[];
  onOpenImage: (url: string) => void;
}) {
  const title = car
    ? car.title || [car.brand, car.model].filter(Boolean).join(" ") || "Bil"
    : "Ukjent bil";
  const subtitle = car && car.title && (car.brand || car.model)
    ? [car.brand, car.model].filter(Boolean).join(" ")
    : null;
  const slug = car?.slug?.trim() || null;
  const showObservedBadge =
    !!car &&
    (car.source === "spotting" || car.identification_status === "unknown");

  const images = moments.filter((m) => m.data?.image_url).map((m) => m.data!.image_url as string);
  const notes = moments.filter((m) => !m.data?.image_url && m.data?.note);

  const titleEl = (
    <div className="text-white font-bold text-[15px] truncate" style={chakra}>
      {title}
    </div>
  );

  return (
    <section>
      <div className="flex items-end justify-between mb-2 px-0.5 gap-3">
        <div className="min-w-0 flex-1">
          {slug ? (
            <Link
              to={`/biler/${slug}`}
              className="block min-w-0 rounded-sm hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#34eab8]/50"
            >
              {titleEl}
            </Link>
          ) : (
            titleEl
          )}
          {subtitle && (
            <div className="text-[11px] text-white/45 truncate" style={oswald}>
              {subtitle}
            </div>
          )}
          {showObservedBadge && (
            <div
              className="mt-1.5 inline-flex text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 rounded border border-white/15 text-white/60"
              style={oswald}
            >
              Observert · uverifisert
            </div>
          )}
          {slug && (
            <Link
              to={`/biler/${slug}`}
              className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[#34eab8] hover:text-[#7ff4cd] transition-colors"
              style={oswald}
            >
              Se bilen
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-white/35 flex-shrink-0" style={oswald}>
          {moments.length} {moments.length === 1 ? "øyeblikk" : "øyeblikk"}
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {images.slice(0, 5).map((url, i) => {
            const isLastWithMore = i === 4 && images.length > 5;
            return (
              <button
                key={i}
                type="button"
                onClick={() => onOpenImage(url)}
                className="relative aspect-square overflow-hidden rounded-md bg-white/[0.04]"
              >
                <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                {isLastWithMore && (
                  <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                    <span className="text-white font-bold" style={chakra}>
                      +{images.length - 5}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {notes.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {notes.map((m) => (
            <div
              key={m.id}
              className="rounded-md border border-white/[0.06] px-3 py-2 text-[12px] text-white/70"
              style={{ background: "hsl(215 25% 8%)", ...oswald }}
            >
              {m.data?.note}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyMoments() {
  return (
    <div
      className="rounded-2xl border border-dashed border-white/10 p-6 text-center mt-6"
      style={{ background: "hsl(215 25% 8%)" }}
    >
      <div className="text-white/55 text-[13px]" style={oswald}>
        Ingen øyeblikk lagret i denne turen.
      </div>
    </div>
  );
}

function Lightbox({
  images,
  index,
  onClose,
  onChange,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onChange: (i: number) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onChange((index + 1) % images.length);
      if (e.key === "ArrowLeft") onChange((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onClose, onChange]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={onClose}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
        aria-label="Lukk"
      >
        <X className="w-5 h-5" />
      </button>
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChange((index - 1 + images.length) % images.length);
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            aria-label="Forrige"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChange((index + 1) % images.length);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            aria-label="Neste"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
      <img
        src={images[index]}
        alt=""
        className="max-w-[92vw] max-h-[88vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] text-white/60"
        style={oswald}
      >
        {index + 1} / {images.length}
      </div>
    </div>
  );
}
