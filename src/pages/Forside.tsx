import { Layout } from "@/components/layout/Layout";
import { SeoHead } from "@/components/seo";
import { HeroSection } from "@/components/home/HeroSection";
import { FunFactsSection } from "@/components/home/FunFactsSection";
import { CTASection } from "@/components/home/CTASection";
import { SimcaLive } from "@/components/home/SimcaLive";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/config/site";

/**
 * Klassisk Simca Norge-forside (metallic blue club homepage).
 * Gjenopprettet fra pre-Bilgarasje-layout; layout er uendret.
 */
export default function Forside() {
  return (
    <Layout contained>
      <SeoHead
        title={`${SITE_NAME} – ${SITE_TAGLINE}`}
        description={SITE_DESCRIPTION}
        canonicalPath="/"
      />
      <SimcaLive />
      <HeroSection />
      <FunFactsSection />
      <CTASection />
    </Layout>
  );
}
