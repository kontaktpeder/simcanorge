import { useState, useCallback, useEffect } from "react";
import { AlertTriangle, ExternalLink, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateCarTitle } from "@/data/carBrands";
import { compressImages, generateImageId, getSubmissionImagePath, getCarImagePath, type CompressionProgress } from "@/lib/imageCompression";
import { ImageUploadProgress } from "@/components/ui/image-upload-progress";
import { StepImages } from "./StepImages";
import { StepBrand } from "./StepBrand";
import { StepDetails } from "./StepDetails";
import { StepStory } from "./StepStory";
import { StepContact } from "./StepContact";
import { StepConsent } from "./StepConsent";
import { CarWizardPreview } from "./CarWizardPreview";
import { INITIAL_WIZARD_DATA, STEP_LABELS, type WizardData, type WizardStep } from "./WizardTypes";
import { useAuth } from "@/hooks/useAuth";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";
import { FEATURES } from "@/config/features";

function normalizeRegistrationNumber(raw: string): string {
  return raw.replace(/[\s\-]/g, "").toUpperCase();
}

type DuplicateHit = { id: string; slug: string; title: string; published_at: string | null };

interface CarWizardProps {
  onSuccess?: (result: { carId: string; email: string; flow: "guest" | "authenticated"; publishedNow?: boolean; slug?: string }) => void;
  initialRegistrationNumber?: string;
  /** When true, skip the in-wizard duplicate-regnr check (already handled upstream by RegNrGate). */
  skipDuplicateCheck?: boolean;
}

