import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Camera, Loader2, X, Car as CarIcon, CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActivityMoments } from "@/hooks/useActivityMoments";
import { LicensePlateInput } from "@/components/car/wizard/LicensePlateInput";
import { useCreateCarRelationshipRequest } from "@/hooks/useCreateCarRelationshipRequest";
import { useCarBrands, useCarModels } from "@/hooks/useCarCatalog";
import {
  RELATIONSHIP_OPTIONS,
  RELATIONSHIP_NOTE_MAX,
  type RelationshipType,
} from "@/lib/relationshipTypes";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

interface CarMatch {
  id: string;
  slug: string | null;
  title: string;
  published_at: string | null;
}

function normalizeRegnr(regnr: string): string {
  return regnr.toLowerCase().replace(/\s|-/g, "").trim();
}

export function AddMomentDialog({
  sessionId,
  open,
  onOpenChange,
}: {
  sessionId?: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { addMoment, isAdding } = useActivityMoments(sessionId ?? undefined);
  const { user } = useAuth();
  const relMutation = useCreateCarRelationshipRequest();
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [regnr, setRegnr] = useState("");
  const [titleOrModel, setTitleOrModel] = useState("");
  const [brandId, setBrandId] = useState<number | null>(null);
  const [brandName, setBrandName] = useState("");
  const [modelName, setModelName] = useState("");
  const [brandMode, setBrandMode] = useState<"select" | "other">("select");
  const [modelMode, setModelMode] = useState<"select" | "other">("select");
  const { data: brands = [], isLoading: brandsLoading } = useCarBrands();
  const { data: models = [], isLoading: modelsLoading } = useCarModels(brandId);
  const [match, setMatch] = useState<CarMatch | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Status mot innlogget bruker for matchet bil
  type MatchStatus = "none" | "owned" | "pending" | "available";
  const [matchStatus, setMatchStatus] = useState<MatchStatus>("none");

  // Inline relasjons-state
  const [showRelForm, setShowRelForm] = useState(false);
  const [relType, setRelType] = useState<RelationshipType>("current_owner");
  const [relNote, setRelNote] = useState("");
  const [wantsStewardship, setWantsStewardship] = useState(false);
  const [relSent, setRelSent] = useState(false);

  // Debounced regnr lookup
  useEffect(() => {
    const normalized = normalizeRegnr(regnr);
    if (normalized.length < 2) {
      setMatch(null);
      setIsLookingUp(false);
      setMatchStatus("none");
      // reset rel-state hvis regnr endres bort fra match
      setShowRelForm(false);
      setRelSent(false);
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
      const next = list.length > 0 ? list[0] : null;
      setMatch(next);
      setIsLookingUp(false);
      setShowRelForm(false);
      setRelSent(false);
      setMatchStatus(next ? "available" : "none");
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
      setIsLookingUp(false);
    };
  }, [regnr]);

  // Sjekk om innlogget bruker allerede eier eller har pending forespørsel på matchet bil
  useEffect(() => {
    if (!match || !user) return;
    let cancelled = false;
    (async () => {
      const [ownerRes, pendingRes] = await Promise.all([
        supabase
          .from("car_owners")
          .select("id")
          .eq("car_id", match.id)
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("car_relationship_requests")
          .select("id")
          .eq("car_id", match.id)
          .eq("requester_id", user.id)
          .eq("status", "pending")
          .maybeSingle(),
      ]);
      if (cancelled) return;
      if (ownerRes.data) setMatchStatus("owned");
      else if (pendingRes.data) setMatchStatus("pending");
      else setMatchStatus("available");
    })();
    return () => {
      cancelled = true;
    };
  }, [match, user]);


  const reset = () => {
    setImageFile(null);
    setNote("");
    setRegnr("");
    setTitleOrModel("");
    setBrandId(null);
    setBrandName("");
    setModelName("");
    setBrandMode("select");
    setModelMode("select");
    setMatch(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setShowRelForm(false);
    setRelType("current_owner");
    setRelNote("");
    setWantsStewardship(false);
    setRelSent(false);
  };

  const handleFile = (f: File | null) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (f) {
      setImageFile(f);
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setImageFile(null);
      setPreviewUrl(null);
    }
  };

  const composedTitle = [brandName.trim(), modelName.trim(), titleOrModel.trim()]
    .filter(Boolean)
    .join(" ")
    .trim();

  const handleSubmit = async () => {
    if (!imageFile && !note.trim() && !regnr.trim() && !composedTitle) return;
    await addMoment({
      sessionId: sessionId ?? null,
      imageFile,
      note: note.trim() || null,
      visibility,
      registrationNumber: regnr.trim() || null,
      titleOrModel: composedTitle || null,
    });
    reset();
    onOpenChange(false);
  };

  const handleSendRelationship = async () => {
    if (!match) return;
    const result = await relMutation.mutateAsync({
      carId: match.id,
      relationshipType: relType,
      note: relNote,
      wantsStewardship: relType === "current_owner" ? wantsStewardship : false,
      source: "activity_moment",
    });
    // Hold bruker i samme modal — ingen navigering.
    if (result.code === "created" || result.code === "already_pending") {
      setRelSent(true);
      setShowRelForm(false);
    } else if (result.code === "already_linked") {
      // Allerede koblet — skjul form, ikke vis "sendt"
      setShowRelForm(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="border-white/10 max-h-[90dvh] flex flex-col p-0 gap-0 sm:rounded-2xl rounded-t-2xl rounded-b-none sm:rounded-b-2xl bottom-0 top-auto sm:top-[50%] translate-y-0 sm:translate-y-[-50%] data-[state=open]:slide-in-from-bottom-4 sm:data-[state=open]:slide-in-from-top-[48%]"
        style={{
          background: "linear-gradient(180deg, hsl(215 30% 11%) 0%, hsl(215 30% 8%) 100%)",
          boxShadow: "0 -20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(52,234,184,0.08)",
        }}
      >
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
          <DialogTitle className="text-white" style={chakra}>Legg til øyeblikk</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 px-5 pb-3 overflow-y-auto flex-1 min-h-0">
          {previewUrl ? (
            <div className="relative rounded-lg overflow-hidden border border-white/10">
              <img src={previewUrl} alt="" className="w-full max-h-72 object-cover" />
              <button
                type="button"
                onClick={() => handleFile(null)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label
              className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border border-dashed border-white/15 hover:border-[#2dd4a8]/40 transition-all cursor-pointer"
              style={{ background: "hsl(215 25% 8%)" }}
            >
              <Camera className="w-6 h-6 text-[#2dd4a8]" />
              <span className="text-[12px] text-white/60 uppercase tracking-[0.1em]" style={oswald}>Ta / velg bilde</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </label>
          )}

          <div>
            <Label className="text-[11px] uppercase tracking-[0.15em] text-white/40" style={oswald}>
              Regnr (valgfri)
            </Label>
            <div className="mt-1.5">
              <LicensePlateInput value={regnr} onChange={setRegnr} />
            </div>
            <p className="text-[10px] text-white/30 mt-1.5" style={oswald}>
              Kobles til bil i garasjen. Vises aldri offentlig.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-[11px] uppercase tracking-[0.15em] text-white/40" style={oswald}>
                Merke (valgfri)
              </Label>
              {brandMode === "select" ? (
                <select
                  value={brandName}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "__other__") {
                      setBrandMode("other");
                      setBrandName("");
                      setBrandId(null);
                      setModelName("");
                      return;
                    }
                    const b = brands.find((x) => x.name === v);
                    setBrandName(b?.name ?? "");
                    setBrandId(b?.id ?? null);
                    setModelName("");
                    setModelMode("select");
                  }}
                  disabled={brandsLoading}
                  className="mt-1.5 w-full h-11 px-3 text-[14px] rounded-md border border-white/10 bg-[hsl(215_25%_8%)] text-white"
                >
                  <option value="">{brandsLoading ? "Laster…" : "Velg merke…"}</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                  <option value="__other__">Annet (skriv inn)</option>
                </select>
              ) : (
                <div className="flex gap-2 mt-1.5">
                  <Input
                    value={brandName}
                    onChange={(e) => { setBrandName(e.target.value); setBrandId(null); }}
                    placeholder="Skriv inn merke…"
                    className="bg-[hsl(215_25%_8%)] border-white/10 text-white placeholder:text-white/30"
                  />
                  <button
                    type="button"
                    onClick={() => { setBrandMode("select"); setBrandName(""); setBrandId(null); }}
                    className="px-2 text-[11px] text-white/50 hover:text-white underline whitespace-nowrap"
                  >
                    Velg fra liste
                  </button>
                </div>
              )}
            </div>

            <div>
              <Label className="text-[11px] uppercase tracking-[0.15em] text-white/40" style={oswald}>
                Modell (valgfri)
              </Label>
              {modelMode === "select" && brandId ? (
                <select
                  value={modelName}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "__other__") {
                      setModelMode("other");
                      setModelName("");
                      return;
                    }
                    setModelName(v);
                  }}
                  disabled={!brandId || modelsLoading}
                  className="mt-1.5 w-full h-11 px-3 text-[14px] rounded-md border border-white/10 bg-[hsl(215_25%_8%)] text-white"
                >
                  <option value="">
                    {!brandId ? "Velg merke først…" : modelsLoading ? "Laster…" : models.length === 0 ? "Ingen modeller – skriv inn" : "Velg modell…"}
                  </option>
                  {models.map((m) => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                  <option value="__other__">Annet (skriv inn)</option>
                </select>
              ) : (
                <div className="flex gap-2 mt-1.5">
                  <Input
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="Skriv inn modell…"
                    disabled={!brandName}
                    className="bg-[hsl(215_25%_8%)] border-white/10 text-white placeholder:text-white/30"
                  />
                  {brandId && (
                    <button
                      type="button"
                      onClick={() => { setModelMode("select"); setModelName(""); }}
                      className="px-2 text-[11px] text-white/50 hover:text-white underline whitespace-nowrap"
                    >
                      Velg fra liste
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label className="text-[11px] uppercase tracking-[0.15em] text-white/40" style={oswald}>
                Variant / tittel (valgfri)
              </Label>
              <Input
                value={titleOrModel}
                onChange={(e) => setTitleOrModel(e.target.value.slice(0, 80))}
                placeholder="F.eks. GL, Turbo"
                className="mt-1.5 bg-[hsl(215_25%_8%)] border-white/10 text-white placeholder:text-white/30"
              />
              <p className="text-[10px] text-white/30 mt-1.5" style={oswald}>
                Brukes som navn hvis vi oppretter en ny bil for øyeblikket.
              </p>
            </div>
          </div>

          {isLookingUp && (
            <div className="flex items-center gap-2 text-[11px] text-white/40">
              <Loader2 className="w-3 h-3 animate-spin" />
              Søker etter bil…
            </div>
          )}

          {/* Match-kort: viser status mot innlogget bruker */}
          {!isLookingUp && match && !relSent && !showRelForm && (
            <div className="rounded-lg border border-[#2dd4a8]/30 bg-[#2dd4a8]/[0.06] p-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-md bg-[#2dd4a8]/10 p-1.5 text-[#2dd4a8]">
                  {matchStatus === "owned" ? (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  ) : matchStatus === "pending" ? (
                    <Clock className="w-3.5 h-3.5" />
                  ) : (
                    <CarIcon className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-white truncate" style={chakra}>
                    {match.title}
                  </p>

                  {matchStatus === "owned" && (
                    <>
                      <p className="text-[12px] text-white/80 mt-1" style={oswald}>
                        Denne bilen er allerede i garasjen din
                      </p>
                      <p className="text-[11px] text-white/50 mt-1" style={oswald}>
                        Øyeblikket kobles automatisk til bilen.
                      </p>
                    </>
                  )}

                  {matchStatus === "pending" && (
                    <>
                      <p className="text-[12px] text-white/80 mt-1" style={oswald}>
                        Du har allerede sendt forespørsel
                      </p>
                      <p className="text-[11px] text-white/50 mt-1" style={oswald}>
                        En ansvarlig vurderer den. Du kan fortsatt lagre øyeblikket.
                      </p>
                    </>
                  )}

                  {matchStatus !== "owned" && matchStatus !== "pending" && (
                    <>
                      <p className="text-[12px] text-white/70 mt-1" style={oswald}>
                        Kjenner du denne bilen?
                      </p>
                      <p className="text-[11px] text-white/50 mt-1" style={oswald}>
                        Be om å bli knyttet til bilen og bidra med bilder eller historie.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setShowRelForm(true)}
                        className="mt-2 bg-[#2dd4a8] text-[#070b10] hover:bg-[#34eab8] h-9 w-full sm:w-auto"
                      >
                        Kjenner du denne bilen?
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Inline relasjons-form (mobil først) */}
          {!isLookingUp && match && showRelForm && !relSent && (
            <div className="rounded-lg border border-[#2dd4a8]/30 bg-[#2dd4a8]/[0.06] p-3 space-y-3">
              <div>
                <p className="text-[13px] font-semibold text-white" style={chakra}>
                  {match.title}
                </p>
                <p className="text-[11px] text-white/50 mt-0.5" style={oswald}>
                  Be om å bli knyttet til bilen og bidra med bilder eller historie.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-[0.15em] text-white/50" style={oswald}>
                  Din relasjon
                </Label>
                <select
                  value={relType}
                  onChange={(e) => setRelType(e.target.value as RelationshipType)}
                  className="w-full h-11 px-3 text-[14px] rounded-md border border-white/15 bg-[hsl(215_25%_8%)] text-white"
                >
                  {RELATIONSHIP_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-[0.15em] text-white/50" style={oswald}>
                  Beskjed (valgfri)
                </Label>
                <Textarea
                  value={relNote}
                  onChange={(e) => setRelNote(e.target.value.slice(0, RELATIONSHIP_NOTE_MAX))}
                  rows={2}
                  placeholder="Hvorfor kjenner du denne bilen?"
                  className="bg-[hsl(215_25%_8%)] border-white/15 text-white placeholder:text-white/30"
                />
              </div>

              {relType === "current_owner" && (
                <label className="flex items-start gap-3 rounded-md border border-white/10 bg-[hsl(215_25%_8%)] p-3 cursor-pointer">
                  <Switch
                    checked={wantsStewardship}
                    onCheckedChange={setWantsStewardship}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-white" style={oswald}>
                      Jeg vil bidra med bilder og historie
                    </div>
                    <div className="text-[11px] text-white/50 mt-0.5" style={oswald}>
                      Krever godkjenning før du kan redigere bilen.
                    </div>
                  </div>
                </label>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowRelForm(false)}
                  className="text-white/60 hover:text-white h-10 flex-1"
                  disabled={relMutation.isPending}
                >
                  Avbryt
                </Button>
                <Button
                  type="button"
                  onClick={handleSendRelationship}
                  disabled={relMutation.isPending}
                  className="bg-[#2dd4a8] text-[#070b10] hover:bg-[#34eab8] h-10 flex-1"
                >
                  {relMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Send forespørsel"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Suksess-kort */}
          {relSent && match && (
            <div className="rounded-lg border border-[#2dd4a8]/40 bg-[#2dd4a8]/[0.10] p-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#2dd4a8] mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-white" style={chakra}>
                    Forespørsel sendt — gøy at du kjenner bilen!
                  </p>
                  <p className="text-[11px] text-white/60 mt-1" style={oswald}>
                    Du kan fortsatt lagre øyeblikket ditt.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Textarea
            placeholder="Skriv notat (valgfritt)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="bg-[hsl(215_25%_8%)] border-white/10 text-white placeholder:text-white/30"
          />
        </div>
        <div
          className="flex gap-2 justify-end px-5 py-3 border-t border-white/[0.06] shrink-0"
          style={{
            background: "hsl(215 30% 9%)",
            paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
          }}
        >
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-white/60 hover:text-white"
          >
            Avbryt
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isAdding || (!imageFile && !note.trim() && !regnr.trim() && !titleOrModel.trim())}
            className="bg-[#2dd4a8] text-[#070b10] hover:bg-[#34eab8]"
          >
            {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lagre"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
