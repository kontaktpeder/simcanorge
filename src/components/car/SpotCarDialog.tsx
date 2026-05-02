import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Eye, Car as CarIcon, Link2, CheckCircle2, HelpCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSpotCar, type SpotCarResult } from "@/hooks/useSpotCar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { FEATURES } from "@/config/features";
import { LicensePlateInput } from "@/components/car/wizard/LicensePlateInput";
import { RelationshipRequestDialog } from "@/components/car/relationship/RelationshipRequestDialog";
import { track } from "@/lib/analytics";

interface SpotCarDialogProps {
  trigger?: React.ReactNode;
  onSpotted?: (result: SpotCarResult) => void;
}

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

export function SpotCarDialog({ trigger, onSpotted }: SpotCarDialogProps) {
  if (!FEATURES.spotting) return null;
  return <SpotCarDialogInner trigger={trigger} onSpotted={onSpotted} />;
}

interface CarMatch {
  id: string;
  slug: string | null;
  title: string;
  published_at: string | null;
}

function normalizeRegnr(regnr: string): string {
  return regnr.toLowerCase().replace(/\s|-/g, "").trim();
}

function SpotCarDialogInner({ trigger, onSpotted }: SpotCarDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { spotCar, isSubmitting } = useSpotCar();
  const [open, setOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [regnr, setRegnr] = useState("");
  const [titleOrModel, setTitleOrModel] = useState("");
  const [note, setNote] = useState("");

  const [match, setMatch] = useState<CarMatch | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [relOpen, setRelOpen] = useState(false);
  const [successResult, setSuccessResult] = useState<SpotCarResult | null>(null);

  // Debounced regnr lookup
  useEffect(() => {
    const normalized = normalizeRegnr(regnr);
    if (normalized.length < 2) {
      setMatch(null);
      setIsLookingUp(false);
      return;
    }
    let cancelled = false;
    setIsLookingUp(true);
    const handle = window.setTimeout(async () => {
      const { data } = await supabase.rpc(
        "find_cars_by_registration_number" as never,
        { p_normalized: normalized } as never,
      );
      if (cancelled) return;
      const list = Array.isArray(data) ? (data as CarMatch[]) : [];
      setMatch(list.length > 0 ? list[0] : null);
      setIsLookingUp(false);
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
      setIsLookingUp(false);
    };
  }, [regnr]);

  const screen = location.pathname === "/" ? "start" : "other";

  const handleOpenChange = (next: boolean) => {
    if (next) {
      void track("spot_intent_click", screen, { intent: "spot", path: location.pathname });
    }
    if (next && !user) {
      navigate(`/login?returnUrl=${encodeURIComponent(location.pathname)}`);
      return;
    }
    setOpen(next);
  };

  const resetForm = () => {
    setImageFile(null);
    setRegnr("");
    setTitleOrModel("");
    setNote("");
    setMatch(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return;
    const result = await spotCar({
      imageFile,
      registrationNumber: regnr.trim() || undefined,
      titleOrModel: titleOrModel.trim() || undefined,
      note: note.trim() || undefined,
    });
    if (result) {
      void track("spotting_submitted", screen, { car_id: result.carId, path: location.pathname });
      setOpen(false);
      resetForm();
      onSpotted?.(result.carId);
    }
  };

  const defaultTrigger = (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/[0.06] text-primary px-4 py-2.5 text-sm font-bold uppercase tracking-wider min-h-[44px] hover:bg-primary/10 transition-colors"
      style={oswald}
    >
      <Eye className="h-4 w-4" />
      Spot bil
    </button>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={oswald} className="uppercase tracking-wider">
              Spot bil
            </DialogTitle>
            <DialogDescription>
              Del en bil du har sett i dag. Registreringsnummer vises ikke offentlig.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="spot-image">
                Bilde <span className="text-destructive">*</span>
              </Label>
              <label
                htmlFor="spot-image"
                className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 bg-muted/20 p-6 cursor-pointer hover:border-primary/40 transition-colors min-h-[120px]"
              >
                <Camera className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground text-center">
                  {imageFile ? imageFile.name : "Trykk for å velge bilde"}
                </span>
              </label>
              <input
                id="spot-image"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Registreringsnummer (valgfritt)</Label>
              <LicensePlateInput value={regnr} onChange={setRegnr} />
              <p className="text-[11px] text-muted-foreground">
                Vises aldri offentlig — brukes kun for å matche eksisterende bil.
              </p>
            </div>

            {/* Match-kort */}
            {isLookingUp && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Søker etter bil…
              </div>
            )}
            {!isLookingUp && match && (
              <div className="rounded-lg border border-primary/30 bg-primary/[0.05] p-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary">
                    <CarIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] uppercase tracking-wider text-primary/80" style={oswald}>
                      Denne bilen finnes allerede
                    </p>
                    <p className="text-sm font-semibold text-foreground truncate">{match.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Har du et forhold til den? Knytt deg til historikken.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      className="mt-2 btn-enamel-blue"
                      onClick={() => setRelOpen(true)}
                    >
                      <Link2 className="mr-1.5 h-3.5 w-3.5" />
                      Jeg har forhold til denne bilen
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="spot-title">Modell / tittel (valgfritt)</Label>
              <Input
                id="spot-title"
                value={titleOrModel}
                onChange={(e) => setTitleOrModel(e.target.value)}
                placeholder="F.eks. Volvo 240"
                className="min-h-[44px]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="spot-note">Notat (valgfritt)</Label>
              <Textarea
                id="spot-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Hvor så du den? Hva fanget oppmerksomheten?"
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={!imageFile || isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-3 text-sm font-bold uppercase tracking-wider min-h-[48px] hover:bg-primary/90 transition-colors disabled:opacity-50"
              style={oswald}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              Spot bil
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {match && (
        <RelationshipRequestDialog
          open={relOpen}
          onOpenChange={setRelOpen}
          carId={match.id}
          carTitle={match.title}
          source="spotting"
          onSubmitted={() => {
            setOpen(false);
            resetForm();
          }}
        />
      )}
    </>
  );
}
