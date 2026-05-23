import { Link } from "react-router-dom";
import { SeoHead } from "@/components/seo";
import { Layout } from "@/components/layout/Layout";
import { CreateCTA } from "@/components/ui/CreateCTA";
import { MapPin, Calendar, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;
const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

export default function KlubberPage() {
  const { data: pages, isLoading } = useQuery({
    queryKey: ["public-pages-klubber"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("id, title, slug, tagline, page_type, logo_url, cover_url, location, founded_year")
        .eq("is_public", true)
        .eq("status", "active")
        .eq("page_type", "club")
        .order("title");
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <Layout>
      <SeoHead
        title="Klubber | Bilgarasje.no"
        description="Bilklubber og entusiastforeninger i det norske bilmiljøet."
        canonicalPath="/klubber"
      />

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
                Klubber
              </h1>
              <p
                className="text-[0.7rem] sm:text-[0.85rem] md:text-[1rem] uppercase tracking-[0.15em] text-white/50 font-bold italic mt-0.5"
                style={chakra}
              >
                — Bilklubber & foreninger
              </p>
              <div className="mt-4">
                <CreateCTA
                  createUrl="/dashboard/sider/ny"
                  label="Registrer din klubb"
                  variant="hero"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── GRID ─── */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-5 md:px-8 pb-16 sm:pb-24">

          {isLoading && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-52 rounded-lg bg-[#3a2e24]/[0.06] animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && pages && pages.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pages.map((page) => (
                <Link
                  key={page.id}
                  to={`/klubber/${page.slug}`}
                  className="group block overflow-hidden transition-all duration-300"
                >
                  {/* Cover */}
                  <div className="aspect-[16/9] relative overflow-hidden rounded-md bg-[#e8e0d4]">
                    {page.cover_url ? (
                      <img
                        src={page.cover_url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3a2e24 0%, #4a3d30 100%)' }}>
                        <Users className="w-10 h-10 text-[#c4962c]/30" strokeWidth={1.2} />
                      </div>
                    )}
                    {/* Bottom fade */}
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent" />

                    {/* Logo badge */}
                    {page.logo_url ? (
                      <img
                        src={page.logo_url}
                        alt=""
                        className="absolute bottom-3 left-3 w-9 h-9 rounded-full object-cover border-2 border-white/80 shadow-md"
                      />
                    ) : (
                      <div
                        className="absolute bottom-3 left-3 w-9 h-9 rounded-full flex items-center justify-center border-2 border-white/80 shadow-md"
                        style={{ background: 'linear-gradient(135deg, #3a2e24, #4a3d30)' }}
                      >
                        <span className="text-xs font-bold text-[#c4962c]/90" style={chakra}>
                          {page.title.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="pt-3 space-y-1">
                    <h3
                      className="text-[14px] sm:text-[15px] font-bold uppercase tracking-[0.04em] text-[#3a2e24] leading-tight group-hover:text-[#8b6914] transition-colors truncate"
                      style={chakra}
                    >
                      {page.title}
                    </h3>

                    {page.tagline && (
                      <p className="text-[12px] sm:text-[13px] text-[#3a2e24]/50 leading-relaxed line-clamp-2">
                        {page.tagline}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-[#3a2e24]/35 pt-0.5">
                      {page.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {page.location}
                        </span>
                      )}
                      {page.founded_year && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Est. {page.founded_year}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!isLoading && (!pages || pages.length === 0) && (
            <div className="py-16 sm:py-24 text-center">
              <Users className="w-12 h-12 text-[#3a2e24]/15 mx-auto mb-4" strokeWidth={1.2} />
              <p
                className="text-[1.2rem] sm:text-[1.6rem] uppercase text-[#3a2e24]/30 font-bold tracking-[0.08em]"
                style={oswald}
              >
                Ingen klubber enda
              </p>
              <p className="text-[13px] text-[#3a2e24]/25 mt-1.5">
                Bli den første til å registrere din klubb
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
