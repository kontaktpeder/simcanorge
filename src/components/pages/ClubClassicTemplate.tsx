import { Link } from "react-router-dom";
import { MapPin, Calendar, Mail, Globe, Phone } from "lucide-react";
import { PublicPageContact } from "./PublicPageContact";
import { ClubCommunityCars } from "./ClubCommunityCars";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { FeedCard } from "@/components/feed/FeedCard";

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

export function ClubClassicTemplate({ page }: { page: Page }) {
  const { data: feedPosts } = useFeedPosts({ pageId: page.id, limit: 8 });

  return (
    <div className="bg-background font-sans">

      {/* ── HERO — metallic blue lacquer ── */}
      <section className="relative overflow-hidden bg-metal-blue" style={{ minHeight: "420px" }}>
        {page.cover_url && (
          <>
            <img
              src={page.cover_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0F3E7A]" />
          </>
        )}

        {/* Chrome rule top */}
        <div className="relative z-10 pt-6 px-6 md:px-12">
          <div
            className="h-[3px] rounded-full"
            style={{ background: "linear-gradient(90deg, transparent 0%, #B8C0CC 20%, #FFFFFF 50%, #B8C0CC 80%, transparent 100%)" }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 md:px-12 py-12 md:py-20">
          {page.logo_url && (
            <div className="badge-frame p-1 mb-6">
              <img src={page.logo_url} alt="" className="w-24 h-24 rounded-xl object-cover" />
            </div>
          )}

          {page.founded_year && (
            <p className="text-xs tracking-[0.35em] uppercase text-white/60 mb-3 font-sans font-semibold">
              Est. {page.founded_year}
            </p>
          )}

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display leading-[0.95] text-white uppercase tracking-wide">
            {page.title}
          </h1>

          {page.tagline && (
            <p className="text-lg md:text-xl text-white/50 mt-4 max-w-xl italic font-serif">
              {page.tagline}
            </p>
          )}

          <div className="flex items-center gap-6 mt-8 text-xs text-white/50 font-sans">
            {page.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-white/40" />
                {page.location}
              </span>
            )}
            {page.founded_year && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-white/40" />
                Siden {page.founded_year}
              </span>
            )}
          </div>
        </div>

        {/* Chrome rule bottom */}
        <div className="relative z-10 pb-0 px-6 md:px-12">
          <div
            className="h-[3px] rounded-full"
            style={{ background: "linear-gradient(90deg, transparent 0%, #B8C0CC 20%, #FFFFFF 50%, #B8C0CC 80%, transparent 100%)" }}
          />
        </div>
      </section>

      {/* ── ENAMEL RED STRIP ── */}
      <div className="bg-metal-red">
        <div className="max-w-[900px] mx-auto px-6 md:px-12 py-3 flex items-center justify-center">
          <span className="text-[10px] tracking-[0.4em] uppercase text-white/80 font-display">
            {page.page_type === "club" ? "Klubb" : page.page_type} · Bilgarasjen
          </span>
        </div>
      </div>

      {/* ── BODY — cream background ── */}
      <div className="max-w-[900px] mx-auto px-6 md:px-12 py-12 md:py-16">

        {/* Om klubben */}
        {page.about && (
          <div className="border-chrome rounded-xl p-6 md:p-8 bg-card mb-12 md:mb-16">
            <div className="grid md:grid-cols-[260px_1fr] gap-8 md:gap-12">
              <div className="space-y-4">
                <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground font-sans font-semibold">
                  Om klubben
                </p>
                <h2 className="text-2xl font-display uppercase tracking-wide text-foreground">
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

              <div className="md:border-l md:border-chrome-mid/30 md:pl-12">
                <p className="text-[15px] leading-[1.8] text-muted-foreground whitespace-pre-line font-sans">
                  {page.about}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Community cars */}
        <ClubCommunityCars
          page={{ id: page.id, slug: page.slug, brand_key: page.brand_key }}
          variant="classic"
        />

        {/* TODO: Reintroduce events for clubs later when we have a clearer event model */}

        {/* Klubb-feed */}
        {feedPosts && feedPosts.length > 0 && (
          <>
            {/* Chrome divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-[2px] rounded-full" style={{ background: "linear-gradient(90deg, transparent, #B8C0CC 30%, #FFFFFF 50%, #B8C0CC 70%, transparent)" }} />
              <div className="w-2 h-2 rounded-full bg-primary" />
              <div className="flex-1 h-[2px] rounded-full" style={{ background: "linear-gradient(90deg, transparent, #B8C0CC 30%, #FFFFFF 50%, #B8C0CC 70%, transparent)" }} />
            </div>

            <div className="border-chrome rounded-xl p-6 md:p-8 bg-card">
              <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground font-sans font-semibold mb-2">
                Siste nytt
              </p>
              <h2 className="text-2xl font-display uppercase tracking-wide text-foreground mb-6">
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

      {/* ── FOOTER — metallic blue ── */}
      <div className="bg-metal-blue">
        <div className="relative z-10 px-6 md:px-12 pt-1">
          <div
            className="h-[2px] rounded-full"
            style={{ background: "linear-gradient(90deg, transparent 0%, #B8C0CC 20%, #FFFFFF 50%, #B8C0CC 80%, transparent 100%)" }}
          />
        </div>
        <div className="max-w-[900px] mx-auto px-6 md:px-12 py-6 flex items-center justify-between relative z-10">
          <span className="text-xs text-white/40 font-sans">
            {page.title}{page.founded_year ? ` · Est. ${page.founded_year}` : ""}
          </span>
          <Link to="/" className="text-xs text-white/30 hover:text-white/60 transition-colors font-sans">
            Bilgarasjen.no
          </Link>
        </div>
      </div>
    </div>
  );
}
