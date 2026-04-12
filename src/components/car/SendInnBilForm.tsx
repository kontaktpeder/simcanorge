import { useState, useRef, useMemo, useCallback } from "react";
import { Car, Send, Camera, X, ImagePlus, Users, AlertTriangle, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { CAR_BRANDS, getModelsForBrand, getYearsForModel, getVariantsForModel, generateCarTitle } from "@/data/carBrands";
import { CAR_BODY_TYPES } from "@/data/carBodyTypes";
import { FormFieldWithTooltip } from "@/components/ui/form-field-with-tooltip";
import { compressImages, generateImageId, getSubmissionImagePath, type CompressionProgress } from "@/lib/imageCompression";
import { ImageUploadProgress } from "@/components/ui/image-upload-progress";

const CATEGORIES = [
  { id: "registrert", label: "Registrerte biler" },
  { id: "restaurering", label: "Restaureringsprosjekter" },
  { id: "historisk", label: "Historiske biler" },
  { id: "vrak", label: "Vrak" }
];

const submissionSchema = z.object({
  brand: z.string().min(1, "Velg et merke"),
  car_model: z.string().min(1, "Velg en modell"),
  variant: z.string().max(100, "Variant kan ikke være mer enn 100 tegn").optional().or(z.literal("")),
  body_type: z.string().optional().or(z.literal("")),
  car_year: z.number().int().min(1900, "Ugyldig årstall").max(2000, "Ugyldig årstall").optional().nullable(),
  owner_name: z.string().trim().min(2, "Navn må være minst 2 tegn").max(100, "Navn kan ikke være mer enn 100 tegn"),
  email: z.string().trim().email("Ugyldig e-postadresse").max(255, "E-post kan ikke være mer enn 255 tegn"),
  phone: z.string().trim().max(20, "Telefonnummer kan ikke være mer enn 20 tegn").optional().or(z.literal("")),
  category: z.string().min(1, "Velg en kategori"),
  tags: z.string().max(500, "Tags kan ikke være mer enn 500 tegn").optional().or(z.literal("")),
  car_story: z.string().trim().max(5000, "Historien kan ikke være mer enn 5000 tegn").optional().or(z.literal("")),
  registration_number: z.string().trim().max(10, "Maks 10 tegn").optional().or(z.literal("")),
});

function normalizeRegistrationNumber(raw: string): string {
  return raw.replace(/[\s\-]/g, "").toUpperCase();
}

type DuplicateHit = { id: string; slug: string; title: string; published_at: string | null };

const MIN_SUBMIT_INTERVAL = 2000;

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

export interface SendInnBilFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  showCancelButton?: boolean;
}

