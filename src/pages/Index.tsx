import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { FunFactsSection } from "@/components/home/FunFactsSection";
import { CTASection } from "@/components/home/CTASection";
import { SimcaLive } from "@/components/home/SimcaLive";

const Index = () => {
  return (
    <Layout contained>
      {/* SimcaLive only shows on desktop as fixed element */}
      <SimcaLive />
      <HeroSection />
      <FunFactsSection />
      <CTASection />
    </Layout>
  );
};

export default Index;
