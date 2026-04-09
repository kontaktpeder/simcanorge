import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { PageTypeBadge } from "@/components/pages/PageTypeBadge";
import { CreateCTA } from "@/components/ui/CreateCTA";
import { MapPin, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">bilgarasje.no</p>
            <h1 className="text-3xl font-bold tracking-tight">Klubber</h1>
            <p className="text-muted-foreground mt-1">
              Bilklubber og entusiastforeninger i det norske bilmiljøet.
            </p>
          </div>

          <div className="max-w-md">
            <CreateCTA
              createUrl="/dashboard/sider/ny"
              label="Registrer din klubb"
              description="Har du en bilklubb eller forening?"
              variant="strip"
            />
          </div>

          <div>
            {isLoading && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            )}

            {!isLoading && pages && pages.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {pages.map((page) => (
                  <Link
                    key={page.id}
                    to={`/klubber/${page.slug}`}
                    className="group block rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="h-28 bg-muted relative overflow-hidden">
                      {page.cover_url ? (
                        <img src={page.cover_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                      )}
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        {page.logo_url ? (
                          <img src={page.logo_url} alt="" className="w-8 h-8 rounded-full object-cover border" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">
                              {page.title.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <PageTypeBadge type={page.page_type} />
                      </div>

                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {page.title}
                      </h3>

                      {page.tagline && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{page.tagline}</p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
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
              <div className="text-center py-16 space-y-2">
                <p className="text-lg font-semibold">Ingen klubber enda</p>
                <p className="text-muted-foreground text-sm">Bli den første til å registrere din klubb</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