export function SendInnBilForm({ onSuccess, onCancel, showCancelButton = false }: SendInnBilFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<CompressionProgress | null>(null);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    reduction: number;
  } | null>(null);
  const [allowEdits, setAllowEdits] = useState<boolean | null>(null);
  const [allowInstagram, setAllowInstagram] = useState<boolean>(false);
  const [clubLinkRequested, setClubLinkRequested] = useState(false);
  const [clubPageId, setClubPageId] = useState("");
  const [clubMessage, setClubMessage] = useState("");
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);
  const [duplicateHits, setDuplicateHits] = useState<DuplicateHit[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateChecked, setDuplicateChecked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    brand: "",
    owner_name: "",
    email: "",
    phone: "",
    car_model: "",
    variant: "",
    body_type: "",
    car_year: "",
    category: "registrert",
    tags: "",
    car_story: "",
    registration_number: "",
  });

  const availableModels = useMemo(() => {
    return getModelsForBrand(formData.brand);
  }, [formData.brand]);

  const availableYears = useMemo(() => {
    return getYearsForModel(formData.brand, formData.car_model);
  }, [formData.brand, formData.car_model]);

  const availableVariants = useMemo(() => {
    return getVariantsForModel(formData.brand, formData.car_model);
  }, [formData.brand, formData.car_model]);

  const generatedTitle = useMemo(() => {
    if (!formData.brand || !formData.car_model) return "";
    return generateCarTitle(formData.brand, formData.car_model, formData.car_year ? parseInt(formData.car_year) : null);
  }, [formData.brand, formData.car_model, formData.car_year]);

  const { data: clubs } = useQuery({
    queryKey: ["public-clubs-for-submission"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("id, title, slug")
        .eq("page_type", "club")
        .eq("is_public", true)
        .eq("status", "active")
        .order("title");
      if (error) throw error;
      return data ?? [];
    },
  });

  const selectedClub = clubs?.find(c => c.id === clubPageId) ?? null;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    // Reset duplicate check if regnr changes
    if (name === "registration_number") {
      setDuplicateChecked(false);
      setDuplicateHits([]);
      setShowDuplicateDialog(false);
    }
  };

  const checkDuplicateRegnr = useCallback(async () => {
    const normalized = normalizeRegistrationNumber(formData.registration_number).toLowerCase();
    if (normalized.length < 2) return true; // skip check for very short input
    try {
      const { data } = await supabase.rpc("find_cars_by_registration_number", { p_normalized: normalized });
      if (data && data.length > 0) {
        setDuplicateHits(data as DuplicateHit[]);
        setShowDuplicateDialog(true);
        return false; // block submit until user decides
      }
    } catch (err) {
      console.warn("Duplicate regnr check failed:", err);
    }
    setDuplicateChecked(true);
    return true;
  }, [formData.registration_number]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 10) {
      toast({
        title: "For mange bilder",
        description: "Du kan laste opp maksimalt 10 bilder.",
        variant: "destructive"
      });
      return;
    }
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Ugyldig filtype",
          description: `${file.name} er ikke et bilde.`,
          variant: "destructive"
        });
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Filen er for stor",
          description: `${file.name} er over 10MB.`,
          variant: "destructive"
        });
        return false;
      }
      return true;
    });
    setImages(prev => [...prev, ...validFiles]);

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  type ImageUploadFailure = { fileName: string; message: string };
  type UploadImagesResult = { urls: string[]; failures: ImageUploadFailure[] };

  const uploadImages = async (carId: string): Promise<UploadImagesResult> => {
    const urls: string[] = [];
    const failures: ImageUploadFailure[] = [];

    if (images.length === 0) return { urls: [], failures: [] };

    const compressedResults = await compressImages(images, progress => {
      setUploadProgress(progress);
    });

    const totalOriginal = compressedResults.reduce((sum, r) => sum + r.originalSize, 0);
    const totalCompressed = compressedResults.reduce((sum, r) => sum + r.compressedSize, 0);
    setCompressionStats({
      originalSize: totalOriginal,
      compressedSize: totalCompressed,
      reduction: Math.round((1 - totalCompressed / totalOriginal) * 100)
    });

    for (let i = 0; i < compressedResults.length; i++) {
      const { file } = compressedResults[i];
      const imageId = generateImageId();
      const filePath = getSubmissionImagePath(carId, imageId);
      setUploadProgress({
        stage: 'uploading',
        current: i + 1,
        total: compressedResults.length,
        percentage: Math.round((i + 1) / compressedResults.length * 100)
      });
      const { error: uploadError } = await supabase.storage.from('simca-images').upload(filePath, file);
      if (uploadError) {
        console.error('Upload error:', uploadError);
        failures.push({ fileName: file.name, message: uploadError.message });
        continue;
      }
      const { data: urlData } = supabase.storage.from('simca-images').getPublicUrl(filePath);
      urls.push(urlData.publicUrl);
    }
    return { urls, failures };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
      toast({
        title: "Feil konfigurasjon",
        description: "Backend er ikke konfigurert riktig (mangler API-nøkkel). Prøv å laste siden på nytt, og kontakt admin hvis det fortsetter.",
        variant: "destructive",
      });
      return;
    }

    const now = Date.now();
    if (now - lastSubmitTime < MIN_SUBMIT_INTERVAL) {
      toast({ description: "Vennligst vent før du sender inn igjen.", variant: "destructive" });
      return;
    }
    setLastSubmitTime(now);
    setErrors({});

    // Duplicate regnr check (non-blocking dialog)
    if (formData.registration_number.trim() && !duplicateChecked) {
      const ok = await checkDuplicateRegnr();
      if (!ok) return; // dialog will show – user picks action
    }
    
    const dataToValidate = {
      ...formData,
      car_year: formData.car_year ? parseInt(formData.car_year) : null,
      phone: formData.phone || undefined,
      variant: formData.variant || undefined,
      body_type: formData.body_type || undefined,
      tags: formData.tags || undefined,
      car_story: formData.car_story || undefined,
      registration_number: formData.registration_number || undefined,
    };
    
    const result = submissionSchema.safeParse(dataToValidate);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (clubLinkRequested && !clubPageId) {
      setErrors(prev => ({ ...prev, club_page: "Velg ønsket klubb" }));
      return;
    }
    
    setIsSubmitting(true);
    setUploadProgress(null);
    setCompressionStats(null);
    
    try {
      const tagsArray = result.data.tags ? result.data.tags.split(",").map(t => t.trim()).filter(t => t.length > 0) : [];
      const generatedTitle = generateCarTitle(result.data.brand, result.data.car_model, result.data.car_year);
      const baseSlug = generateSlug(generatedTitle);

      const createUuidV4 = () => {
        const g = globalThis as any;
        if (g.crypto?.randomUUID) return g.crypto.randomUUID() as string;
        const bytes = new Uint8Array(16);
        g.crypto.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
      };

      const carId = createUuidV4();
      let carSlug = baseSlug;

      // Upload images first so we know the actual count
      const uploadResult = images.length > 0
        ? await uploadImages(carId)
        : { urls: [] as string[], failures: [] as ImageUploadFailure[] };

      console.info("[SendInnBilForm] submit context", {
        emailDomain: result.data.email.split("@")[1] ?? null,
        status: "submitted",
        source: "submission",
        allow_edits: allowEdits === true,
        images_selected: images.length,
        images_uploaded: uploadResult.urls.length,
      });

      const submissionPayload = {
        submitted_at: new Date().toISOString(),
        owner_name: result.data.owner_name,
        email: result.data.email,
        phone: result.data.phone || null,
        brand: result.data.brand,
        car_model: result.data.car_model,
        variant: result.data.variant || null,
        body_type: result.data.body_type || null,
        car_year: result.data.car_year,
        category: result.data.category,
        tags: tagsArray,
        car_story: result.data.car_story || null,
        allow_edits: allowEdits === true,
        allow_instagram: allowInstagram,
        club_join_request: clubLinkRequested && selectedClub
          ? {
              requested: true,
              page_id: selectedClub.id,
              page_title: selectedClub.title,
              page_slug: selectedClub.slug,
              message: clubMessage.trim() || null,
            }
          : { requested: false, page_id: null, page_title: null, page_slug: null, message: null },
        image_count: uploadResult.urls.length,
        images_selected: images.length,
      };

      const tryInsertCar = async (slug: string) => {
        return supabase.from("cars").insert({
          id: carId,
          title: generatedTitle,
          slug,
          brand: result.data.brand,
          model: result.data.car_model,
          variant: result.data.variant || null,
          body_type: result.data.body_type || null,
          year: result.data.car_year,
          category: result.data.category,
          tags: tagsArray,
          story: result.data.car_story || null,
          status: "submitted" as const,
          published_at: null,
          source: "submission" as const,
          submitted_by_email: result.data.email,
          submitted_by_name: result.data.owner_name,
          submitted_by_phone: result.data.phone || null,
          submitted_notes: null,
          submission_payload: submissionPayload,
          approved_at: null,
          approved_by: null,
          allow_edits: allowEdits === true,
          registration_number: result.data.registration_number?.trim() || null,
        } as any);
      };

      const { error: carError } = await tryInsertCar(carSlug);
      if (carError) {
        if (carError.code === "23505") {
          carSlug = `${baseSlug}-${Date.now()}`;
          const { error: retryError } = await tryInsertCar(carSlug);
          if (retryError) throw retryError;
        } else {
          throw carError;
        }
      }

      // Insert car_images rows
      let imagesSaved = 0;
      const insertErrors: string[] = [];

      for (let i = 0; i < uploadResult.urls.length; i++) {
        const { error: insertError } = await supabase.from("car_images").insert({
          car_id: carId,
          image_url: uploadResult.urls[i],
          sort_order: i,
        });
        if (insertError) {
          console.error("car_images insert error:", insertError);
          insertErrors.push(insertError.message);
        } else {
          imagesSaved++;
        }
      }

      // Toast feedback
      const uploadFailCount = uploadResult.failures.length;
      const insertFailCount = insertErrors.length;
      const wantedImages = images.length;

      if (wantedImages > 0 && uploadFailCount === 0 && insertFailCount === 0 && imagesSaved === wantedImages) {
        toast({
          title: "Takk for innsendingen!",
          description: `Vi har mottatt bilen og ${imagesSaved} bilde(r). Den blir synlig når admin har godkjent den.`,
        });
      } else if (wantedImages > 0 && (uploadFailCount > 0 || insertFailCount > 0)) {
        toast({
          title: "Innsending mottatt, men noe gikk galt med bildene",
          description: [
            uploadFailCount > 0 && `${uploadFailCount} bilde(r) kunne ikke lastes opp.`,
            insertFailCount > 0 && `${insertFailCount} bilde(r) ble ikke knyttet til bilen.`,
            imagesSaved > 0 && `${imagesSaved} av ${wantedImages} bilde(r) er lagret.`,
            "Teksten din er lagret. Ta gjerne kontakt om du vil ettersende bilder.",
          ].filter(Boolean).join(" "),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Takk for innsendingen!",
          description: "Bilen vil bli vist når admin har godkjent den.",
        });
      }

      // Create club link request via RPC if requested
      if (clubLinkRequested && selectedClub) {
        try {
          const { data: rpcResult } = await supabase.rpc('create_page_car_link_request', {
            p_car_id: carId,
            p_page_id: selectedClub.id,
            p_message: clubMessage.trim() || null,
          });
          const rpcData = rpcResult as { success?: boolean } | null;
          if (rpcData && !rpcData.success) {
            console.warn('Club link request RPC returned:', rpcData);
          }
        } catch (rpcErr) {
          console.error('Club link request failed:', rpcErr);
          // Non-critical — car is already saved
        }
      }

      onSuccess?.();
    } catch (error: any) {
      const errMsg = error?.details || error?.message || "Prøv igjen senere.";

      console.error("Submission error:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
      });

      const isRlsError =
        typeof error?.message === "string" &&
        error.message.toLowerCase().includes("row-level security");

      toast({
        title: "Noe gikk galt",
        description: isRlsError
          ? "Innsendingen ble stoppet av tilgangsregler i backend. Prøv en hard refresh (Ctrl+F5) og send inn på nytt. Hvis det fortsatt skjer, gi oss beskjed."
          : errMsg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-4 border-transparent bg-clip-padding rounded-3xl overflow-hidden shadow-2xl" style={{
      background: 'linear-gradient(white, white) padding-box, linear-gradient(180deg, #F2F4F7 0%, #B8C0CC 20%, #FFFFFF 40%, #7A8596 60%, #F2F4F7 80%, #5B6472 100%) border-box'
    }}>
      {/* Inner blue header */}
      <div className="bg-gradient-to-r from-[#1F66B5] to-[#2B7BD4] p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <Car className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl text-white">
            Vi ser gjennom historien din!
          </h2>
        </div>
      </div>

      {/* Form content */}
      <div className="bg-card p-4 sm:p-6 md:p-10">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Brand, Model, Variant, Body Type, Year - Car details */}
          <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-muted/30 rounded-lg border-2 border-muted">
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Velg merke, modell og årstall – dette blir bilens tittel på siden</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Brand */}
              <FormFieldWithTooltip label="MERKE" tooltip="Bilprodusent. Eks: Simca" required htmlFor="brand" error={errors.brand}>
                <select id="brand" name="brand" value={formData.brand} onChange={e => setFormData(prev => ({
                  ...prev,
                  brand: e.target.value,
                  car_model: "",
                  car_year: ""
                }))} className={`w-full h-12 px-3 text-base rounded-md border-2 bg-background ${errors.brand ? 'border-destructive' : 'border-muted'}`} required>
                  <option value="">Velg merke...</option>
                  {CAR_BRANDS.map(brand => <option key={brand.name} value={brand.name}>{brand.name}</option>)}
                </select>
              </FormFieldWithTooltip>

              {/* Model */}
              <FormFieldWithTooltip label="MODELL" tooltip="Modellserie / plattform. Eks: 1100" required htmlFor="car_model" error={errors.car_model}>
                <select id="car_model" name="car_model" value={formData.car_model} onChange={e => setFormData(prev => ({
                  ...prev,
                  car_model: e.target.value,
                  car_year: "",
                  variant: ""
                }))} className={`w-full h-12 px-3 text-base rounded-md border-2 bg-background ${errors.car_model ? 'border-destructive' : 'border-muted'}`} required disabled={!formData.brand}>
                  <option value="">Velg modell...</option>
                  {availableModels.map(model => <option key={model.name} value={model.name}>{model.name}</option>)}
                </select>
              </FormFieldWithTooltip>

              {/* Variant */}
              <FormFieldWithTooltip label="VARIANTBETEGNELSE" tooltip="Fabrikkens navn på en spesifikk utgave. Eks: VF1, Rallye 2" htmlFor="variant" error={errors.variant}>
                {availableVariants.length > 0 ? (
                  <select id="variant" name="variant" value={formData.variant} onChange={e => setFormData(prev => ({
                    ...prev,
                    variant: e.target.value
                  }))} className={`w-full h-12 px-3 text-base rounded-md border-2 bg-background ${errors.variant ? 'border-destructive' : 'border-muted'}`} disabled={!formData.car_model}>
                    <option value="">Velg variant...</option>
                    {availableVariants.map(variant => <option key={variant} value={variant}>{variant}</option>)}
                    <option value="__other__">Annet (skriv inn)</option>
                  </select>
                ) : (
                  <Input id="variant" name="variant" value={formData.variant} onChange={handleChange} placeholder="F.eks. VF1, Rallye 2, TI..." className={`text-base h-12 border-2 ${errors.variant ? 'border-destructive' : 'border-muted'}`} />
                )}
              </FormFieldWithTooltip>

              {/* Body Type */}
              <FormFieldWithTooltip label="KAROSSERIFORM" tooltip="Karosseritype / bruksform. Eks: Pick-Up, Sedan" htmlFor="body_type" error={errors.body_type}>
                <select id="body_type" name="body_type" value={formData.body_type} onChange={e => setFormData(prev => ({
                  ...prev,
                  body_type: e.target.value
                }))} className={`w-full h-12 px-3 text-base rounded-md border-2 bg-background ${errors.body_type ? 'border-destructive' : 'border-muted'}`}>
                  <option value="">Velg karosseriform...</option>
                  {CAR_BODY_TYPES.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}
                </select>
              </FormFieldWithTooltip>

              {/* Year */}
              <FormFieldWithTooltip label="ÅRSTALL" tooltip="Produksjonsår for bilen" htmlFor="car_year" error={errors.car_year}>
                <select id="car_year" name="car_year" value={formData.car_year} onChange={e => setFormData(prev => ({
                  ...prev,
                  car_year: e.target.value
                }))} className={`w-full h-12 px-3 text-base rounded-md border-2 bg-background ${errors.car_year ? 'border-destructive' : 'border-muted'}`} disabled={!formData.car_model}>
                  <option value="">Velg år...</option>
                  {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </FormFieldWithTooltip>
            </div>

            {/* Generated title preview */}
            {generatedTitle && (
              <div className="mt-2 p-2 sm:p-3 bg-primary/10 rounded-md border border-primary/30">
                <p className="text-xs sm:text-sm text-muted-foreground">Bilens tittel på siden blir:</p>
                <p className="text-base sm:text-lg font-display text-primary">{generatedTitle}</p>
              </div>
            )}
          </div>

          {/* Registration number */}
          <div className="space-y-1.5 sm:space-y-2">
            <FormFieldWithTooltip label="REGISTRERINGSNUMMER" tooltip="Valgfritt. Norsk skiltnummer, f.eks. AB 12345" htmlFor="registration_number" error={errors.registration_number}>
              <Input
                id="registration_number"
                name="registration_number"
                value={formData.registration_number}
                onChange={handleChange}
                placeholder="F.eks. AB 12345"
                maxLength={10}
                className={`text-base h-12 border-2 uppercase ${errors.registration_number ? 'border-destructive' : 'border-muted'}`}
              />
            </FormFieldWithTooltip>
            <p className="text-xs text-muted-foreground">Valgfritt – brukes for å sjekke om bilen allerede finnes hos oss</p>
          </div>

          {/* Category */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="category" className="text-base sm:text-lg font-display">KATEGORI *</Label>
            <select id="category" name="category" value={formData.category} onChange={e => setFormData(prev => ({
              ...prev,
              category: e.target.value
            }))} className={`w-full h-12 px-3 text-base rounded-md border-2 bg-background ${errors.category ? 'border-destructive' : 'border-muted'}`} required>
              {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
            </select>
            {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
          </div>

          {/* Name */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="owner_name" className="text-base sm:text-lg font-display">DITT NAVN *</Label>
            <Input id="owner_name" name="owner_name" value={formData.owner_name} onChange={handleChange} placeholder="Ola Nordmann" className={`text-base h-12 border-2 ${errors.owner_name ? 'border-destructive' : 'border-muted'}`} required />
            {errors.owner_name && <p className="text-sm text-destructive">{errors.owner_name}</p>}
          </div>

          {/* Email and Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="email" className="text-base sm:text-lg font-display">E-POST *</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="ola@eksempel.no" className={`text-base h-12 border-2 ${errors.email ? 'border-destructive' : 'border-muted'}`} required />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="phone" className="text-base sm:text-lg font-display">TELEFON</Label>
              <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="123 45 678" className={`text-base h-12 border-2 ${errors.phone ? 'border-destructive' : 'border-muted'}`} />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="tags" className="text-base sm:text-lg font-display">STIKKORD</Label>
            <Input id="tags" name="tags" value={formData.tags} onChange={handleChange} placeholder="f.eks. original, veteran, rally" className={`text-base h-12 border-2 ${errors.tags ? 'border-destructive' : 'border-muted'}`} />
            {errors.tags && <p className="text-sm text-destructive">{errors.tags}</p>}
            <p className="text-xs sm:text-sm text-muted-foreground">Skill med komma</p>
          </div>

          {/* Story */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="car_story" className="text-base sm:text-lg font-display">HISTORIEN BAK BILEN</Label>
            <Textarea id="car_story" name="car_story" value={formData.car_story} onChange={handleChange} placeholder="Fortell oss om bilen din – hvordan du fant den, restaureringen, minner, planer..." className={`text-base min-h-[150px] sm:min-h-[180px] border-2 ${errors.car_story ? 'border-destructive' : 'border-muted'}`} />
            {errors.car_story && <p className="text-sm text-destructive">{errors.car_story}</p>}
            <p className="text-xs sm:text-sm text-muted-foreground">
              Jo mer du forteller, jo bedre kan vi presentere bilen din.
            </p>
          </div>

          {/* Image Upload */}
          <div className="space-y-3 sm:space-y-4">
            <Label className="text-base sm:text-lg font-display flex items-center gap-2">
              <Camera className="w-5 h-5" />
              BILDER AV BILEN
            </Label>
            
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />

            {/* Image previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-muted">
                    <img src={preview} alt={`Bilde ${index + 1}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1.5 sm:p-1 hover:bg-destructive/80 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            {images.length < 10 && (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-muted-foreground/30 rounded-xl p-6 sm:p-8 hover:border-accent hover:bg-accent/5 transition-all group active:scale-[0.98]">
                <div className="flex flex-col items-center gap-2 sm:gap-3 text-muted-foreground group-hover:text-accent">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-muted flex items-center justify-center group-hover:bg-accent/10">
                    <ImagePlus className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div className="text-center">
                    <p className="font-display text-base sm:text-lg">Velg bilder</p>
                    <p className="text-xs sm:text-sm">Maks 10 bilder, 10 MB per bilde. Bildene lastes opp når du trykker «Send inn».</p>
                  </div>
                </div>
              </button>
            )}

            <p className="text-xs sm:text-sm text-muted-foreground">
              {images.length}/10 bilder valgt
            </p>
          </div>

          {/* Progress bar during upload */}
          {isSubmitting && uploadProgress && <ImageUploadProgress progress={uploadProgress} compressionStats={compressionStats} />}

          {/* Consent radio buttons */}
          <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 bg-muted/30 rounded-lg border-2 border-muted">
            <p className="font-display text-base sm:text-lg mb-2 sm:mb-3">GODKJENNING FOR REDIGERING *</p>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              Vi kan rette små skrivefeil, tydeliggjøre detaljer og legge til teknisk info (f.eks. modellvariant, årsmodell og historikk). Innholdet endres ikke helt – vi bygger videre på det du har sendt inn.
            </p>
            
            <label className="flex items-start gap-3 cursor-pointer p-2 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <input type="radio" name="allowEdits" checked={allowEdits === true} onChange={() => setAllowEdits(true)} className="w-5 h-5 mt-0.5 accent-primary flex-shrink-0" />
              <span className="text-sm sm:text-base text-foreground font-medium">
                Ja, jeg godkjenner at Simca Norge kan redigere og forbedre innsendelsen min før publisering.
              </span>
            </label>
            
            <label className="flex items-start gap-3 cursor-pointer p-2 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <input type="radio" name="allowEdits" checked={allowEdits === false} onChange={() => setAllowEdits(false)} className="w-5 h-5 mt-0.5 accent-primary flex-shrink-0" />
              <span className="text-sm sm:text-base text-foreground font-medium">
                Nei, jeg ønsker at innsendelsen publiseres som den er.
              </span>
            </label>
          </div>

          {/* Club join request */}
          <div className="p-3 sm:p-4 bg-muted/30 rounded-lg border-2 border-muted">
            <p className="font-display text-base sm:text-lg mb-2 sm:mb-3 flex items-center gap-2">
              <Users className="w-5 h-5" />
              KNYTTE BILEN TIL EN KLUBB
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3">
              Ønsker du at bilen skal vises på en klubbside? Du kan sende en forespørsel her. Klubben/admin godkjenner koblingen.
            </p>
            <label className="flex items-start gap-3 cursor-pointer p-2 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                checked={clubLinkRequested}
                onChange={(e) => {
                  setClubLinkRequested(e.target.checked);
                  if (!e.target.checked) {
                    setClubPageId("");
                    setClubMessage("");
                  }
                  if (errors.club_page) setErrors(prev => ({ ...prev, club_page: "" }));
                }}
                className="w-5 h-5 mt-0.5 accent-primary flex-shrink-0"
              />
              <span className="text-sm sm:text-base text-foreground font-medium">
                Ja, jeg ønsker å knytte bilen til en klubb på Bilgarasjen
              </span>
            </label>

            {clubLinkRequested && (
              <div className="mt-3 space-y-3 pl-8">
                <div>
                  <Label className="text-sm font-medium">Velg klubb *</Label>
                  <select
                    value={clubPageId}
                    onChange={(e) => {
                      setClubPageId(e.target.value);
                      if (errors.club_page) setErrors(prev => ({ ...prev, club_page: "" }));
                    }}
                    className={`w-full h-12 px-3 text-base rounded-md border-2 bg-background mt-1 ${errors.club_page ? 'border-destructive' : 'border-muted'}`}
                  >
                    <option value="">Velg klubb...</option>
                    {clubs?.map(club => (
                      <option key={club.id} value={club.id}>{club.title}</option>
                    ))}
                  </select>
                  {errors.club_page && <p className="text-destructive text-xs mt-1">{errors.club_page}</p>}
                </div>
                <div>
                  <Label className="text-sm font-medium">Melding til klubb/admin (valgfritt)</Label>
                  <Textarea
                    value={clubMessage}
                    onChange={(e) => setClubMessage(e.target.value)}
                    placeholder="F.eks. «Jeg er medlem og vil gjerne ha bilen på klubbsiden»"
                    maxLength={2000}
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Instagram consent */}
          <div className="p-3 sm:p-4 bg-muted/30 rounded-lg border-2 border-muted">
            <p className="font-display text-base sm:text-lg mb-2 sm:mb-3">DELING PÅ INSTAGRAM</p>
            <label className="flex items-start gap-3 cursor-pointer p-2 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                checked={allowInstagram}
                onChange={(e) => setAllowInstagram(e.target.checked)}
                className="w-5 h-5 mt-0.5 accent-primary flex-shrink-0"
              />
              <span className="text-sm sm:text-base text-foreground font-medium">
                Jeg godkjenner at bilder og beskrivelse av bilen min deles på Simca Norge sin{" "}
                <a
                  href="https://www.instagram.com/simcanorge/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-accent"
                >
                  Instagram
                </a>
                .
              </span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {showCancelButton && onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto text-lg h-12 sm:h-14">
                Avbryt
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting || allowEdits === null} className="w-full btn-enamel-blue text-lg sm:text-xl h-12 sm:h-14 disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? "Sender..." : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send inn
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Inner red footer */}
      <div className="bg-gradient-to-r from-[#C10D0D] to-[#D41515] p-4">
        <p className="text-center text-white/80 text-sm font-serif italic">
          Alle innsendinger blir gjennomgått av Simca Norge
        </p>
      </div>
    </div>
  );
}
