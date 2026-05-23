import { useParams, Link } from "react-router-dom";
import { SeoHead } from "@/components/seo";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { FeedCard } from "@/components/feed/FeedCard";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { usePageEvents } from "@/hooks/usePageEvents";
import { MapPin, ExternalLink, Calendar, MapPinIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const serif = { fontFamily: "'Playfair Display', 'Georgia', serif" } as const;
const mono = { fontFamily: "'Courier New', 'Courier', monospace" } as const;
const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const bebas = { fontFamily: "'Bebas Neue', 'Oswald', 'Impact', sans-serif" } as const;

/* ─── Hooks ─── */

function useBrandHub(brandKey: string | undefined) {
  return useQuery({
    queryKey: ["brand-hub", brandKey],
    queryFn: async () => {
      if (!brandKey) return null;
      const normalized = brandKey.toLowerCase();

      // Primary: page_type_variant = 'brand' + brand_key match
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("is_public", true)
        .eq("status", "active")
        .eq("page_type", "club")
        .limit(10);
      if (error) throw error;

      // Prefer brand variant match
      const brandMatch = (data ?? []).find(
        (p: any) => p.page_type_variant === "brand" && p.brand_key?.toLowerCase() === normalized
      );
      if (brandMatch) return brandMatch;

      // Fallback: any page with matching brand_key
      const fallback = (data ?? []).find(
        (p: any) => p.brand_key?.toLowerCase() === normalized
      );
      return fallback ?? null;
    },
    enabled: !!brandKey,
  });
}

function useBrandCars(brandKey: string | undefined) {
  return useQuery({
    queryKey: ["brand-cars", brandKey],
    queryFn: async () => {
      if (!brandKey) return [];
      const { data, error } = await supabase
        .from("cars")
        .select(`id, title, slug, brand, model, year, car_images(image_url, sort_order)`)
        .ilike("brand", brandKey)
        .not("published_at", "is", null)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!brandKey,
  });
}

/* ─── Helpers ─── */

function getFirstImage(images: { image_url: string; sort_order: number }[] | null) {
  if (!images || images.length === 0) return null;
  return [...images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.image_url ?? null;
}

/* ─── Component ─── */

export default function MerkeHub() {
  const { brand } = useParams<{ brand: string }>();

  const { data: hub, isLoading: hubLoading } = useBrandHub(brand);
  const { data: cars, isLoading: carsLoading } = useBrandCars(brand);
  const { data: events } = usePageEvents(hub?.id);
  const { data: feedPosts } = useFeedPosts({ pageId: hub?.id, limit: 5 });

  const firstEvent = events?.[0];

  if (hubLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center">
          <p className="text-[#3a2e24]/50 text-lg">Laster…</p>
        </div>
      </Layout>
    );
  }

  if (!hub) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#F7F4EF] flex flex-col items-center justify-center gap-4 px-6">
          <h1 className="text-4xl font-bold text-[#1B5FA0] uppercase tracking-wider" style={oswald}>
            Merke ikke funnet
          </h1>
          <p className="text-[#3a2e24]/60 text-lg capitalize">{brand}</p>
          <p className="text-[#3a2e24]/40">Denne merkesiden er ikke opprettet ennå.</p>
          <Link to="/biler" className="text-[#1B5FA0] hover:underline mt-4">← Se alle biler</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SeoHead
        title={`${hub.title} — Bilgarasjen`}
        description={hub.tagline || undefined}
        canonicalPath="/biler"
      />

      <div className="min-h-screen bg-[#F7F4EF]">

        {/* ── HERO — tall image, light gradient ── */}
        <section className="relative overflow-hidden" style={{ minHeight: "60vh" }}>
          {hub.cover_url ? (
            <>
              <img
                src={hub.cover_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(to bottom, rgba(247,244,239,0.1) 0%, rgba(247,244,239,0.3) 50%, rgba(247,244,239,0.92) 85%, #F7F4EF 100%)",
                }}
              />
            </>
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(135deg, #0F3E7A 0%, #1F66B5 40%, #4FA0FF 70%, #1F66B5 100%)" }}
            />
          )}

          {/* Top chrome rule */}
          <div className="relative z-10 flex items-center gap-3 px-6 md:px-12 pt-6">
            <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, #B8C0CC, #FFFFFF, #B8C0CC, transparent)" }} />
            <span className="text-[#3a2e24]/30 text-[10px] uppercase tracking-[0.3em]" style={mono}>
              Bilgarasjen · Merker
            </span>
            <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, #B8C0CC, #FFFFFF, #B8C0CC, transparent)" }} />
          </div>
        </section>

        {/* ── IDENTITY BLOCK — logo overlaps hero ── */}
        <div className="max-w-5xl mx-auto px-6 md:px-10 relative" style={{ marginTop: "-80px" }}>
          {hub.logo_url && (
            <img
              src={hub.logo_url}
              alt={hub.title}
              className="w-28 h-28 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-[#F7F4EF] shadow-xl mb-5"
              style={{ transform: "translateY(-36%)" }}
            />
          )}

          <div style={{ paddingTop: hub.logo_url ? "0" : "24px" }}>
            {hub.founded_year && (
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#3a2e24]/30 mb-1" style={mono}>
                Est. {hub.founded_year}
              </p>
            )}
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1B5FA0] uppercase tracking-wide leading-[0.95]"
              style={bebas}
            >
              {hub.title}
            </h1>
            {hub.tagline && (
              <p className="text-[#3a2e24]/50 text-base md:text-lg mt-3 max-w-xl italic" style={serif}>
                {hub.tagline}
              </p>
            )}

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <a
                href="#biler"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
                style={{ ...oswald, background: "#1B5FA0", letterSpacing: "0.05em" }}
              >
                Se biler
              </a>
              {firstEvent && (
                <Link
                  to={`/e/${firstEvent.slug}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border transition-colors"
                  style={{ ...oswald, borderColor: "#C21212", color: "#C21212", letterSpacing: "0.05em" }}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Neste arrangement
                </Link>
              )}
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4 mt-5 text-[#3a2e24]/35 text-xs" style={mono}>
              {hub.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {hub.location}
                </span>
              )}
              {cars && cars.length > 0 && (
                <span>{cars.length} biler registrert</span>
              )}
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="max-w-5xl mx-auto px-6 md:px-10 pt-12 pb-16 md:pb-20 space-y-0">

          {/* Om merket */}
          {hub.about && (
            <section className="mb-14">
              <div className="flex flex-col md:flex-row gap-8 md:gap-12">
                <div className="md:w-1/3 shrink-0">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-[#3a2e24]/30 mb-1" style={mono}>
                    Om merket
                  </p>
                  <h2 className="text-2xl text-[#1B5FA0]" style={serif}>
                    {hub.title}
                  </h2>
                  {hub.website && (
                    <a
                      href={hub.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#1B5FA0]/50 hover:text-[#1B5FA0] mt-3 transition-colors"
                      style={mono}
                    >
                      <ExternalLink className="w-3 h-3" /> Nettside
                    </a>
                  )}
                </div>
                <div className="md:w-2/3">
                  <p
                    className="text-[#3a2e24]/65 leading-[1.85] text-[15px] whitespace-pre-line"
                    style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif" }}
                  >
                    {hub.about}
                  </p>
                </div>
              </div>
            </section>
          )}

          <SparseDot />

          {/* ── BILER — warm framed panel ── */}
          <section id="biler" className="py-14">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#3a2e24]/30 mb-1" style={mono}>
                  Registrerte biler
                </p>
                <h2 className="text-2xl text-[#1B5FA0]" style={serif}>
                  {hub.title} i Norge
                </h2>
              </div>
              <Link
                to={`/biler?brand=${brand}`}
                className="text-xs text-[#1B5FA0]/50 hover:text-[#1B5FA0] transition-colors"
                style={mono}
              >
                Se alle →
              </Link>
            </div>

            {/* Warm panel wrapper */}
            <div className="rounded-2xl p-4 md:p-6" style={{ background: "linear-gradient(135deg, #e8e1d6 0%, #dfd5c7 100%)" }}>
              {carsLoading && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
                  ))}
                </div>
              )}

              {!carsLoading && cars && cars.length > 0 && (
                <div className="space-y-4">
                  {/* First car — large */}
                  {(() => {
                    const first = cars[0];
                    const img = getFirstImage(first.car_images as any);
                    return (
                      <Link
                        to={`/biler/${first.slug}`}
                        className="block group rounded-xl overflow-hidden bg-white/60"
                      >
                        {img ? (
                          <img
                            src={img}
                            alt={first.title}
                            className="w-full aspect-[16/7] object-cover group-hover:scale-[1.02] transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full aspect-[16/7] bg-[#F2F4F7] flex items-center justify-center text-[#B8C0CC]">
                            Ingen bilde
                          </div>
                        )}
                        <div className="p-4">
                          <p className="font-bold text-lg text-[#3a2e24] group-hover:text-[#1B5FA0] transition-colors" style={oswald}>
                            {first.title}
                          </p>
                          {first.year && (
                            <p className="text-xs text-[#3a2e24]/40 mt-0.5" style={mono}>{first.year}</p>
                          )}
                        </div>
                      </Link>
                    );
                  })()}

                  {/* Rest — grid */}
                  {cars.length > 1 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {cars.slice(1).map((car) => {
                        const img = getFirstImage(car.car_images as any);
                        return (
                          <Link
                            key={car.id}
                            to={`/biler/${car.slug}`}
                            className="group rounded-xl overflow-hidden bg-white/60 hover:shadow-md transition-shadow"
                          >
                            {img ? (
                              <img src={img} alt={car.title} className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full aspect-[4/3] bg-[#F2F4F7] flex items-center justify-center text-[#B8C0CC] text-xs">
                                Ingen bilde
                              </div>
                            )}
                            <div className="p-3">
                              <p className="font-semibold text-sm text-[#3a2e24] truncate group-hover:text-[#1B5FA0] transition-colors" style={oswald}>
                                {car.title}
                              </p>
                              {car.year && (
                                <p className="text-[11px] text-[#3a2e24]/35 mt-0.5" style={mono}>{car.year}</p>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {!carsLoading && (!cars || cars.length === 0) && (
                <p className="text-[#3a2e24]/40 text-center py-12 text-sm">
                  Ingen publiserte biler registrert ennå.
                </p>
              )}
            </div>
          </section>

          {/* ── ARRANGEMENTER — accent border style ── */}
          <section className="py-14">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#3a2e24]/30 mb-1" style={mono}>
              Kommende
            </p>
            <h2 className="text-2xl text-[#1B5FA0] mb-6" style={serif}>
              Arrangementer
            </h2>

            {events && events.length > 0 ? (
              <div className="space-y-3">
                {events.map((event: any) => {
                  const img = getFirstImage(event.event_images);
                  return (
                    <Link
                      key={event.id}
                      to={`/e/${event.slug}`}
                      className="group flex items-stretch rounded-sm overflow-hidden bg-white border border-[#B8C0CC]/20 hover:border-[#1B5FA0]/30 transition-colors"
                    >
                      {/* Left accent rail */}
                      <div className="w-1.5 shrink-0" style={{ background: "linear-gradient(180deg, #C21212, #9A0A0A)" }} />

                      {img && (
                        <img src={img} alt="" className="w-24 md:w-32 h-auto object-cover shrink-0" />
                      )}

                      <div className="flex-1 p-4 min-w-0">
                        <p className="text-[11px] uppercase tracking-wider text-[#C21212]/70 font-semibold mb-1" style={mono}>
                          {format(new Date(event.starts_at), "d. MMM yyyy", { locale: nb })}
                        </p>
                        <p className="font-bold text-[#3a2e24] group-hover:text-[#1B5FA0] transition-colors truncate" style={oswald}>
                          {event.title}
                        </p>
                        {event.location && (
                          <p className="text-xs text-[#3a2e24]/40 mt-1 flex items-center gap-1">
                            <MapPinIcon className="w-3 h-3" /> {event.location}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-[#3a2e24]/35 text-sm py-8">
                Ingen kommende arrangementer.
              </p>
            )}
          </section>

          {/* ── FEED ── */}
          {feedPosts && feedPosts.length > 0 && (
            <>
              <SparseDot />
              <section className="py-14">
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#3a2e24]/30 mb-1" style={mono}>
                  Fra siden
                </p>
                <h2 className="text-2xl text-[#1B5FA0] mb-8" style={serif}>
                  Siste nytt
                </h2>
                <div className="space-y-6">
                  {feedPosts.map((post) => (
                    <div key={post.id} className="border border-[#B8C0CC]/15 rounded-xl overflow-hidden">
                      <FeedCard post={post} />
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="border-t border-[#B8C0CC]/20 py-8 text-center bg-[#F7F4EF]">
          <span className="text-xs text-[#3a2e24]/25" style={mono}>
            {hub.title}{hub.founded_year ? ` · Est. ${hub.founded_year}` : ""} — Bilgarasjen.no
          </span>
        </div>
      </div>
    </Layout>
  );
}

/* ─── Sparse dot divider ─── */
function SparseDot() {
  return (
    <div className="flex items-center justify-center py-2">
      <div className="w-1 h-1 rounded-full bg-[#B8C0CC]/40" />
    </div>
  );
}
