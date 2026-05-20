import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  X,
  Loader2,
  Link2,
  CheckCircle2,
  ChevronDown,
  Share2,
  ArrowRight,
  ImagePlus,
  Camera,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSpotCar, type SpotCarResult } from "@/hooks/useSpotCar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { LicensePlateInput } from "@/components/car/wizard/LicensePlateInput";
import { RelationshipRequestDialog } from "@/components/car/relationship/RelationshipRequestDialog";
import { track } from "@/lib/analytics";
import { shareObservation } from "@/lib/shareObservation";

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;
const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

export interface ObservationComposeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialImageFile?: File | null;
  onPublished?: (result: SpotCarResult) => void;
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

export function ObservationComposeSheet({
  open,
  onOpenChange,
  initialImageFile = null,
  onPublished,
}: ObservationComposeSheetProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { spotCar, isSubmitting } = useSpotCar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [regnr, setRegnr] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [match, setMatch] = useState<CarMatch | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [relOpen, setRelOpen] = useState(false);
  const [successResult, setSuccessResult] = useState<SpotCarResult | null>(null);

  const screen =
    location.pathname === "/" || location.pathname === "/app" ? "start" : "compose";

  const previewUrl = useMemo(() => {
    if (!imageFile) return null;
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (open && initialImageFile) setImageFile(initialImageFile);
  }, [open, initialImageFile]);

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
    };
  }, [regnr]);

  const variant: "matched" | "unknown" | "new_identified" | null = successResult
    ? successResult.matchedExistingCar
      ? "matched"
      : successResult.identificationStatus === "unknown"
        ? "unknown"
        : "new_identified"
    : null;

  useEffect(() => {
    if (!successResult || !variant) return;
    void track("spotting_success_view", screen, {
      variant,
      car_id: successResult.carId,
      has_slug: Boolean(successResult.slug),
    });
  }, [successResult, variant, screen]);

  const resetAll = () => {
    setImageFile(null);
    setCaption("");
    setRegnr("");
    setDetailsOpen(false);
    setMatch(null);
    setSuccessResult(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (next && !user) {
      navigate(`/login?returnUrl=${encodeURIComponent(location.pathname)}`);
      return;
    }
    if (!next) resetAll();
    onOpenChange(next);
  };

  const handlePublish = async () => {
    if (!imageFile) return;
    const result = await spotCar({
      imageFile,
      registrationNumber: regnr.trim() || undefined,
      note: caption.trim() || undefined,
    });
    if (result) {
      void track("spotting_submitted", screen, { car_id: result.carId });
      setSuccessResult(result);
      onPublished?.(result);
    }
  };

  const finish = () => {
    resetAll();
    onOpenChange(false);
  };

  const goToCar = () => {
    if (!successResult?.slug) return;
    void track("spotting_success_cta", screen, {
      cta: "see_car",
      variant,
      car_id: successResult.carId,
      has_slug: true,
    });
    navigate(`/biler/${successResult.slug}`);
    finish();
  };

  const handleShare = async () => {
    if (!successResult?.slug) return;
    void track("spotting_success_cta", screen, {
      cta: "share",
      variant,
      car_id: successResult.carId,
      has_slug: true,
    });
    await shareObservation(successResult.slug);
  };

  const pickFile = () => fileInputRef.current?.click();

  const isMatched = successResult?.matchedExistingCar === true;
  const isUnknown =
    !!successResult?.createdNewCar && successResult.identificationStatus === "unknown";

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          onInteractOutside={(e) => isSubmitting && e.preventDefault()}
          onEscapeKeyDown={(e) => isSubmitting && e.preventDefault()}
          className="p-0 gap-0 border-0 bg-[#070b10] text-white max-w-full w-screen h-[100dvh] sm:h-auto sm:max-h-[92vh] sm:max-w-lg sm:rounded-2xl sm:border sm:border-white/10 overflow-hidden flex flex-col"
        >
          {/* Top close */}
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="absolute right-3 top-3 z-30 rounded-full p-2 text-white/70 hover:text-white hover:bg-white/10 backdrop-blur-sm"
            style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
            aria-label="Lukk"
          >
            <X className="w-5 h-5" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              e.target.value = "";
              if (f) setImageFile(f);
            }}
          />

          {successResult ? (
            // ============= SUCCESS / REWARD =============
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-12 pb-8 animate-fade-in">
              <div className="relative mb-6">
                {previewUrl && (
                  <div className="w-44 h-44 rounded-2xl overflow-hidden border border-white/10 shadow-2xl animate-scale-in">
                    <img src={previewUrl} alt="Observasjon" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-full flex items-center justify-center bg-[#34eab8] border-4 border-[#070b10] animate-scale-in">
                  <CheckCircle2 className="w-6 h-6 text-[#070b10]" strokeWidth={2.5} />
                </div>
              </div>

              <h2
                className="text-2xl sm:text-3xl font-bold uppercase tracking-wider mb-2"
                style={chakra}
              >
                Bilen finnes nå i arkivet
              </h2>
              <p className="text-white/60 text-sm max-w-xs mb-1">
                {isMatched
                  ? "Observasjonen din er lagt til historikken."
                  : "Takk for at du fanget den."}
              </p>
              {isUnknown && (
                <p className="text-white/50 text-xs max-w-xs mb-2">
                  Andre kan hjelpe å identifisere bilen på bilsida.
                </p>
              )}

              <div className="flex flex-col gap-2.5 w-full max-w-xs mt-8">
                {successResult.slug && (
                  <>
                    <button
                      type="button"
                      onClick={goToCar}
                      className="w-full min-h-[52px] rounded-xl bg-[#34eab8] text-[#070b10] font-bold uppercase tracking-wider text-sm inline-flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all"
                      style={chakra}
                    >
                      Se bilside
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleShare}
                      className="w-full min-h-[48px] rounded-xl border border-white/15 bg-white/[0.04] text-white font-bold uppercase tracking-wider text-sm inline-flex items-center justify-center gap-2 hover:bg-white/[0.08] active:scale-[0.98] transition-all"
                      style={chakra}
                    >
                      <Share2 className="w-4 h-4" />
                      Del med venner
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={finish}
                  className="w-full min-h-[44px] text-white/55 hover:text-white text-xs uppercase tracking-[0.2em]"
                  style={oswald}
                >
                  Ferdig
                </button>
              </div>
            </div>
          ) : (
            // ============= COMPOSE =============
            <div className="flex-1 flex flex-col min-h-0">
              {/* Image as the post */}
              <div className="relative flex-1 min-h-0 bg-black flex items-center justify-center overflow-hidden">
                {previewUrl ? (
                  <>
                    <img
                      src={previewUrl}
                      alt="Forhåndsvisning"
                      className="w-full h-full object-contain animate-fade-in"
                    />
                    {/* Caption overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                      <Input
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Hva så du?"
                        className="border-white/15 bg-white/[0.08] backdrop-blur-md text-white placeholder:text-white/55 min-h-[48px] text-base rounded-xl"
                        style={chakra}
                        maxLength={280}
                      />
                    </div>
                    {/* Change image */}
                    <button
                      type="button"
                      onClick={pickFile}
                      className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur-md px-3 py-1.5 text-xs text-white/85 hover:bg-black/70 transition-colors"
                      style={oswald}
                    >
                      <ImagePlus className="w-3.5 h-3.5" />
                      Bytt bilde
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={pickFile}
                    className="flex flex-col items-center gap-3 text-white/55 hover:text-white px-8 py-12 transition-colors"
                  >
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, #34eab8, #1cb896)",
                      }}
                    >
                      <Camera className="w-9 h-9 text-[#070b10]" strokeWidth={2.25} />
                    </div>
                    <span className="text-sm uppercase tracking-[0.18em] font-bold text-white/80" style={chakra}>
                      Velg et bilde
                    </span>
                  </button>
                )}
              </div>

              {/* Bottom action area */}
              <div
                className="shrink-0 px-4 pt-3 pb-4 border-t border-white/[0.06] bg-[#070b10] space-y-3"
                style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
              >
                <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
                  <CollapsibleTrigger className="w-full inline-flex items-center justify-between text-xs uppercase tracking-[0.16em] text-white/55 hover:text-white/85 transition-colors py-1.5" style={oswald}>
                    <span>Legg til detaljer</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${detailsOpen ? "rotate-180" : ""}`}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3 space-y-2 animate-fade-in">
                    <LicensePlateInput value={regnr} onChange={setRegnr} />
                    <p className="text-[10px] text-white/40 leading-snug">
                      Vises aldri offentlig — brukes til å matche bil i arkivet.
                    </p>

                    {isLookingUp && (
                      <div className="flex items-center gap-2 text-xs text-white/55">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Søker i arkivet…
                      </div>
                    )}

                    {!isLookingUp && match && (
                      <div className="rounded-lg border border-[#34eab8]/30 bg-[#34eab8]/[0.06] p-3 animate-fade-in">
                        <p
                          className="text-[10px] uppercase tracking-[0.16em] text-[#34eab8]"
                          style={oswald}
                        >
                          Finnes i arkivet
                        </p>
                        <p className="text-sm font-semibold text-white truncate mt-0.5">
                          {match.title}
                        </p>
                        <button
                          type="button"
                          onClick={() => setRelOpen(true)}
                          className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#34eab8] hover:text-white transition-colors"
                          style={oswald}
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          Dette er min bil
                        </button>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={!imageFile || isSubmitting}
                  className="w-full min-h-[54px] rounded-xl bg-[#34eab8] text-[#070b10] font-bold uppercase tracking-wider text-sm inline-flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={chakra}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Del bilen</>
                  )}
                </button>
              </div>
            </div>
          )}
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
            resetAll();
            onOpenChange(false);
          }}
        />
      )}
    </>
  );
}
