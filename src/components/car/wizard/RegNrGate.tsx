import { useEffect, useRef, useState } from "react";
import { Loader2, ExternalLink, ArrowRight, CheckCircle2, Eye, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LicensePlateInput } from "./LicensePlateInput";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FEATURES } from "@/config/features";
import { RelationshipRequestDialog } from "@/components/car/relationship/RelationshipRequestDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Hit = { id: string; slug: string; title: string; published_at: string | null };

type AlreadyLinkedState =
  | { kind: "owner"; hit: Hit }
  | { kind: "viewer"; hit: Hit }
  | { kind: "pending"; hit: Hit; requestId: string };

interface RegNrGateProps {
  onContinue: (registrationNumber: string) => void;
}

function normalize(raw: string): string {
  return raw.replace(/[\s\-]/g, "").toUpperCase();
}

export function RegNrGate({ onContinue }: RegNrGateProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [regnr, setRegnr] = useState(() => searchParams.get("reg") ?? "");
  const [hits, setHits] = useState<Hit[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [requestDialogFor, setRequestDialogFor] = useState<Hit | null>(null);
  const [checkingLink, setCheckingLink] = useState(false);
  const [alreadyLinked, setAlreadyLinked] = useState<AlreadyLinkedState | null>(null);
  const autoOpenedRef = useRef(false);

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

  // Auto-open relationship dialog after login redirect (URL-driven rehydration)
  useEffect(() => {
    if (autoOpenedRef.current) return;
    if (!user) return;
    if (searching || !searched) return;
    const intent = searchParams.get("intent");
    const carId = searchParams.get("carId");
    if (intent !== "rel" || !carId) return;
    const hit = hits.find(h => h.id === carId);
    if (!hit) return;
    autoOpenedRef.current = true;
    // Strip intent + carId so refresh doesn't re-trigger; keep reg for context.
    const next = new URLSearchParams(searchParams);
    next.delete("intent");
    next.delete("carId");
    setSearchParams(next, { replace: true });
    // Run through the same gate as a manual click so existing-link cases route correctly.
    void resolveClaim(hit);
  }, [user, searching, searched, hits, searchParams, setSearchParams]);

  // Three-way gate: existing owner → dashboard, existing viewer → public/garage,
  // pending request → success page, else → open relationship dialog.
  async function resolveClaim(hit: Hit) {
    if (!user) return;
    setCheckingLink(true);
    try {
      const [{ data: ownerRow }, { data: pendingRow }] = await Promise.all([
        supabase
          .from("car_owners")
          .select("id, role")
          .eq("car_id", hit.id)
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("car_relationship_requests" as any)
          .select("id")
          .eq("car_id", hit.id)
          .eq("requester_id", user.id)
          .eq("status", "pending")
          .maybeSingle(),
      ]);

      if (ownerRow?.role === "owner") {
        setAlreadyLinked({ kind: "owner", hit });
        return;
      }
      if (ownerRow) {
        // Any non-owner row (e.g. viewer) — relationship already exists.
        setAlreadyLinked({ kind: "viewer", hit });
        return;
      }
      if (pendingRow && (pendingRow as any).id) {
        setAlreadyLinked({ kind: "pending", hit, requestId: (pendingRow as any).id });
        return;
      }
      setRequestDialogFor(hit);
    } catch (err) {
      console.warn("resolveClaim failed", err);
      // Fall back to opening the dialog so the user isn't blocked.
      setRequestDialogFor(hit);
    } finally {
      setCheckingLink(false);
    }
  }

  const handleClaimIntent = (hit: Hit) => {
    if (FEATURES.relationshipRequestsV1) {
      if (!user) {
        // Write intent into URL so returnUrl carries everything we need to rehydrate.
        const next = new URLSearchParams(window.location.search);
        next.set("reg", norm);
        next.set("intent", "rel");
        next.set("carId", hit.id);
        const here = window.location.pathname + "?" + next.toString();
        navigate(`/login?returnUrl=${encodeURIComponent(here)}`);
        return;
      }
      void resolveClaim(hit);
      return;
    }
    // Fallback: mailto intent
    const subject = encodeURIComponent(`Knytt meg til bil: ${hit.title}`);
    const body = encodeURIComponent(
      `Bil: ${hit.title}\nReg.nr: ${norm}\nBil-ID: ${hit.id}\n` +
      (user?.email ? `Min e-post: ${user.email}\n` : "")
    );
    window.location.href = `mailto:hei@bilgarasje.no?subject=${subject}&body=${body}`;
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
                  Vi fant bilen din i Bilgarasje
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Denne bilen finnes allerede. Velg hva du vil gjøre videre.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {hits.map(hit => (
                <div
                  key={hit.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-background border border-border"
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
                    <p className="text-sm font-medium truncate">{hit.title}</p>
                    <a
                      href={`/biler/${hit.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Se profil <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <Button
                className="btn-enamel-blue h-12 w-full text-base"
                onClick={() => handleClaimIntent(hits[0])}
                disabled={checkingLink}
              >
                {checkingLink ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sjekker…
                  </>
                ) : (
                  "Dette er bilen min"
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center -mt-1">
                {user
                  ? "Vi kobler deg til bilen etter en kort bekreftelse."
                  : "Vi sender deg en lenke for å koble bilen til kontoen din."}
              </p>
              <Button
                variant="outline"
                className="h-11 w-full"
                onClick={() => onContinue(norm)}
                disabled={checkingLink}
              >
                Dette er en annen bil
              </Button>
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

      <RelationshipRequestDialog
        open={!!requestDialogFor}
        onOpenChange={(open) => {
          if (!open) setRequestDialogFor(null);
        }}
        carId={requestDialogFor?.id ?? ""}
        carTitle={requestDialogFor?.title}
        defaultRelationship="current_owner"
      />

      <AlreadyLinkedDialog
        state={alreadyLinked}
        onClose={() => setAlreadyLinked(null)}
        onNavigate={(to) => {
          setAlreadyLinked(null);
          navigate(to);
        }}
      />
    </div>
  );
}

function AlreadyLinkedDialog({
  state,
  onClose,
  onNavigate,
}: {
  state: AlreadyLinkedState | null;
  onClose: () => void;
  onNavigate: (to: string) => void;
}) {
  const open = !!state;

  let title = "";
  let description = "";
  let primaryLabel = "";
  let primaryTo = "";
  let primaryIcon = <Home className="mr-2 h-4 w-4" />;

  if (state?.kind === "owner") {
    title = "Du er allerede koblet til denne bilen";
    description = `«${state.hit.title}» ligger allerede i garasjen din. Du kan åpne den i dashbordet for å redigere historie, bilder og tidslinje.`;
    primaryLabel = "Åpne bilen";
    primaryTo = `/dashboard/bil/${state.hit.id}`;
  } else if (state?.kind === "viewer") {
    title = "Du er allerede knyttet til bilen";
    description = state.hit.published_at
      ? `Du har en relasjon til «${state.hit.title}». Du kan se den offentlige profilen, men eierskapet ligger hos noen andre.`
      : `Du har en relasjon til «${state.hit.title}». Bilen er ikke offentlig ennå — følg med i garasjen din for oppdateringer.`;
    primaryLabel = state.hit.published_at ? "Se bilen" : "Til min garasje";
    primaryTo = state.hit.published_at ? `/biler/${state.hit.slug}` : "/garasje";
    primaryIcon = state.hit.published_at ? <Eye className="mr-2 h-4 w-4" /> : <Home className="mr-2 h-4 w-4" />;
  } else if (state?.kind === "pending") {
    title = "Du har allerede en forespørsel på vei";
    description = `Forespørselen din om «${state.hit.title}» venter på behandling. Du trenger ikke sende den på nytt.`;
    primaryLabel = "Se status";
    primaryTo = `/relasjon-sendt/${state.requestId}`;
    primaryIcon = <ArrowRight className="mr-2 h-4 w-4" />;
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Lukk</AlertDialogCancel>
          <AlertDialogAction onClick={() => onNavigate(primaryTo)}>
            {primaryIcon}
            {primaryLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
