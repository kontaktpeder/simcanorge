import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { FunFactsSection } from "@/components/home/FunFactsSection";
import { CTASection } from "@/components/home/CTASection";
import { SimcaLive } from "@/components/home/SimcaLive";

const Index = () => {
  return (
    <Layout>
      <SimcaLive />
      <HeroSection />
      <FunFactsSection />
      <CTASection />
    </Layout>
  );
};

export default Index;
