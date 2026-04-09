import { Link } from "react-router-dom";
import { Mail, Globe, Phone } from "lucide-react";
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

      {/* ── HERO — cover image only ── */}
      {page.cover_url && (
        <section className="relative w-full h-[240px] md:h-[360px]">
          <img
            src={page.cover_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        </section>
      )}

      {/* ── BODY ── */}
      <div className="max-w-[960px] mx-auto px-4 md:px-8 py-8 md:py-14">

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

        {/* Community cars */}
        <ClubCommunityCars
          page={{ id: page.id, slug: page.slug, brand_key: page.brand_key }}
          variant="classic"
        />

        {/* Klubb-feed */}
        {feedPosts && feedPosts.length > 0 && (
          <>
            {/* Chrome divider */}
            <div className="flex items-center gap-4 my-8 md:my-12">
              <div className="flex-1 h-[2px] rounded-full" style={{ background: "linear-gradient(90deg, transparent, #B8C0CC 30%, #FFFFFF 50%, #B8C0CC 70%, transparent)" }} />
              <div className="w-2 h-2 rounded-full bg-accent" />
              <div className="flex-1 h-[2px] rounded-full" style={{ background: "linear-gradient(90deg, transparent, #B8C0CC 30%, #FFFFFF 50%, #B8C0CC 70%, transparent)" }} />
            </div>

            <div className="border border-border/50 rounded-xl p-5 md:p-8 bg-card">
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

      {/* ── FOOTER — poster-section-blue matching hero ── */}
      <div className="poster-section-blue relative">
        <div className="absolute inset-0 stripes-diagonal" />
        <div className="relative z-10 px-6 md:px-12 pt-1">
          <div
            className="h-[2px] rounded-full opacity-40"
            style={{ background: "linear-gradient(90deg, transparent 0%, #B8C0CC 20%, #FFFFFF 50%, #B8C0CC 80%, transparent 100%)" }}
          />
        </div>
        <div className="max-w-[960px] mx-auto px-6 md:px-12 py-5 flex items-center justify-between relative z-10">
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
