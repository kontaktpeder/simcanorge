import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Car, Upload, CheckCircle2, AlertCircle, Users, ChevronRight, ChevronLeft, ArrowLeft, Camera, ImagePlus, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CAR_BRANDS, getModelsForBrand, getVariantsForModel } from '@/data/carBrands';
import { CAR_BODY_TYPES } from '@/data/carBodyTypes';
import { compressImages, generateImageId, getCarImagePath } from '@/lib/imageCompression';
import { motion } from 'framer-motion';

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;
const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

const CATEGORIES = [
  { value: 'registrert', label: 'Registrert' },
  { value: 'restaurering', label: 'Restaureringsprosjekt' },
  { value: 'historisk', label: 'Historisk' },
  { value: 'vrak', label: 'Vrak' },
];

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

type Step = 'info' | 'images' | 'done';

/* ── Step indicator ── */
function StepIndicator({ current }: { current: Step }) {
  const steps: { key: Step; label: string; number: number }[] = [
    { key: 'info', label: 'Informasjon', number: 1 },
    { key: 'images', label: 'Bilder', number: 2 },
    { key: 'done', label: 'Publisert', number: 3 },
  ];
  const currentIdx = steps.findIndex(s => s.key === current);
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8">
      {steps.map((s, i) => {
        const isActive = i === currentIdx;
        const isDone = i < currentIdx;
        return (
          <div key={s.key} className="flex items-center gap-2 sm:gap-3">
            {i > 0 && (
              <div
                className="w-8 sm:w-12 h-px"
                style={{ background: isDone ? '#c4962c' : '#d5cec3' }}
              />
            )}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all"
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, #d4a017, #c4962c)'
                    : isDone
                      ? '#c4962c'
                      : '#e8e0d4',
                  color: isActive || isDone ? '#0f0d0b' : '#8b7d6b',
                }}
              >
                {isDone ? '✓' : s.number}
              </div>
              <span
                className="hidden sm:block text-[11px] tracking-[0.1em] uppercase font-semibold"
                style={{
                  ...oswald,
                  color: isActive ? '#3a2e24' : isDone ? '#c4962c' : '#8b7d6b',
                }}
              >
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Styled field label ── */
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label
      className="block text-[11px] tracking-[0.15em] uppercase font-bold mb-1.5"
      style={{ ...oswald, color: '#6b5d4f' }}
    >
      {children}
      {required && <span className="text-[#c4962c] ml-0.5">*</span>}
    </label>
  );
}

/* ── Styled select ── */
function StyledSelect({
  value,
  onChange,
  children,
  disabled,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full h-11 px-3 text-sm rounded-sm border bg-[#faf6f0] disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#c4962c]/30"
      style={{ borderColor: '#d5cec3', color: '#3a2e24' }}
    >
      {children}
    </select>
  );
}

export default function DashboardOpprettBil() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [createdCarId, setCreatedCarId] = useState<string | null>(null);
  const [isReorderingImages, setIsReorderingImages] = useState(false);

  // Form
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [variant, setVariant] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [year, setYear] = useState('');
  const [category, setCategory] = useState('registrert');
  const [story, setStory] = useState('');

  // Consent
  const [allowEdits, setAllowEdits] = useState<boolean | null>(null);
  const [allowInstagram, setAllowInstagram] = useState(false);
  const [clubLinkRequested, setClubLinkRequested] = useState(false);
  const [clubPageId, setClubPageId] = useState('');
  const [clubMessage, setClubMessage] = useState('');

  const { data: clubs } = useQuery({
    queryKey: ['public-clubs-for-opprett'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pages')
        .select('id, title, slug')
        .eq('page_type', 'club')
        .eq('is_public', true)
        .eq('status', 'active')
        .order('title');
      if (error) throw error;
      return data ?? [];
    },
  });

  const selectedClub = clubs?.find(c => c.id === clubPageId) ?? null;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?returnUrl=/dashboard/opprett-bil');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center" style={{ background: '#f0ebe3' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#c4962c' }} />
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  const availableModels = brand ? getModelsForBrand(brand) : [];
  const availableVariants = brand && model ? getVariantsForModel(brand, model) : [];
  const generatedTitle = [brand, model, variant].filter(Boolean).join(' ');

  const handleCreateCar = async () => {
    if (!brand || !model) { toast.error('Merke og modell er påkrevd'); return; }
    if (allowEdits === null) { toast.error('Du må velge om du godkjenner redigering'); return; }
    if (clubLinkRequested && !clubPageId) { toast.error('Velg ønsket klubb'); return; }

    setIsSaving(true);
    try {
      const title = generatedTitle;
      const baseSlug = generateSlug(title);
      const slug = `${baseSlug}-${Date.now().toString(36)}`;
      const userEmail = user.email || '';

      const submissionPayload = {
        submitted_at: new Date().toISOString(),
        allow_edits: allowEdits === true,
        allow_instagram: allowInstagram,
        club_join_request: clubLinkRequested && selectedClub
          ? { requested: true, page_id: selectedClub.id, page_title: selectedClub.title, page_slug: selectedClub.slug, message: clubMessage.trim() || null }
          : { requested: false, page_id: null, page_title: null, page_slug: null, message: null },
      };

      const { data: car, error: carError } = await supabase
        .from('cars')
        .insert({
          title, slug, brand, model,
          variant: variant || null,
          body_type: bodyType || null,
          year: year ? parseInt(year) : null,
          category, story: story || null,
          source: 'owner_self' as any,
          status: 'draft' as any,
          created_by_user_id: user.id,
          allow_edits: allowEdits === true,
          submission_payload: submissionPayload,
        })
        .select('id')
        .single();

      if (carError) { console.error('Car create error:', carError); toast.error('Kunne ikke opprette bil: ' + (carError.message || 'Ukjent feil')); return; }

      const { error: ownerError } = await supabase.from('car_owners').insert({ car_id: car.id, user_id: user.id, email: userEmail, role: 'owner' });
      if (ownerError) { console.error('Owner claim error:', ownerError); toast.error('Bil opprettet, men kunne ikke knytte deg som eier. Kontakt admin.'); }

      if (clubLinkRequested && selectedClub) {
        try {
          const { data: rpcResult } = await supabase.rpc('create_page_car_link_request', { p_car_id: car.id, p_page_id: selectedClub.id, p_message: clubMessage.trim() || null });
          const rpcData = rpcResult as { success?: boolean } | null;
          if (rpcData && !rpcData.success) console.warn('Club link RPC:', rpcData);
        } catch (rpcErr) { console.error('Club link failed:', rpcErr); }
      }

      setCreatedCarId(car.id);
      setStep('images');
      toast.success('Bil opprettet! Last opp bilder nå.');
    } catch (err: any) { console.error('Unexpected:', err); toast.error('Uventet feil'); }
    finally { setIsSaving(false); }
  };

  // Live query for car images
  const { data: carImages = [] } = useQuery({
    queryKey: ['opprett-car-images', createdCarId],
    queryFn: async () => {
      if (!createdCarId) return [];
      const { data, error } = await supabase
        .from('car_images')
        .select('id, image_url, alt_text, sort_order')
        .eq('car_id', createdCarId)
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!createdCarId,
  });

  const sortedImages = [...carImages].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !createdCarId) return;
    setIsUploading(true);
    try {
      const results = await compressImages(Array.from(files));
      let successCount = 0;
      const currentCount = sortedImages.length;
      for (const result of results) {
        const imageId = generateImageId();
        const filePath = getCarImagePath(createdCarId, imageId);
        const { error: uploadError } = await supabase.storage.from('simca-images').upload(filePath, result.file, { contentType: 'image/webp' });
        if (uploadError) { console.error('Upload error:', uploadError); continue; }
        const { data: urlData } = supabase.storage.from('simca-images').getPublicUrl(filePath);
        const { error: dbError } = await supabase.from('car_images').insert({ car_id: createdCarId, image_url: urlData.publicUrl, sort_order: currentCount + successCount });
        if (dbError) { console.error('DB error:', dbError); } else { successCount++; }
      }
      queryClient.invalidateQueries({ queryKey: ['opprett-car-images', createdCarId] });
      toast.success(`${successCount} bilde(r) lastet opp`);
    } catch (err) { console.error('Upload error:', err); toast.error('Feil ved bildeopplasting'); }
    finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const deleteImage = async (imageId: string) => {
    const { error } = await supabase.from('car_images').delete().eq('id', imageId);
    if (error) { console.error('Delete error:', error); toast.error('Kunne ikke slette bilde'); }
    else { toast.success('Bilde slettet'); queryClient.invalidateQueries({ queryKey: ['opprett-car-images', createdCarId] }); }
  };

  const persistImageOrder = async (images: typeof sortedImages) => {
    setIsReorderingImages(true);
    try {
      for (let i = 0; i < images.length; i++) {
        await supabase.from('car_images').update({ sort_order: i }).eq('id', images[i].id);
      }
      queryClient.invalidateQueries({ queryKey: ['opprett-car-images', createdCarId] });
    } catch { toast.error('Kunne ikke endre rekkefølge'); }
    finally { setIsReorderingImages(false); }
  };

  const moveImageLeft = (index: number) => {
    if (index <= 0) return;
    const next = [...sortedImages];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    persistImageOrder(next);
  };

  const moveImageRight = (index: number) => {
    if (index >= sortedImages.length - 1) return;
    const next = [...sortedImages];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    persistImageOrder(next);
  };

  const setMainImage = (index: number) => {
    if (index <= 0) return;
    const next = [...sortedImages];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    persistImageOrder(next);
  };

  const handlePublish = async () => {
    if (!createdCarId) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('cars').update({ published_at: new Date().toISOString(), status: 'published' as any }).eq('id', createdCarId);
      if (error) {
        console.error('Publish error:', error);
        if (error.message?.includes('Merke')) toast.error('Merke må være satt før publisering');
        else if (error.message?.includes('Modell')) toast.error('Modell må være satt før publisering');
        else if (error.message?.includes('bilde')) toast.error('Minst ett bilde kreves for publisering');
        else toast.error('Kunne ikke publisere: ' + error.message);
        return;
      }
      setStep('done');
      toast.success('Bilen er publisert!');
    } catch { toast.error('Uventet feil ved publisering'); }
    finally { setIsSaving(false); }
  };

  return (
    <Layout>
      <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #f0ebe3 0%, #e8e0d4 40%, #dfd5c7 100%)' }}>
        <div className="container max-w-2xl mx-auto px-4 py-8 sm:py-12">

          {/* Back link */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            <Link
              to="/dashboard/mine-biler"
              className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase font-semibold mb-6 hover:opacity-70 transition-opacity"
              style={{ ...oswald, color: '#8b7d6b' }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Tilbake til bilgarasjen
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-2"
          >
            <div className="inline-flex items-center gap-2 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #d4a017, #c4962c)' }}
              >
                <Car className="w-5 h-5 text-[#0f0d0b]" />
              </div>
            </div>
            <h1
              className="text-2xl sm:text-3xl font-bold italic uppercase tracking-wide"
              style={{ ...chakra, color: '#3a2e24' }}
            >
              Opprett ny bil
            </h1>
            <p className="text-[13px] mt-1.5" style={{ color: '#8b7d6b' }}>
              Del historien bak bilen din med Bilgarasjen
            </p>
          </motion.div>

          {/* Step indicator */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <StepIndicator current={step} />
          </motion.div>

          {/* ═══ STEP: DONE ═══ */}
          {step === 'done' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div
                className="rounded-sm overflow-hidden border"
                style={{ borderColor: '#c4962c33', background: '#faf6f0' }}
              >
                <div className="text-center py-14 px-6">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                    style={{ background: 'linear-gradient(135deg, #d4a017, #e8c547, #c4962c)' }}
                  >
                    <CheckCircle2 className="w-10 h-10 text-[#0f0d0b]" />
                  </div>
                  <h2
                    className="text-xl sm:text-2xl font-bold italic uppercase tracking-wide mb-2"
                    style={{ ...chakra, color: '#3a2e24' }}
                  >
                    Bilen er publisert!
                  </h2>
                  <p className="text-sm mb-8" style={{ color: '#8b7d6b' }}>
                    Bilen er nå synlig på nettsiden. Du kan redigere detaljer og bilder når som helst.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => navigate(`/dashboard/bil/${createdCarId}`)}
                      className="px-6 py-3 text-[12px] tracking-[0.12em] uppercase font-bold rounded-sm transition-all hover:brightness-110"
                      style={{ ...oswald, background: 'linear-gradient(135deg, #d4a017, #e8c547, #c4962c)', color: '#0f0d0b' }}
                    >
                      Gå til bilen
                    </button>
                    <button
                      onClick={() => navigate('/dashboard/mine-biler')}
                      className="px-6 py-3 text-[12px] tracking-[0.12em] uppercase font-bold rounded-sm border transition-all hover:bg-[#f0ebe3]"
                      style={{ ...oswald, borderColor: '#c4962c55', color: '#3a2e24' }}
                    >
                      Til bilgarasjen
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP: IMAGES ═══ */}
          {step === 'images' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-5"
            >
              {/* Title preview */}
              {generatedTitle && (
                <div className="text-center mb-2">
                  <p className="text-[10px] tracking-[0.2em] uppercase font-bold" style={{ ...oswald, color: '#c4962c' }}>
                    Bil opprettet
                  </p>
                  <p className="text-lg font-bold italic" style={{ ...chakra, color: '#3a2e24' }}>
                    {generatedTitle}
                  </p>
                </div>
              )}

              <div
                className="rounded-sm overflow-hidden border"
                style={{ borderColor: '#c4962c33', background: '#faf6f0' }}
              >
                {/* Header */}
                <div
                  className="px-5 py-3 border-b flex items-center gap-2"
                  style={{ borderColor: '#e8e0d4', background: '#f5efe6' }}
                >
                  <Camera className="w-4 h-4" style={{ color: '#c4962c' }} />
                  <span className="text-[11px] tracking-[0.15em] uppercase font-bold" style={{ ...oswald, color: '#3a2e24' }}>
                    Bilder
                  </span>
                  {sortedImages.length > 0 && (
                    <span className="ml-auto text-[11px] tracking-[0.1em] uppercase font-semibold" style={{ ...oswald, color: '#c4962c' }}>
                      {sortedImages.length} bilde{sortedImages.length !== 1 ? 'r' : ''}
                    </span>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="ml-2 px-3 py-1.5 text-[10px] tracking-[0.12em] uppercase font-bold rounded-sm border transition-all hover:bg-[#f0ebe3]"
                    style={{ ...oswald, borderColor: '#c4962c55', color: '#3a2e24' }}
                  >
                    {isUploading ? (
                      <span className="flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Laster opp...</span>
                    ) : (
                      <span className="flex items-center gap-1.5"><Upload className="w-3 h-3" /> Last opp</span>
                    )}
                  </button>
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />

                {/* Image gallery — matches DashboardBilDetalj */}
                {sortedImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 p-3 sm:p-5">
                    {sortedImages.map((img, index) => (
                      <div key={img.id} className="relative group aspect-video rounded-sm overflow-hidden" style={{ background: '#e8e0d4' }}>
                        <img
                          src={img.image_url}
                          alt={img.alt_text || generatedTitle}
                          className="w-full h-full object-cover"
                        />
                        {index === 0 && (
                          <span
                            className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 text-[10px] tracking-[0.1em] uppercase font-bold px-2 py-1 rounded-sm inline-flex items-center gap-1"
                            style={{ ...oswald, background: 'linear-gradient(135deg, #d4a017, #c4962c)', color: '#0f0d0b' }}
                          >
                            <Star className="w-3 h-3 fill-current" />
                            <span className="hidden sm:inline">Hovedbilde</span>
                          </span>
                        )}

                        {/* Reorder + main controls */}
                        <div className="absolute inset-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 via-transparent to-transparent sm:bg-black/40 flex items-end sm:items-center justify-center gap-1 sm:gap-2 p-2 sm:p-0">
                          {index > 0 && (
                            <button
                              onClick={() => moveImageLeft(index)}
                              disabled={isReorderingImages}
                              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-90"
                            >
                              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          )}
                          {index !== 0 && (
                            <button
                              onClick={() => setMainImage(index)}
                              disabled={isReorderingImages}
                              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-90"
                              title="Sett som hovedbilde"
                            >
                              <Star className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          )}
                          {index < sortedImages.length - 1 && (
                            <button
                              onClick={() => moveImageRight(index)}
                              disabled={isReorderingImages}
                              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-90"
                            >
                              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => deleteImage(img.id)}
                          className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-red-600 text-white p-1.5 rounded-full sm:opacity-0 sm:group-hover:opacity-100 transition-opacity min-h-[28px] min-w-[28px] flex items-center justify-center active:scale-90"
                          aria-label="Slett bilde"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 sm:p-6">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full py-10 rounded-sm border-2 border-dashed transition-all group hover:border-[#c4962c]/50 hover:bg-[#f5efe6] active:scale-[0.99]"
                      style={{ borderColor: '#d5cec3' }}
                    >
                      {isUploading ? (
                        <span className="flex items-center justify-center gap-2 text-sm" style={{ color: '#8b7d6b' }}>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Laster opp...
                        </span>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform" style={{ background: '#e8e0d4' }}>
                            <ImagePlus className="w-6 h-6" style={{ color: '#8b7d6b' }} />
                          </div>
                          <span className="text-sm font-medium" style={{ color: '#6b5d4f' }}>Klikk for å velge bilder</span>
                          <span className="text-xs" style={{ color: '#a89b8c' }}>JPG, PNG eller WebP — maks 10 bilder</span>
                        </div>
                      )}
                    </button>

                    <div className="flex items-start gap-2 mt-4 p-3 rounded-sm border" style={{ background: '#fef9ee', borderColor: '#e8d8a8' }}>
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#c4962c' }} />
                      <p className="text-sm" style={{ color: '#6b5d4f' }}>Minst ett bilde kreves for å publisere bilen.</p>
                    </div>
                  </div>
                )}

                {sortedImages.length > 0 && (
                  <div className="px-5 pb-1 pt-0">
                    <p className="text-[11px] mb-3" style={{ color: '#8b7d6b' }}>
                      Første bilde brukes som hovedbilde. Bruk pilene for å endre rekkefølge.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handlePublish}
                  disabled={sortedImages.length === 0 || isSaving}
                  className="flex-1 px-6 py-3.5 text-[12px] tracking-[0.12em] uppercase font-bold rounded-sm transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ ...oswald, background: 'linear-gradient(135deg, #d4a017, #e8c547, #c4962c)', color: '#0f0d0b' }}
                >
                  {isSaving ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Publiserer...
                    </span>
                  ) : 'Publiser bilen'}
                </button>
                <button
                  onClick={() => { toast.success('Bilen er lagret som kladd.'); navigate('/dashboard/mine-biler'); }}
                  className="flex-1 px-6 py-3.5 text-[12px] tracking-[0.12em] uppercase font-bold rounded-sm border transition-all hover:bg-[#f0ebe3]"
                  style={{ ...oswald, borderColor: '#c4962c55', color: '#3a2e24' }}
                >
                  Lagre som kladd
                </button>
              </div>
            </motion.div>
          )}

          {/* ═══ STEP: INFO ═══ */}
          {step === 'info' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Chrome border card — matching SendInnBilForm */}
              <div
                className="border-4 border-transparent bg-clip-padding rounded-sm overflow-hidden shadow-xl"
                style={{
                  background: 'linear-gradient(#faf6f0, #faf6f0) padding-box, linear-gradient(180deg, #e8e0d4 0%, #c4962c 20%, #f5efe6 40%, #8b7d6b 60%, #e8e0d4 80%, #c4962c 100%) border-box',
                }}
              >
                {/* Gold header bar */}
                <div
                  className="px-5 sm:px-6 py-4"
                  style={{ background: 'linear-gradient(135deg, #3a2e24 0%, #2a1f16 100%)' }}
                >
                  <div className="flex items-center gap-3">
                    <Car className="w-6 h-6" style={{ color: '#c4962c' }} />
                    <div>
                      <h2
                        className="text-lg sm:text-xl font-bold italic uppercase tracking-wide"
                        style={{ ...chakra, color: '#f0ebe3' }}
                      >
                        Bilinformasjon
                      </h2>
                      <p className="text-[11px]" style={{ color: '#8b7d6b' }}>
                        Fyll inn detaljer om bilen din
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form body */}
                <div className="p-5 sm:p-6 md:p-8 space-y-5" style={{ background: '#faf6f0' }}>

                  {/* Title preview */}
                  {generatedTitle && (
                    <div
                      className="px-4 py-3 rounded-sm border text-center"
                      style={{ background: '#f5efe6', borderColor: '#c4962c44' }}
                    >
                      <p className="text-[10px] tracking-[0.2em] uppercase font-bold mb-0.5" style={{ ...oswald, color: '#c4962c' }}>
                        Tittel på siden
                      </p>
                      <p className="text-base font-bold italic" style={{ ...chakra, color: '#3a2e24' }}>
                        {generatedTitle}
                      </p>
                    </div>
                  )}

                  {/* Car details grid */}
                  <div
                    className="p-4 rounded-sm border space-y-4"
                    style={{ background: '#f5efe6', borderColor: '#e8e0d4' }}
                  >
                    <p
                      className="text-[10px] tracking-[0.2em] uppercase font-bold"
                      style={{ ...oswald, color: '#8b7d6b' }}
                    >
                      Velg merke, modell og årstall
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Brand */}
                      <div>
                        <FieldLabel required>Merke</FieldLabel>
                        <StyledSelect value={brand} onChange={(e) => { setBrand(e.target.value); setModel(''); setVariant(''); }}>
                          <option value="">Velg merke...</option>
                          {CAR_BRANDS.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                        </StyledSelect>
                      </div>

                      {/* Model */}
                      <div>
                        <FieldLabel required>Modell</FieldLabel>
                        {availableModels.length > 0 ? (
                          <StyledSelect value={model} onChange={(e) => { setModel(e.target.value); setVariant(''); }}>
                            <option value="">Velg modell...</option>
                            {availableModels.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                          </StyledSelect>
                        ) : (
                          <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Skriv modellnavn"
                            className="h-11 rounded-sm border text-sm"
                            style={{ background: '#faf6f0', borderColor: '#d5cec3', color: '#3a2e24' }}
                          />
                        )}
                      </div>

                      {/* Variant */}
                      <div>
                        <FieldLabel>Variant</FieldLabel>
                        {availableVariants.length > 0 ? (
                          <StyledSelect value={variant} onChange={(e) => setVariant(e.target.value)}>
                            <option value="">Velg variant...</option>
                            {availableVariants.map(v => <option key={v} value={v}>{v}</option>)}
                          </StyledSelect>
                        ) : (
                          <Input value={variant} onChange={(e) => setVariant(e.target.value)} placeholder="F.eks. VF1, Rallye 2"
                            className="h-11 rounded-sm border text-sm"
                            style={{ background: '#faf6f0', borderColor: '#d5cec3', color: '#3a2e24' }}
                          />
                        )}
                      </div>

                      {/* Body type */}
                      <div>
                        <FieldLabel>Karosseri</FieldLabel>
                        <StyledSelect value={bodyType} onChange={(e) => setBodyType(e.target.value)}>
                          <option value="">Velg karosseri...</option>
                          {CAR_BODY_TYPES.map(bt => <option key={bt.id} value={bt.id}>{bt.label}</option>)}
                        </StyledSelect>
                      </div>

                      {/* Year */}
                      <div>
                        <FieldLabel>Årstall</FieldLabel>
                        <Input
                          type="number" value={year} onChange={(e) => setYear(e.target.value)}
                          placeholder="f.eks. 1964" min={1900} max={2030}
                          className="h-11 rounded-sm border text-sm"
                          style={{ background: '#faf6f0', borderColor: '#d5cec3', color: '#3a2e24' }}
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <FieldLabel>Kategori</FieldLabel>
                        <StyledSelect value={category} onChange={(e) => setCategory(e.target.value)}>
                          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </StyledSelect>
                      </div>
                    </div>
                  </div>

                  {/* Story */}
                  <div>
                    <FieldLabel>Historien bak bilen</FieldLabel>
                    <Textarea
                      value={story}
                      onChange={(e) => setStory(e.target.value)}
                      placeholder="Fortell om bilens historie, restaurering eller hva som gjør den spesiell..."
                      rows={4}
                      className="rounded-sm border text-sm resize-none"
                      style={{ background: '#faf6f0', borderColor: '#d5cec3', color: '#3a2e24' }}
                    />
                  </div>

                  {/* ── Consent: Redigering ── */}
                  <div
                    className="p-4 rounded-sm border space-y-3"
                    style={{ background: '#f5efe6', borderColor: '#e8e0d4' }}
                  >
                    <p
                      className="text-[11px] tracking-[0.15em] uppercase font-bold"
                      style={{ ...oswald, color: '#3a2e24' }}
                    >
                      Godkjenning for redigering <span style={{ color: '#c4962c' }}>*</span>
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: '#8b7d6b' }}>
                      Vi kan rette små skrivefeil, tydeliggjøre detaljer og legge til teknisk info. Innholdet endres ikke helt – vi bygger videre på det du har sendt inn.
                    </p>
                    <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-sm transition-colors hover:bg-[#f0ebe3]">
                      <input type="radio" name="allowEdits" checked={allowEdits === true} onChange={() => setAllowEdits(true)} className="w-4 h-4 mt-0.5 accent-[#c4962c] flex-shrink-0" />
                      <span className="text-sm font-medium" style={{ color: '#3a2e24' }}>
                        Ja, jeg godkjenner at Simca Norge kan redigere og forbedre innsendelsen min.
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-sm transition-colors hover:bg-[#f0ebe3]">
                      <input type="radio" name="allowEdits" checked={allowEdits === false} onChange={() => setAllowEdits(false)} className="w-4 h-4 mt-0.5 accent-[#c4962c] flex-shrink-0" />
                      <span className="text-sm font-medium" style={{ color: '#3a2e24' }}>
                        Nei, jeg ønsker at innholdet publiseres som det er.
                      </span>
                    </label>
                  </div>

                  {/* ── Consent: Klubb ── */}
                  <div
                    className="p-4 rounded-sm border space-y-3"
                    style={{ background: '#f5efe6', borderColor: '#e8e0d4' }}
                  >
                    <p
                      className="text-[11px] tracking-[0.15em] uppercase font-bold flex items-center gap-2"
                      style={{ ...oswald, color: '#3a2e24' }}
                    >
                      <Users className="w-4 h-4" style={{ color: '#c4962c' }} />
                      Knytte bilen til en klubb
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: '#8b7d6b' }}>
                      Ønsker du at bilen skal vises på en klubbside? Klubben/admin godkjenner koblingen.
                    </p>
                    <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-sm transition-colors hover:bg-[#f0ebe3]">
                      <input
                        type="checkbox"
                        checked={clubLinkRequested}
                        onChange={(e) => { setClubLinkRequested(e.target.checked); if (!e.target.checked) { setClubPageId(''); setClubMessage(''); } }}
                        className="w-4 h-4 mt-0.5 accent-[#c4962c] flex-shrink-0"
                      />
                      <span className="text-sm font-medium" style={{ color: '#3a2e24' }}>
                        Ja, jeg ønsker å knytte bilen til en klubb på Bilgarasjen
                      </span>
                    </label>

                    {clubLinkRequested && (
                      <div className="mt-2 space-y-3 pl-7">
                        <div>
                          <FieldLabel required>Velg klubb</FieldLabel>
                          <StyledSelect value={clubPageId} onChange={(e) => setClubPageId(e.target.value)}>
                            <option value="">Velg klubb...</option>
                            {clubs?.map(club => <option key={club.id} value={club.id}>{club.title}</option>)}
                          </StyledSelect>
                        </div>
                        <div>
                          <FieldLabel>Melding til klubb/admin</FieldLabel>
                          <Textarea
                            value={clubMessage}
                            onChange={(e) => setClubMessage(e.target.value)}
                            placeholder="F.eks. «Jeg er medlem og vil gjerne ha bilen på klubbsiden»"
                            maxLength={2000}
                            rows={2}
                            className="rounded-sm border text-sm resize-none"
                            style={{ background: '#faf6f0', borderColor: '#d5cec3', color: '#3a2e24' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Consent: Instagram ── */}
                  <div
                    className="p-4 rounded-sm border space-y-2"
                    style={{ background: '#f5efe6', borderColor: '#e8e0d4' }}
                  >
                    <p
                      className="text-[11px] tracking-[0.15em] uppercase font-bold"
                      style={{ ...oswald, color: '#3a2e24' }}
                    >
                      Deling på Instagram
                    </p>
                    <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-sm transition-colors hover:bg-[#f0ebe3]">
                      <input
                        type="checkbox"
                        checked={allowInstagram}
                        onChange={(e) => setAllowInstagram(e.target.checked)}
                        className="w-4 h-4 mt-0.5 accent-[#c4962c] flex-shrink-0"
                      />
                      <span className="text-sm font-medium" style={{ color: '#3a2e24' }}>
                        Jeg godkjenner at bilder og beskrivelse av bilen min deles på Simca Norge sin{' '}
                        <a href="https://www.instagram.com/simcanorge/" target="_blank" rel="noopener noreferrer"
                          className="underline transition-colors"
                          style={{ color: '#c4962c' }}
                        >
                          Instagram
                        </a>.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Gold footer bar with submit */}
                <div
                  className="px-5 sm:px-6 py-4 border-t"
                  style={{ borderColor: '#e8e0d4', background: 'linear-gradient(135deg, #f5efe6 0%, #ede5d8 100%)' }}
                >
                  <button
                    onClick={handleCreateCar}
                    disabled={isSaving || !brand || !model || allowEdits === null}
                    className="w-full py-3.5 text-[13px] tracking-[0.12em] uppercase font-bold rounded-sm transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ ...oswald, background: 'linear-gradient(135deg, #d4a017, #e8c547, #c4962c)', color: '#0f0d0b' }}
                  >
                    {isSaving ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Oppretter...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Neste: Last opp bilder
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </Layout>
  );
}
