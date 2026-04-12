import { Layout } from "@/components/layout/Layout";
import { AnimatedSection } from "@/components/layout/AnimatedSection";
import { CarWizard } from "@/components/car/wizard";
import { StepVerify } from "@/components/car/wizard/StepVerify";
import { CheckCircle } from "lucide-react";
import { useState } from "react";

type PageState =
  | { step: "wizard" }
  | { step: "verify"; carId: string; email: string }
  | { step: "done" };

export default function SendInnBil() {
  const [state, setState] = useState<PageState>({ step: "wizard" });

  if (state.step === "done") {
    return (
      <Layout contained>
        <section className="min-h-[80vh] flex items-center relative overflow-hidden">
          <div className="absolute inset-0 top-0 h-1/2 bg-gradient-to-b from-primary to-primary/70" />
          <div className="absolute inset-0 top-1/2 bg-gradient-to-b from-destructive to-destructive/80" />
          <div className="absolute inset-0 stripes-diagonal opacity-30" />
          
          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="badge-frame bg-background/10 backdrop-blur-sm p-12 max-w-lg mx-auto">
              <CheckCircle className="w-20 h-20 text-primary-foreground mx-auto mb-6" />
              <h1 className="font-display text-4xl md:text-5xl text-primary-foreground mb-4">
                TAKK!
              </h1>
              <p className="font-serif text-xl text-primary-foreground/90">
                Vi gleder oss til å se hva du har sendt inn! Du vil få tilsendt en lenke på e-post, som lar deg logge inn i ditt eget bilrom, og redigere selv hva folk får se av bilen din.
              </p>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (state.step === "verify") {
    return (
      <Layout contained>
        <section className="py-8 sm:py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-xl">
            <StepVerify
              email={state.email}
              carId={state.carId}
              onSkip={() => setState({ step: "done" })}
              onVerified={() => setState({ step: "done" })}
            />
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout contained>
      <section className="py-8 sm:py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-foreground mb-3">
              DEL BILEN DIN
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
              Har du en Simca, Talbot eller Matra? Legg den til på siden – det tar bare noen minutter.
            </p>
          </div>

          <AnimatedSection triggerOnMount>
            <CarWizard onSuccess={({ carId, email }) => setState({ step: "verify", carId, email })} />
          </AnimatedSection>
        </div>
      </section>
    </Layout>
  );
}
