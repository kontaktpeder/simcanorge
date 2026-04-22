import { Layout } from "@/components/layout/Layout";
import { AnimatedSection } from "@/components/layout/AnimatedSection";
import { CarWizard } from "@/components/car/wizard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, Home, ArrowRight, AlertTriangle, LogOut, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";

type PageState =
  | { step: "wizard" }
  | { step: "linking" }
  | { step: "success"; email: string }
  | { step: "mismatch"; carId: string; signedInEmail: string | null };

function getPendingClaimCarIdFromUrl() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("claimCarId");
}

function getPendingClaimCarId() {
  if (typeof window === "undefined") return null;
  return getPendingClaimCarIdFromUrl() ?? localStorage.getItem("pendingClaimCarId");
}

function clearPendingClaimCarId() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("pendingClaimCarId");
}

async function resolvePostClaimPath(carId: string): Promise<string> {
  const { data: car } = await supabase
    .from("cars")
    .select("id, slug, status, published_at")
    .eq("id", carId)
    .single();

  if (car?.published_at && car?.slug) return `/biler/${car.slug}`;
  if (car) return `/dashboard/bil/${car.id}`;
  return "/dashboard/mine-biler";
}

function navigateToCarAfterClaim(
  carId: string,
  navigate: ReturnType<typeof useNavigate>,
  toast: ReturnType<typeof useToast>["toast"],
) {
  void (async () => {
    const path = await resolvePostClaimPath(carId);
    toast({
      title: "Bilen er din",
      description: "Du kan sette passord senere fra profilen din.",
    });
    navigate(path);
  })();
}

export default function SendInnBil() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const claimHandledRef = useRef(false);
  const [state, setState] = useState<PageState>(() => {
    if (getPendingClaimCarId()) {
      return { step: "linking" };
    }
    return { step: "wizard" };
  });

  // Handle car claim after magic link redirect
  useEffect(() => {
    const pendingCarId = getPendingClaimCarId();
    if (!pendingCarId) return;

    localStorage.setItem("pendingClaimCarId", pendingCarId);

    const linkCarToUser = async (_userId: string) => {
      if (claimHandledRef.current) return;
      claimHandledRef.current = true;

      const { data: result, error } = await supabase.rpc("claim_car_after_email_verify", {
        p_car_id: pendingCarId,
      });

      const res = result as any;

      if (!error && res?.ok) {
        clearPendingClaimCarId();
        navigateToOnboarding(pendingCarId, navigate, toast);
        return;
      }

      clearPendingClaimCarId();
      console.warn("Car claim failed:", error?.message ?? res?.error ?? "unknown");
      claimHandledRef.current = false;
      toast({
        title: "Innlogging registrert, men bilen ble ikke koblet",
        description: error?.message || "Bilen finnes kanskje ikke eller er allerede koblet.",
        variant: "destructive",
      });
      setState({ step: "wizard" });
    };

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        void linkCarToUser(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void linkCarToUser(session.user.id);
      }
    });

    const fallbackTimer = window.setTimeout(() => {
      if (claimHandledRef.current) return;
      clearPendingClaimCarId();
      setState({ step: "wizard" });
    }, 8000);

    return () => {
      window.clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, [toast, navigate]);

  const handleWizardSuccess = async ({ carId, email, flow }: { carId: string; email: string; flow: "guest" | "authenticated" }) => {
    if (flow === "authenticated") {
      // Authenticated user: skip OTP, go directly to dashboard
      queryClient.invalidateQueries({ queryKey: ["my-cars"] });
      queryClient.invalidateQueries({ queryKey: ["my-cars-count"] });
      const path = await resolvePostClaimPath(carId);
      navigate(path);
      toast({ title: "Bilen er lagt til", description: "Du finner den i garasjen din." });
      return;
    }

    // Guest flow: send magic link
    try {
      localStorage.setItem("pendingClaimCarId", carId);
      const redirectUrl = new URL("/send-inn", window.location.origin);
      redirectUrl.searchParams.set("claimCarId", carId);

      await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: redirectUrl.toString(),
        },
      });
    } catch (err) {
      console.warn("Magic link send failed:", err);
    }

    setState({ step: "success", email });
  };

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

  if (state.step === "success") {
    return (
      <Layout contained>
        <section className="py-8 sm:py-12 md:py-16">
          <div className="container mx-auto max-w-xl px-4">
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-8 w-8 text-primary" />
              </div>

              <div className="space-y-2">
                <h2 className="font-display text-2xl text-foreground sm:text-3xl">
                  Takk! Vi har sendt deg en e-post
                </h2>
                <p className="mx-auto max-w-md text-sm text-muted-foreground sm:text-base">
                  En innloggingslenke er sendt til{" "}
                  <strong className="text-foreground">{state.email}</strong>.
                </p>
              </div>

              <div className="mx-auto max-w-sm space-y-2 rounded-xl border border-border bg-muted/30 p-5 text-left text-sm text-muted-foreground">
                <p className="font-display text-base text-foreground">Hva gjør lenken?</p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Logger deg inn og kobler bilen til din konto</li>
                  <li>Du kan redigere, legge til bilder og følge godkjenningen</li>
                  <li>Du velger passord når du logger inn første gang</li>
                </ul>
                <p className="text-xs pt-1">Sjekk spam-mappen om du ikke finner e-posten.</p>
              </div>

              <div className="mx-auto max-w-sm flex flex-col gap-3 pt-2">
                <Button asChild className="btn-enamel-blue h-12 text-base w-full">
                  <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer">
                    <Mail className="mr-2 h-5 w-5" /> Åpne e-post
                  </a>
                </Button>
                <Button asChild variant="outline" className="h-12 text-base w-full">
                  <Link to="/">
                    <Home className="mr-2 h-5 w-5" /> Utforsk Bilgarasjen
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout contained fillHeight>
      <section className="flex flex-col flex-1 min-h-0 py-4 sm:py-6">
        <div className="container mx-auto px-4 flex flex-col flex-1 min-h-0">
          <div className="mb-4 text-center shrink-0">
            <h1 className="mb-1 font-display text-2xl text-foreground sm:text-3xl md:text-4xl">
              DEL BILEN DIN
            </h1>
            <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">
              Har du en bil med en historie å dele? Legg den til – du kan bygge på med flere detaljer senere når du har fått tilgang til garasjen din.
            </p>
          </div>

          <div className="flex-1 min-h-0">
            <CarWizard onSuccess={handleWizardSuccess} />
          </div>
        </div>
      </section>
    </Layout>
  );
}
