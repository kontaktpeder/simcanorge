import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Lock,
  Globe,
  MessageCircle,
  Sparkles,
  X,
  ArrowRight,
  Car as CarIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  publishObservation,
  type PublishObservationResult,
} from "@/lib/publishObservation";
import {
  usePublishComposer,
  type PublishComposerType,
  type PublishComposerVisibility,
} from "@/contexts/PublishComposerContext";

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;
const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

const SPOT_NEW = "__spot_new__";

interface MyCar {
  id: string;
  title: string;
  slug: string | null;
}

function Chip({
  active,
  onClick,
  children,
  variant = "default",
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "default" | "primary";
}) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] font-bold transition-colors";
  const styles = active
    ? variant === "primary"
      ? "bg-[#34eab8] text-[#070b10]"
      : "bg-white/[0.14] text-white border border-white/20"
    : "bg-white/[0.04] text-white/55 border border-white/10 hover:bg-white/[0.08] hover:text-white/80";
  return (
    <button type="button" onClick={onClick} className={`${base} ${styles}`} style={chakra}>
      {children}
    </button>
  );
}

export function PublishComposer() {
  const { isOpen, props, closePublishComposer } = usePublishComposer();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [type, setType] = useState<PublishComposerType>("moment");
  const [visibility, setVisibility] =
    useState<PublishComposerVisibility>("public");
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [selectedCarTitle, setSelectedCarTitle] = useState<string | null>(null);
  const [myCars, setMyCars] = useState<MyCar[]>([]);
  const [carPickerOpen, setCarPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<PublishObservationResult | null>(null);

  // ─── Initialiser fra openPublishComposer-props ──────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setImageFile(props.initialImageFile ?? null);
    setCaption("");
    setType(props.defaultType ?? "moment");
    setVisibility(props.defaultVisibility ?? "public");
    setSelectedCarId(props.prefillCarId ?? null);
    setSelectedCarTitle(props.prefillCarTitle ?? null);
    setResult(null);
    setIsSubmitting(false);
  }, [isOpen, props]);

  // ─── Hent brukerens biler (for popover-velger) ──────────────────────────
  useEffect(() => {
    if (!isOpen || !user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("car_owners")
        .select("car_id, cars:cars!inner(id, title, slug)")
        .eq("user_id", user.id)
        .eq("role", "owner");
      if (cancelled) return;
      const list: MyCar[] = (data ?? [])
        .map((row: any) => row.cars)
        .filter(Boolean)
        .map((c: any) => ({ id: c.id, title: c.title, slug: c.slug }));
      setMyCars(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, user]);

  const previewUrl = useMemo(() => {
    if (!imageFile) return null;
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const carChipLabel = selectedCarId
    ? selectedCarTitle ?? "På denne bilen"
    : "Spotta ny bil";

  function pickFile() {
    fileInputRef.current?.click();
  }

  function handleSelectCar(carId: string, title: string) {
    setSelectedCarId(carId);
    setSelectedCarTitle(title);
    setCarPickerOpen(false);
  }

  function handleClearCar() {
    setSelectedCarId(null);
    setSelectedCarTitle(null);
    setCarPickerOpen(false);
  }

  async function handlePublish() {
    if (!user) {
      navigate("/login?returnUrl=" + encodeURIComponent(window.location.pathname));
      return;
    }
    if (!imageFile) {
      toast.error("Velg et bilde først");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await publishObservation({
        userId: user.id,
        imageFile,
        caption,
        type,
        visibility,
        carId: selectedCarId,
        activitySessionId: props.prefillSessionId ?? null,
        titleOrModel: caption || null,
      });
      setResult(res);

      // Invalidations
      queryClient.invalidateQueries({ queryKey: ["car-events", res.carId] });
      queryClient.invalidateQueries({ queryKey: ["feed_posts"] });
      if (res.type === "question") {
        queryClient.invalidateQueries({ queryKey: ["questions"] });
      }
      if (props.prefillSessionId) {
        queryClient.invalidateQueries({
          queryKey: ["activity-moments", props.prefillSessionId],
        });
      }
    } catch (err) {
      console.error("publish failed", err);
      toast.error("Kunne ikke publisere");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenChange(next: boolean) {
    if (isSubmitting) return;
    if (!next) {
      closePublishComposer();
    }
  }

  // ─── Post-publish CTA (én subtil nudge) ─────────────────────────────────
  function handleViewResult() {
    if (!result) return;
    if (result.type === "question" && result.questionSlug) {
      navigate(`/sporsmal/${result.questionSlug}`);
    } else if (result.carSlug) {
      navigate(`/biler/${result.carSlug}`);
    }
    closePublishComposer();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        onInteractOutside={(e) => isSubmitting && e.preventDefault()}
        onEscapeKeyDown={(e) => isSubmitting && e.preventDefault()}
        className="p-0 gap-0 border-0 bg-[#070b10] text-white max-w-full w-screen h-[100dvh] sm:h-auto sm:max-h-[92vh] sm:max-w-lg sm:rounded-2xl sm:border sm:border-white/10 overflow-hidden flex flex-col"
      >
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

        {result ? (
          // ═══════════════ POST-PUBLISH (én nudge) ═══════════════
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12 animate-fade-in">
            <div className="relative mb-6">
              {previewUrl && (
                <div className="w-40 h-40 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                  <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="absolute -bottom-3 -right-3 w-11 h-11 rounded-full flex items-center justify-center bg-[#34eab8] border-4 border-[#070b10]">
                <CheckCircle2 className="w-5 h-5 text-[#070b10]" strokeWidth={2.5} />
              </div>
            </div>
            <h2 className="text-2xl font-bold uppercase tracking-wider mb-1" style={chakra}>
              Delt
            </h2>
            <p className="text-white/55 text-sm max-w-xs mb-8">
              {result.type === "question"
                ? "Spørsmålet ligger på bilen og i feeden."
                : result.visibility === "public"
                  ? "Lagt til på bilen og i feeden."
                  : "Lagt til på bilen — kun synlig for deg."}
            </p>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {(result.questionSlug || result.carSlug) && (
                <button
                  type="button"
                  onClick={handleViewResult}
                  className="w-full min-h-[48px] rounded-xl bg-[#34eab8] text-[#070b10] font-bold uppercase tracking-wider text-sm inline-flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all"
                  style={chakra}
                >
                  {result.type === "question" ? "Se spørsmål" : "Se bilen"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={closePublishComposer}
                className="w-full min-h-[44px] text-white/55 hover:text-white text-xs uppercase tracking-[0.2em]"
                style={oswald}
              >
                Ferdig
              </button>
            </div>
          </div>
        ) : (
          // ═══════════════ COMPOSE ═══════════════
          <div className="flex-1 flex flex-col min-h-0">
            {/* Bilde */}
            <div className="relative flex-1 min-h-0 bg-black flex items-center justify-center overflow-hidden">
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Forhåndsvisning"
                    className="w-full h-full object-contain animate-fade-in"
                  />
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
                    style={{ background: "linear-gradient(135deg, #34eab8, #1cb896)" }}
                  >
                    <Camera className="w-9 h-9 text-[#070b10]" strokeWidth={2.25} />
                  </div>
                  <span
                    className="text-sm uppercase tracking-[0.18em] font-bold text-white/80"
                    style={chakra}
                  >
                    Velg et bilde
                  </span>
                </button>
              )}
            </div>

            {/* Caption + chips + publish */}
            <div
              className="shrink-0 px-4 pt-3 pb-4 border-t border-white/[0.06] bg-[#070b10] space-y-3"
              style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
            >
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value.slice(0, 500))}
                placeholder={
                  type === "question" ? "Hva lurer du på?" : "Skriv noe…"
                }
                rows={2}
                className="w-full resize-none bg-transparent text-[15px] text-white placeholder:text-white/30 focus:outline-none leading-snug"
                style={chakra}
              />

              {/* Chip-rader */}
              <div className="space-y-2">
                {/* Bil */}
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] uppercase tracking-[0.18em] text-white/35 w-16 shrink-0"
                    style={oswald}
                  >
                    Bil
                  </span>
                  <Popover open={carPickerOpen} onOpenChange={setCarPickerOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] text-white/85 border border-white/12 hover:bg-white/[0.10] px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] font-bold transition-colors"
                        style={chakra}
                      >
                        <CarIcon className="w-3 h-3" />
                        {carChipLabel}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="w-64 p-1 bg-[#0c1219] border-white/10"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          handleClearCar();
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-xs hover:bg-white/[0.06] ${
                          !selectedCarId ? "text-[#34eab8]" : "text-white/85"
                        }`}
                        style={chakra}
                      >
                        Spotta ny bil
                      </button>
                      {myCars.length > 0 && (
                        <div className="my-1 border-t border-white/[0.06]" />
                      )}
                      {myCars.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectCar(c.id, c.title)}
                          className={`w-full text-left px-3 py-2 rounded-md text-xs hover:bg-white/[0.06] truncate ${
                            selectedCarId === c.id
                              ? "text-[#34eab8]"
                              : "text-white/85"
                          }`}
                          style={chakra}
                        >
                          {c.title}
                        </button>
                      ))}
                      {myCars.length === 0 && (
                        <p
                          className="px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-white/35"
                          style={oswald}
                        >
                          Ingen biler i garasjen ennå
                        </p>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Type */}
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] uppercase tracking-[0.18em] text-white/35 w-16 shrink-0"
                    style={oswald}
                  >
                    Type
                  </span>
                  <Chip
                    active={type === "moment"}
                    onClick={() => setType("moment")}
                    variant="primary"
                  >
                    <Sparkles className="w-3 h-3" />
                    Øyeblikk
                  </Chip>
                  <Chip
                    active={type === "question"}
                    onClick={() => setType("question")}
                    variant="primary"
                  >
                    <MessageCircle className="w-3 h-3" />
                    Spørsmål
                  </Chip>
                </div>

                {/* Synlighet */}
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] uppercase tracking-[0.18em] text-white/35 w-16 shrink-0"
                    style={oswald}
                  >
                    Vises
                  </span>
                  <Chip
                    active={visibility === "public"}
                    onClick={() => setVisibility("public")}
                  >
                    <Globe className="w-3 h-3" />
                    Offentlig
                  </Chip>
                  <Chip
                    active={visibility === "private"}
                    onClick={() => setVisibility("private")}
                  >
                    <Lock className="w-3 h-3" />
                    Privat
                  </Chip>
                </div>
              </div>

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
                  <>Del</>
                )}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
