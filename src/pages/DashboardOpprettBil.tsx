import { Layout } from "@/components/layout/Layout";
import { CarWizard } from "@/components/car/wizard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { PostCreateActionOverlay } from "@/components/car/PostCreateActionOverlay";

interface PostCreateState {
  carId: string;
  carSlug: string;
  carTitle: string;
  firstImageUrl: string | null;
  canPublish: boolean;
}

export default function DashboardOpprettBil() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [postCreate, setPostCreate] = useState<PostCreateState | null>(null);

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

  const handleWizardSuccess = async ({
    carId,
    flow,
    slug,
  }: {
    carId: string;
    email: string;
    flow: "guest" | "authenticated";
    publishedNow?: boolean;
    slug?: string;
  }) => {
    queryClient.invalidateQueries({ queryKey: ["my-cars"] });
    queryClient.invalidateQueries({ queryKey: ["my-cars-count"] });

    if (flow !== "authenticated") {
      navigate("/dashboard/mine-biler");
      return;
    }

    // Hent det vi trenger for å vise "Hva vil du nå?"-overlay
    try {
      const { data: car } = await supabase
        .from("cars")
        .select("title, slug, brand, model, car_images(image_url, sort_order)")
        .eq("id", carId)
        .single();

      const sortedImages = (car?.car_images ?? [])
        .slice()
        .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      const firstImage = sortedImages[0]?.image_url ?? null;
      const canPublish =
        sortedImages.length > 0 && !!car?.brand && !!car?.model;

      setPostCreate({
        carId,
        carSlug: car?.slug ?? slug ?? "",
        carTitle: car?.title ?? "Bilen din",
        firstImageUrl: firstImage,
        canPublish,
      });
    } catch {
      // Hvis vi ikke får hentet bilen, send dem direkte til detaljsiden
      navigate(`/dashboard/bil/${carId}`);
    }
  };

  const handleOverlayClose = () => {
    if (!postCreate) return;
    const { carId } = postCreate;
    setPostCreate(null);
    navigate(`/dashboard/bil/${carId}`);
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

      {postCreate && (
        <PostCreateActionOverlay
          carId={postCreate.carId}
          carSlug={postCreate.carSlug}
          carTitle={postCreate.carTitle}
          firstImageUrl={postCreate.firstImageUrl}
          canPublish={postCreate.canPublish}
          onClose={handleOverlayClose}
        />
      )}
    </Layout>
  );
}
