import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { PageTypeBadge } from "@/components/pages/PageTypeBadge";
import { MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const EXCLUDED_TYPES = ["club"];

export default function AktoererPage() {
  const { data: pages, isLoading } = useQuery({
    queryKey: ["public-pages-aktoerer"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("id, title, slug, tagline, page_type, logo_url, cover_url, location")
        .eq("is_public", true)
        .eq("status", "active")
        .order("title");
      if (error) throw error;
      return (data ?? []).filter((p) => !EXCLUDED_TYPES.includes(p.page_type));
    },
  });

  return (
    <Layout>
      <Helmet>
        <title>Aktører | Bilgarasjen</title>
        <meta name="description" content="Utforsk verksteder, forhandlere, museer, samlinger og andre aktører i det norske bilmiljøet." />
      </Helmet>

      <div className="min-h-screen bg-[#111315]">
        {/* Hero */}
        <section className="pt-12 pb-8 max-w-[1000px] mx-auto px-5 md:px-8">
          <p
            className="text-[14px] sm:text-[16px] tracking-[0.3em] uppercase mb-2"
            style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 500, background: 'linear-gradient(135deg, #F5A623, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            bilgarasje.no
          </p>
          <h1
            className="text-[2.4rem] sm:text-[3.2rem] md:text-[4.2rem] leading-[1] uppercase tracking-[0.12em] text-white font-bold"
            style={{ fontFamily: "'Oswald', 'Bebas Neue', sans-serif" }}
          >
            Aktører
          </h1>
          <p className="text-[14px] text-white/40 mt-3 max-w-[500px]">
            Verksteder, forhandlere, museer, samlinger og andre aktører i det norske bilmiljøet.
          </p>
        </section>

        {/* Divider */}
        <div className="max-w-[1000px] mx-auto px-5 md:px-8">
          <div className="h-[2px] bg-gradient-to-r from-[hsl(var(--page-accent)/0.4)] via-white/[0.06] to-transparent" />
        </div>

        {/* Grid */}
        <section className="max-w-[1000px] mx-auto px-5 md:px-8 py-10">
          {isLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-[200px] bg-white/[0.02] animate-pulse rounded-xl" />
              ))}
            </div>
          )}

          {!isLoading && pages && pages.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pages.map((page) => (
                <Link
                  key={page.id}
                  to={`/s/${page.slug}`}
                  className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300"
                >
                  {/* Cover */}
                  <div className="h-28 overflow-hidden">
                    {page.cover_url ? (
                      <img
                        src={page.cover_url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-white/[0.04] to-transparent" />
                    )}
                    <div className="absolute inset-0 h-28 bg-gradient-to-t from-[#111315] to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="relative px-4 pb-4 -mt-6">
                    <div className="flex items-end gap-3 mb-2">
                      {page.logo_url ? (
                        <img
                          src={page.logo_url}
                          alt={page.title}
                          className="w-12 h-12 rounded-lg border-2 border-[#111315] object-cover shadow-md"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg border-2 border-[#111315] bg-white/[0.06] flex items-center justify-center shadow-md">
                          <span className="text-lg font-bold text-[hsl(var(--page-accent))]">
                            {page.title.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <PageTypeBadge type={page.page_type} dark />
                    </div>

                    <h2
                      className="text-[16px] uppercase tracking-[0.04em] text-white font-semibold leading-tight group-hover:text-[hsl(var(--page-accent))] transition-colors"
                      style={{ fontFamily: "'Oswald', sans-serif" }}
                    >
                      {page.title}
                    </h2>

                    {page.tagline && (
                      <p className="text-[13px] text-white/40 mt-1 line-clamp-2">{page.tagline}</p>
                    )}

                    {page.location && (
                      <p className="text-[12px] text-white/30 mt-2 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {page.location}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!isLoading && (!pages || pages.length === 0) && (
            <div className="py-24 text-center">
              <p
                className="text-[1.6rem] uppercase text-white/25 font-bold tracking-[0.08em]"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                Ingen aktører enda
              </p>
              <p className="text-[14px] text-white/15 mt-2">
                Aktører vil dukke opp her etter hvert
              </p>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
