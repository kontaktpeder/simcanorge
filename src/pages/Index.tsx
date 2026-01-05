import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { FunFactsSection } from "@/components/home/FunFactsSection";
import { CTASection } from "@/components/home/CTASection";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <FunFactsSection />
      <CTASection />
    </Layout>
  );
};

export default Index;
