import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LicensePlateInput } from "@/components/car/wizard/LicensePlateInput";
import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  X,
  ArrowRight,
  ExternalLink,
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

interface MyCar {
  id: string;
  title: string;
  slug: string | null;
}

interface RegHit {
  id: string;
  slug: string;
  title: string;
}

type CarMode = "none" | "spot" | "garage";

function normalizePlate(raw: string): string {
  return raw.replace(/[\s\-]/g, "").toUpperCase();
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

  const [carMode, setCarMode] = useState<CarMode>("none");
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [selectedCarTitle, setSelectedCarTitle] = useState<string | null>(null);
  const [regnr, setRegnr] = useState("");
  const [regHits, setRegHits] = useState<RegHit[]>([]);
  const [regThumbs, setRegThumbs] = useState<Record<string, string>>({});
  const [regSearching, setRegSearching] = useState(false);

  const [myCars, setMyCars] = useState<MyCar[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<PublishObservationResult | null>(null);

  // ─── Init ved åpning ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setImageFile(props.initialImageFile ?? null);
    setCaption("");
    setType(props.defaultType ?? "moment");
    setVisibility(props.defaultVisibility ?? "public");
    setSelectedCarId(props.prefillCarId ?? null);
    setSelectedCarTitle(props.prefillCarTitle ?? null);
    setCarMode(props.prefillCarId ? "garage" : "none");
    setRegnr("");
    setRegHits([]);
    setRegThumbs({});
    setResult(null);
    setIsSubmitting(false);
  }, [isOpen, props]);

  // ─── Hent egne biler ─────────────────────────────────────────────────
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

  // ─── Debounced regnr-søk ─────────────────────────────────────────────
  useEffect(() => {
    if (carMode !== "spot") return;
    const norm = normalizePlate(regnr).toLowerCase();
    if (norm.length < 4) {
      setRegHits([]);
      setRegThumbs({});
      return;
    }
    const t = setTimeout(async () => {
      setRegSearching(true);
      try {
        const { data } = await supabase.rpc(
          "find_cars_by_registration_number",
          { p_normalized: norm },
        );
        const hits = ((data as RegHit[]) || []).slice(0, 4);
        setRegHits(hits);
        if (hits.length > 0) {
          const { data: imgs } = await supabase
            .from("car_images")
            .select("car_id, image_url, sort_order")
            .in(
              "car_id",
              hits.map((h) => h.id),
            )
            .order("sort_order", { ascending: true });
          const map: Record<string, string> = {};
          (imgs || []).forEach((row: any) => {
            if (!map[row.car_id]) map[row.car_id] = row.image_url;
          });
          setRegThumbs(map);
        } else {
          setRegThumbs({});
        }
      } catch (err) {
        console.warn("regnr lookup failed", err);
      } finally {
        setRegSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [regnr, carMode]);

  const previewUrl = useMemo(() => {
    if (!imageFile) return null;
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function pickFile() {
    fileInputRef.current?.click();
  }

  function handleSelectGarageCar(c: MyCar) {
    setSelectedCarId(c.id);
    setSelectedCarTitle(c.title);
  }

  function handleSelectRegHit(hit: RegHit) {
    setSelectedCarId(hit.id);
    setSelectedCarTitle(hit.title);
    setCarMode("garage"); // visuelt: bilen er nå valgt
  }

  async function handlePublish() {
    if (!user) {
      navigate(
        "/login?returnUrl=" + encodeURIComponent(window.location.pathname),
      );
      return;
    }
    if (!imageFile) {
      toast.error("Velg et bilde først");
      return;
    }
    setIsSubmitting(true);
    try {
      const attachCar = carMode !== "none";
      const res = await publishObservation({
        userId: user.id,
        imageFile,
        caption,
        type,
        visibility,
        attachCar,
        carId: selectedCarId,
        registrationNumber:
          carMode === "spot" && !selectedCarId ? regnr || null : null,
        activitySessionId: props.prefillSessionId ?? null,
        titleOrModel: caption || null,
      });
      setResult(res);
      if (res.carId) {
        queryClient.invalidateQueries({ queryKey: ["car-events", res.carId] });
      }
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
    if (!next) closePublishComposer();
  }

  function handleViewResult() {
    if (!result) return;
    if (result.type === "question" && result.questionSlug) {
      navigate(`/sporsmal/${result.questionSlug}`);
    } else if (result.carSlug) {
      navigate(`/biler/${result.carSlug}`);
    }
    closePublishComposer();
  }

  const canPublish = !!imageFile && !isSubmitting;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        onInteractOutside={(e) => isSubmitting && e.preventDefault()}
        onEscapeKeyDown={(e) => isSubmitting && e.preventDefault()}
        className="car-paper-theme text-neutral-900 p-0 gap-0 border-0 max-w-full w-screen h-[100dvh] sm:h-auto sm:max-h-[92vh] sm:max-w-lg sm:rounded-2xl sm:border sm:border-black/10 overflow-hidden flex flex-col"
        style={{ backgroundColor: "#e9e7e1" }}
      >
        <button
          type="button"
          onClick={() => handleOpenChange(false)}
          className="absolute right-3 top-3 z-30 rounded-full p-2 text-neutral-600 hover:text-neutral-900 hover:bg-black/5 transition-colors"
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
          // ═══════════════ POST-PUBLISH ═══════════════
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12 animate-fade-in">
            <div className="relative mb-6">
              {previewUrl && (
                <div className="w-40 h-40 rounded-2xl overflow-hidden border border-black/10 shadow-lg">
                  <img
                    src={previewUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div
                className="absolute -bottom-3 -right-3 w-11 h-11 rounded-full flex items-center justify-center border-4"
                style={{
                  backgroundColor: "#1f3a34",
                  borderColor: "#e9e7e1",
                }}
              >
                <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <h2 className="font-display text-2xl text-neutral-900 mb-1">
              Takk — det er med.
            </h2>
            <p className="text-neutral-600 text-sm max-w-xs mb-8">
              {result.carId
                ? result.type === "question"
                  ? "Spørsmålet ligger på bilen og i feeden."
                  : result.visibility === "public"
                    ? "Lagt til på bilen og i feeden."
                    : "Lagt til på bilen — kun synlig for deg."
                : "Innlegget er i feeden. Knytt til bil for å lagre det i arkivet."}
            </p>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {(result.questionSlug || result.carSlug) && (
                <Button
                  type="button"
                  onClick={handleViewResult}
                  className="btn-enamel-blue h-12 w-full text-base"
                >
                  {result.type === "question" ? "Se spørsmål" : "Se bilen"}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={closePublishComposer}
                className="h-11 w-full text-neutral-600"
              >
                Ferdig
              </Button>
            </div>
          </div>
        ) : (
          // ═══════════════ COMPOSE ═══════════════
          <div className="flex-1 overflow-y-auto">
            <div
              className="px-4 pt-4 pb-4 space-y-5"
              style={{
                paddingTop: "max(1rem, env(safe-area-inset-top))",
                paddingBottom: "calc(1rem + 80px + env(safe-area-inset-bottom))",
              }}
            >
              {/* Bilde */}
              <div className="relative rounded-xl overflow-hidden bg-neutral-200/60 aspect-[4/5] sm:aspect-video">
                {previewUrl ? (
                  <>
                    <img
                      src={previewUrl}
                      alt="Forhåndsvisning"
                      className="w-full h-full object-cover animate-fade-in"
                    />
                    <button
                      type="button"
                      onClick={pickFile}
                      className="absolute top-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-white/85 backdrop-blur px-3 py-1.5 text-xs text-neutral-800 hover:bg-white transition-colors border border-black/10 shadow-sm"
                    >
                      <ImagePlus className="w-3.5 h-3.5" />
                      Bytt bilde
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={pickFile}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-neutral-500 hover:text-neutral-700"
                  >
                    <ImagePlus className="w-8 h-8" />
                    <span className="text-sm">Velg et bilde</span>
                  </button>
                )}
              </div>

              {/* Caption */}
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value.slice(0, 500))}
                placeholder={
                  type === "question"
                    ? "Hva lurer du på?"
                    : "Skriv noe om bildet…"
                }
                rows={2}
                className="w-full resize-none bg-transparent text-[15px] text-neutral-900 placeholder:text-neutral-500 focus:outline-none leading-snug px-1"
              />

              {/* Knytt til bil */}
              <section className="space-y-2">
                <div>
                  <h3 className="text-[11px] uppercase tracking-[0.14em] font-semibold text-neutral-500">
                    Knytt til bil
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Knyttes til bilens historie. Hopp over hvis du bare vil dele i feeden.
                  </p>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white overflow-hidden">
                  <CarOption
                    active={carMode === "none"}
                    onClick={() => {
                      setCarMode("none");
                      setSelectedCarId(null);
                      setSelectedCarTitle(null);
                    }}
                    title="Ikke knytt til bil"
                    subtitle="Innlegg vises kun i feeden."
                  />
                  <CarOption
                    active={carMode === "spot"}
                    onClick={() => {
                      setCarMode("spot");
                      setSelectedCarId(null);
                      setSelectedCarTitle(null);
                    }}
                    title="Spotta ny bil"
                    subtitle="Skriv inn regnr — vi sjekker arkivet."
                  />
                  {carMode === "spot" && (
                    <div className="px-4 pb-4 pt-1 space-y-3 border-t border-black/5 bg-neutral-50/60">
                      <div className="flex flex-col items-center gap-2 pt-3">
                        <LicensePlateInput value={regnr} onChange={setRegnr} />
                        <p className="text-[11px] text-neutral-500">
                          Valgfritt — du kan dele bildet uten regnr.
                        </p>
                      </div>
                      {regSearching && (
                        <div className="flex items-center justify-center gap-2 text-xs text-neutral-500 py-1">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Søker…
                        </div>
                      )}
                      {regHits.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">
                            Vi fant dette i arkivet
                          </p>
                          {regHits.map((hit) => {
                            const picked = selectedCarId === hit.id;
                            return (
                              <button
                                key={hit.id}
                                type="button"
                                onClick={() => handleSelectRegHit(hit)}
                                className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-colors text-left ${
                                  picked
                                    ? "border-primary bg-primary/5"
                                    : "border-black/10 bg-white hover:bg-neutral-50"
                                }`}
                              >
                                <div className="h-12 w-16 shrink-0 rounded-md overflow-hidden bg-neutral-200 flex items-center justify-center">
                                  {regThumbs[hit.id] ? (
                                    <img
                                      src={regThumbs[hit.id]}
                                      alt=""
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <ExternalLink className="w-3 h-3 text-neutral-400" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate text-neutral-900">
                                    {hit.title}
                                  </p>
                                  <p className="text-[11px] text-neutral-500">
                                    {picked ? "Valgt" : "Trykk for å velge"}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  {myCars.length > 0 && (
                    <>
                      <CarOption
                        active={carMode === "garage" && !!selectedCarId}
                        onClick={() => {
                          setCarMode("garage");
                          if (!selectedCarId && myCars[0]) {
                            handleSelectGarageCar(myCars[0]);
                          }
                        }}
                        title={
                          carMode === "garage" && selectedCarTitle
                            ? selectedCarTitle
                            : "Velg fra garasjen"
                        }
                        subtitle={
                          carMode === "garage" && selectedCarTitle
                            ? "Valgt fra din garasje."
                            : `${myCars.length} ${myCars.length === 1 ? "bil" : "biler"} i garasjen`
                        }
                      />
                      {carMode === "garage" && (
                        <div className="px-2 pb-2 pt-1 border-t border-black/5 bg-neutral-50/60 space-y-1">
                          {myCars.map((c) => {
                            const picked = selectedCarId === c.id;
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => handleSelectGarageCar(c)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                  picked
                                    ? "bg-primary/5 text-primary border border-primary/30"
                                    : "text-neutral-800 hover:bg-white border border-transparent"
                                }`}
                              >
                                {c.title}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </section>

              {/* Synlighet */}
              <section className="space-y-2">
                <h3 className="text-[11px] uppercase tracking-[0.14em] font-semibold text-neutral-500">
                  Vises
                </h3>
                <div className="inline-flex w-full rounded-full border border-black/10 bg-white p-1">
                  <SegmentButton
                    active={visibility === "public"}
                    onClick={() => setVisibility("public")}
                  >
                    Offentlig
                  </SegmentButton>
                  <SegmentButton
                    active={visibility === "private"}
                    onClick={() => setVisibility("private")}
                  >
                    Privat
                  </SegmentButton>
                </div>
              </section>

              {/* Spørsmål sekundært */}
              <button
                type="button"
                onClick={() =>
                  setType(type === "question" ? "moment" : "question")
                }
                disabled={carMode === "none"}
                className="text-sm text-neutral-700 hover:text-neutral-900 underline underline-offset-4 disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
              >
                {type === "question"
                  ? "Tilbake til vanlig innlegg"
                  : "Gjør til spørsmål"}
              </button>
              {carMode === "none" && (
                <p className="text-[11px] text-neutral-500 -mt-3">
                  Knytt til bil for å gjøre dette til et spørsmål.
                </p>
              )}
            </div>

            {/* Sticky publish-bar */}
            <div
              className="absolute left-0 right-0 bottom-0 px-4 pt-3 pb-4 border-t border-black/10 bg-[#e9e7e1]"
              style={{
                paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
              }}
            >
              <Button
                type="button"
                onClick={handlePublish}
                disabled={!canPublish}
                className="btn-enamel-blue h-12 w-full text-base"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Del"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CarOption({
  active,
  onClick,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-black/5 last:border-b-0 transition-colors ${
        active ? "bg-primary/5" : "hover:bg-neutral-50"
      }`}
    >
      <span
        className={`mt-1 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
          active ? "border-primary" : "border-neutral-400"
        }`}
      >
        {active && (
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "hsl(var(--primary))" }}
          />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-neutral-900 truncate">
          {title}
        </span>
        <span className="block text-xs text-neutral-500 mt-0.5">{subtitle}</span>
      </span>
    </button>
  );
}

function SegmentButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 h-10 rounded-full text-sm font-medium transition-all ${
        active
          ? "bg-neutral-900 text-white shadow-sm"
          : "text-neutral-600 hover:text-neutral-900"
      }`}
    >
      {children}
    </button>
  );
}
