import { useEffect, useState } from "react";
import { Loader2, ExternalLink, ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LicensePlateInput } from "./LicensePlateInput";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type Hit = { id: string; slug: string; title: string; published_at: string | null };

interface RegNrGateProps {
  onContinue: (registrationNumber: string) => void;
}

function normalize(raw: string): string {
  return raw.replace(/[\s\-]/g, "").toUpperCase();
}

export function RegNrGate({ onContinue }: RegNrGateProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [regnr, setRegnr] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  // Debounced auto-search
  useEffect(() => {
    const norm = normalize(regnr).toLowerCase();
    if (norm.length < 4) {
      setHits([]);
      setThumbs({});
      setSearched(false);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await supabase.rpc("find_cars_by_registration_number", { p_normalized: norm });
        const found = (data as Hit[]) || [];
        setHits(found);

        // Fetch first image per hit (best-effort, public bucket)
        if (found.length > 0) {
          const ids = found.map(h => h.id);
          const { data: imgs } = await supabase
            .from("car_images")
            .select("car_id, image_url, sort_order")
            .in("car_id", ids)
            .order("sort_order", { ascending: true });
          const map: Record<string, string> = {};
          (imgs || []).forEach((row: any) => {
            if (!map[row.car_id]) map[row.car_id] = row.image_url;
          });
          setThumbs(map);
        } else {
          setThumbs({});
        }
      } catch (err) {
        console.warn("regnr lookup failed", err);
        setHits([]);
        setThumbs({});
      } finally {
        setSearching(false);
        setSearched(true);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [regnr]);

  const norm = normalize(regnr);
  const hasHits = searched && hits.length > 0;
  const noHits = searched && hits.length === 0 && norm.length >= 4 && !searching;

  const handleClaimIntent = (hit: Hit) => {
    const subject = encodeURIComponent(`Knytt meg til bil: ${hit.title}`);
    const body = encodeURIComponent(
      `Hei,\n\nJeg ønsker å bli koblet til denne bilen i Bilgarasje:\n\n` +
      `Bil: ${hit.title}\nReg.nr: ${norm}\nProfil: https://bilgarasje.no/biler/${hit.slug}\n` +
      `Bil-ID: ${hit.id}\n` +
      (user?.email ? `Min e-post: ${user.email}\nBruker-ID: ${user.id}\n` : "") +
      `\nMvh.`
    );
    window.location.href = `mailto:hei@bilgarasje.no?subject=${subject}&body=${body}`;
    toast({
      title: "Forespørsel klargjort",
      description: "Vi behandler den manuelt og kobler deg til bilen.",
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl sm:text-3xl text-foreground">Finn bilen din først</h2>
        <p className="text-sm sm:text-base text-muted-foreground mx-auto max-w-md">
          Skriv inn registreringsnummeret. Hvis bilen allerede ligger i Bilgarasje,
          slipper du å registrere den på nytt.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex flex-col items-center gap-3">
          <LicensePlateInput value={regnr} onChange={setRegnr} />
          <p className="text-xs text-muted-foreground">
            Valgfritt — du kan hoppe over hvis bilen ikke har norsk skilt.
          </p>
        </div>

        {searching && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Søker…
          </div>
        )}

        {hasHits && (
          <div className="space-y-3 rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display text-base text-foreground">
                  Vi fant bilen i Bilgarasje
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Hvis dette ser ut som riktig bil, kan du åpne profilen.
                  Hvis det ikke stemmer, kan du fortsette med ny registrering.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {hits.map(hit => (
                <a
                  key={hit.id}
                  href={`/biler/${hit.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 rounded-lg bg-background border border-border hover:border-primary/40 hover:bg-muted/50 transition-colors group"
                >
                  <div className="h-14 w-20 shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                    {thumbs[hit.id] ? (
                      <img
                        src={thumbs[hit.id]}
                        alt={hit.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Ingen bilde</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate group-hover:text-primary">{hit.title}</p>
                    <p className="text-xs text-muted-foreground">Se profil</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                </a>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-1">
              {user ? (
                <>
                  <Button
                    className="btn-enamel-blue h-11 w-full"
                    onClick={() => handleClaimIntent(hits[0])}
                  >
                    <Mail className="mr-2 h-4 w-4" /> Knytt meg til denne bilen
                  </Button>
                  <Button variant="outline" className="h-11 w-full" onClick={() => onContinue(norm)}>
                    Dette er ikke riktig bil – fortsett <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="btn-enamel-blue h-11 w-full"
                    onClick={() => onContinue(norm)}
                  >
                    Fortsett – knytt med e-postlenke senere <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Du registrerer bilen og bekrefter eierskap via e-posten din.
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {noHits && (
          <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm text-muted-foreground text-center">
            Ingen treff på <span className="font-mono font-semibold text-foreground">{norm}</span> —
            bilen er ikke registrert hos oss ennå.
          </div>
        )}

        <div className="pt-2 border-t border-border">
          <Button
            className="btn-enamel-blue h-12 w-full text-base"
            onClick={() => onContinue(norm)}
          >
            {norm.length >= 4 && noHits
              ? "Fortsett og registrer bilen"
              : norm.length === 0
                ? "Hopp over – jeg har ikke regnr"
                : "Fortsett"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
