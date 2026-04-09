import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { CarEventsList } from '@/components/car/CarEventsList';
import { 
  Car, Wrench, Loader2, XCircle, 
  Pencil, Save, X, Eye, EyeOff, Upload, Trash2, Clock, Send,
  ChevronLeft, ChevronRight, Star, ImageIcon, BookOpen, Info, ArrowLeft,
  CheckCircle2, Circle
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { compressImages, generateImageId, getCarImagePath } from '@/lib/imageCompression';
import { CAR_BRANDS, getModelsForBrand } from '@/data/carBrands';
import { CAR_BODY_TYPES } from '@/data/carBodyTypes';
import { motion } from 'framer-motion';
import { PostComposer } from '@/components/feed/PostComposer';
import carSilhouette from '@/assets/car-silhouette.png';

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

const CATEGORIES = [
  { value: 'registrert', label: 'Registrert' },
  { value: 'prosjekt', label: 'Prosjekt' },
  { value: 'veteran', label: 'Veteranbil' },
];

function SectionCard({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`bg-white/70 backdrop-blur-sm border border-[#3a2e24]/[0.08] rounded-lg p-5 sm:p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({ icon, title, description, action }: { icon: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
      <div className="flex-1 min-w-0">
        <h2 className="text-[0.95rem] sm:text-[1.05rem] uppercase tracking-[0.08em] font-bold text-[#3a2e24] flex items-center gap-2" style={chakra}>
          <span className="text-[#8b6914]">{icon}</span>
          {title}
        </h2>
        {description && <p className="text-[12px] sm:text-[13px] text-[#3a2e24]/40 mt-1">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function ActionBtn({ onClick, disabled, children, variant = 'primary', className = '' }: { onClick?: () => void; disabled?: boolean; children: React.ReactNode; variant?: 'primary' | 'ghost' | 'outline' | 'destructive'; className?: string }) {
  const base = 'inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] uppercase tracking-[0.08em] font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-md transition-all duration-200 active:scale-95 disabled:opacity-50';
  const styles = {
    primary: 'bg-[#3a2e24] text-white hover:bg-[#2a2118]',
    ghost: 'text-[#3a2e24]/60 hover:text-[#3a2e24] hover:bg-[#3a2e24]/5',
    outline: 'border border-[#3a2e24]/15 text-[#3a2e24]/70 hover:border-[#c4962c]/40 hover:text-[#3a2e24]',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]} ${className}`} style={chakra}>
      {children}
    </button>
  );
}

const statusLabel = (s: string) => {
  switch (s) {
    case 'published': return { text: 'Publisert', color: 'bg-green-600/15 text-green-800' };
    case 'draft': return { text: 'Kladd', color: 'bg-amber-500/15 text-amber-800' };
    case 'submitted': return { text: 'Innsendt', color: 'bg-blue-500/15 text-blue-800' };
    case 'archived': return { text: 'Arkivert', color: 'bg-gray-400/15 text-gray-600' };
    default: return { text: s, color: 'bg-gray-400/15 text-gray-600' };
  }
};

