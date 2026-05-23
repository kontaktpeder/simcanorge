import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LicensePlateInput } from "@/components/car/wizard/LicensePlateInput";
import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  X,
  Car,
  Binoculars,
  Warehouse,
  Globe,
  Lock,
  ChevronRight,
  Link as LinkIcon,
  Instagram,
  Facebook,
  Share2,
  FileText,
  RotateCw,
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

// Vegvesen-inspired palette
const VV_BG = "#f3f3f3";
const VV_YELLOW = "#fcc419";
const VV_YELLOW_SOFT = "#fff4d1";
const VV_DARK = "#2b2b2b";
const VV_ORANGE = "#ff8a00";

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
    setCarMode("garage");
  }

  async function handlePublish() {
    if (!user) {
      navigate(
        "/login?returnUrl=" + encodeURIComponent(window.location.pathname),
      );
      return;
    }
    const hasText = caption.trim().length > 0;
    if (!imageFile && !hasText) {
      toast.error("Skriv noe eller legg til et bilde");
      return;
    }
    setIsSubmitting(true);
    try {
      const attachCar = carMode !== "none";
      const res = await publishObservation({
        userId: user.id,
        imageFile: imageFile ?? null,
        caption,
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
    if (result.carSlug) {
      navigate(`/biler/${result.carSlug}`);
    }
    closePublishComposer();
  }

  const canPublish = (!!imageFile || caption.trim().length > 0) && !isSubmitting;
  const garageCount = myCars.length;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        onInteractOutside={(e) => isSubmitting && e.preventDefault()}
        onEscapeKeyDown={(e) => isSubmitting && e.preventDefault()}
        className="text-neutral-900 p-0 gap-0 border-0 max-w-full w-screen h-[100dvh] sm:h-auto sm:max-h-[92vh] sm:max-w-lg sm:rounded-2xl sm:border sm:border-black/10 overflow-hidden flex flex-col"
        style={{ backgroundColor: VV_BG, fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            e.target.value = "";
            if (f) setImageFile(f);
          }}
        />

        {result ? (
          // ═══════════════ POST-PUBLISH ═══════════════
          <div className="flex-1 overflow-y-auto bg-white animate-fade-in relative">
            <button
              type="button"
              onClick={closePublishComposer}
              className="absolute top-3 right-3 z-10 w-10 h-10 inline-flex items-center justify-center rounded-full hover:bg-black/5 text-neutral-700"
              style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
              aria-label="Lukk"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>

            <div className="px-6 pt-10 pb-8 flex flex-col items-center text-center">
              {/* Sjekkmerke */}
              <div className="relative w-20 h-20 mb-5">
                <span
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: "#d6f3e0" }}
                />
                <span className="absolute inset-2 rounded-full flex items-center justify-center" style={{ backgroundColor: "#22c55e" }}>
                  <CheckCircle2 className="w-9 h-9 text-white" strokeWidth={3} />
                </span>
                {/* stråler */}
                <span className="absolute -left-3 top-3 w-3 h-0.5 rounded-full" style={{ backgroundColor: "#22c55e" }} />
                <span className="absolute -left-2 top-8 w-4 h-0.5 rounded-full rotate-[20deg]" style={{ backgroundColor: "#22c55e" }} />
                <span className="absolute -right-3 top-3 w-3 h-0.5 rounded-full" style={{ backgroundColor: "#22c55e" }} />
                <span className="absolute -right-2 top-8 w-4 h-0.5 rounded-full -rotate-[20deg]" style={{ backgroundColor: "#22c55e" }} />
                <span className="absolute left-1 -top-1 w-0.5 h-3 rounded-full" style={{ backgroundColor: "#22c55e" }} />
                <span className="absolute right-1 -top-1 w-0.5 h-3 rounded-full" style={{ backgroundColor: "#22c55e" }} />
              </div>

              <h2 className="text-[26px] font-bold text-neutral-900 mb-2 leading-tight">
                Takk! Innlegget er delt.
              </h2>
              <p className="text-neutral-600 text-sm max-w-sm mb-6 leading-relaxed">
                {result.carId
                  ? result.visibility === "public"
                    ? "Innlegget er lagt til i feeden og på bilen. Tusen takk for bidraget!"
                    : "Innlegget er lagret på bilen — kun synlig for deg. Tusen takk!"
                  : "Innlegget er i feeden. Tusen takk for bidraget!"}
              </p>

              {/* Bildekort med tag */}
              {previewUrl && (
                <div className="relative w-full max-w-[280px] mb-8">
                  <div className="rounded-2xl overflow-hidden border border-black/10 shadow-sm aspect-[4/5] bg-neutral-100">
                    <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div
                    className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1.5 text-[12px] font-semibold text-neutral-900 shadow-md border border-black/5"
                  >
                    <span
                      className="w-5 h-5 rounded flex items-center justify-center"
                      style={{ backgroundColor: VV_YELLOW_SOFT }}
                    >
                      <Car className="w-3 h-3 text-neutral-800" strokeWidth={2.5} />
                    </span>
                    <span className="truncate max-w-[140px]">
                      {selectedCarTitle ?? (carMode === "none" ? "Ikke knyttet til bil" : "Bil")}
                    </span>
                  </div>
                </div>
              )}

              {/* Del innlegget — visuelt grid */}
              <div className="w-full text-left mb-6">
                <h3 className="text-[11px] uppercase tracking-[0.14em] font-bold text-neutral-500 mb-3">
                  Del innlegget
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  <ShareTile label="Kopier lenke" iconBg="#f3f3f3">
                    <LinkIcon className="w-5 h-5 text-neutral-700" strokeWidth={2} />
                  </ShareTile>
                  <ShareTile label="Instagram" iconBg="transparent">
                    <span
                      className="w-7 h-7 rounded-md flex items-center justify-center"
                      style={{
                        background:
                          "linear-gradient(135deg,#f7c14b 0%,#ea4c89 45%,#9c2bc1 100%)",
                      }}
                    >
                      <Instagram className="w-4 h-4 text-white" strokeWidth={2.25} />
                    </span>
                  </ShareTile>
                  <ShareTile label="Facebook" iconBg="transparent">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "#1877f2" }}
                    >
                      <Facebook className="w-4 h-4 text-white fill-white" strokeWidth={0} />
                    </span>
                  </ShareTile>
                  <ShareTile label="Flere valg" iconBg="#f3f3f3">
                    <Share2 className="w-5 h-5 text-neutral-700" strokeWidth={2} />
                  </ShareTile>
                </div>
              </div>

              {/* Primær + sekundær CTA */}
              <div className="w-full flex flex-col gap-2">
                {result.carSlug ? (
                  <Button
                    type="button"
                    onClick={handleViewResult}
                    className="h-12 w-full text-base font-semibold text-white hover:brightness-110 rounded-xl"
                    style={{ backgroundColor: VV_DARK }}
                  >
                    <FileText className="mr-2 w-4 h-4" strokeWidth={2.25} />
                    Se innlegget
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={closePublishComposer}
                    className="h-12 w-full text-base font-semibold text-white hover:brightness-110 rounded-xl"
                    style={{ backgroundColor: VV_DARK }}
                  >
                    <FileText className="mr-2 w-4 h-4" strokeWidth={2.25} />
                    Se innlegget
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={closePublishComposer}
                  className="h-12 w-full text-base font-semibold text-neutral-900 rounded-xl border-black/10 bg-white hover:bg-neutral-50"
                >
                  Fortsett å bruke appen
                </Button>
              </div>

              <p className="mt-5 inline-flex items-center gap-1.5 text-[12px] text-neutral-400">
                <RotateCw className="w-3.5 h-3.5" strokeWidth={2} />
                Du kan alltid finne innlegget i arkivet ditt
              </p>
            </div>
          </div>
        ) : (
          // ═══════════════ COMPOSE ═══════════════
          <>
            {/* ─── Top bar ─── */}
            <header
              className="relative bg-white border-b border-black/5"
              style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
            >
              <div className="flex items-center justify-between px-3 py-3">
                <button
                  type="button"
                  onClick={closePublishComposer}
                  disabled={isSubmitting}
                  className="w-10 h-10 -ml-1 flex items-center justify-center rounded-full hover:bg-black/5 text-neutral-900"
                  aria-label="Lukk"
                >
                  <ArrowLeft className="w-5 h-5" strokeWidth={2} />
                </button>
                <div className="flex-1 px-2">
                  <h1 className="text-[17px] font-bold text-neutral-900 leading-tight">
                    Del observasjon
                  </h1>
                  <p className="text-[12px] text-neutral-500 leading-tight">
                    {imageFile ? "Klar til å dele" : "Legg til bilde og detaljer"}
                  </p>
                </div>
                <div className="w-10" aria-hidden="true" />
              </div>
              {/* Progress bar */}
              <div className="h-1.5 w-full bg-neutral-200">
                <div
                  className="h-full transition-all"
                  style={{
                    width: canPublish ? "100%" : imageFile || caption ? "50%" : "15%",
                    backgroundColor: VV_ORANGE,
                  }}
                />
              </div>
            </header>

            {/* ─── Scroll body ─── */}
            <div className="flex-1 overflow-y-auto">
              <div
                className="px-4 pt-4 space-y-4"
                style={{
                  paddingBottom: "calc(1rem + 96px + env(safe-area-inset-bottom))",
                }}
              >
                {/* Bilde */}
                <div className="relative rounded-2xl overflow-hidden bg-neutral-200/70 aspect-[4/5] sm:aspect-video shadow-sm">
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
                        className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-neutral-900 hover:bg-white border border-black/10 shadow-sm"
                      >
                        <ImagePlus className="w-3.5 h-3.5" />
                        Bytt bilde
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageFile(null)}
                        className="absolute top-3 right-3 w-9 h-9 inline-flex items-center justify-center rounded-full bg-white/95 hover:bg-white border border-black/10 shadow-sm text-neutral-700"
                        aria-label="Fjern bilde"
                      >
                        <X className="w-4 h-4" strokeWidth={2.5} />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={pickFile}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-neutral-500 hover:text-neutral-700"
                    >
                      <ImagePlus className="w-8 h-8" />
                      <span className="text-sm font-medium">Velg et bilde</span>
                    </button>
                  )}
                </div>

                {/* Tittel-kort */}
                <div className="rounded-2xl bg-white border border-black/10 shadow-sm px-4 py-3">
                  <div className="flex items-baseline justify-end">
                    <span className="text-[11px] text-neutral-400 tabular-nums">
                      {caption.length}/100
                    </span>
                  </div>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value.slice(0, 100))}
                    placeholder="Hva tenker du på?"
                    className="w-full bg-transparent text-[16px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none mt-1"
                  />
                </div>

                {/* Hva gjelder det */}
                <section className="space-y-2">
                  <h3 className="text-[11px] uppercase tracking-[0.14em] font-bold text-neutral-900 px-1">
                    Hva gjelder det?
                  </h3>

                  <div className="space-y-2">
                    <VVOption
                      active={carMode === "none"}
                      onClick={() => {
                        setCarMode("none");
                        setSelectedCarId(null);
                        setSelectedCarTitle(null);
                      }}
                      icon={<Car className="w-5 h-5" strokeWidth={2} />}
                      title="Ikke knyttet til bil"
                      subtitle="Innlegg vises kun i feeden."
                    />
                    <VVOption
                      active={carMode === "spot"}
                      onClick={() => {
                        setCarMode("spot");
                        setSelectedCarId(null);
                        setSelectedCarTitle(null);
                      }}
                      icon={<Binoculars className="w-5 h-5" strokeWidth={2} />}
                      title="Spotta en bil"
                      subtitle="Skriv inn regnr – vi sjekker arkivet."
                    />
                    {carMode === "spot" && (
                      <div className="rounded-2xl bg-white border border-black/10 shadow-sm px-4 py-4 space-y-3">
                        <div className="flex flex-col items-center gap-2">
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
                          <div className="space-y-2 pt-1">
                            <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-500 font-semibold">
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
                                      ? "bg-[color:var(--vv-soft)]"
                                      : "border-black/10 bg-white hover:bg-neutral-50"
                                  }`}
                                  style={
                                    picked
                                      ? ({
                                          borderColor: VV_YELLOW,
                                          backgroundColor: VV_YELLOW_SOFT,
                                          "--vv-soft": VV_YELLOW_SOFT,
                                        } as React.CSSProperties)
                                      : undefined
                                  }
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
                                    <p className="text-sm font-semibold truncate text-neutral-900">
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
                    {garageCount > 0 && (
                      <>
                        <VVOption
                          active={carMode === "garage" && !!selectedCarId}
                          onClick={() => {
                            setCarMode("garage");
                            if (!selectedCarId && myCars[0]) {
                              handleSelectGarageCar(myCars[0]);
                            }
                          }}
                          icon={<Warehouse className="w-5 h-5" strokeWidth={2} />}
                          title={
                            carMode === "garage" && selectedCarTitle
                              ? selectedCarTitle
                              : "Velg fra garasjen"
                          }
                          subtitle={
                            carMode === "garage" && selectedCarTitle
                              ? "Valgt fra din garasje."
                              : `${garageCount} ${garageCount === 1 ? "bil" : "biler"} i din garasje.`
                          }
                        />
                        {carMode === "garage" && garageCount > 1 && (
                          <div className="rounded-2xl bg-white border border-black/10 shadow-sm px-2 py-2 space-y-1">
                            {myCars.map((c) => {
                              const picked = selectedCarId === c.id;
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => handleSelectGarageCar(c)}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                    picked
                                      ? "font-semibold text-neutral-900"
                                      : "text-neutral-700 hover:bg-neutral-50"
                                  }`}
                                  style={
                                    picked
                                      ? { backgroundColor: VV_YELLOW_SOFT }
                                      : undefined
                                  }
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
                  <h3 className="text-[11px] uppercase tracking-[0.14em] font-bold text-neutral-900 px-1">
                    Synlighet
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <VVSegment
                      active={visibility === "public"}
                      onClick={() => setVisibility("public")}
                      icon={<Globe className="w-4 h-4" strokeWidth={2.25} />}
                      label="Offentlig"
                    />
                    <VVSegment
                      active={visibility === "private"}
                      onClick={() => setVisibility("private")}
                      icon={<Lock className="w-4 h-4" strokeWidth={2.25} />}
                      label="Privat"
                    />
                  </div>
                </section>
              </div>
            </div>

            {/* ─── Sticky bottom bar ─── */}
            <div
              className="absolute left-0 right-0 bottom-0 px-4 pt-3 pb-4 flex items-center justify-between gap-3"
              style={{
                backgroundColor: VV_DARK,
                paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
              }}
            >
              <div aria-hidden="true" />
              <Button
                type="button"
                onClick={handlePublish}
                disabled={!canPublish}
                className="h-12 px-5 text-base font-semibold text-neutral-900 hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                style={{ backgroundColor: VV_YELLOW }}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Del
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function VVOption({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl bg-white border shadow-sm transition-all text-left"
      style={{
        borderColor: active ? VV_YELLOW : "rgba(0,0,0,0.08)",
        backgroundColor: active ? VV_YELLOW_SOFT : "#ffffff",
        boxShadow: active
          ? `0 0 0 1px ${VV_YELLOW} inset, 0 1px 2px rgba(0,0,0,0.04)`
          : "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <span
        className="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center"
        style={{ borderColor: active ? VV_YELLOW : "#bdbdbd" }}
      >
        {active && (
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: VV_YELLOW }}
          />
        )}
      </span>
      <span
        className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-neutral-800"
        style={{ backgroundColor: active ? "#ffe79a" : "#ececec" }}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold text-neutral-900 truncate leading-tight">
          {title}
        </span>
        <span className="block text-[12px] text-neutral-600 mt-0.5">
          {subtitle}
        </span>
      </span>
      <ChevronRight className="w-5 h-5 text-neutral-400 shrink-0" />
    </button>
  );
}

function VVSegment({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-12 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-colors select-none border"
      style={{
        backgroundColor: active ? VV_DARK : "#ffffff",
        color: active ? "#ffffff" : "#3a3a3a",
        borderColor: active ? VV_DARK : "rgba(0,0,0,0.1)",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function ShareTile({
  label,
  iconBg,
  children,
}: {
  label: string;
  iconBg: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-black/10 bg-white px-2 py-3 hover:bg-neutral-50 transition-colors"
    >
      <span
        className="w-9 h-9 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: iconBg }}
      >
        {children}
      </span>
      <span className="text-[11px] font-medium text-neutral-700 truncate w-full text-center">
        {label}
      </span>
    </button>
  );
}
