import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { usePublicPageBySlug } from "@/hooks/usePageBySlug";
import { PublicPageHero } from "@/components/pages/PublicPageHero";
import { PublicPageAbout } from "@/components/pages/PublicPageAbout";
import { PublicPageContact } from "@/components/pages/PublicPageContact";
import { PublicPageEvents } from "@/components/pages/PublicPageEvents";
import { ClubClassicTemplate } from "@/components/pages/ClubClassicTemplate";
import { Layout } from "@/components/layout/Layout";
import { getPageThemeStyle } from "@/lib/pageThemes";
import { MapPin, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { CreateCTA } from "@/components/ui/CreateCTA";
import { ClubCommunityCars } from "@/components/pages/ClubCommunityCars";
import { PlatformContextBanner } from "@/components/layout/PlatformContextBanner";

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

export default function PublicPagePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading, isError } = usePublicPageBySlug(slug);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect /s/:slug → /klubber/:slug for clubs
  useEffect(() => {
    if (page && page.page_type === "club" && location.pathname.startsWith("/s/")) {
      navigate(`/klubber/${page.slug}`, { replace: true });
    }
  }, [page, location.pathname, navigate]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]" style={{ background: '#eee7dd' }}>
          <p className="text-[#3a2e24]/40">Laster…</p>
        </div>
      </Layout>
    );
  }

  if (isError || !page) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4" style={{ background: '#eee7dd' }}>
          <h1 className="text-2xl font-bold mb-2 text-[#3a2e24]">Siden ble ikke funnet</h1>
          <p className="text-[#3a2e24]/40">Adressen finnes ikke eller er ikke offentlig.</p>
        </div>
      </Layout>
    );
  }

  // Klubb + classic template → eget editorial layout
  if (page.page_type === "club" && (page as any).page_template === "classic") {
    return (
      <Layout shortPage>
        <Helmet>
          <title>{page.title} | Bilgarasjen</title>
          {page.tagline && <meta name="description" content={page.tagline} />}
        </Helmet>
        <PlatformContextBanner light />
        <ClubClassicTemplate page={page} />
      </Layout>
    );
  }

  // Club modern → warm editorial theme matching Index.tsx
  const isClub = page.page_type === "club";

  if (isClub) {
    return (
      <Layout shortPage>
        <Helmet>
          <title>{page.title} | Bilgarasjen</title>
          {page.tagline && <meta name="description" content={page.tagline} />}
        </Helmet>

        <div>
          {/* ─── HERO ─── */}
          <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #4a3d30 0%, #3a2e24 40%, #2a2118 100%)' }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 30% 50%, transparent 50%, rgba(0,0,0,0.2) 100%)' }} />

            {page.cover_url && (
              <div className="absolute inset-0 pointer-events-none">
                <img
                  src={page.cover_url}
                  alt=""
                  className="absolute right-0 top-0 h-full w-full md:w-[58%] object-cover"
                  style={{
                    WebkitMaskImage: 'linear-gradient(to left, black 40%, transparent 100%)',
                    maskImage: 'linear-gradient(to left, black 40%, transparent 100%)',
                    opacity: 0.7,
                  }}
                />
              </div>
            )}

            <div className="relative z-10 max-w-[1000px] mx-auto px-5 md:px-8">
              <div className="flex items-end gap-5 md:gap-6 min-h-[280px] sm:min-h-[340px] md:min-h-[400px] pb-10 pt-8">
                {/* Logo */}
                {page.logo_url ? (
                  <img
                    src={page.logo_url}
                    alt={page.title}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-white/10 object-cover shadow-2xl flex-shrink-0"
                    style={{ boxShadow: '0 8px 32px -8px rgba(196,150,44,0.3)' }}
                  />
                ) : (
                  <div
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-white/10 flex items-center justify-center shadow-2xl flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.05)', boxShadow: '0 8px 32px -8px rgba(196,150,44,0.3)' }}
                  >
                    <span
                      className="text-3xl font-bold"
                      style={{ background: 'linear-gradient(135deg, #F5A623, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                    >
                      {page.title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="pb-1 flex-1 min-w-0">
                  <p className="text-[10px] tracking-[0.3em] uppercase mb-1"
                    style={{ ...chakra, fontWeight: 500, background: 'linear-gradient(135deg, #F5A623, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Klubb
                  </p>
                  <h1
                    className="text-[1.8rem] sm:text-[2.6rem] md:text-[3.2rem] leading-[0.95] uppercase tracking-[0.02em] text-white font-bold italic"
                    style={{ ...chakra, textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}
                  >
                    {page.title}
                  </h1>
                  {page.tagline && (
                    <p className="text-white/45 mt-2 text-sm sm:text-base tracking-wide max-w-[500px]">
                      {page.tagline}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <PlatformContextBanner light />

          {/* ─── INFO STRIP ─── */}
          <div style={{ background: 'linear-gradient(180deg, #f2ece4 0%, #eee7dd 100%)', borderBottom: '1px solid rgba(58,46,36,0.06)' }}>
            <div className="max-w-[1000px] mx-auto px-5 md:px-8">
              <div className="flex items-center gap-6 py-4">
                {page.location && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(page.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[13px] text-[#3a2e24]/50 hover:text-[#c4962c] transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#c4962c]/70" />
                    <span className="underline underline-offset-2 decoration-[#3a2e24]/15">
                      {page.location}
                    </span>
                  </a>
                )}
                {page.founded_year && (
                  <span className="flex items-center gap-2 text-[13px] text-[#3a2e24]/50">
                    <Calendar className="w-3.5 h-3.5 text-[#c4962c]/70" />
                    Grunnlagt {page.founded_year}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ─── CONTENT ─── */}
          <section style={{ background: 'linear-gradient(180deg, #eee7dd 0%, #ebe4da 40%, #e8e1d6 100%)' }}>
            <div className="max-w-[1000px] mx-auto px-5 md:px-8 py-12 md:py-16">
              {/* About */}
              {page.about && (
                <div className="mb-12 md:mb-16">
                  <h2
                    className="text-[1.3rem] md:text-[1.6rem] uppercase font-bold leading-[1] tracking-[0.06em] mb-6 text-[#3a2e24]"
                    style={chakra}
                  >
                    Om oss
                  </h2>
                  <p className="text-[15px] sm:text-base text-[#3a2e24]/60 whitespace-pre-wrap leading-[1.8] max-w-[680px]">
                    {page.about}
                  </p>
                </div>
              )}

              {/* Community cars */}
              <ClubCommunityCars
                page={{ id: page.id, slug: page.slug, brand_key: (page as any).brand_key ?? null }}
                variant="modern"
              />

              <div className="h-px bg-gradient-to-r from-[#c4962c]/25 via-[#3a2e24]/[0.06] to-transparent mb-12 md:mb-16" />

              {/* TODO: Reintroduce events for clubs later when we have a clearer event model */}

              {/* Contact — full width */}
              <PublicPageContact page={page} light />
            </div>
          </section>

          {!user && (
            <div className="px-5 md:px-8 pb-12" style={{ background: '#e8e1d6' }}>
              <div className="max-w-[1000px] mx-auto">
                <CreateCTA
                  createUrl="/dashboard/sider/ny"
                  label="Opprett din side"
                  description="Har du en klubb, bedrift eller samling?"
                  variant="card"
                />
              </div>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Standard dark layout for non-club pages
  const themeStyle = getPageThemeStyle(page.page_type, (page as any).page_template);

  return (
    <Layout>
      <Helmet>
        <title>{page.title} | Bilgarasjen</title>
        {page.tagline && <meta name="description" content={page.tagline} />}
      </Helmet>

      <div className="min-h-screen bg-[#0B0B0C]" style={themeStyle}>
        <PublicPageHero page={page} />

        <div className="max-w-[1000px] mx-auto px-5 md:px-8">
          <div className="flex items-center gap-6 py-5 border-b border-white/[0.06]">
            {page.location && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(page.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[13px] text-white/40 hover:text-[hsl(var(--page-accent))] transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-[hsl(var(--page-accent)/0.7)]" />
                <span className="underline underline-offset-2 decoration-white/15">
                  {page.location}
                </span>
              </a>
            )}
            {page.founded_year && (
              <span className="flex items-center gap-2 text-[13px] text-white/40">
                <Calendar className="w-3.5 h-3.5 text-[hsl(var(--page-accent)/0.7)]" />
                Grunnlagt {page.founded_year}
              </span>
            )}
          </div>
        </div>

        <div className="max-w-[1000px] mx-auto px-5 md:px-8 py-12 md:py-16">
          <PublicPageAbout page={page} />
          <div className="h-px bg-gradient-to-r from-[hsl(var(--page-accent)/0.25)] via-white/[0.04] to-transparent my-12 md:my-16" />
          <div className="grid gap-12 md:gap-16 md:grid-cols-[1.2fr_1fr]">
            <PublicPageEvents pageId={page.id} />
            <PublicPageContact page={page} />
          </div>
        </div>

        {!user && (
          <div className="max-w-[1000px] mx-auto px-5 md:px-8 pb-12">
            <CreateCTA
              createUrl="/dashboard/sider/ny"
              label="Opprett din side"
              description="Har du en klubb, bedrift eller samling?"
              variant="card"
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