export default function DashboardBilDetalj() {
  const { carId } = useParams<{ carId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [isEditingStory, setIsEditingStory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isReorderingImages, setIsReorderingImages] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const [basicForm, setBasicForm] = useState({
    brand: "", model: "", variant: "", body_type: "", year: "", category: "registrert", tags: "",
  });
  const [storyForm, setStoryForm] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate('/login?returnUrl=/dashboard');
  }, [user, authLoading, navigate]);

  const { data: carData, isLoading } = useQuery({
    queryKey: ['my-car', carId, user?.id],
    queryFn: async () => {
      if (!user || !carId) return null;
      const { data: ownerCheck } = await supabase
        .from('car_owners').select('id')
        .eq('car_id', carId).eq('user_id', user.id).eq('role', 'owner').maybeSingle();
      if (!ownerCheck) return { hasAccess: false };
      const { data: car, error } = await supabase
        .from('cars').select(`*, car_images(id, image_url, alt_text, sort_order)`)
        .eq('id', carId).single();
      if (error) throw error;
      return { hasAccess: true, car };
    },
    enabled: !!user && !!carId
  });

  const car = carData?.car;

  useEffect(() => {
    if (car) {
      setBasicForm({
        brand: car.brand || "", model: car.model || "", variant: car.variant || "",
        body_type: car.body_type || "", year: car.year?.toString() || "",
        category: car.category || "registrert", tags: car.tags?.join(", ") || "",
      });
      setStoryForm(car.story || "");
    }
  }, [car]);

  const saveBasicInfo = async () => {
    if (!car) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('cars').update({
        brand: basicForm.brand || null, model: basicForm.model, variant: basicForm.variant || null,
        body_type: basicForm.body_type || null, year: basicForm.year ? parseInt(basicForm.year) : null,
        category: basicForm.category, tags: basicForm.tags.split(',').map(t => t.trim()).filter(t => t),
      }).eq('id', car.id);
      if (error) { toast.error(`Kunne ikke lagre: ${error.message}`); return; }
      toast.success('Lagret!');
      setIsEditingBasic(false);
      queryClient.invalidateQueries({ queryKey: ['my-car', carId, user?.id] });
    } catch { toast.error('Uventet feil ved lagring'); }
    finally { setIsSaving(false); }
  };

  const saveStory = async () => {
    if (!car) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('cars').update({ story: storyForm || null }).eq('id', car.id);
      if (error) { toast.error(`Kunne ikke lagre: ${error.message}`); return; }
      toast.success('Historien er lagret!');
      setIsEditingStory(false);
      queryClient.invalidateQueries({ queryKey: ['my-car', carId, user?.id] });
    } catch { toast.error('Uventet feil ved lagring'); }
    finally { setIsSaving(false); }
  };

  const { data: openRequest } = useQuery({
    queryKey: ['publication-request', carId, user?.id],
    queryFn: async () => {
      if (!carId || !user) return null;
      const { data } = await supabase.from('car_publication_requests').select('*')
        .eq('car_id', carId).eq('status', 'open').maybeSingle();
      return data as { id: string; car_id: string; action: 'publish' | 'unpublish'; created_at: string } | null;
    },
    enabled: !!carId && !!user
  });

  const clearOpenPublicationRequests = async (cid: string) => {
    await supabase.from('car_publication_requests').delete().eq('car_id', cid).eq('status', 'open');
    queryClient.invalidateQueries({ queryKey: ['publication-request', carId, user?.id] });
  };

  const handlePublish = async () => {
    if (!car || !user) return;
    setIsPublishing(true);
    try {
      const { error } = await supabase.from('cars').update({
        published_at: new Date().toISOString(),
        status: 'published' as any,
      }).eq('id', car.id);
      if (error) {
        const msg = error.message || '';
        if (msg.includes('Merke')) toast.error('Merke må være satt før publisering');
        else if (msg.includes('Modell')) toast.error('Modell må være satt før publisering');
        else if (msg.includes('bilde')) toast.error('Minst ett bilde kreves for publisering');
        else toast.error(`Kunne ikke publisere: ${msg}`);
        return;
      }
      await clearOpenPublicationRequests(car.id);
      toast.success('Bilen er publisert! 🎉');
      queryClient.invalidateQueries({ queryKey: ['my-car', carId, user?.id] });
    } catch { toast.error('Uventet feil ved publisering'); }
    finally { setIsPublishing(false); }
  };

  const handleUnpublish = async () => {
    if (!car || !user) return;
    if (!confirm('Er du sikker på at du vil avpublisere bilen? Den vil ikke lenger være synlig for andre.')) return;
    setIsPublishing(true);
    try {
      const { error } = await supabase.from('cars').update({
        published_at: null,
        status: 'draft' as any,
      }).eq('id', car.id);
      if (error) { toast.error(`Kunne ikke avpublisere: ${error.message}`); return; }
      toast.success('Bilen er avpublisert');
      queryClient.invalidateQueries({ queryKey: ['my-car', carId, user?.id] });
    } catch { toast.error('Uventet feil'); }
    finally { setIsPublishing(false); }
  };

  const cancelRequest = async () => {
    if (!openRequest) return;
    const { error } = await supabase.from('car_publication_requests').delete().eq('id', openRequest.id);
    if (error) toast.error('Kunne ikke avbryte');
    else { toast.success('Avbrutt'); queryClient.invalidateQueries({ queryKey: ['publication-request', carId, user?.id] }); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !car) return;
    const isFirst = !car.car_images || car.car_images.length === 0;
    setIsUploadingImages(true);
    try {
      const results = await compressImages(Array.from(files));
      let ok = 0;
      for (const result of results) {
        const imageId = generateImageId();
        const filePath = getCarImagePath(car.id, imageId);
        const { error: uploadError } = await supabase.storage.from('simca-images').upload(filePath, result.file, { contentType: 'image/webp' });
        if (uploadError) { toast.error(`Feil: ${result.file.name}`); continue; }
        const { data: urlData } = supabase.storage.from('simca-images').getPublicUrl(filePath);
        const { error: dbError } = await supabase.from('car_images').insert({
          car_id: car.id, image_url: urlData.publicUrl, alt_text: car.title, sort_order: (car.car_images?.length || 0) + 1,
        });
        if (dbError) toast.error('Kunne ikke lagre bildereferanse');
        else ok++;
      }
      if (isFirst && ok > 0) {
        try { await supabase.rpc('notify_admins_images_added', { _car_id: car.id, _car_title: car.title }); } catch {}
      }
      toast.success(`${results.length} bilde(r) lastet opp!`);
      queryClient.invalidateQueries({ queryKey: ['my-car', carId, user?.id] });
    } catch { toast.error('Feil ved bildeopplasting'); }
    finally { setIsUploadingImages(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const deleteImage = async (imageId: string) => {
    const { error } = await supabase.from('car_images').delete().eq('id', imageId);
    if (error) toast.error('Kunne ikke slette');
    else { toast.success('Slettet'); queryClient.invalidateQueries({ queryKey: ['my-car', carId, user?.id] }); }
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center" style={{ background: '#eee7dd' }}>
          <Loader2 className="w-8 h-8 animate-spin text-[#c4962c]" />
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  if (carData && !carData.hasAccess) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center" style={{ background: '#eee7dd' }}>
          <XCircle className="w-14 h-14 text-red-400 mb-4" />
          <p className="text-[1.1rem] uppercase font-bold text-[#3a2e24]/50 tracking-[0.06em]" style={oswald}>Ingen tilgang</p>
          <Link to="/dashboard/mine-biler" className="mt-4 text-[13px] uppercase tracking-[0.1em] text-[#c4962c] hover:text-[#a07820] font-bold border-b border-[#c4962c]/30 pb-0.5" style={oswald}>
            ← Tilbake til mine biler
          </Link>
        </div>
      </Layout>
    );
  }

  if (!car) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center" style={{ background: '#eee7dd' }}>
          <Car className="w-14 h-14 text-[#3a2e24]/15 mb-4" />
          <p className="text-[1.1rem] uppercase font-bold text-[#3a2e24]/30 tracking-[0.06em]" style={oswald}>Bilen finnes ikke</p>
        </div>
      </Layout>
    );
  }

  const sortedImages = [...(car.car_images || [])].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
  const mainImage = sortedImages[0];
  const status = statusLabel(car.status || 'draft');

  const persistCarImageOrder = async (images: any[]) => {
    setIsReorderingImages(true);
    try {
      for (let i = 0; i < images.length; i++) {
        await supabase.from('car_images').update({ sort_order: i }).eq('id', images[i].id);
      }
      toast.success('Rekkefølge oppdatert');
      queryClient.invalidateQueries({ queryKey: ['my-car', carId, user?.id] });
    } catch { toast.error('Kunne ikke endre rekkefølge'); }
    finally { setIsReorderingImages(false); }
  };

  const moveCarImageLeft = async (index: number) => {
    if (index <= 0) return;
    const next = [...sortedImages];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    await persistCarImageOrder(next);
  };

  const moveCarImageRight = async (index: number) => {
    if (index >= sortedImages.length - 1) return;
    const next = [...sortedImages];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    await persistCarImageOrder(next);
  };

  const setCarMainImage = async (index: number) => {
    if (index <= 0) return;
    const next = [...sortedImages];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    await persistCarImageOrder(next);
  };

  const availableModels = basicForm.brand ? getModelsForBrand(basicForm.brand) : [];

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)]">

        {/* ─── HERO with car image ─── */}
        <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #4a3d30 0%, #3a2e24 40%, #2a2118 100%)' }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(196,150,44,0.10) 0%, transparent 60%)' }} />

          {/* Hero car image */}
          {mainImage && (
            <div className="absolute inset-0 pointer-events-none hidden md:block">
              <img
                src={mainImage.image_url}
                alt=""
                className="absolute right-0 top-0 h-full w-[50%] object-cover"
                style={{
                  WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.5) 30%, transparent 100%)',
                  maskImage: 'linear-gradient(to left, rgba(0,0,0,0.5) 30%, transparent 100%)',
                  opacity: 0.7,
                }}
              />
            </div>
          )}

          <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-5 md:px-8">
            <div className="flex flex-col justify-center min-h-[160px] sm:min-h-[190px] md:min-h-[220px] py-6 md:py-8 md:max-w-[55%]">
              <Link
                to="/dashboard/mine-biler"
                className="inline-flex items-center gap-1.5 text-white/35 hover:text-white/60 mb-3 transition-colors text-[11px] uppercase tracking-[0.15em] font-semibold"
                style={oswald}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Mine biler
              </Link>

              <p className="text-[10px] sm:text-[11px] tracking-[0.3em] uppercase mb-1"
                style={{ ...oswald, fontWeight: 500, background: 'linear-gradient(135deg, #F5A623, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                bilgarasje.no
              </p>

              {car.year && (
                <span className="text-[1.6rem] sm:text-[2rem] font-serif text-[#c4962c]/50 leading-none">
                  {car.year}
                </span>
              )}
              <h1
                className="text-[1.3rem] sm:text-[1.7rem] md:text-[2rem] leading-[0.95] uppercase tracking-[0.02em] text-white font-bold italic mt-0.5"
                style={{ ...chakra, textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}
              >
                {car.title}
              </h1>

              <div className="flex items-center gap-3 mt-3">
                <span className={`text-[10px] sm:text-[11px] uppercase tracking-[0.08em] font-bold px-2.5 py-1 rounded-full ${status.color}`} style={oswald}>
                  {status.text}
                </span>
                {car.overhauled && (
                  <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.08em] font-bold text-green-400/80" style={oswald}>
                    <Wrench className="w-3.5 h-3.5" /> Overhalt
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ─── CONTENT ─── */}
        <section
          className="relative pt-6 sm:pt-8 md:pt-10 pb-12 sm:pb-20 overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #eee7dd 0%, #ebe4da 40%, #e8e1d6 100%)' }}
        >
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none flex justify-center overflow-hidden" style={{ opacity: 0.02 }}>
            <img src={carSilhouette} alt="" className="w-[80%] max-w-[1000px] translate-y-[30%]" style={{ transform: 'scaleX(-1)', filter: 'brightness(0)' }} />
          </div>

          <div className="relative z-10 max-w-[800px] mx-auto px-4 sm:px-5 md:px-8 space-y-5 sm:space-y-6">

            {/* Publish actions */}
            <SectionCard delay={0}>
              {(() => {
                const isPublished = car.status === 'published';
                const isArchived = car.status === 'archived';
                const brandOk = !!(car.brand && car.brand.trim());
                const modelOk = !!(car.model && car.model.trim());
                const imagesOk = (car.car_images?.length || 0) >= 1;
                const canPublish = brandOk && modelOk && imagesOk && !isArchived && !isPublished;

                return (
                  <>
                    {/* Published: show link + unpublish */}
                    {isPublished && (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        {car.slug && (
                          <Link
                            to={`/biler/${car.slug}`}
                            className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.08em] font-bold text-[#c4962c] hover:text-[#a07820] transition-colors"
                            style={chakra}
                          >
                            <Eye className="w-4 h-4" />
                            Se offentlig side →
                          </Link>
                        )}
                        <ActionBtn variant="outline" onClick={handleUnpublish} disabled={isPublishing}>
                          <EyeOff className="w-4 h-4" />
                          {isPublishing ? 'Avpubliserer...' : 'Avpubliser'}
                        </ActionBtn>
                      </div>
                    )}

                    {/* Not published: show checklist + publish */}
                    {!isPublished && !isArchived && (
                      <div>
                        {/* Old open request warning */}
                        {openRequest && (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
                            <div className="flex items-start gap-2 flex-1">
                              <Clock className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-[13px] font-bold text-amber-800" style={chakra}>
                                  Du har en åpen forespørsel til admin fra før
                                </p>
                                <p className="text-[12px] text-amber-600">
                                  Avbryt den hvis du heller vil publisere selv.
                                </p>
                              </div>
                            </div>
                            <ActionBtn variant="outline" onClick={cancelRequest}>
                              <X className="w-3.5 h-3.5" /> Avbryt
                            </ActionBtn>
                          </div>
                        )}

                        <SectionTitle
                          icon={<Send className="w-5 h-5" />}
                          title="Publiser på bilgarasje.no"
                          description="Når du publiserer, vises bilen under Biler med offentlig lenke."
                        />

                        {/* Checklist */}
                        <div className="space-y-2 mb-4">
                          {[
                            { ok: brandOk, label: 'Merke er satt' },
                            { ok: modelOk, label: 'Modell er satt' },
                            { ok: imagesOk, label: 'Minst ett bilde er lastet opp' },
                          ].map(({ ok, label }) => (
                            <div key={label} className="flex items-center gap-2">
                              {ok ? (
                                <CheckCircle2 className="w-4.5 h-4.5 text-green-600 shrink-0" />
                              ) : (
                                <Circle className="w-4.5 h-4.5 text-[#3a2e24]/20 shrink-0" />
                              )}
                              <span className={`text-[13px] ${ok ? 'text-[#3a2e24]/70' : 'text-[#3a2e24]/35'}`}>
                                {label}
                              </span>
                            </div>
                          ))}
                        </div>

                        {!canPublish && (
                          <p className="text-[12px] text-[#3a2e24]/35 mb-4">
                            Fyll inn grunninfo og last opp bilder, så blir «Publiser» tilgjengelig.
                          </p>
                        )}

                        <ActionBtn onClick={handlePublish} disabled={!canPublish || isPublishing}>
                          <Send className="w-4 h-4" />
                          {isPublishing ? 'Publiserer...' : 'Publiser'}
                        </ActionBtn>
                      </div>
                    )}

                    {/* Archived */}
                    {isArchived && (
                      <p className="text-[13px] text-[#3a2e24]/40" style={chakra}>
                        Denne bilen er arkivert.
                      </p>
                    )}
                  </>
                );
              })()}
            </SectionCard>

            {/* Images */}
            <SectionCard delay={0.08} className="!p-0 overflow-hidden">
              <div className="p-5 sm:p-6 pb-0">
                <SectionTitle
                  icon={<ImageIcon className="w-5 h-5" />}
                  title="Bilder"
                  description="Første bilde brukes som hovedbilde."
                  action={
                    <ActionBtn variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploadingImages}>
                      <Upload className="w-4 h-4" />
                      {isUploadingImages ? 'Laster opp...' : 'Last opp'}
                    </ActionBtn>
                  }
                />
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" multiple className="hidden" />

              {sortedImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 p-3 sm:p-5">
                  {sortedImages.map((img: any, index: number) => (
                    <div key={img.id} className="relative group aspect-video rounded-md overflow-hidden bg-[#3a2e24]/[0.06]">
                      <img src={img.image_url} alt={img.alt_text || car.title} className="w-full h-full object-cover" />
                      {index === 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-[#c4962c] text-white text-[10px] uppercase tracking-[0.08em] font-bold px-2 py-0.5 rounded inline-flex items-center gap-1" style={oswald}>
                          <Star className="w-3 h-3 fill-current" />
                          <span className="hidden sm:inline">Hovedbilde</span>
                        </span>
                      )}
                      <div className="absolute inset-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 via-transparent to-transparent sm:bg-black/40 flex items-end sm:items-center justify-center gap-1 sm:gap-2 p-2 sm:p-0">
                        {index > 0 && (
                          <button onClick={() => moveCarImageLeft(index)} disabled={isReorderingImages}
                            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-90">
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                        )}
                        {index !== 0 && (
                          <button onClick={() => setCarMainImage(index)} disabled={isReorderingImages}
                            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-90"
                            title="Sett som hovedbilde">
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        {index < sortedImages.length - 1 && (
                          <button onClick={() => moveCarImageRight(index)} disabled={isReorderingImages}
                            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-90">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <button onClick={() => deleteImage(img.id)}
                        className="absolute top-1.5 right-1.5 bg-red-600 text-white p-1.5 rounded-full sm:opacity-0 sm:group-hover:opacity-100 transition-opacity min-h-[28px] min-w-[28px] flex items-center justify-center active:scale-90">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 sm:p-12 text-center">
                  <ImageIcon className="w-10 h-10 text-[#3a2e24]/15 mx-auto mb-3" strokeWidth={1.4} />
                  <p className="text-[1rem] uppercase text-[#3a2e24]/30 font-bold tracking-[0.06em]" style={oswald}>Ingen bilder ennå</p>
                  <button onClick={() => fileInputRef.current?.click()}
                    className="mt-3 text-[12px] uppercase tracking-[0.12em] text-[#c4962c] hover:text-[#a07820] font-bold border-b border-[#c4962c]/30 pb-0.5 transition-colors" style={oswald}>
                    Last opp ditt første bilde →
                  </button>
                </div>
              )}
            </SectionCard>

            {/* Basic info */}
            <SectionCard delay={0.16}>
              <SectionTitle
                icon={<Info className="w-5 h-5" />}
                title="Grunninfo"
                action={
                  !isEditingBasic ? (
                    <ActionBtn variant="ghost" onClick={() => setIsEditingBasic(true)}>
                      <Pencil className="w-3.5 h-3.5" /> Rediger
                    </ActionBtn>
                  ) : (
                    <div className="flex gap-2">
                      <ActionBtn onClick={saveBasicInfo} disabled={isSaving}>
                        <Save className="w-3.5 h-3.5" /> {isSaving ? 'Lagrer...' : 'Lagre'}
                      </ActionBtn>
                      <ActionBtn variant="ghost" onClick={() => {
                        setIsEditingBasic(false);
                        if (car) setBasicForm({
                          brand: car.brand || "", model: car.model || "", variant: car.variant || "",
                          body_type: car.body_type || "", year: car.year?.toString() || "",
                          category: car.category || "registrert", tags: car.tags?.join(", ") || "",
                        });
                      }}>
                        <X className="w-3.5 h-3.5" /> Avbryt
                      </ActionBtn>
                    </div>
                  )
                }
              />

              {isEditingBasic ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] uppercase tracking-[0.1em] font-bold text-[#3a2e24]/50 mb-1.5 block" style={oswald}>Merke</label>
                    <Select value={basicForm.brand} onValueChange={(v) => setBasicForm({ ...basicForm, brand: v, model: "" })}>
                      <SelectTrigger className="h-11 bg-white border-[#3a2e24]/10"><SelectValue placeholder="Velg merke" /></SelectTrigger>
                      <SelectContent>{CAR_BRANDS.map(b => <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-[0.1em] font-bold text-[#3a2e24]/50 mb-1.5 block" style={oswald}>Modell</label>
                    <Select value={basicForm.model} onValueChange={(v) => setBasicForm({ ...basicForm, model: v })}>
                      <SelectTrigger className="h-11 bg-white border-[#3a2e24]/10"><SelectValue placeholder="Velg modell" /></SelectTrigger>
                      <SelectContent>{availableModels.map(m => <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-[0.1em] font-bold text-[#3a2e24]/50 mb-1.5 block" style={oswald}>Variant</label>
                    <Input value={basicForm.variant} onChange={(e) => setBasicForm({ ...basicForm, variant: e.target.value })}
                      placeholder="f.eks. GLS, LS" className="h-11 bg-white border-[#3a2e24]/10" />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-[0.1em] font-bold text-[#3a2e24]/50 mb-1.5 block" style={oswald}>Karosseri</label>
                    <Select value={basicForm.body_type} onValueChange={(v) => setBasicForm({ ...basicForm, body_type: v })}>
                      <SelectTrigger className="h-11 bg-white border-[#3a2e24]/10"><SelectValue placeholder="Velg karosseri" /></SelectTrigger>
                      <SelectContent>{CAR_BODY_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-[0.1em] font-bold text-[#3a2e24]/50 mb-1.5 block" style={oswald}>Årsmodell</label>
                    <Input type="number" value={basicForm.year} onChange={(e) => setBasicForm({ ...basicForm, year: e.target.value })}
                      placeholder="f.eks. 1972" className="h-11 bg-white border-[#3a2e24]/10" />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-[0.1em] font-bold text-[#3a2e24]/50 mb-1.5 block" style={oswald}>Kategori</label>
                    <Select value={basicForm.category} onValueChange={(v) => setBasicForm({ ...basicForm, category: v })}>
                      <SelectTrigger className="h-11 bg-white border-[#3a2e24]/10"><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] uppercase tracking-[0.1em] font-bold text-[#3a2e24]/50 mb-1.5 block" style={oswald}>Tags (kommaseparert)</label>
                    <Input value={basicForm.tags} onChange={(e) => setBasicForm({ ...basicForm, tags: e.target.value })}
                      placeholder="f.eks. original, restaurert" className="h-11 bg-white border-[#3a2e24]/10" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                  {[
                    ['Merke', car.brand], ['Modell', car.model], ['Variant', car.variant],
                    ['Karosseri', car.body_type], ['Årsmodell', car.year], ['Kategori', car.category],
                  ].map(([label, value]) => (
                    <div key={label as string}>
                      <span className="text-[11px] uppercase tracking-[0.1em] font-bold text-[#3a2e24]/35 block" style={oswald}>{label}</span>
                      <p className="text-[0.95rem] font-medium text-[#3a2e24] capitalize">{value || '—'}</p>
                    </div>
                  ))}
                  {car.tags && car.tags.length > 0 && (
                    <div className="col-span-full mt-1">
                      <span className="text-[11px] uppercase tracking-[0.1em] font-bold text-[#3a2e24]/35 block mb-1.5" style={oswald}>Tags</span>
                      <div className="flex flex-wrap gap-1.5">
                        {car.tags.map((tag: string) => (
                          <span key={tag} className="bg-[#3a2e24]/[0.06] text-[#3a2e24]/70 text-[12px] px-2.5 py-1 rounded-full">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </SectionCard>

            {/* Story */}
            <SectionCard delay={0.24}>
              <SectionTitle
                icon={<BookOpen className="w-5 h-5" />}
                title="Historien"
                description="Fortell historien om bilen din."
                action={
                  !isEditingStory ? (
                    <ActionBtn variant="ghost" onClick={() => setIsEditingStory(true)}>
                      <Pencil className="w-3.5 h-3.5" /> Rediger
                    </ActionBtn>
                  ) : (
                    <div className="flex gap-2">
                      <ActionBtn onClick={saveStory} disabled={isSaving}>
                        <Save className="w-3.5 h-3.5" /> {isSaving ? 'Lagrer...' : 'Lagre'}
                      </ActionBtn>
                      <ActionBtn variant="ghost" onClick={() => { setIsEditingStory(false); setStoryForm(car.story || ""); }}>
                        <X className="w-3.5 h-3.5" /> Avbryt
                      </ActionBtn>
                    </div>
                  )
                }
              />

              {isEditingStory ? (
                <Textarea value={storyForm} onChange={(e) => setStoryForm(e.target.value)}
                  placeholder="Fortell historien om bilen din..." rows={8}
                  className="bg-white border-[#3a2e24]/10 min-h-[180px]" />
              ) : (
                car.story ? (
                  <p className="text-[#3a2e24]/60 whitespace-pre-wrap leading-relaxed text-[0.95rem]">{car.story}</p>
                ) : (
                  <p className="text-[#3a2e24]/30 italic text-[0.95rem]">Ingen historie lagt til ennå.</p>
                )
              )}
            </SectionCard>

            {/* Feed composer */}
            <SectionCard delay={0.32}>
              <SectionTitle
                icon={<Send className="w-5 h-5" />}
                title="Del i feeden"
                description="Del en oppdatering med bilsamfunnet"
              />
              <PostComposer
                compact
                postType="car_update"
                carId={car.id}
                snapshotTitle={car.title}
                snapshotImageUrl={mainImage?.image_url}
                snapshotEntityType="car"
              />
            </SectionCard>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <CarEventsList carId={car.id} />
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
