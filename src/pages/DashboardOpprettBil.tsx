import { Layout } from "@/components/layout/Layout";
import { CarWizard } from "@/components/car/wizard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

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

export default function DashboardOpprettBil() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login?returnUrl=/dashboard/opprett-bil");
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  const handleWizardSuccess = async ({ carId, flow }: { carId: string; email: string; flow: "guest" | "authenticated" }) => {
    queryClient.invalidateQueries({ queryKey: ["my-cars"] });
    queryClient.invalidateQueries({ queryKey: ["my-cars-count"] });

    if (flow === "authenticated") {
      const path = await resolvePostClaimPath(carId);
      toast({ title: "Bilen er lagt til", description: "Du finner den i garasjen din." });
      navigate(path);
      return;
    }

    // Fallback (shouldn't happen here since user is logged in)
    navigate("/dashboard/mine-biler");
  };

  return (
    <Layout contained fillHeight>
      <section className="flex flex-col flex-1 min-h-0 py-4 sm:py-6">
        <div className="container mx-auto px-4 flex flex-col flex-1 min-h-0">
          <div className="mb-4 shrink-0">
            <Link
              to="/dashboard/mine-biler"
              className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase font-semibold mb-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Tilbake til bilgarasjen
            </Link>
            <div className="text-center">
              <h1 className="mb-1 font-display text-2xl text-foreground sm:text-3xl md:text-4xl">
                LEGG INN BIL
              </h1>
              <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">
                Bygg opp bilsiden din steg for steg – du kan alltid komme tilbake og legge til mer.
              </p>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <CarWizard onSuccess={handleWizardSuccess} />
          </div>
        </div>
      </section>
    </Layout>
  );
}
