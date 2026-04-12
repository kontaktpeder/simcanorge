import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShoppingBag, Save, Loader2, Clock, ChevronLeft, ImagePlus, X, Lock, Wrench, Package, Car, Warehouse, ChevronRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Label } from '@/components/ui/label';
import { useOwnerProfile, useLegacyOwnerId } from '@/hooks/useOwnerProfile';
import { useInsertMarketplaceImages } from '@/hooks/useMarketplace';
import { compressImages, generateImageId, getMarketplaceImagePath, type CompressionProgress } from '@/lib/imageCompression';
import { ImageUploadProgress } from '@/components/ui/image-upload-progress';
import { supabase } from '@/integrations/supabase/client';
import { DelerAnnonseForm } from '@/components/markedsplass/DelerAnnonseForm';
import { useUnifiedCategories, getRootCategories } from '@/hooks/useUnifiedCategories';
import { submitAsListing } from '@/lib/itemSubmit';
import type { ItemFormValues } from '@/lib/itemSubmit';
import { LISTING_TYPES, type ListingTypeId } from '@/config/listingTypes';

const TYPE_ICONS: Record<ListingTypeId, React.ReactNode> = {
  deler: <Wrench className="w-8 h-8" />,
  samleobjekter: <Package className="w-8 h-8" />,
  biler: <Car className="w-8 h-8" />,
  lagerplass: <Warehouse className="w-8 h-8" />,
};

