import { useState, useCallback } from "react";
import { AlertTriangle, ExternalLink, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateCarTitle } from "@/data/carBrands";
import { compressImages, generateImageId, getSubmissionImagePath, type CompressionProgress } from "@/lib/imageCompression";
import { ImageUploadProgress } from "@/components/ui/image-upload-progress";
import { StepImages } from "./StepImages";
import { StepBrand } from "./StepBrand";
import { StepDetails } from "./StepDetails";
import { StepStory } from "./StepStory";
import { StepContact } from "./StepContact";
import { StepConsent } from "./StepConsent";
import { CarWizardPreview } from "./CarWizardPreview";
import { INITIAL_WIZARD_DATA, STEP_LABELS, type WizardData, type WizardStep } from "./WizardTypes";

function normalizeRegistrationNumber(raw: string): string {
  return raw.replace(/[\s\-]/g, "").toUpperCase();
}

type DuplicateHit = { id: string; slug: string; title: string; published_at: string | null };

interface CarWizardProps {
  onSuccess?: (result: { carId: string; email: string }) => void;
}

export function CarWizard({ onSuccess }: CarWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<WizardStep>(0);
  const [data, setData] = useState<WizardData>(INITIAL_WIZARD_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<CompressionProgress | null>(null);
  const [compressionStats, setCompressionStats] = useState<{ originalSize: number; compressedSize: number; reduction: number } | null>(null);
  const [duplicateHits, setDuplicateHits] = useState<DuplicateHit[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateChecked, setDuplicateChecked] = useState(false);

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

      // Upload images
      const uploadedUrls: string[] = [];
      if (data.images.length > 0) {
        const compressed = await compressImages(data.images, p => setUploadProgress(p));
        const totalOrig = compressed.reduce((s, r) => s + r.originalSize, 0);
        const totalComp = compressed.reduce((s, r) => s + r.compressedSize, 0);
        setCompressionStats({ originalSize: totalOrig, compressedSize: totalComp, reduction: Math.round((1 - totalComp / totalOrig) * 100) });

        for (let i = 0; i < compressed.length; i++) {
          const { file } = compressed[i];
          const path = getSubmissionImagePath(carId, generateImageId());
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
        image_count: uploadedUrls.length,
        images_selected: data.images.length,
      };

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
      onSuccess?.({ carId, email: data.email });
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
            {step === 4 && <StepContact data={data} onChange={onChange} errors={errors} />}
            {step === 5 && <StepConsent data={data} onChange={onChange} onSubmit={handleSubmit} isSubmitting={isSubmitting} errors={errors} />}

            {/* Upload progress */}
            {isSubmitting && uploadProgress && <div className="mt-4"><ImageUploadProgress progress={uploadProgress} compressionStats={compressionStats} /></div>}
          </div>

          {/* Fixed navigation buttons */}
          <div className="shrink-0 flex justify-between items-center pt-4 pb-2 border-t border-muted mt-2">
            {step > 0 ? (
              <button type="button" onClick={goBack}
                className="px-6 py-3 rounded-lg font-display text-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
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
                className="px-8 py-3 rounded-lg font-display text-base uppercase tracking-wider transition-all hover:brightness-110 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #1F66B5, #2B7BD4)", color: "#fff" }}>
                {step === 0 && data.images.length === 0 ? "Hopp over bilder" : step === 3 && !data.car_story.trim() ? "Hopp over →" : "Neste →"}
              </button>
            ) : (
              <Button type="button" onClick={handleSubmit}
                disabled={isSubmitting || data.allowEdits === null || !data.privacyAccepted}
                className="btn-enamel-blue text-base h-12 px-8 disabled:opacity-40">
                {isSubmitting ? "Sender…" : <><Send className="w-5 h-5 mr-2" /> Send inn</>}
              </Button>
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
