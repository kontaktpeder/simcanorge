import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { usePublicPageBySlug } from "@/hooks/usePageBySlug";
import { PublicPageHero } from "@/components/pages/PublicPageHero";
import { PublicPageAbout } from "@/components/pages/PublicPageAbout";
import { PublicPageContact } from "@/components/pages/PublicPageContact";

export default function PublicPagePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading, isError } = usePublicPageBySlug(slug);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Laster…</p>
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-2xl font-bold mb-2">Siden ble ikke funnet</h1>
        <p className="text-muted-foreground">Adressen finnes ikke eller er ikke offentlig.</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{page.title} | Bilgarasjen</title>
        {page.tagline && <meta name="description" content={page.tagline} />}
      </Helmet>

      <div className="min-h-screen">
        <PublicPageHero page={page} />
        <div className="max-w-4xl mx-auto px-4 py-8 grid gap-6 md:grid-cols-[2fr_1fr]">
          <PublicPageAbout page={page} />
          <PublicPageContact page={page} />
        </div>
      </div>
    </>
  );
}
