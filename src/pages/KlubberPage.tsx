import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { CreateCTA } from "@/components/ui/CreateCTA";
import { MapPin, Calendar, Users, ArrowRight } from "lucide-react";
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
      <Helmet>
        <title>Klubber | Bilgarasje.no</title>
        <meta name="description" content="Bilklubber og entusiastforeninger i det norske bilmiljøet." />
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
                Klubber
              </h1>
              <p
                className="text-[0.7rem] sm:text-[0.85rem] md:text-[1rem] uppercase tracking-[0.15em] text-white/50 font-bold italic mt-0.5"
                style={chakra}
              >
                — Bilklubber & foreninger
              </p>
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-5 md:px-8 -mt-5 relative z-10">
          <CreateCTA
            createUrl="/dashboard/sider/ny"
            label="Registrer din klubb"
            description="Har du en bilklubb eller forening?"
            variant="inline"
            className="rounded-sm shadow-md"
          />
        </div>

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
                  className="group block rounded-lg overflow-hidden border border-[#c4962c]/10 hover:border-[#c4962c]/25 transition-all duration-300 hover:shadow-[0_8px_30px_-10px_rgba(196,150,44,0.15)]"
                  style={{ background: 'linear-gradient(180deg, #f5efe6 0%, #f0e9df 100%)' }}
                >
                  {/* Cover */}
                  <div className="h-32 relative overflow-hidden bg-[#e8e0d4]">
                    {page.cover_url ? (
                      <img
                        src={page.cover_url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3a2e24 0%, #4a3d30 100%)' }}>
                        <Users className="w-10 h-10 text-[#c4962c]/30" strokeWidth={1.2} />
                      </div>
                    )}
                    {/* Fade overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#f5efe6]/60 to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-5 space-y-2.5">
                    <div className="flex items-center gap-3">
                      {page.logo_url ? (
                        <img
                          src={page.logo_url}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover border-2 border-[#c4962c]/15 shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-[#c4962c]/15" style={{ background: 'linear-gradient(135deg, #3a2e24, #4a3d30)' }}>
                          <span className="text-sm font-bold text-[#c4962c]/80" style={chakra}>
                            {page.title.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-[14px] sm:text-[15px] font-bold uppercase tracking-[0.04em] text-[#3a2e24] leading-tight group-hover:text-[#8b6914] transition-colors truncate"
                          style={chakra}
                        >
                          {page.title}
                        </h3>
                        <span className="text-[10px] uppercase tracking-[0.15em] text-[#8b6914]/60 font-semibold" style={oswald}>
                          Klubb
                        </span>
                      </div>
                    </div>

                    {page.tagline && (
                      <p className="text-[12px] sm:text-[13px] text-[#3a2e24]/55 leading-relaxed line-clamp-2">
                        {page.tagline}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-3 text-[11px] text-[#3a2e24]/40">
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
                      <ArrowRight className="w-3.5 h-3.5 text-[#c4962c]/40 group-hover:text-[#c4962c] group-hover:translate-x-0.5 transition-all" />
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
