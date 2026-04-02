import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { usePublicPageBySlug } from "@/hooks/usePageBySlug";
import { PublicPageHero } from "@/components/pages/PublicPageHero";
import { PublicPageAbout } from "@/components/pages/PublicPageAbout";
import { PublicPageContact } from "@/components/pages/PublicPageContact";
import { PublicPageEvents } from "@/components/pages/PublicPageEvents";
import { Layout } from "@/components/layout/Layout";

export default function PublicPagePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading, isError } = usePublicPageBySlug(slug);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh] bg-[hsl(var(--page-bg))]">
          <p className="text-white/40">Laster…</p>
        </div>
      </Layout>
    );
  }

  if (isError || !page) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 bg-[hsl(var(--page-bg))]">
          <h1 className="text-2xl font-bold mb-2 text-white">Siden ble ikke funnet</h1>
          <p className="text-white/40">Adressen finnes ikke eller er ikke offentlig.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>{page.title} | Bilgarasjen</title>
        {page.tagline && <meta name="description" content={page.tagline} />}
      </Helmet>

      <div className="min-h-screen bg-[hsl(var(--page-bg))]">
        <PublicPageHero page={page} />

        <div className="max-w-[1000px] mx-auto px-5 md:px-8 py-10">
          {/* About section — full width, no card */}
          <PublicPageAbout page={page} />

          {/* Divider */}
          <div className="h-[2px] bg-gradient-to-r from-[hsl(var(--page-accent)/0.4)] via-white/[0.06] to-transparent my-10" />

          {/* Contact + Events side by side on desktop */}
          <div className="grid gap-10 md:grid-cols-[1fr_1fr]">
            <PublicPageContact page={page} />
            <PublicPageEvents pageId={page.id} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
