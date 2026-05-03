import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Car as CarIcon, HelpCircle, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { IdentifyCarDialog } from "@/components/car/IdentifyCarDialog";
import { RelationshipRequestDialog } from "@/components/car/relationship/RelationshipRequestDialog";
import { FEATURES } from "@/config/features";
import {
  resolveSpottingCoverFromRow,
  type CarWithSpottingMedia,
} from "@/lib/spottingMedia";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

interface UnknownCar extends CarWithSpottingMedia {
  id: string;
  title: string;
  slug: string | null;
  created_at: string;
}

export default function UkjenteBiler() {
  const [identifyTarget, setIdentifyTarget] = useState<{ id: string; title: string } | null>(null);
  const [relationshipTarget, setRelationshipTarget] = useState<{ id: string; title: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["unknown-cars"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select(
          `id,title,slug,created_at,
           car_images(image_url,sort_order),
           car_events(visibility,occurred_at,car_event_images(image_url,sort_order))`,
        )
        .in("identification_status", ["unknown", "needs_review"])
        .eq("source", "spotting")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as UnknownCar[];
    },
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-primary/80 mb-2" style={oswald}>
            Hjelp fellesskapet
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={chakra}>
            Ukjente biler
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Noen har spottet disse bilene uten å vite hva de er. Vet du? Foreslå merke, modell og år.
          </p>
        </header>

        {isLoading && (
          <div className="text-center py-12 text-muted-foreground">Laster…</div>
        )}

        {!isLoading && (data?.length ?? 0) === 0 && (
          <div className="text-center py-16 border border-dashed border-border/40 rounded-lg">
            <CarIcon className="h-10 w-10 mx-auto text-muted-foreground/60 mb-3" />
            <p className="text-muted-foreground">Ingen ukjente biler akkurat nå.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.map((car) => {
            const cover = resolveSpottingCoverFromRow(car);
            const firstImage = cover?.image_url;
            return (
              <article
                key={car.id}
                className="rounded-lg border border-border/40 bg-card overflow-hidden flex flex-col"
              >
                <Link to={`/biler/${car.slug ?? car.id}`} className="block aspect-[4/3] bg-muted relative">
                  {firstImage ? (
                    <img
                      src={firstImage}
                      alt={car.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                      <CarIcon className="h-12 w-12" />
                    </div>
                  )}
                </Link>
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-primary/80" style={oswald}>
                      Ukjent bil
                    </p>
                    <h2 className="text-base font-semibold truncate" style={chakra}>
                      {car.title}
                    </h2>
                  </div>
                  <div className="mt-auto flex flex-col gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIdentifyTarget({ id: car.id, title: car.title })}
                    >
                      <HelpCircle className="h-4 w-4 mr-1.5" />
                      Vet du hva dette er?
                    </Button>
                    {FEATURES.relationshipRequestsV1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setRelationshipTarget({ id: car.id, title: car.title })}
                      >
                        <Link2 className="h-4 w-4 mr-1.5" />
                        Kjenner du til bilen?
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {identifyTarget && (
        <IdentifyCarDialog
          open={!!identifyTarget}
          onOpenChange={(o) => !o && setIdentifyTarget(null)}
          carId={identifyTarget.id}
          carTitle={identifyTarget.title}
        />
      )}

      {relationshipTarget && (
        <RelationshipRequestDialog
          open={!!relationshipTarget}
          onOpenChange={(o) => !o && setRelationshipTarget(null)}
          carId={relationshipTarget.id}
          carTitle={relationshipTarget.title}
          source="ukjente_biler"
        />
      )}
    </Layout>
  );
}
