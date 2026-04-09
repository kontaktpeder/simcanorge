import { Link } from "react-router-dom";
import { Mail, Globe, Phone, ArrowRight } from "lucide-react";
import { PublicPageHero } from "./PublicPageHero";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { FeedCard } from "@/components/feed/FeedCard";
import { useClubCommunityCars, firstCarImage, clubBrandToken } from "@/hooks/useClubCommunityCars";
import { Skeleton } from "@/components/ui/skeleton";
import type { Database } from "@/integrations/supabase/types";

type PageRow = Database["public"]["Tables"]["pages"]["Row"];

interface Page {
  id: string;
  title: string;
  slug: string;
  tagline: string | null;
  about: string | null;
  logo_url: string | null;
  cover_url: string | null;
  location: string | null;
  founded_year: number | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  page_type: string;
  brand_key: string | null;
}

function ClubCarsSection({ page }: { page: Page }) {
  const clubPage = { id: page.id, slug: page.slug, brand_key: page.brand_key };
  const { data: cars, isLoading, isFetched } = useClubCommunityCars(clubPage);
  const token = clubBrandToken(clubPage);

  if (!token) return null;
  if (isFetched && (!cars || cars.length === 0)) return null;

  const listUrl = `/biler?brand=${encodeURIComponent(token)}`;

  if (isLoading) {
    return (
      <div className="mb-10 md:mb-14">
        <Skeleton className="h-6 w-40 mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-10 md:mb-14">
      <div className="flex items-end justify-between mb-5">
        <div>
          <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground font-sans font-semibold mb-1">
            Miljøet
          </p>
          <h2 className="text-xl md:text-2xl font-display uppercase tracking-wide text-foreground">
            Biler fra miljøet
          </h2>
        </div>
        <Link
          to={listUrl}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-accent transition-colors"
        >
          Se alle biler
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {cars!.map((car) => {
          const img = firstCarImage(car);
          return (
            <Link
              key={car.id}
              to={`/biler/${car.slug}`}
              className="group block rounded-lg overflow-hidden bg-card border border-border/50 hover:shadow-md transition-shadow"
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                {img ? (
                  <img
                    src={img}
                    alt={car.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-xs">
                    Bilde
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-sm font-semibold text-foreground truncate">{car.title}</p>
                {car.year != null && <p className="text-xs text-muted-foreground">{car.year}</p>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function ClubClassicTemplate({ page }: { page: Page }) {
  const { data: feedPosts } = useFeedPosts({ pageId: page.id, limit: 8 });

  // Cast to PageRow for PublicPageHero compatibility
  const heroPage = page as unknown as PageRow;

  return (
    <div className="bg-background font-sans">

      {/* ── HERO — poster-section-blue like homepage ── */}
      <section className="poster-section poster-section-blue hero-watermark relative overflow-hidden min-h-[280px] md:min-h-[340px] flex flex-col justify-center">
        <div className="absolute inset-0 stripes-diagonal" />

        {page.cover_url && (
          <>
            <img
              src={page.cover_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-luminosity"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B2A55]/90 via-[#0B2A55]/60 to-transparent" />
          </>
        )}

        <div className="container mx-auto relative z-10">
          <div className="flex items-center gap-6 md:gap-10">
            {/* Logo left */}
            {page.logo_url && (
              <img
                src={page.logo_url}
                alt={page.title}
                className="h-24 md:h-36 lg:h-44 w-auto flex-shrink-0"
                style={{
                  filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4)) drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                }}
              />
            )}

            {/* Text right */}
            <div>
              {page.founded_year && (
                <p className="text-[10px] tracking-[0.35em] uppercase text-white/40 font-sans font-semibold mb-1">
                  Est. {page.founded_year}
                </p>
              )}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display leading-[0.95] text-white uppercase tracking-wide">
                {page.title}
              </h1>
              {page.tagline && (
                <p className="text-sm md:text-lg text-white/60 mt-2 max-w-lg font-serif italic">
                  {page.tagline}
                </p>
              )}
              {page.location && (
                <p className="text-xs text-white/35 mt-3 tracking-wide">
                  📍 {page.location}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── BODY ── */}
      <div className="max-w-[1000px] mx-auto px-5 md:px-8 py-8 md:py-14">

        {/* Om klubben */}
        {page.about && (
          <div className="mb-10 md:mb-14">
            <div className="grid md:grid-cols-[240px_1fr] gap-6 md:gap-10">
              <div className="space-y-3">
                <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground font-sans font-semibold">
                  Om klubben
                </p>
                <h2 className="text-xl md:text-2xl font-display uppercase tracking-wide text-foreground">
                  Hvem er vi?
                </h2>
                <div className="flex flex-col gap-2 mt-4">
                  {page.contact_email && (
                    <a href={`mailto:${page.contact_email}`} className="flex items-center gap-2 text-[13px] text-primary hover:text-accent transition-colors">
                      <Mail className="w-3.5 h-3.5" />
                      Kontakt oss
                    </a>
                  )}
                  {page.website && (
                    <a href={page.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[13px] text-primary hover:text-accent transition-colors">
                      <Globe className="w-3.5 h-3.5" />
                      Nettside
                    </a>
                  )}
                  {page.contact_phone && (
                    <a href={`tel:${page.contact_phone}`} className="flex items-center gap-2 text-[13px] text-primary hover:text-accent transition-colors">
                      <Phone className="w-3.5 h-3.5" />
                      {page.contact_phone}
                    </a>
                  )}
                </div>
              </div>

              <div className="md:border-l md:border-border md:pl-10">
                <p className="text-[15px] leading-[1.8] text-muted-foreground whitespace-pre-line font-sans">
                  {page.about}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Biler — inline, no card wrapper */}
        <ClubCarsSection page={page} />

        {/* Klubb-feed */}
        {feedPosts && feedPosts.length > 0 && (
          <>
            <div className="section-divider" />

            <div>
              <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground font-sans font-semibold mb-2">
                Siste nytt
              </p>
              <h2 className="text-xl md:text-2xl font-display uppercase tracking-wide text-foreground mb-6">
                Fra klubben
              </h2>
              <div className="space-y-6">
                {feedPosts.map((post) => (
                  <FeedCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
