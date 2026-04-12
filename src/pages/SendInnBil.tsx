import { Layout } from "@/components/layout/Layout";
import { AnimatedSection } from "@/components/layout/AnimatedSection";
import { CarWizard } from "@/components/car/wizard";
import { StepVerify } from "@/components/car/wizard/StepVerify";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type PageState =
  | { step: "wizard" }
  | { step: "linking" }
  | { step: "verify"; carId: string; email: string }
  | { step: "done" };

export default function SendInnBil() {
  const { toast } = useToast();
  const claimHandledRef = useRef(false);
  const [state, setState] = useState<PageState>(() => {
    const hasClaimParam = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("claimCarId");
    return hasClaimParam ? { step: "linking" } : { step: "wizard" };
  });

  useEffect(() => {
    const claimCarId = new URLSearchParams(window.location.search).get("claimCarId");
    if (!claimCarId) return;

    const cleanClaimUrl = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete("claimCarId");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    };

    const linkCarToUser = async (userId: string) => {
      if (claimHandledRef.current) return;
      claimHandledRef.current = true;

      const { error } = await supabase
        .from("cars")
        .update({ created_by_user_id: userId } as any)
        .eq("id", claimCarId);

      if (error) {
        claimHandledRef.current = false;
        cleanClaimUrl();
        toast({
          title: "Innlogging registrert, men bilen ble ikke koblet",
          description: error.message || "Prøv igjen fra lenken i e-posten.",
          variant: "destructive",
        });
        setState({ step: "wizard" });
        return;
      }

      cleanClaimUrl();
      toast({
        title: "Bilen er koblet til kontoen din",
        description: "Du kan nå redigere bilen senere.",
      });
      setState({ step: "done" });
    };

    const fallbackTimer = window.setTimeout(() => {
      if (claimHandledRef.current) return;
      cleanClaimUrl();
      setState({ step: "wizard" });
    }, 5000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void linkCarToUser(session.user.id);
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        void linkCarToUser(session.user.id);
      }
    });

    return () => {
      window.clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, [toast]);

  if (state.step === "linking") {
    return (
      <Layout contained>
        <section className="py-8 sm:py-12 md:py-16">
          <div className="container mx-auto max-w-xl px-4 text-center">
            <div className="space-y-4 rounded-2xl border border-border bg-card p-8 shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <h1 className="font-display text-3xl text-foreground">Kobler bilen til kontoen din…</h1>
              <p className="text-muted-foreground">
                Vent et lite øyeblikk mens vi fullfører innloggingen fra e-posten.
              </p>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (state.step === "done") {
    return (
      <Layout contained>
        <section className="relative flex min-h-[80vh] items-center overflow-hidden">
          <div className="absolute inset-0 top-0 h-1/2 bg-gradient-to-b from-primary to-primary/70" />
          <div className="absolute inset-0 top-1/2 bg-gradient-to-b from-destructive to-destructive/80" />
          <div className="absolute inset-0 stripes-diagonal opacity-30" />

          <div className="container relative z-10 mx-auto px-4 text-center">
            <div className="badge-frame mx-auto max-w-lg bg-background/10 p-12 backdrop-blur-sm">
              <CheckCircle className="mx-auto mb-6 h-20 w-20 text-primary-foreground" />
              <h1 className="mb-4 font-display text-4xl text-primary-foreground md:text-5xl">
                TAKK!
              </h1>
              <p className="font-serif text-xl text-primary-foreground/90">
                Vi gleder oss til å se hva du har sendt inn! Hvis du koblet bilen til kontoen din via lenken på e-post,
                kan du redigere den senere fra ditt eget bilrom.
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
          <div className="container mx-auto max-w-xl px-4">
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
          <div className="mb-8 text-center sm:mb-12">
            <h1 className="mb-3 font-display text-3xl text-foreground sm:text-4xl md:text-5xl">
              DEL BILEN DIN
            </h1>
            <p className="mx-auto max-w-xl text-base text-muted-foreground sm:text-lg">
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