export default function OpprettAnnonse() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { data: ownerProfile, isLoading: profileLoading } = useOwnerProfile(user?.id);
  const { data: legacyOwnerId } = useLegacyOwnerId(user?.id);
  const insertImages = useInsertMarketplaceImages();
  const { data: allCategories = [] } = useUnifiedCategories();

  const [selectedType, setSelectedType] = useState<ListingTypeId | null>(
    (searchParams.get('type') as ListingTypeId) || null
  );
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<CompressionProgress | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const opprettAnnonsePath = `/dashboard/opprett-annonse${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/login?returnUrl=${encodeURIComponent(opprettAnnonsePath)}`);
    }
  }, [user, authLoading, navigate, opprettAnnonsePath]);

  if (authLoading || profileLoading) {
    return (
      <Layout>
        <div className="container py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  const opprettAnnonsePath = `/dashboard/opprett-annonse${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const komIGangHref = `/kom-i-gang?returnUrl=${encodeURIComponent(opprettAnnonsePath)}`;

  if (!ownerProfile) {
    return (
      <Layout>
        <section className="relative overflow-hidden" style={{ background: 'hsl(42, 30%, 95%)' }}>
          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'hsl(2, 85%, 40%)' }} />
          <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
            <div className="max-w-lg mx-auto text-center">
              <p className="font-display text-[10px] uppercase tracking-[0.4em] text-foreground/40 mb-4">
                Simca · Talbot · Matra
              </p>
              <Clock className="h-16 w-16 text-foreground/20 mx-auto mb-6" />
              <h2 className="font-display text-3xl md:text-4xl uppercase tracking-wider leading-none mb-4 text-foreground">
                Entusiastprofil påkrevd
              </h2>
              <div className="w-16 h-[2px] mx-auto mb-6" style={{ background: 'hsl(2, 85%, 40%)' }} />
              <p className="font-serif italic text-base text-foreground/60 mb-8">
                Opprett en Entusiastprofil først for å legge ut annonser på markedsplassen.
              </p>
              <Link
                to={komIGangHref}
                className="group inline-flex items-center gap-3 px-10 py-4 font-display text-sm uppercase tracking-[0.2em] text-white border-2 border-white/30 hover:border-white transition-all"
                style={{ background: 'hsl(2, 85%, 40%)' }}
              >
                Opprett profil og fortsett
                <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="mt-4">
                <Link
                  to="/dashboard"
                  className="font-display text-xs uppercase tracking-[0.2em] text-foreground/40 hover:text-foreground/70 transition-colors"
                >
                  Til Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (!ownerProfile.contact_email) {
    return (
      <Layout>
        <section className="relative overflow-hidden" style={{ background: 'hsl(42, 30%, 95%)' }}>
          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'hsl(2, 85%, 40%)' }} />
          <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
            <div className="max-w-md mx-auto text-center">
              <h2 className="font-display text-2xl md:text-3xl uppercase tracking-wider leading-none mb-4 text-foreground">
                Legg til kontakt-e-post
              </h2>
              <div className="w-16 h-[2px] mx-auto mb-4" style={{ background: 'hsl(2, 85%, 40%)' }} />
              <p className="font-serif italic text-sm text-foreground/60 mb-8">
                Kjøpere trenger en måte å nå deg. E-posten lagres på profilen din og gjenbrukes automatisk.
              </p>
              <ContactEmailGate
                ownerProfileId={ownerProfile.id}
                loginEmail={user?.email ?? null}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ["owner-profile", user?.id] })}
              />
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    setImages((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => setImagePreviews((p) => [...p, reader.result as string]);
      reader.readAsDataURL(f);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (itemId: string): Promise<{ image_url: string; sort_order: number }[]> => {
    if (images.length === 0) return [];
    const compressed = await compressImages(images, (p) => setUploadProgress(p));
    const uploaded: { image_url: string; sort_order: number }[] = [];
    for (let i = 0; i < compressed.length; i++) {
      const { file } = compressed[i];
      const imageId = generateImageId();
      const filePath = getMarketplaceImagePath(itemId, imageId);
      setUploadProgress({
        stage: 'uploading',
        current: i + 1,
        total: compressed.length,
        percentage: Math.round(((i + 1) / compressed.length) * 100),
      });
      const { error } = await supabase.storage.from('simca-images').upload(filePath, file, { contentType: 'image/webp' });
      if (error) { console.error('Upload error:', error); continue; }
      const { data } = supabase.storage.from('simca-images').getPublicUrl(filePath);
      uploaded.push({ image_url: data.publicUrl, sort_order: i });
    }
    return uploaded;
  };

  const handleSubmit = async (values: ItemFormValues) => {
    if (!ownerProfile || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const data = await submitAsListing(values, {
        ownerId: legacyOwnerId || ownerProfile.id,
        personProfileId: ownerProfile.id,
        profileLocation: ownerProfile?.location ?? null,
      });
      if (images.length > 0 && data?.id) {
        const uploaded = await uploadImages(data.id);
        if (uploaded.length > 0) {
          await insertImages.mutateAsync({ itemId: data.id, images: uploaded });
        }
      }
      toast.success('Annonsen er sendt inn', {
        description: 'Du kan se og redigere den under. Den vises på markedsplassen når admin har godkjent den.',
      });
      await queryClient.refetchQueries({ queryKey: ['my-listings', user?.id] });
      navigate('/dashboard/mine-annonser', { state: { justSubmitted: true } });
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('Kunne ikke sende inn annonsen');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  const roots = getRootCategories(allCategories);
  const selectedTypeConfig = selectedType ? LISTING_TYPES.find((t) => t.id === selectedType) : null;
  const selectedRoot = selectedTypeConfig
    ? roots.find((r) => r.slug === selectedTypeConfig.slug)
    : null;

  return (
    <Layout>
      {/* Editorial hero header */}
      <section className="relative overflow-hidden" style={{ background: 'hsl(42, 30%, 95%)' }}>
        {/* Red accent rule */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'hsl(2, 85%, 40%)' }} />

        {/* Newsprint texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, currentColor 1px, currentColor 2px)`,
            backgroundSize: '100% 4px',
          }}
        />

        <div className="container mx-auto px-4 py-10 md:py-16 relative z-10">
          <div className="max-w-3xl mx-auto">
            {/* Back link */}
            <Link
              to="/dashboard/mine-annonser"
              className="inline-flex items-center gap-1.5 font-display text-[10px] uppercase tracking-[0.3em] text-foreground/40 hover:text-foreground/70 transition-colors mb-8"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Tilbake til dine annonser
            </Link>

            <p className="font-display text-[10px] md:text-xs uppercase tracking-[0.4em] text-foreground/40 mb-3">
              Simca · Talbot · Matra
            </p>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl uppercase tracking-wider leading-[0.9] text-foreground mb-4">
              Opprett annonse
            </h1>
            <div className="w-16 h-[2px] mb-4" style={{ background: 'hsl(2, 85%, 40%)' }} />
            {!selectedType && (
              <p className="font-serif italic text-base md:text-lg text-foreground/60 max-w-md">
                Velg hva du ønsker å legge ut på markedsplassen.
              </p>
            )}
            {selectedType && selectedTypeConfig && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedType(null)}
                  className="font-display text-[10px] uppercase tracking-[0.3em] text-foreground/40 hover:text-foreground/70 transition-colors inline-flex items-center gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Bytt type
                </button>
                <span className="text-foreground/20">·</span>
                <span className="font-display text-sm uppercase tracking-[0.2em]" style={{ color: 'hsl(2, 85%, 40%)' }}>
                  {selectedTypeConfig.label}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom rule */}
        <div className="h-px bg-foreground/10" />
      </section>

      {/* Main content */}
      <section className="relative" style={{ background: 'hsl(42, 30%, 95%)' }}>
        {/* Newsprint texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, currentColor 1px, currentColor 2px)`,
            backgroundSize: '100% 4px',
          }}
        />

        <div className="container mx-auto px-4 py-10 md:py-14 relative z-10">
          <div className="max-w-3xl mx-auto">

            {/* Step 1: Choose type */}
            {!selectedType && (
              <>
                {/* Section header */}
                <div className="text-center mb-10">
                  <p className="font-display text-xs md:text-sm uppercase tracking-[0.4em] text-foreground/40 mb-2">
                    Simca · Talbot · Matra
                  </p>
                  <h2 className="font-display text-3xl md:text-5xl uppercase tracking-wider">
                    Velg type
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-8 max-w-3xl mx-auto">
                  {LISTING_TYPES.map((type, index) => {
                    const isLocked = type.locked;
                    return isLocked ? (
                      <div
                        key={type.id}
                        className="relative p-8 md:p-10 border-2 border-foreground/10 opacity-50 cursor-not-allowed"
                        style={{ background: 'rgba(255,255,255,0.7)' }}
                      >
                        <Lock className="absolute top-4 right-4 w-4 h-4 text-muted-foreground" />
                        <div className="text-foreground/30 mb-4">
                          {TYPE_ICONS[type.id]}
                        </div>
                        <h3 className="font-display text-2xl md:text-3xl uppercase tracking-wider text-foreground/40">
                          {type.label}
                        </h3>
                        {type.lockedMessage && (
                          <p className="font-serif italic text-sm md:text-base text-foreground/30 mt-3">
                            {type.lockedMessage}
                          </p>
                        )}
                      </div>
                    ) : (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setSelectedType(type.id)}
                        className="group relative block text-left p-8 md:p-10 border-2 border-foreground/15 hover:border-foreground/40 transition-all"
                        style={{ background: 'rgba(255,255,255,0.85)' }}
                      >
                        <div
                          className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: 'hsl(2, 85%, 40%)' }}
                        />
                        <div className="text-foreground/60 group-hover:text-foreground transition-colors mb-4">
                          {TYPE_ICONS[type.id]}
                        </div>
                        <h3 className="font-display text-2xl md:text-3xl uppercase tracking-wider group-hover:text-primary transition-colors">
                          {type.label}
                        </h3>
                        {type.description && (
                          <p className="font-serif italic text-sm md:text-base text-foreground/40 mt-3">
                            {type.description}
                          </p>
                        )}
                        <ChevronRight className="absolute top-1/2 right-6 -translate-y-1/2 w-5 h-5 text-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </button>
                    );
                  })}
                </div>

                {/* Editorial footer note */}
                <div className="mt-10 text-center">
                  <div className="h-px bg-foreground/10 mb-6" />
                  <p className="font-serif italic text-xs text-foreground/30">
                    Alt som legges ut må godkjennes av redaksjonen før publisering.
                  </p>
                </div>
              </>
            )}

            {/* Step 2: Form */}
            {selectedType && selectedTypeConfig && !selectedTypeConfig.locked && (
              <>
                {/* Section divider */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-px flex-1 bg-foreground/10" />
                  <span className="font-display text-xs uppercase tracking-[0.4em] text-foreground/30">Ny annonse</span>
                  <div className="h-px flex-1 bg-foreground/10" />
                </div>

                {/* Form card */}
                <div className="border-2 border-foreground/10" style={{ background: 'rgba(255,255,255,0.75)' }}>
                  {/* Card header accent */}
                  <div className="h-1" style={{ background: 'hsl(2, 85%, 40%)' }} />

                  {/* Form header inside card */}
                  <div className="px-5 sm:px-8 md:px-10 pt-6 md:pt-8 pb-2">
                    <p className="font-display text-[10px] md:text-xs uppercase tracking-[0.4em] text-foreground/30 mb-1">
                      {selectedTypeConfig.label}
                    </p>
                    <h3 className="font-display text-2xl md:text-3xl uppercase tracking-wider">
                      Ny annonse
                    </h3>
                    <div className="h-px bg-foreground/10 mt-4" />
                  </div>

                  <div className="p-5 sm:p-8 md:p-10 pt-4 sm:pt-6">
                    <DelerAnnonseForm
                      initialValues={{
                        rootCategoryId: selectedRoot?.id ?? '',
                      }}
                      forceRootId={selectedRoot?.id}
                      carModelRequired={selectedTypeConfig.carModelRequired}
                      onSubmit={handleSubmit}
                      submitLabel="Send inn annonse"
                      isSubmitting={isSubmitting}
                      profileLocation={ownerProfile?.location ?? null}
                    >
                      {/* Images */}
                      <div className="space-y-2">
                        <Label className="font-display text-xs md:text-sm uppercase tracking-[0.15em] text-foreground/70">Bilder (valgfritt)</Label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <div className="flex flex-wrap gap-3 mt-1.5">
                          {imagePreviews.map((src, i) => (
                            <div key={i} className="relative w-24 h-24">
                              <img src={src} alt={`Bilde ${i + 1}`} className="w-full h-full object-cover border-2 border-foreground/10" />
                              <button
                                type="button"
                                onClick={() => removeImage(i)}
                                className="absolute top-1 right-1 p-0.5 bg-black/50 rounded-full text-white hover:bg-black/70"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-24 h-24 border-2 border-dashed border-foreground/15 flex items-center justify-center hover:border-foreground/30 transition-colors"
                          >
                            <ImagePlus className="w-7 h-7 text-foreground/30" />
                          </button>
                        </div>
                      </div>

                      {uploadProgress && <ImageUploadProgress progress={uploadProgress} />}

                      <div className="flex items-start gap-3 p-4 border-2 border-foreground/8 bg-foreground/[0.02] text-base text-foreground/50">
                        <Clock className="h-5 w-5 mt-0.5 shrink-0" />
                        <p className="font-serif italic">Alt som legges ut må godkjennes før publisering.</p>
                      </div>
                    </DelerAnnonseForm>
                  </div>
                </div>

                {/* Editorial footer */}
                <div className="mt-10 text-center">
                  <div className="h-px bg-foreground/10 mb-6" />
                  <p className="font-display text-[10px] md:text-xs uppercase tracking-[0.4em] text-foreground/25">
                    Markedsplass · Simca Norge
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}

function ContactEmailGate({ ownerProfileId, loginEmail, onSuccess }: { ownerProfileId: string; loginEmail: string | null; onSuccess: () => void }) {
  const [email, setEmail] = useState(() => loginEmail?.trim() ?? "");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setSaving(true);
    const { error } = await supabase
      .from("person_profiles")
      .update({ contact_email: email, contact_phone: phone || null } as any)
      .eq("id", ownerProfileId);
    setSaving(false);
    if (error) {
      toast.error("Kunne ikke lagre kontaktinfo");
      return;
    }
    toast.success("Kontaktinfo lagret");
    onSuccess();
  };

  return (
    <form onSubmit={handleSave} className="space-y-4 text-left max-w-sm mx-auto">
      {loginEmail && email !== loginEmail && (
        <button
          type="button"
          onClick={() => setEmail(loginEmail)}
          className="w-full text-sm text-primary hover:text-primary/80 underline underline-offset-2 transition-colors text-center"
        >
          Bruk min innloggings-e-post ({loginEmail})
        </button>
      )}
      <div className="space-y-1">
        <label className="text-sm font-medium">E-post *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="din@epost.no"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Telefon (valgfritt)</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+47 000 00 000"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      <button
        type="submit"
        disabled={saving || !email.includes("@")}
        className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? "Lagrer..." : "Lagre og fortsett"}
      </button>
    </form>
  );
}
