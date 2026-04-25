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

  const handleWizardSuccess = async ({ carId, flow, publishedNow, slug }: { carId: string; email: string; flow: "guest" | "authenticated"; publishedNow?: boolean; slug?: string }) => {
    queryClient.invalidateQueries({ queryKey: ["my-cars"] });
    queryClient.invalidateQueries({ queryKey: ["my-cars-count"] });

    if (flow === "authenticated") {
      if (publishedNow && slug) {
        // Belønning: send brukeren til den offentlige siden av sin egen bil
        navigate(`/biler/${slug}`);
        return;
      }
      // Kladd: send til dashbord-detalj med tydelig "publiser nå"-mulighet
      navigate(`/dashboard/bil/${carId}`);
      return;
    }

    // Fallback (shouldn't happen here since user is logged in)
    navigate("/dashboard/mine-biler");
  };

  return (
    <Layout contained fillHeight>
      <section className="flex flex-col flex-1 min-h-0 py-2 sm:py-4">
        <div className="container mx-auto px-3 sm:px-4 flex flex-col flex-1 min-h-0">
          {/* Compact header – fixed, doesn't shrink */}
          <div className="shrink-0 mb-2 sm:mb-3 flex items-center justify-between gap-3">
            <Link
              to="/dashboard/mine-biler"
              className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] tracking-[0.15em] uppercase font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Tilbake til garasjen</span>
              <span className="xs:hidden">Tilbake</span>
            </Link>
            <h1 className="font-display text-sm sm:text-base uppercase tracking-[0.15em] text-foreground">
              Legg inn bil
            </h1>
          </div>

          {/* Wizard fills remaining height – internal scroll only when needed */}
          <div className="flex-1 min-h-0">
            <CarWizard onSuccess={handleWizardSuccess} />
          </div>
        </div>
      </section>
    </Layout>
  );
}
