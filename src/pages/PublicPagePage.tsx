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
        <div className="flex items-center justify-center min-h-[60vh] bg-[#0B0B0C]">
          <p className="text-white/40">Laster…</p>
        </div>
      </Layout>
    );
  }

  if (isError || !page) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 bg-[#0B0B0C]">
          <h1 className="text-2xl font-bold mb-2 text-white">Siden ble ikke funnet</h1>
          <p className="text-white/40">Adressen finnes ikke eller er ikke offentlig.</p>
        </div>
      </Layout>
    );
  }

  // Klubb + classic template → eget editorial layout
  if (page.page_type === "club" && (page as any).page_template === "classic") {
    return (
      <Layout>
        <Helmet>
          <title>{page.title} | Bilgarasjen</title>
          {page.tagline && <meta name="description" content={page.tagline} />}
        </Helmet>
        <ClubClassicTemplate page={page} />
      </Layout>
    );
  }

  // Standard layout for alle andre
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