export function CarWizard({ onSuccess, initialRegistrationNumber, skipDuplicateCheck }: CarWizardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: personProfile } = useMyPersonProfile();
  const DRAFT_KEY = "wizard:draft:guest";

  type PersistedDraft = { data: Omit<WizardData, "images" | "imagePreviews">; step: WizardStep };

  const loadDraft = (): PersistedDraft | null => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || !parsed.data) return null;
      return parsed as PersistedDraft;
    } catch {
      return null;
    }
  };

  const [step, setStep] = useState<WizardStep>(() => {
    const draft = loadDraft();
    return (draft?.step ?? 0) as WizardStep;
  });
  const [data, setData] = useState<WizardData>(() => {
    const draft = loadDraft();
    if (draft) {
      return {
        ...INITIAL_WIZARD_DATA,
        ...draft.data,
        images: [],
        imagePreviews: [],
        registration_number:
          draft.data.registration_number || initialRegistrationNumber || "",
      };
    }
    return {
      ...INITIAL_WIZARD_DATA,
      registration_number: initialRegistrationNumber ?? "",
    };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<CompressionProgress | null>(null);
  const [compressionStats, setCompressionStats] = useState<{ originalSize: number; compressedSize: number; reduction: number } | null>(null);
  const [duplicateHits, setDuplicateHits] = useState<DuplicateHit[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateChecked, setDuplicateChecked] = useState(!!skipDuplicateCheck);

  // Persist draft to sessionStorage so login round-trip doesn't wipe progress.
  // We exclude File objects (images) — they can't be serialized.
  useEffect(() => {
    try {
      const { images: _i, imagePreviews: _p, ...persistable } = data;
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ data: persistable, step }),
      );
    } catch {
      // ignore (quota / disabled storage)
    }
  }, [data, step]);

  // Prefill email and name for authenticated users
  useEffect(() => {
    if (!user?.email) return;
    const profileName = personProfile?.display_name;
    const fallbackName = user.user_metadata?.full_name || user.user_metadata?.name || "";
    setData(prev => ({
      ...prev,
      email: prev.email || user.email!.trim().toLowerCase(),
      owner_name: prev.owner_name || profileName || fallbackName,
    }));
  }, [user?.id, personProfile?.display_name]);

  const onChange = useCallback((patch: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...patch }));
    // Clear related errors
    Object.keys(patch).forEach(key => {
      if (errors[key]) setErrors(prev => ({ ...prev, [key]: "" }));
    });
    // Reset duplicate check if regnr changes
    if ("registration_number" in patch) {
      setDuplicateChecked(false);
      setDuplicateHits([]);
    }
  }, [errors]);

  const goNext = () => setStep(s => Math.min(s + 1, 5) as WizardStep);
  const goBack = () => setStep(s => Math.max(s - 1, 0) as WizardStep);

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleSubmit = async () => {
    // Validate final step
    const fieldErrors: Record<string, string> = {};
    if (!data.owner_name.trim() || data.owner_name.trim().length < 2) fieldErrors.owner_name = "Navn må være minst 2 tegn";
    if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) fieldErrors.email = "Ugyldig e-postadresse";
    if (data.allowEdits === null) fieldErrors.allowEdits = "Velg et alternativ";
    if (!data.privacyAccepted) fieldErrors.privacyAccepted = "Du må godta personvernerklæringen";
    if (data.clubLinkRequested && !data.clubPageId) fieldErrors.club_page = "Velg klubb";
    if (!data.brand) fieldErrors.brand = "Velg merke";
    if (!data.car_model) fieldErrors.car_model = "Velg modell";
    if (FEATURES.relationshipModelV1 && !data.relationship_type) fieldErrors.relationship_type = "Velg relasjon";

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      if (fieldErrors.brand || fieldErrors.car_model) setStep(1);
      else if (fieldErrors.owner_name || fieldErrors.email) setStep(4);
      return;
    }

    // Duplicate regnr check
    if (data.registration_number.trim() && !duplicateChecked) {
      const normalized = normalizeRegistrationNumber(data.registration_number).toLowerCase();
      if (normalized.length >= 2) {
        try {
          const { data: hits } = await supabase.rpc("find_cars_by_registration_number", { p_normalized: normalized });
          if (hits && hits.length > 0) {
            setDuplicateHits(hits as DuplicateHit[]);
            setShowDuplicateDialog(true);
            return;
          }
        } catch (err) {
          console.warn("Duplicate check failed:", err);
        }
      }
      setDuplicateChecked(true);
    }

    setIsSubmitting(true);
    setUploadProgress(null);
    setCompressionStats(null);

    try {
      const generatedTitle = generateCarTitle(data.brand, data.car_model, data.car_year ? parseInt(data.car_year) : null);
      const baseSlug = generateSlug(generatedTitle);
      const tagsArray = data.tags ? data.tags.split(",").map(t => t.trim()).filter(Boolean) : [];

      const createUuid = () => {
        const g = globalThis as any;
        if (g.crypto?.randomUUID) return g.crypto.randomUUID() as string;
        const bytes = new Uint8Array(16);
        g.crypto.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
      };

      const carId = createUuid();
      let carSlug = baseSlug;

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      const isAuthenticated = !!session?.user;

      // Upload images
      const uploadedUrls: string[] = [];
      if (data.images.length > 0) {
        const compressed = await compressImages(data.images, p => setUploadProgress(p));
        const totalOrig = compressed.reduce((s, r) => s + r.originalSize, 0);
        const totalComp = compressed.reduce((s, r) => s + r.compressedSize, 0);
        setCompressionStats({ originalSize: totalOrig, compressedSize: totalComp, reduction: Math.round((1 - totalComp / totalOrig) * 100) });

        for (let i = 0; i < compressed.length; i++) {
          const { file } = compressed[i];
          const path = isAuthenticated
            ? getCarImagePath(carId, generateImageId())
            : getSubmissionImagePath(carId, generateImageId());
          setUploadProgress({ stage: "uploading", current: i + 1, total: compressed.length, percentage: Math.round((i + 1) / compressed.length * 100) });
          const { error } = await supabase.storage.from("simca-images").upload(path, file);
          if (!error) {
            const { data: urlData } = supabase.storage.from("simca-images").getPublicUrl(path);
            uploadedUrls.push(urlData.publicUrl);
          }
        }
      }

      const selectedClub = data.clubLinkRequested && data.clubPageId
        ? { id: data.clubPageId } : null;

      const relationshipNote =
        data.relationship_type === "other"
          ? (data.relationship_note?.trim() || null)
          : null;

      const submissionPayload = {
        submitted_at: new Date().toISOString(),
        owner_name: data.owner_name,
        email: data.email,
        phone: data.phone || null,
        brand: data.brand,
        car_model: data.car_model,
        variant: data.variant || null,
        body_type: data.body_type || null,
        car_year: data.car_year ? parseInt(data.car_year) : null,
        category: data.category,
        tags: tagsArray,
        car_story: data.car_story || null,
        allow_edits: data.allowEdits === true,
        allow_instagram: data.allowInstagram,
        club_join_request: selectedClub
          ? { requested: true, page_id: selectedClub.id, page_title: null, page_slug: null, message: data.clubMessage.trim() || null }
          : { requested: false, page_id: null, page_title: null, page_slug: null, message: null },
        relationship: FEATURES.relationshipModelV1
          ? {
              type: data.relationship_type || "current_owner",
              note: relationshipNote,
            }
          : null,
        image_count: uploadedUrls.length,
        images_selected: data.images.length,
      };

      if (isAuthenticated) {
        // ── Authenticated flow: publish now or save as draft ──
        const authUser = session!.user;
        const slug = `${baseSlug}-${Date.now().toString(36)}`;

        // Bilen lagres alltid som draft fra wizarden. Brukeren får et eget
        // "Hva vil du nå?"-vindu rett etter (PostCreateActionOverlay) der
        // publisering er den primære, tydelige handlingen.
        const carStatus: "draft" = "draft";
        const publishedAt: string | null = null;
        const canPublishNow = false;

        const { error: carError } = await supabase.from("cars").insert({
          id: carId,
          title: generatedTitle,
          slug,
          brand: data.brand,
          model: data.car_model,
          variant: data.variant || null,
          body_type: data.body_type || null,
          year: data.car_year ? parseInt(data.car_year) : null,
          category: data.category,
          tags: tagsArray,
          story: data.car_story || null,
          status: carStatus as any,
          published_at: publishedAt,
          source: "owner_self" as const,
          created_by_user_id: authUser.id,
          allow_edits: data.allowEdits === true,
          registration_number: data.registration_number.trim() || null,
          submission_payload: submissionPayload,
        } as any);

        if (carError) throw carError;

        // Create car_owners row (with relationship fields when flag is on)
        const ownerInsert: Record<string, unknown> = {
          car_id: carId,
          user_id: authUser.id,
          email: authUser.email || data.email.trim().toLowerCase(),
          role: "owner",
        };
        if (FEATURES.relationshipModelV1) {
          const relType = data.relationship_type || "current_owner";
          ownerInsert.relationship_type = relType;
          ownerInsert.relationship_note = relType === "other" ? relationshipNote : null;
          ownerInsert.relationship_is_verified = relType === "current_owner";
          ownerInsert.relationship_is_public = true;
        }
        const { error: ownerError } = await supabase
          .from("car_owners")
          .insert(ownerInsert as never);
        if (ownerError) console.error("car_owners insert error:", ownerError);

        // Insert images
        for (let i = 0; i < uploadedUrls.length; i++) {
          await supabase.from("car_images").insert({
            car_id: carId,
            image_url: uploadedUrls[i],
            sort_order: i,
          });
        }

        // Club link request
        if (selectedClub) {
          try {
            await supabase.rpc("create_page_car_link_request", {
              p_car_id: carId, p_page_id: selectedClub.id, p_message: data.clubMessage.trim() || null,
            });
          } catch (err) { console.error("Club link failed:", err); }
        }

        toast({ title: "Bilen er klar 🚗", description: "Velg hva du vil gjøre videre." });
        try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
        onSuccess?.({ carId, email: data.email, flow: "authenticated", publishedNow: canPublishNow, slug });

      } else {
        // ── Guest flow: anonymous submission ──
        const tryInsert = async (slug: string) =>
          supabase.from("cars").insert({
            id: carId,
            title: generatedTitle,
            slug,
            brand: data.brand,
            model: data.car_model,
            variant: data.variant || null,
            body_type: data.body_type || null,
            year: data.car_year ? parseInt(data.car_year) : null,
            category: data.category,
            tags: tagsArray,
            story: data.car_story || null,
            status: "submitted" as const,
            published_at: null,
            source: "submission" as const,
            submitted_by_email: data.email.trim().toLowerCase(),
            submitted_by_name: data.owner_name,
            submitted_by_phone: data.phone || null,
            submission_payload: submissionPayload,
            allow_edits: data.allowEdits === true,
            registration_number: data.registration_number.trim() || null,
          } as any);

        const { error: carError } = await tryInsert(carSlug);
        if (carError) {
          if (carError.code === "23505") {
            carSlug = `${baseSlug}-${Date.now()}`;
            const { error: retry } = await tryInsert(carSlug);
            if (retry) throw retry;
          } else throw carError;
        }

        // Insert images with error handling
        const insertErrors: string[] = [];
        let imagesSaved = 0;
        for (let i = 0; i < uploadedUrls.length; i++) {
          const { error: insertError } = await supabase.from("car_images").insert({
            car_id: carId,
            image_url: uploadedUrls[i],
            sort_order: i,
          });
          if (insertError) {
            console.error("car_images insert error:", insertError);
            insertErrors.push(insertError.message);
          } else {
            imagesSaved++;
          }
        }
        const wanted = uploadedUrls.length;
        if (wanted > 0 && imagesSaved === 0) {
          throw new Error(
            insertErrors[0] || "Kunne ikke knytte bildene til bilen. Teksten er lagret."
          );
        }
        if (wanted > 0 && insertErrors.length > 0 && imagesSaved > 0) {
          toast({
            title: "Innsending delvis lagret",
            description: `${imagesSaved} av ${wanted} bilde(r) ble knyttet. Noen feilet.`,
            variant: "destructive",
          });
        }

        // Club link request
        if (selectedClub) {
          try {
            await supabase.rpc("create_page_car_link_request", {
              p_car_id: carId, p_page_id: selectedClub.id, p_message: data.clubMessage.trim() || null,
            });
          } catch (err) { console.error("Club link failed:", err); }
        }

        toast({ title: "Takk for innsendingen!", description: "Vi har mottatt bilen din. Den blir synlig når admin har godkjent den." });
        try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
        onSuccess?.({ carId, email: data.email, flow: "guest" });
      }
    } catch (error: any) {
      const isRls = error?.message?.toLowerCase().includes("row-level security");
      toast({
        title: "Noe gikk galt",
        description: isRls
          ? "Tilgangsregler stoppet innsendingen. Prøv en hard refresh."
          : error?.message || "Prøv igjen senere.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-full min-h-0">
      {/* Progress bar */}
      <div className="flex items-center gap-1 mb-4 shrink-0">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex-1">
            <div className={`h-1.5 rounded-full transition-colors duration-300 ${
              i <= step ? "bg-primary" : "bg-muted"
            }`} />
            <p className={`text-[11px] mt-1.5 uppercase tracking-wider font-bold transition-colors ${
              i === step ? "text-primary" : i < step ? "text-foreground" : "text-muted-foreground"
            }`}>{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 min-h-0">
        {/* Main form area */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto min-h-0 pr-1 scrollbar-thin">
            {step === 0 && <StepImages data={data} onChange={onChange} />}
            {step === 1 && <StepBrand data={data} onChange={onChange} errors={errors} />}
            {step === 2 && <StepDetails data={data} onChange={onChange} />}
            {step === 3 && <StepStory data={data} onChange={onChange} />}
            {step === 4 && <StepContact data={data} onChange={onChange} errors={errors} emailLocked={!!user} nameLocked={!!personProfile?.display_name} showLoginHint={!user} />}
            {step === 5 && <StepConsent data={data} onChange={onChange} onSubmit={handleSubmit} isSubmitting={isSubmitting} errors={errors} />}

            {/* Upload progress */}
            {isSubmitting && uploadProgress && <div className="mt-4"><ImageUploadProgress progress={uploadProgress} compressionStats={compressionStats} /></div>}
          </div>

          {/* Fixed navigation buttons */}
          <div className="shrink-0 flex justify-between items-center gap-2 pt-2 pb-1 sm:pt-4 sm:pb-2 border-t border-muted mt-1 sm:mt-2">
            {step > 0 ? (
              <button type="button" onClick={goBack}
                className="px-3 py-2 sm:px-6 sm:py-3 rounded-lg font-display text-xs sm:text-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                ← Tilbake
              </button>
            ) : <div />}
            {step < 5 ? (
              <button type="button" onClick={() => {
                if (step === 0) { goNext(); return; }
                if (step === 1 && (!data.brand || !data.car_model)) return;
                if (step === 4) {
                  const canProceed = data.owner_name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
                  if (!canProceed) return;
                }
                goNext();
              }}
                disabled={step === 1 && (!data.brand || !data.car_model) || step === 4 && (data.owner_name.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))}
                className="px-4 py-2 sm:px-8 sm:py-3 rounded-lg font-display text-sm sm:text-base uppercase tracking-wider transition-all hover:brightness-110 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #1F66B5, #2B7BD4)", color: "#fff" }}>
                {step === 0 && data.images.length === 0 ? "Hopp over" : step === 3 && !data.car_story.trim() ? "Hopp over →" : "Neste →"}
              </button>
            ) : (
              (() => {
                const missing: string[] = [];
                if (data.allowEdits === null) missing.push("Velg om vi kan redigere bilen (Ja/Nei)");
                if (!data.privacyAccepted) missing.push("Godta personvernerklæringen");
                const blocked = missing.length > 0;
                return (
                  <div className="flex flex-col items-end gap-2">
                    {blocked && (
                      <div
                        role="status"
                        aria-live="polite"
                        className="text-xs sm:text-sm text-amber-200 bg-amber-500/10 border border-amber-500/40 rounded-md px-3 py-2 max-w-xs text-right"
                      >
                        <p className="font-semibold mb-1">Mangler før du kan lagre:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                          {missing.map((m) => <li key={m}>{m}</li>)}
                        </ul>
                      </div>
                    )}
                    <Button type="button" onClick={handleSubmit}
                      disabled={isSubmitting || blocked}
                      title={blocked ? `Mangler: ${missing.join(" • ")}` : undefined}
                      className="btn-enamel-blue text-sm sm:text-base h-10 sm:h-12 px-5 sm:px-8 disabled:opacity-40">
                      {isSubmitting ? "Sender…" : (
                        <>
                          <Send className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          {user ? "Lagre bil" : "Send inn"}
                        </>
                      )}
                    </Button>
                  </div>
                );
              })()
            )}
          </div>
        </div>

        {/* Live preview (sticky on desktop) */}
        <div className="lg:col-span-2 hidden lg:block overflow-y-auto min-h-0">
          <CarWizardPreview data={data} />
        </div>
      </div>

      {/* Duplicate dialog */}
      {showDuplicateDialog && duplicateHits.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border-2 border-amber-500/40 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display text-lg text-foreground">Kan allerede være lagt inn</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Vi fant {duplicateHits.length === 1 ? "en bil" : `${duplicateHits.length} biler`} med samme registreringsnummer.
                </p>
              </div>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {duplicateHits.map(hit => (
                <a key={hit.id} href={`/biler/${hit.slug}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
                  <span className="text-sm font-medium group-hover:text-primary truncate">{hit.title}</span>
                  <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </a>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1"
                onClick={() => { setShowDuplicateDialog(false); setDuplicateHits([]); }}>
                Avbryt
              </Button>
              <Button type="button" className="flex-1 btn-enamel-blue"
                onClick={() => { setShowDuplicateDialog(false); setDuplicateChecked(true); handleSubmit(); }}>
                Fortsett likevel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
