import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { usePublicPageBySlug } from "@/hooks/usePageBySlug";
import { PublicPageHero } from "@/components/pages/PublicPageHero";
import { PublicPageAbout } from "@/components/pages/PublicPageAbout";
import { PublicPageContact } from "@/components/pages/PublicPageContact";
import { PublicPageEvents } from "@/components/pages/PublicPageEvents";
import { Layout } from "@/components/layout/Layout";
import { getPageThemeStyle } from "@/lib/pageThemes";
import { MapPin, Calendar, Users } from "lucide-react";

export default function PublicPagePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading, isError } = usePublicPageBySlug(slug);

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

  const themeStyle = getPageThemeStyle(page.page_type);

  return (
    <Layout>
      <Helmet>
        <title>{page.title} | Bilgarasjen</title>
        {page.tagline && <meta name="description" content={page.tagline} />}
      </Helmet>

      <div className="min-h-screen bg-[#0B0B0C]" style={themeStyle}>
        {/* HERO */}
        <PublicPageHero page={page} />

        {/* INFO STRIP */}
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

        {/* CONTENT */}
        <div className="max-w-[1000px] mx-auto px-5 md:px-8 py-12 md:py-16">
          {/* Om oss */}
          <PublicPageAbout page={page} />

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-[hsl(var(--page-accent)/0.25)] via-white/[0.04] to-transparent my-12 md:my-16" />

          {/* Events + Contact */}
          <div className="grid gap-12 md:gap-16 md:grid-cols-[1.2fr_1fr]">
            <PublicPageEvents pageId={page.id} />
            <PublicPageContact page={page} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
