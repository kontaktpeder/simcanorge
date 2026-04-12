import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { CarEventsList } from '@/components/car/CarEventsList';
import {
  Car, Wrench, Loader2, XCircle,
  Pencil, Save, X, EyeOff, Upload, Trash2, Clock, Send,
  ChevronLeft, ChevronRight, Star, ImageIcon, BookOpen, Info, ArrowLeft,
  CheckCircle2, Circle, ExternalLink, Sparkles
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

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

const CATEGORIES = [
  { value: 'registrert', label: 'Registrert' },
  { value: 'prosjekt', label: 'Prosjekt' },
  { value: 'veteran', label: 'Veteranbil' },
];

const statusLabel = (s: string) => {
  switch (s) {
    case 'published': return { text: 'Publisert', color: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' };
    case 'draft': return { text: 'Kladd', color: 'bg-amber-500/15 text-amber-400 border border-amber-500/20' };
    case 'submitted': return { text: 'Innsendt', color: 'bg-blue-500/15 text-blue-400 border border-blue-500/20' };
    case 'archived': return { text: 'Arkivert', color: 'bg-muted text-muted-foreground border border-border' };
    default: return { text: s, color: 'bg-muted text-muted-foreground border border-border' };
  }
};

/* ─── Minimal inline button ─── */
function InlineBtn({ onClick, disabled, children, variant = 'ghost', className = '' }: {
  onClick?: () => void; disabled?: boolean; children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'outline' | 'destructive' | 'glow'; className?: string;
}) {
  const base = 'inline-flex items-center gap-1.5 text-[11px] sm:text-[12px] uppercase tracking-[0.08em] font-bold px-3 py-2 rounded-lg transition-all duration-200 active:scale-95 disabled:opacity-40';
  const styles = {
    primary: 'bg-primary text-primary-foreground hover:brightness-110',
    ghost: 'text-muted-foreground/60 hover:text-foreground hover:bg-white/[0.04]',
    outline: 'border border-border/60 text-muted-foreground/70 hover:border-primary/30 hover:text-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:brightness-110',
    glow: 'bg-primary text-primary-foreground hover:brightness-110 shadow-[0_0_24px_rgba(45,212,168,0.2)]',
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]} ${className}`} style={oswald}>{children}</button>
  );
}

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

  // ─── Actions ───
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
        published_at: new Date().toISOString(), status: 'published' as any,
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
    if (!confirm('Er du sikker på at du vil avpublisere bilen?')) return;
    setIsPublishing(true);
    try {
      const { error } = await supabase.from('cars').update({ published_at: null, status: 'draft' as any }).eq('id', car.id);
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

  // ─── Loading / error states ───
  if (authLoading || isLoading) {
    return <Layout><div className="min-h-[60vh] flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
  }
  if (!user) return null;
  if (carData && !carData.hasAccess) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-background">
          <XCircle className="w-14 h-14 text-destructive/50 mb-4" />
          <p className="text-[1.1rem] uppercase font-bold text-muted-foreground tracking-[0.06em]" style={oswald}>Ingen tilgang</p>
          <Link to="/dashboard/mine-biler" className="mt-4 text-[13px] uppercase tracking-[0.1em] text-primary hover:text-primary/80 font-bold border-b border-primary/30 pb-0.5" style={oswald}>← Tilbake til mine biler</Link>
        </div>
      </Layout>
    );
  }
  if (!car) {
    return <Layout><div className="min-h-[60vh] flex flex-col items-center justify-center bg-background"><Car className="w-14 h-14 text-muted-foreground/30 mb-4" /><p className="text-[1.1rem] uppercase font-bold text-muted-foreground/50 tracking-[0.06em]" style={oswald}>Bilen finnes ikke</p></div></Layout>;
  }

  const sortedImages = [...(car.car_images || [])].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
  const mainImage = sortedImages[0];
  const sideImages = sortedImages.slice(1, 3);
  const restImages = sortedImages.slice(3);
  const status = statusLabel(car.status || 'draft');
  const availableModels = basicForm.brand ? getModelsForBrand(basicForm.brand) : [];

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

  const isPublished = car.status === 'published';
  const isArchived = car.status === 'archived';
  const brandOk = !!(car.brand && car.brand.trim());
  const modelOk = !!(car.model && car.model.trim());
  const imagesOk = (car.car_images?.length || 0) >= 1;
  const canPublish = brandOk && modelOk && imagesOk && !isArchived && !isPublished;

  return (
    <Layout>
      <div className="min-h-screen bg-background">

        {/* ─── HERO – cleaner, let the car breathe ─── */}
        <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, hsl(215 28% 6%) 0%, hsl(215 25% 8%) 100%)' }}>
          {mainImage && (
            <div className="absolute inset-0 pointer-events-none">
              <img src={mainImage.image_url} alt="" className="absolute inset-0 w-full h-full object-cover"
                style={{ opacity: 0.18, filter: 'saturate(0.6) blur(1px)' }} />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(7,11,16,0.5) 0%, rgba(7,11,16,0.85) 60%, hsl(215 28% 6%) 100%)' }} />
            </div>
          )}

          <div className="relative z-10 max-w-[900px] mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="pt-8 pb-10 sm:pt-10 sm:pb-14"
            >
              <Link to="/dashboard/mine-biler"
                className="inline-flex items-center gap-1.5 text-muted-foreground/40 hover:text-muted-foreground/70 mb-6 transition-colors text-[11px] uppercase tracking-[0.15em] font-semibold"
                style={oswald}>
                <ArrowLeft className="w-3.5 h-3.5" /> Mine biler
              </Link>

              <div className="flex items-center gap-3 mb-3">
                <span className={`text-[10px] uppercase tracking-[0.08em] font-bold px-2.5 py-1 rounded-full ${status.color}`} style={oswald}>{status.text}</span>
                {car.overhauled && (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.08em] font-bold text-emerald-400/70" style={oswald}>
                    <Wrench className="w-3 h-3" /> Overhalt
                  </span>
                )}
              </div>

              {car.year && (
                <span className="text-[1.4rem] sm:text-[1.6rem] font-serif text-primary/25 leading-none block mb-0.5">{car.year}</span>
              )}
              <h1 className="text-[1.3rem] sm:text-[1.7rem] md:text-[2rem] leading-[0.95] uppercase tracking-[0.01em] text-foreground font-bold"
                style={{ ...chakra }}>
                {car.title}
              </h1>

              {/* Progress line */}
              <div className="mt-4 h-[1px] w-full max-w-[280px]" style={{
                background: 'linear-gradient(90deg, hsl(168 60% 40% / 0.5) 0%, hsl(168 60% 40% / 0.1) 70%, transparent 100%)',
              }} />

              <div className="flex flex-wrap items-center gap-3 mt-4">
                {isPublished && car.slug && (
                  <Link to={`/biler/${car.slug}`}
                    className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] font-bold text-primary/60 hover:text-primary transition-colors" style={oswald}>
                    <ExternalLink className="w-3.5 h-3.5" /> Se offentlig side
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ─── CONTENT FLOW ─── */}
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12 sm:space-y-16">

          {/* ──────────────────────────────────
              1. PUBLISH STATUS (compact)
          ────────────────────────────────── */}
          {!isArchived && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
              {isPublished ? (
                <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.04]">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[12px] uppercase tracking-[0.06em] font-bold" style={oswald}>Bilen er live</span>
                  </div>
                  <InlineBtn variant="ghost" onClick={handleUnpublish} disabled={isPublishing}>
                    <EyeOff className="w-3.5 h-3.5" /> {isPublishing ? '...' : 'Avpubliser'}
                  </InlineBtn>
                </div>
              ) : (
                <div className="space-y-3">
                  {openRequest && (
                    <div className="flex items-center gap-3 bg-amber-500/[0.06] border border-amber-500/15 rounded-lg p-3">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <p className="text-[12px] text-amber-400/70 flex-1" style={oswald}>Åpen forespørsel</p>
                      <InlineBtn variant="ghost" onClick={cancelRequest}><X className="w-3 h-3" /> Avbryt</InlineBtn>
                    </div>
                  )}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      {[
                        { ok: brandOk, label: 'Merke' },
                        { ok: modelOk, label: 'Modell' },
                        { ok: imagesOk, label: 'Bilde' },
                      ].map(({ ok, label }) => (
                        <span key={label} className={`inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.06em] font-bold ${ok ? 'text-emerald-400/70' : 'text-muted-foreground/30'}`} style={oswald}>
                          {ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />} {label}
                        </span>
                      ))}
                    </div>
                    <InlineBtn variant="glow" onClick={handlePublish} disabled={!canPublish || isPublishing}>
                      <Send className="w-3.5 h-3.5" /> {isPublishing ? 'Publiserer...' : 'Publiser bilen'}
                    </InlineBtn>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ──────────────────────────────────
              2. GALLERY (editorial: 1 large + 2 stacked)
          ────────────────────────────────── */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" multiple className="hidden" />

            {sortedImages.length > 0 ? (
              <div className="space-y-3">
                {/* Main gallery grid */}
                <div className={`grid gap-2 sm:gap-3 ${sideImages.length > 0 ? 'grid-cols-1 sm:grid-cols-[1fr_0.42fr]' : 'grid-cols-1'}`}>
                  {/* Hero image */}
                  <div className="relative group aspect-[16/10] rounded-xl overflow-hidden bg-secondary/30">
                    <img src={mainImage.image_url} alt={mainImage.alt_text || car.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3">
                      <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] uppercase tracking-[0.08em] font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1" style={oswald}>
                        <Star className="w-3 h-3 fill-current" /> Hovedbilde
                      </span>
                    </div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 flex items-center justify-center gap-2">
                      <button onClick={() => deleteImage(mainImage.id)} className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white p-2.5 rounded-full active:scale-90 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Side stack */}
                  {sideImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-3">
                      {sideImages.map((img: any, i: number) => {
                        const realIndex = i + 1;
                        return (
                          <div key={img.id} className="relative group aspect-[4/3] sm:aspect-auto sm:h-full rounded-xl overflow-hidden bg-secondary/30">
                            <img src={img.image_url} alt={img.alt_text || car.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 flex items-center justify-center gap-1.5">
                              <button onClick={() => setCarMainImage(realIndex)} disabled={isReorderingImages}
                                className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white p-2 rounded-full active:scale-90 transition-all" title="Sett som hovedbilde">
                                <Star className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => deleteImage(img.id)}
                                className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white p-2 rounded-full active:scale-90 transition-all">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Extra images row */}
                {restImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {restImages.map((img: any, i: number) => {
                      const realIndex = i + 3;
                      return (
                        <div key={img.id} className="relative group aspect-[4/3] rounded-lg overflow-hidden bg-secondary/30">
                          <img src={img.image_url} alt={img.alt_text || car.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 flex items-center justify-center gap-1.5">
                            {realIndex > 0 && (
                              <button onClick={() => moveCarImageLeft(realIndex)} disabled={isReorderingImages}
                                className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white p-1.5 rounded-full active:scale-90 transition-all">
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button onClick={() => setCarMainImage(realIndex)} disabled={isReorderingImages}
                              className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white p-1.5 rounded-full active:scale-90 transition-all">
                              <Star className="w-3.5 h-3.5" />
                            </button>
                            {realIndex < sortedImages.length - 1 && (
                              <button onClick={() => moveCarImageRight(realIndex)} disabled={isReorderingImages}
                                className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white p-1.5 rounded-full active:scale-90 transition-all">
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button onClick={() => deleteImage(img.id)}
                              className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white p-1.5 rounded-full active:scale-90 transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Upload more */}
                <button onClick={() => fileInputRef.current?.click()} disabled={isUploadingImages}
                  className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground/40 hover:text-primary/70 font-bold transition-colors" style={oswald}>
                  <Upload className="w-3.5 h-3.5 inline mr-1.5" />
                  {isUploadingImages ? 'Laster opp...' : 'Last opp flere bilder'}
                </button>
              </div>
            ) : (
              /* Empty gallery */
              <div className="relative border border-dashed border-border/40 rounded-xl py-16 text-center cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" strokeWidth={1.2} />
                <p className="text-[13px] uppercase tracking-[0.08em] font-bold text-muted-foreground/30" style={oswald}>
                  {isUploadingImages ? 'Laster opp...' : 'Last opp bilder'}
                </p>
                <p className="text-[11px] text-muted-foreground/20 mt-1">Første bilde blir hovedbilde</p>
              </div>
            )}
          </motion.section>

          {/* ──────────────────────────────────
              3. TIMELINE – the spine
          ────────────────────────────────── */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <CarEventsList carId={car.id} />
          </motion.section>

          {/* ──────────────────────────────────
              4. STORY (editorial, narrow)
          ────────────────────────────────── */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="max-w-[640px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[0.85rem] uppercase tracking-[0.12em] font-bold text-muted-foreground/40 flex items-center gap-2" style={oswald}>
                <BookOpen className="w-4 h-4" /> Historien
              </h2>
              {!isEditingStory ? (
                <InlineBtn variant="ghost" onClick={() => setIsEditingStory(true)}>
                  <Pencil className="w-3 h-3" /> Rediger
                </InlineBtn>
              ) : (
                <div className="flex gap-2">
                  <InlineBtn variant="primary" onClick={saveStory} disabled={isSaving}>
                    <Save className="w-3 h-3" /> {isSaving ? '...' : 'Lagre'}
                  </InlineBtn>
                  <InlineBtn variant="ghost" onClick={() => { setIsEditingStory(false); setStoryForm(car.story || ""); }}>
                    <X className="w-3 h-3" />
                  </InlineBtn>
                </div>
              )}
            </div>

            {isEditingStory ? (
              <Textarea value={storyForm} onChange={(e) => setStoryForm(e.target.value)}
                placeholder="Fortell historien om bilen din..." rows={10}
                className="bg-transparent border-border/30 min-h-[200px] text-[1rem] leading-[1.85] focus:border-primary/30" />
            ) : (
              car.story ? (
                <p className="text-foreground/55 whitespace-pre-wrap text-[1rem] leading-[1.85]">{car.story}</p>
              ) : (
                <p className="text-muted-foreground/25 italic text-[1rem] leading-[1.85]">
                  Ingen historie lagt til ennå. Trykk rediger for å fortelle historien om bilen din.
                </p>
              )
            )}
          </motion.section>

          {/* ──────────────────────────────────
              5. BASIC INFO (toned down, grid)
          ────────────────────────────────── */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[0.85rem] uppercase tracking-[0.12em] font-bold text-muted-foreground/40 flex items-center gap-2" style={oswald}>
                <Info className="w-4 h-4" /> Grunninfo
              </h2>
              {!isEditingBasic ? (
                <InlineBtn variant="ghost" onClick={() => setIsEditingBasic(true)}>
                  <Pencil className="w-3 h-3" /> Rediger
                </InlineBtn>
              ) : (
                <div className="flex gap-2">
                  <InlineBtn variant="primary" onClick={saveBasicInfo} disabled={isSaving}>
                    <Save className="w-3 h-3" /> {isSaving ? '...' : 'Lagre'}
                  </InlineBtn>
                  <InlineBtn variant="ghost" onClick={() => {
                    setIsEditingBasic(false);
                    if (car) setBasicForm({
                      brand: car.brand || "", model: car.model || "", variant: car.variant || "",
                      body_type: car.body_type || "", year: car.year?.toString() || "",
                      category: car.category || "registrert", tags: car.tags?.join(", ") || "",
                    });
                  }}>
                    <X className="w-3 h-3" />
                  </InlineBtn>
                </div>
              )}
            </div>

            <div className="border-t border-border/20 pt-4">
              {isEditingBasic ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Merke', content: (
                      <Select value={basicForm.brand} onValueChange={(v) => setBasicForm({ ...basicForm, brand: v, model: "" })}>
                        <SelectTrigger className="h-10 bg-transparent border-border/30"><SelectValue placeholder="Velg" /></SelectTrigger>
                        <SelectContent>{CAR_BRANDS.map(b => <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>)}</SelectContent>
                      </Select>
                    )},
                    { label: 'Modell', content: (
                      <Select value={basicForm.model} onValueChange={(v) => setBasicForm({ ...basicForm, model: v })}>
                        <SelectTrigger className="h-10 bg-transparent border-border/30"><SelectValue placeholder="Velg" /></SelectTrigger>
                        <SelectContent>{availableModels.map(m => <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>)}</SelectContent>
                      </Select>
                    )},
                    { label: 'Variant', content: (
                      <Input value={basicForm.variant} onChange={(e) => setBasicForm({ ...basicForm, variant: e.target.value })}
                        placeholder="f.eks. GLS" className="h-10 bg-transparent border-border/30" />
                    )},
                    { label: 'Karosseri', content: (
                      <Select value={basicForm.body_type} onValueChange={(v) => setBasicForm({ ...basicForm, body_type: v })}>
                        <SelectTrigger className="h-10 bg-transparent border-border/30"><SelectValue placeholder="Velg" /></SelectTrigger>
                        <SelectContent>{CAR_BODY_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent>
                      </Select>
                    )},
                    { label: 'Årsmodell', content: (
                      <Input type="number" value={basicForm.year} onChange={(e) => setBasicForm({ ...basicForm, year: e.target.value })}
                        placeholder="1972" className="h-10 bg-transparent border-border/30" />
                    )},
                    { label: 'Kategori', content: (
                      <Select value={basicForm.category} onValueChange={(v) => setBasicForm({ ...basicForm, category: v })}>
                        <SelectTrigger className="h-10 bg-transparent border-border/30"><SelectValue /></SelectTrigger>
                        <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                      </Select>
                    )},
                  ].map(({ label, content }) => (
                    <div key={label}>
                      <label className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground/40 block mb-1.5" style={oswald}>{label}</label>
                      {content}
                    </div>
                  ))}
                  <div className="col-span-2 sm:col-span-3">
                    <label className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground/40 block mb-1.5" style={oswald}>Tags</label>
                    <Input value={basicForm.tags} onChange={(e) => setBasicForm({ ...basicForm, tags: e.target.value })}
                      placeholder="original, restaurert" className="h-10 bg-transparent border-border/30" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-6 gap-y-3">
                  {[
                    ['Merke', car.brand], ['Modell', car.model], ['Variant', car.variant],
                    ['Karosseri', car.body_type], ['Årsmodell', car.year], ['Kategori', car.category],
                  ].map(([label, value]) => (
                    <div key={label as string}>
                      <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground/30 block mb-0.5" style={oswald}>{label}</span>
                      <p className="text-[0.85rem] text-foreground/50 capitalize">{value || '—'}</p>
                    </div>
                  ))}
                  {car.tags && car.tags.length > 0 && (
                    <div className="col-span-full mt-1">
                      <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-muted-foreground/30 block mb-1.5" style={oswald}>Tags</span>
                      <div className="flex flex-wrap gap-1.5">
                        {car.tags.map((tag: string) => (
                          <span key={tag} className="text-[11px] text-muted-foreground/40 border border-border/20 px-2 py-0.5 rounded">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.section>

          {/* ──────────────────────────────────
              6. FEED COMPOSER (subtle)
          ────────────────────────────────── */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="border-t border-border/15 pt-8">
            <h2 className="text-[0.85rem] uppercase tracking-[0.12em] font-bold text-muted-foreground/40 flex items-center gap-2 mb-4" style={oswald}>
              <Send className="w-4 h-4" /> Del i feeden
            </h2>
            <PostComposer compact postType="car_update" carId={car.id}
              snapshotTitle={car.title} snapshotImageUrl={mainImage?.image_url} snapshotEntityType="car" />
          </motion.section>

        </div>
      </div>
    </Layout>
  );
}
