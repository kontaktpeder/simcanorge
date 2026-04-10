import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useState } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { MapPin, Calendar, CalendarDays } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { EventTypeBadge } from "@/components/events/EventTypeBadge";
import { usePublicEvents } from "@/hooks/usePublicEvents";
import { CreateCTA } from "@/components/ui/CreateCTA";

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;
const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

const TYPE_FILTERS = [
  { value: "", label: "Alle", shortLabel: "Alle" },
  { value: "meet", label: "Biltreff", shortLabel: "Treff" },
  { value: "show", label: "Show", shortLabel: "Show" },
  { value: "market", label: "Delemarked", shortLabel: "Marked" },
  { value: "drive", label: "Kjøretur", shortLabel: "Kjør" },
  { value: "club_night", label: "Klubbkveld", shortLabel: "Klubb" },
  { value: "exhibition", label: "Utstilling", shortLabel: "Uts." },
  { value: "open_day", label: "Åpen dag", shortLabel: "Åpen" },
];

export default function EventsPage() {
  const [activeType, setActiveType] = useState("");
  const { data: events, isLoading } = usePublicEvents(
    activeType ? { type: activeType } : undefined
  );

  return (
    <Layout>
      <Helmet>
        <title>Arrangement | Bilgarasje.no</title>
        <meta name="description" content="Kommende biltreff, show og events i Norge" />
      </Helmet>

      <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #eee7dd 0%, #ebe4da 40%, #e8e1d6 100%)' }}>

        {/* ─── HERO ─── */}
        <section
          className="relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #3a2e24 0%, #2a2118 100%)' }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(196,150,44,0.1) 0%, transparent 60%)' }} />

          <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-5 md:px-8">
            <div className="flex flex-col justify-center min-h-[160px] sm:min-h-[180px] md:min-h-[220px] py-8 md:py-10">
              <p
                className="text-[10px] sm:text-[11px] tracking-[0.3em] uppercase mb-1.5"
                style={{ ...oswald, fontWeight: 500, background: 'linear-gradient(135deg, #F5A623, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                bilgarasje.no
              </p>
              <h1
                className="text-[1.5rem] sm:text-[1.9rem] md:text-[2.4rem] leading-[0.93] uppercase tracking-[0.02em] text-white font-bold italic"
                style={{ ...chakra, textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}
              >
                Arrangement
              </h1>
              <p
                className="text-[0.7rem] sm:text-[0.85rem] md:text-[1rem] uppercase tracking-[0.15em] text-white/50 font-bold italic mt-0.5"
                style={chakra}
              >
                — Treff & samlinger
              </p>
              <div className="mt-4">
                <CreateCTA
                  createUrl="/dashboard/events/ny"
                  label="Opprett arrangement"
                  variant="hero"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── FILTER ─── */}
        <nav
          className="border-b"
          style={{ borderColor: 'rgba(58,46,36,0.06)' }}
        >
          <div className="max-w-[1200px] mx-auto px-4 sm:px-5 md:px-8">
            <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide py-3">
              {TYPE_FILTERS.map((f) => {
                const isActive = activeType === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => setActiveType(f.value)}
                    className={`flex-shrink-0 px-3 sm:px-4 py-1.5 text-[10px] sm:text-[11px] uppercase tracking-[0.1em] font-bold transition-all duration-200 rounded-sm ${
                      isActive
                        ? "bg-[#3a2e24] text-white"
                        : "text-[#3a2e24]/40 hover:text-[#3a2e24]/70 hover:bg-[#3a2e24]/[0.04]"
                    }`}
                    style={chakra}
                  >
                    <span className="sm:hidden">{f.shortLabel}</span>
                    <span className="hidden sm:inline">{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* ─── GRID ─── */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-5 md:px-8 py-8 sm:py-10 pb-16 sm:pb-24">

          {isLoading && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-52 rounded-md bg-[#3a2e24]/[0.06] animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && events && events.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => {
                const imgs = [...((event as any).event_images ?? [])].sort(
                  (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
                );
                const heroImage = imgs[0]?.image_url ?? null;
                const startDate = new Date(event.starts_at);
                const ownerPage = (event as any).owner_page;

                return (
                  <Link
                    key={event.id}
                    to={`/e/${event.slug}`}
                    className="group block overflow-hidden transition-all duration-300"
                  >
                    {/* Cover */}
                    <div className="aspect-[16/9] relative overflow-hidden rounded-md bg-[#e8e0d4]">
                      {heroImage ? (
                        <img
                          src={heroImage}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3a2e24 0%, #4a3d30 100%)' }}>
                          <CalendarDays className="w-10 h-10 text-[#c4962c]/30" strokeWidth={1.2} />
                        </div>
                      )}
                      {/* Bottom fade */}
                      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent" />

                      {/* Date badge */}
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-sm px-2.5 py-1.5 shadow-sm">
                        <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#3a2e24]" style={chakra}>
                          {format(startDate, "d. MMM", { locale: nb })}
                        </span>
                      </div>

                      {/* Type badge */}
                      <div className="absolute top-3 right-3">
                        <EventTypeBadge type={event.event_type} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="pt-3 space-y-1">
                      <h3
                        className="text-[14px] sm:text-[15px] font-bold uppercase tracking-[0.04em] text-[#3a2e24] leading-tight group-hover:text-[#8b6914] transition-colors truncate"
                        style={chakra}
                      >
                        {event.title}
                      </h3>

                      <div className="flex items-center gap-3 text-[11px] text-[#3a2e24]/35 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(startDate, "EEEE d. MMMM yyyy", { locale: nb })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-[#3a2e24]/35">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </div>

                      {ownerPage && (
                        <p className="text-[11px] text-[#3a2e24]/25 pt-0.5">
                          {ownerPage.title}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {!isLoading && events?.length === 0 && (
            <div className="py-16 sm:py-24 text-center">
              <CalendarDays className="w-12 h-12 text-[#3a2e24]/15 mx-auto mb-4" strokeWidth={1.2} />
              <p
                className="text-[1.2rem] sm:text-[1.6rem] uppercase text-[#3a2e24]/30 font-bold tracking-[0.08em]"
                style={oswald}
              >
                Ingen arrangement enda
              </p>
              <p className="text-[13px] text-[#3a2e24]/25 mt-1.5">
                {activeType ? "Prøv en annen kategori" : "Arrangementer vil dukke opp her"}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
