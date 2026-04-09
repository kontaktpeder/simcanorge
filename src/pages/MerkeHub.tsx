import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { PublicPageEvents } from "@/components/pages/PublicPageEvents";
import { FeedCard } from "@/components/feed/FeedCard";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { MapPin, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const serif = { fontFamily: "'Playfair Display', 'Georgia', serif" } as const;
const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

function useBrandHub(brandKey: string | undefined) {
  return useQuery({
    queryKey: ["brand-hub", brandKey],
    queryFn: async () => {
      if (!brandKey) return null;
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("is_public", true)
        .eq("status", "active")
        .ilike("slug", `${brandKey}%`)
        .eq("page_type", "club")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      // Check brand_key via cast
      if (data && (data as any).brand_key?.toLowerCase() === brandKey?.toLowerCase()) return data;
      // Fallback: try brand_key directly
      const { data: d2, error: e2 } = await supabase
        .from("pages")
        .select("*")
        .eq("is_public", true)
        .eq("status", "active")
        .eq("page_type", "club")
        .limit(10);
      if (e2) throw e2;
      return (d2 ?? []).find((p: any) => p.brand_key?.toLowerCase() === brandKey?.toLowerCase()) ?? null;
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
        .limit(24);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!brandKey,
  });
}

export default function MerkeHub() {
  const { brand } = useParams<{ brand: string }>();

  const { data: hub, isLoading: hubLoading } = useBrandHub(brand);
  const { data: cars, isLoading: carsLoading } = useBrandCars(brand);
  const { data: feedPosts } = useFeedPosts({ pageId: hub?.id, limit: 6 });

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

  const pageAny = hub as any;

  return (
    <Layout>
      <Helmet>
        <title>{hub.title} — Bilgarasjen</title>
        {hub.tagline && <meta name="description" content={hub.tagline} />}
      </Helmet>

      <div className="min-h-screen bg-[#F7F4EF]">
        {/* ── HERO ── */}
        <section className="relative overflow-hidden" style={{ minHeight: "460px" }}>
          {hub.cover_url ? (
            <>
              <img
                src={hub.cover_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#0F3E7A]/85 via-[#0F3E7A]/70 to-[#0F3E7A]/95" />
              <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 20%, rgba(79,160,255,0.15) 0%, transparent 60%)" }} />
            </>
          ) : (
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0F3E7A 0%, #1F66B5 40%, #0F3E7A 100%)" }} />
          )}

          {/* Top rule */}
          <div className="relative z-10 flex items-center gap-3 px-6 md:px-12 pt-8">
            <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, #F2F4F7, #B8C0CC, #FFFFFF, #7A8596, #F2F4F7, transparent)" }} />
            <span className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-medium" style={oswald}>
              Bilgarasjen · Merker
            </span>
            <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, #F2F4F7, #B8C0CC, #FFFFFF, #7A8596, #F2F4F7, transparent)" }} />
          </div>

          {/* Hero content */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pb-14 pt-10" style={{ minHeight: "380px" }}>
            {hub.logo_url && (
              <img src={hub.logo_url} alt={hub.title} className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover mb-6 border-2 border-white/20 shadow-xl" />
            )}
            {hub.founded_year && (
              <p className="text-white/30 text-xs uppercase tracking-[0.3em] mb-2" style={oswald}>
                Est. {hub.founded_year}
              </p>
            )}
            <h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white uppercase tracking-wide leading-[0.95]"
              style={{ fontFamily: "'Bebas Neue', 'Oswald', 'Impact', sans-serif" }}
            >
              {hub.title}
            </h1>
            {hub.tagline && (
              <p className="text-white/60 text-base md:text-lg mt-4 max-w-xl italic" style={serif}>
                {hub.tagline}
              </p>
            )}
            <div className="flex items-center gap-4 mt-6 text-white/40 text-sm">
              {hub.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {hub.location}
                </span>
              )}
              {cars && cars.length > 0 && (
                <span className="text-white/30">{cars.length} biler registrert</span>
              )}
            </div>
          </div>
        </section>

        {/* ── RED STRIP ── */}
        <div className="h-1.5" style={{ background: "linear-gradient(90deg, #D41515, #C10D0D, #9A0A0A, #C10D0D, #D41515)" }} />

        {/* ── BODY ── */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 space-y-0">
          {/* Om merket */}
          {hub.about && (
            <section className="mb-12">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#1B5FA0]/40 font-medium mb-1" style={oswald}>
                    Om merket
                  </p>
                  <h2 className="text-2xl font-bold text-[#1B5FA0] uppercase tracking-wide" style={oswald}>
                    {hub.title}
                  </h2>
                  {hub.website && (
                    <a href={hub.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-[#1B5FA0]/60 hover:text-[#1B5FA0] mt-2 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" /> Nettside
                    </a>
                  )}
                </div>
                <div className="md:w-2/3">
                  <p className="text-[#3a2e24]/70 leading-relaxed text-[15px]" style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif" }}>
                    {hub.about}
                  </p>
                </div>
              </div>
            </section>
          )}

          <Divider />

          {/* Biler */}
          <section className="py-12">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#1B5FA0]/40 font-medium mb-1" style={oswald}>
                  Registrerte biler
                </p>
                <h2 className="text-2xl font-bold text-[#1B5FA0] uppercase tracking-wide" style={oswald}>
                  {hub.title} i Norge
                </h2>
              </div>
              <Link to={`/biler?brand=${brand}`} className="text-sm text-[#1B5FA0]/60 hover:text-[#1B5FA0] transition-colors">
                Se alle →
              </Link>
            </div>

            {carsLoading && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
                ))}
              </div>
            )}

            {!carsLoading && cars && cars.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {cars.map((car) => {
                  const img = [...(car.car_images ?? [])]
                    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]
                    ?.image_url ?? null;
                  return (
                    <Link key={car.id} to={`/biler/${car.slug}`} className="group rounded-xl overflow-hidden border border-[#B8C0CC]/30 hover:border-[#1B5FA0]/30 transition-all bg-white">
                      {img ? (
                        <img src={img} alt={car.title} className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full aspect-[4/3] bg-[#F2F4F7] flex items-center justify-center text-[#B8C0CC] text-sm">Ingen bilde</div>
                      )}
                      <div className="p-3">
                        <p className="font-semibold text-sm text-[#3a2e24] truncate group-hover:text-[#1B5FA0] transition-colors">
                          {car.title}
                        </p>
                        {car.year && (
                          <p className="text-xs text-[#3a2e24]/40 mt-0.5">{car.year}</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {!carsLoading && (!cars || cars.length === 0) && (
              <p className="text-[#3a2e24]/40 text-center py-12">Ingen publiserte biler registrert ennå.</p>
            )}
          </section>

          {/* Arrangementer */}
          <Divider />
          <section className="py-12">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#1B5FA0]/40 font-medium mb-1" style={oswald}>
              Kommende
            </p>
            <h2 className="text-2xl font-bold text-[#1B5FA0] uppercase tracking-wide mb-6" style={oswald}>
              Arrangementer
            </h2>
            <PublicPageEvents pageId={hub.id} light />
          </section>

          {/* Feed */}
          {feedPosts && feedPosts.length > 0 && (
            <>
              <Divider />
              <section className="py-12">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#1B5FA0]/40 font-medium mb-1" style={oswald}>
                  Fra siden
                </p>
                <h2 className="text-2xl font-bold text-[#1B5FA0] uppercase tracking-wide mb-6" style={oswald}>
                  Siste nytt
                </h2>
                <div className="space-y-4">
                  {feedPosts.map((post) => (
                    <div key={post.id} className="border border-[#B8C0CC]/20 rounded-xl overflow-hidden">
                      <FeedCard post={post} />
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="border-t border-[#B8C0CC]/20 py-8 text-center">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-[#3a2e24]/30">
              {hub.title}{hub.founded_year ? ` · Est. ${hub.founded_year}` : ""}
            </span>
            <span className="text-[10px] text-[#3a2e24]/20">Bilgarasjen.no</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, #B8C0CC, #F2F4F7, #B8C0CC, transparent)" }} />
      <div className="w-1.5 h-1.5 rounded-full bg-[#C21212]/30" />
      <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, #B8C0CC, #F2F4F7, #B8C0CC, transparent)" }} />
    </div>
  );
}
