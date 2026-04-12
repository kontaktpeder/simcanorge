import { Layout } from "@/components/layout/Layout";
import { AnimatedSection } from "@/components/layout/AnimatedSection";
import { CarWizard } from "@/components/car/wizard";
import { StepVerify } from "@/components/car/wizard/StepVerify";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type PageState =
  | { step: "wizard" }
  | { step: "linking" }
  | { step: "verify"; carId: string; email: string };

async function navigateToCarDestination(
  carId: string,
  navigate: ReturnType<typeof useNavigate>,
  toast: ReturnType<typeof useToast>["toast"],
) {
  const { data: car } = await supabase
    .from("cars")
    .select("id, slug, status, published_at")
    .eq("id", carId)
    .single();

  toast({
    title: "Bilen er koblet til kontoen din",
    description: "Du kan nå redigere bilen fra ditt eget bilrom.",
  });

  if (car?.published_at) {
    navigate(`/biler/${car.slug}`);
  } else if (car) {
    navigate(`/dashboard/bil/${car.id}`);
  } else {
    navigate("/dashboard/mine-biler");
  }
}

export default function SendInnBil() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const claimHandledRef = useRef(false);
  const [state, setState] = useState<PageState>(() => {
    if (typeof window !== "undefined" && localStorage.getItem("pendingClaimCarId")) {
      return { step: "linking" };
    }
    return { step: "wizard" };
  });

  // Handle car claim after magic link redirect
  useEffect(() => {
    const pendingCarId = localStorage.getItem("pendingClaimCarId");
    if (!pendingCarId) return;

    const linkCarToUser = async (userId: string) => {
      if (claimHandledRef.current) return;
      claimHandledRef.current = true;

      const { error } = await supabase
        .from("cars")
        .update({ created_by_user_id: userId } as any)
        .eq("id", pendingCarId);

      localStorage.removeItem("pendingClaimCarId");

      if (error) {
        claimHandledRef.current = false;
        toast({
          title: "Innlogging registrert, men bilen ble ikke koblet",
          description: error.message || "Prøv igjen fra lenken i e-posten.",
          variant: "destructive",
        });
        setState({ step: "wizard" });
        return;
      }

      await navigateToCarDestination(pendingCarId, navigate, toast);
    };

    // If already signed in, link immediately
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        void linkCarToUser(session.user.id);
      }
    });

    // Also listen for auth state changes (magic link processing)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void linkCarToUser(session.user.id);
      }
    });

    // Fallback: if nothing happens within 8s, clear and show wizard
    const fallbackTimer = window.setTimeout(() => {
      if (claimHandledRef.current) return;
      localStorage.removeItem("pendingClaimCarId");
      setState({ step: "wizard" });
    }, 8000);

    return () => {
      window.clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, [toast, navigate]);

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

  if (state.step === "verify") {
    return (
      <Layout contained>
        <section className="py-8 sm:py-12 md:py-16">
          <div className="container mx-auto max-w-xl px-4">
            <StepVerify
              email={state.email}
              carId={state.carId}
              onSkip={() => {
                toast({
                  title: "Bilen er sendt inn!",
                  description: "Du kan koble den til en konto senere.",
                });
                navigate("/");
              }}
              onVerified={async () => {
                await navigateToCarDestination(state.carId, navigate, toast);
              }}
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
              Har du en bil med en historie å dele? Legg den til – det tar bare noen minutter.
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
