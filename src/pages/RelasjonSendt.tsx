import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle2, Clock, Eye, Home, ArrowRight, Compass, Sparkles } from "lucide-react";
import { RELATIONSHIP_OPTIONS, type RelationshipType } from "@/lib/relationshipTypes";

interface RequestRow {
  id: string;
  car_id: string;
  status: string;
  created_at: string;
  relationship_type: RelationshipType;
  wants_stewardship: boolean;
  note: string | null;
}

interface CarRow {
  id: string;
  title: string;
  slug: string;
  published_at: string | null;
}

interface ThumbRow {
  car_id: string;
  image_url: string;
}

export default function RelasjonSendt() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/login?returnUrl=${encodeURIComponent(`/relasjon-sendt/${requestId ?? ""}`)}`);
    }
  }, [authLoading, user, requestId, navigate]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["relationship-request-success", requestId],
    enabled: !!requestId && !!user,
    queryFn: async () => {
      const { data: req, error: reqErr } = await supabase
        .from("car_relationship_requests" as any)
        .select("id, car_id, status, created_at, relationship_type, wants_stewardship, note")
        .eq("id", requestId!)
        .maybeSingle();
      if (reqErr) throw reqErr;
      if (!req) throw new Error("not_found");

      const request = req as unknown as RequestRow;

      const { data: car, error: carErr } = await supabase
        .from("cars")
        .select("id, title, slug, published_at")
        .eq("id", request.car_id)
        .maybeSingle();
      if (carErr) throw carErr;

      let thumb: string | null = null;
      if (car?.published_at) {
        const { data: imgs } = await supabase
          .from("car_images")
          .select("car_id, image_url, sort_order")
          .eq("car_id", request.car_id)
          .order("sort_order", { ascending: true })
          .limit(1);
        thumb = ((imgs as ThumbRow[] | null) ?? [])[0]?.image_url ?? null;
      }

      return { request, car: car as CarRow | null, thumb };
    },
  });

  if (authLoading || (!user && !authLoading)) {
    return (
      <Layout contained>
        <section className="py-12">
          <div className="container mx-auto max-w-xl px-4">
            <Skeleton className="h-64 w-full" />
          </div>
        </section>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout contained>
        <section className="py-8 sm:py-12 md:py-16">
          <div className="container mx-auto max-w-xl px-4 space-y-4">
            <Skeleton className="h-16 w-16 rounded-full mx-auto" />
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </section>
      </Layout>
    );
  }

  if (error || !data?.request || !data?.car) {
    return (
      <Layout contained>
        <section className="py-12">
          <div className="container mx-auto max-w-xl px-4 text-center space-y-4">
            <h1 className="font-display text-2xl text-foreground">Vi finner ikke forespørselen</h1>
            <p className="text-muted-foreground text-sm">
              Det kan hende lenken er gammel, eller at den tilhører en annen bruker.
            </p>
            <Button asChild className="btn-enamel-blue">
              <Link to="/garasje">
                <Home className="mr-2 h-4 w-4" /> Til min garasje
              </Link>
            </Button>
          </div>
        </section>
      </Layout>
    );
  }

  const { request, car, thumb } = data;
  const isPublished = !!car.published_at;
  const relLabel =
    RELATIONSHIP_OPTIONS.find(o => o.value === request.relationship_type)?.label ??
    request.relationship_type;

  return (
    <Layout contained>
      <section className="py-8 sm:py-12 md:py-16">
        <div className="container mx-auto max-w-2xl px-4">
          <div className="space-y-8">
            {/* Hero — "Du er nå på vei inn i bilens historie" */}
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h1 className="font-display text-3xl sm:text-4xl text-foreground">
                  Du er på vei inn i bilens historie
                </h1>
                <p className="mx-auto max-w-md text-base text-muted-foreground">
                  Forespørselen din om å knyttes til <strong className="text-foreground">«{car.title}»</strong> er sendt.
                </p>
              </div>
            </div>

            {/* Car card */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-stretch gap-4 p-4 sm:p-5">
                <div className="h-24 w-32 sm:h-28 sm:w-40 shrink-0 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  {thumb ? (
                    <img src={thumb} alt={car.title} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 text-center">
                      {isPublished ? "Ingen bilde" : "Ikke publisert ennå"}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Din relasjon</p>
                  <p className="font-display text-lg sm:text-xl text-foreground leading-tight">{car.title}</p>
                  <p className="text-sm text-muted-foreground">{relLabel}</p>
                  {request.wants_stewardship && (
                    <p className="text-xs text-primary mt-1">
                      Hvis eier/admin godkjenner forespørselen, får du redigeringstilgang til bilen.
                    </p>
                  )}
                </div>
              </div>

              {/* Status strip */}
              <div className="border-t border-border bg-muted/30 px-4 sm:px-5 py-3 flex items-start gap-3">
                {isPublished ? (
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                ) : (
                  <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <div className="text-sm">
                  <p className="font-medium text-foreground">
                    {isPublished ? "Forespørsel mottatt" : "Venter på behandling"}
                  </p>
                  <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                    En ansvarlig vurderer forespørselen. Når den er behandlet, dukker oppdateringen opp under{" "}
                    <Link to="/garasje" className="underline underline-offset-2 hover:text-foreground">
                      Min garasje
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3">
              {isPublished && car.slug && (
                <Button asChild className="btn-enamel-blue h-12 text-base w-full">
                  <Link to={`/biler/${car.slug}`}>
                    <Eye className="mr-2 h-5 w-5" /> Se bilen
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button asChild variant={isPublished ? "outline" : "default"} className={isPublished ? "h-12 text-base w-full" : "btn-enamel-blue h-12 text-base w-full"}>
                <Link to="/garasje">
                  <Home className="mr-2 h-5 w-5" /> Min garasje
                </Link>
              </Button>
              <Button asChild variant="ghost" className="h-11 text-sm w-full">
                <Link to="/biler">
                  <Compass className="mr-2 h-4 w-4" /> Utforsk flere biler
                </Link>
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Forespørselen gir deg ikke automatisk redigeringsrett. Den knytter deg til bilens historikk når den er godkjent.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
