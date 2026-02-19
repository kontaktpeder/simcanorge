import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { AnimatedSection } from "@/components/layout/AnimatedSection";
import { SendInnBilForm } from "@/components/car/SendInnBilForm";
import { CheckCircle } from "lucide-react";
import { useState } from "react";

export default function SendInnBil() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <Layout contained>
        <section className="min-h-[80vh] flex items-center relative overflow-hidden">
          {/* Blue top */}
          <div className="absolute inset-0 top-0 h-1/2 bg-gradient-to-b from-[#1F66B5] to-[#0F3E7A]" />
          {/* Red bottom */}
          <div className="absolute inset-0 top-1/2 bg-gradient-to-b from-[#C10D0D] to-[#9A0A0A]" />
          <div className="absolute inset-0 stripes-diagonal opacity-30" />
          
          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="badge-frame bg-white/10 backdrop-blur-sm p-12 max-w-lg mx-auto">
              <CheckCircle className="w-20 h-20 text-white mx-auto mb-6" />
              <h1 className="font-display text-4xl md:text-5xl text-white mb-4">
                TAKK!
              </h1>
              <p className="font-serif text-xl text-white/90">
                Vi gleder oss til å se hva du har sendt inn! Du vil få tilsendt en lenke på e-post, som lar deg logge inn i ditt eget bilrom, og redigere selv hva folk får se av bilen din.
              </p>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout contained>
      <PageHeader 
        title="SEND INN DIN BIL" 
        subtitle={"Har du en Simca, Talbot eller Matra? Del bilen din med oss,\nså kan vi få lagt den ut på siden!"} 
      />

      <section className="poster-section">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto">
            <AnimatedSection triggerOnMount>
              <SendInnBilForm onSuccess={() => setSubmitted(true)} />
            </AnimatedSection>
          </div>
        </div>
      </section>
    </Layout>
  );
}
