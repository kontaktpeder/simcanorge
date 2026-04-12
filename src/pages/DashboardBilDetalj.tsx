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
  CheckCircle2, Circle, ExternalLink
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

const CATEGORIES = [
  { value: 'registrert', label: 'Registrert' },
  { value: 'prosjekt', label: 'Prosjekt' },
  { value: 'veteran', label: 'Veteranbil' },
];

const statusLabel = (s: string) => {
  switch (s) {
    case 'published': return { text: 'Publisert', icon: <CheckCircle2 className="w-4 h-4" />, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'draft': return { text: 'Kladd', icon: <Circle className="w-4 h-4" />, cls: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'submitted': return { text: 'Innsendt', icon: <Clock className="w-4 h-4" />, cls: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'archived': return { text: 'Arkivert', icon: <EyeOff className="w-4 h-4" />, cls: 'bg-stone-100 text-stone-500 border-stone-200' };
    default: return { text: s, icon: null, cls: 'bg-stone-100 text-stone-500 border-stone-200' };
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
    return <Layout><div className="min-h-[60vh] flex items-center justify-center bg-[#f8f7f5]"><Loader2 className="w-7 h-7 animate-spin text-stone-400" /></div></Layout>;
  }
  if (!user) return null;
  if (carData && !carData.hasAccess) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#f8f7f5]">
          <XCircle className="w-12 h-12 text-red-300 mb-4" />
          <p className="text-lg font-semibold text-stone-500">Ingen tilgang</p>
          <Link to="/dashboard/mine-biler" className="mt-4 text-sm text-teal-600 hover:text-teal-700 font-medium underline underline-offset-4">← Tilbake til mine biler</Link>
        </div>
      </Layout>
    );
  }
  if (!car) {
    return <Layout><div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#f8f7f5]"><Car className="w-12 h-12 text-stone-300 mb-4" /><p className="text-lg font-semibold text-stone-400">Bilen finnes ikke</p></div></Layout>;
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
      <div className="min-h-screen bg-[#f8f7f5]">

        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden bg-[#1e1c19]">
          {mainImage && (
            <div className="absolute inset-0">
              <img src={mainImage.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-[1px] saturate-50" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#1e1c19]/60 via-[#1e1c19]/85 to-[#1e1c19]" />
            </div>
          )}

          <div className="relative z-10 max-w-[860px] mx-auto px-5 sm:px-8 pt-8 pb-10 sm:pt-10 sm:pb-12">
            <Link to="/dashboard/mine-biler"
              className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 mb-5 transition-colors text-sm font-medium">
              <ArrowLeft className="w-4 h-4" /> Mine biler
            </Link>

            <div className="flex items-center gap-3 mb-2">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${status.cls}`}>
                {status.icon} {status.text}
              </span>
              {car.overhauled && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300">
                  <Wrench className="w-3.5 h-3.5" /> Overhalt
                </span>
              )}
            </div>

            {car.year && (
              <span className="text-2xl sm:text-3xl font-serif text-white/20 leading-none block mb-0.5">{car.year}</span>
            )}
            <h1 className="text-2xl sm:text-3xl md:text-4xl leading-tight font-bold text-white tracking-tight">
              {car.title}
            </h1>

            <div className="mt-4 h-[2px] w-40 rounded-full bg-gradient-to-r from-amber-400/60 to-transparent" />

            {isPublished && car.slug && (
              <Link to={`/biler/${car.slug}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-white/40 hover:text-white/70 transition-colors mt-4">
                <ExternalLink className="w-4 h-4" /> Se offentlig side
              </Link>
            )}
          </div>
        </section>

        {/* ─── CONTENT ─── */}
        <div className="max-w-[860px] mx-auto px-5 sm:px-8 py-8 sm:py-12 space-y-10 sm:space-y-14">

          {/* ── PUBLISH STATUS ── */}
          {!isArchived && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
              {isPublished ? (
                <div className="flex items-center justify-between py-3 px-5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-semibold">Bilen er live</span>
                  </div>
                  <button onClick={handleUnpublish} disabled={isPublishing}
                    className="text-sm font-medium text-stone-400 hover:text-stone-600 transition-colors">
                    {isPublishing ? '...' : 'Avpubliser'}
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-4">
                  {openRequest && (
                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                      <p className="text-sm text-amber-700 flex-1 font-medium">Åpen forespørsel</p>
                      <button onClick={cancelRequest} className="text-sm text-stone-400 hover:text-stone-600">Avbryt</button>
                    </div>
                  )}
                  <p className="text-sm font-semibold text-stone-700">Klar for publisering?</p>
                  <div className="flex items-center gap-4">
                    {[
                      { ok: brandOk, label: 'Merke' },
                      { ok: modelOk, label: 'Modell' },
                      { ok: imagesOk, label: 'Minst 1 bilde' },
                    ].map(({ ok, label }) => (
                      <span key={label} className={`inline-flex items-center gap-1.5 text-sm font-medium ${ok ? 'text-emerald-600' : 'text-stone-300'}`}>
                        {ok ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />} {label}
                      </span>
                    ))}
                  </div>
                  <button onClick={handlePublish} disabled={!canPublish || isPublishing}
                    className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-sm">
                    <Send className="w-4 h-4" /> {isPublishing ? 'Publiserer...' : 'Publiser bilen'}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── GALLERY ── */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <SectionHeading icon={<ImageIcon />} title="Bilder" />
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" multiple className="hidden" />

            {sortedImages.length > 0 ? (
              <div className="space-y-3">
                <div className={`grid gap-2.5 ${sideImages.length > 0 ? 'grid-cols-1 sm:grid-cols-[1fr_0.42fr]' : 'grid-cols-1'}`}>
                  <div className="relative group aspect-[16/10] rounded-xl overflow-hidden bg-stone-100">
                    <img src={mainImage.image_url} alt={mainImage.alt_text || car.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3">
                      <span className="bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-md inline-flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" /> Hovedbilde
                      </span>
                    </div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 flex items-center justify-center gap-2">
                      <button onClick={() => deleteImage(mainImage.id)} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2.5 rounded-full">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {sideImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-1 gap-2.5">
                      {sideImages.map((img: any, i: number) => {
                        const realIndex = i + 1;
                        return (
                          <div key={img.id} className="relative group aspect-[4/3] sm:aspect-auto sm:h-full rounded-xl overflow-hidden bg-stone-100">
                            <img src={img.image_url} alt={img.alt_text || car.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 flex items-center justify-center gap-1.5">
                              <button onClick={() => setCarMainImage(realIndex)} disabled={isReorderingImages}
                                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-full" title="Sett som hovedbilde">
                                <Star className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => deleteImage(img.id)}
                                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-full">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {restImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {restImages.map((img: any, i: number) => {
                      const realIndex = i + 3;
                      return (
                        <div key={img.id} className="relative group aspect-[4/3] rounded-lg overflow-hidden bg-stone-100">
                          <img src={img.image_url} alt={img.alt_text || car.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 flex items-center justify-center gap-1.5">
                            {realIndex > 0 && (
                              <button onClick={() => moveCarImageLeft(realIndex)} disabled={isReorderingImages}
                                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-1.5 rounded-full">
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button onClick={() => setCarMainImage(realIndex)} disabled={isReorderingImages}
                              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-1.5 rounded-full">
                              <Star className="w-3.5 h-3.5" />
                            </button>
                            {realIndex < sortedImages.length - 1 && (
                              <button onClick={() => moveCarImageRight(realIndex)} disabled={isReorderingImages}
                                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-1.5 rounded-full">
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button onClick={() => deleteImage(img.id)}
                              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-1.5 rounded-full">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button onClick={() => fileInputRef.current?.click()} disabled={isUploadingImages}
                  className="inline-flex items-center gap-2 text-sm font-medium text-stone-400 hover:text-teal-600 transition-colors mt-1">
                  <Upload className="w-4 h-4" />
                  {isUploadingImages ? 'Laster opp...' : 'Last opp flere bilder'}
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-stone-200 rounded-xl py-14 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-all"
                onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="w-10 h-10 text-stone-300 mx-auto mb-3" strokeWidth={1.2} />
                <p className="text-base font-semibold text-stone-400">
                  {isUploadingImages ? 'Laster opp...' : 'Last opp bilder'}
                </p>
                <p className="text-sm text-stone-400 mt-1">Første bilde blir hovedbilde</p>
              </div>
            )}
          </motion.section>

          {/* ── TIMELINE ── */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <CarEventsList carId={car.id} variant="light" />
          </motion.section>

          {/* ── STORY ── */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between mb-3">
              <SectionHeading icon={<BookOpen />} title="Historien" />
              {!isEditingStory ? (
                <EditButton onClick={() => setIsEditingStory(true)} />
              ) : (
                <div className="flex gap-2">
                  <SaveButton onClick={saveStory} isSaving={isSaving} />
                  <CancelButton onClick={() => { setIsEditingStory(false); setStoryForm(car.story || ""); }} />
                </div>
              )}
            </div>

            <div className="max-w-[640px]">
              {isEditingStory ? (
                <Textarea value={storyForm} onChange={(e) => setStoryForm(e.target.value)}
                  placeholder="Fortell historien om bilen din..."
                  rows={8}
                  className="bg-white border-stone-200 text-base text-stone-800 leading-relaxed focus:border-teal-400 focus:ring-teal-400/20 rounded-lg min-h-[180px]" />
              ) : (
                car.story ? (
                  <p className="text-base text-stone-600 whitespace-pre-wrap leading-[1.8]">{car.story}</p>
                ) : (
                  <p className="text-base text-stone-300 italic leading-relaxed">
                    Ingen historie lagt til ennå. Trykk «Rediger» for å fortelle historien om bilen din.
                  </p>
                )
              )}
            </div>
          </motion.section>

          {/* ── BASIC INFO ── */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="flex items-center justify-between mb-3">
              <SectionHeading icon={<Info />} title="Grunninfo" />
              {!isEditingBasic ? (
                <EditButton onClick={() => setIsEditingBasic(true)} />
              ) : (
                <div className="flex gap-2">
                  <SaveButton onClick={saveBasicInfo} isSaving={isSaving} />
                  <CancelButton onClick={() => {
                    setIsEditingBasic(false);
                    if (car) setBasicForm({
                      brand: car.brand || "", model: car.model || "", variant: car.variant || "",
                      body_type: car.body_type || "", year: car.year?.toString() || "",
                      category: car.category || "registrert", tags: car.tags?.join(", ") || "",
                    });
                  }} />
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-stone-200 p-5 sm:p-6">
              {isEditingBasic ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <FormField label="Merke">
                    <Select value={basicForm.brand} onValueChange={(v) => setBasicForm({ ...basicForm, brand: v, model: "" })}>
                      <SelectTrigger className="h-11 bg-white border-stone-200 text-base text-stone-800"><SelectValue placeholder="Velg merke" /></SelectTrigger>
                      <SelectContent>{CAR_BRANDS.map(b => <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Modell">
                    <Select value={basicForm.model} onValueChange={(v) => setBasicForm({ ...basicForm, model: v })}>
                      <SelectTrigger className="h-11 bg-white border-stone-200 text-base text-stone-800"><SelectValue placeholder="Velg modell" /></SelectTrigger>
                      <SelectContent>{availableModels.map(m => <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Variant">
                    <Input value={basicForm.variant} onChange={(e) => setBasicForm({ ...basicForm, variant: e.target.value })}
                      placeholder="f.eks. GLS" className="h-11 bg-white border-stone-200 text-base text-stone-800" />
                  </FormField>
                  <FormField label="Karosseri">
                    <Select value={basicForm.body_type} onValueChange={(v) => setBasicForm({ ...basicForm, body_type: v })}>
                      <SelectTrigger className="h-11 bg-white border-stone-200 text-base text-stone-800"><SelectValue placeholder="Velg type" /></SelectTrigger>
                      <SelectContent>{CAR_BODY_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Årsmodell">
                    <Input type="number" value={basicForm.year} onChange={(e) => setBasicForm({ ...basicForm, year: e.target.value })}
                      placeholder="1972" className="h-11 bg-white border-stone-200 text-base text-stone-800" />
                  </FormField>
                  <FormField label="Kategori">
                    <Select value={basicForm.category} onValueChange={(v) => setBasicForm({ ...basicForm, category: v })}>
                      <SelectTrigger className="h-11 bg-white border-stone-200 text-base text-stone-800"><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormField>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <FormField label="Tags (kommaseparert)">
                      <Input value={basicForm.tags} onChange={(e) => setBasicForm({ ...basicForm, tags: e.target.value })}
                        placeholder="original, restaurert, rallye" className="h-11 bg-white border-stone-200 text-base text-stone-800" />
                    </FormField>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4">
                  {[
                    ['Merke', car.brand], ['Modell', car.model], ['Variant', car.variant],
                    ['Karosseri', car.body_type], ['Årsmodell', car.year], ['Kategori', car.category],
                  ].map(([label, value]) => (
                    <div key={label as string}>
                      <span className="text-xs font-semibold text-stone-400 block mb-1">{label}</span>
                      <p className="text-base text-stone-700 capitalize font-medium">{value || '—'}</p>
                    </div>
                  ))}
                  {car.tags && car.tags.length > 0 && (
                    <div className="col-span-full mt-2">
                      <span className="text-xs font-semibold text-stone-400 block mb-2">Tags</span>
                      <div className="flex flex-wrap gap-2">
                        {car.tags.map((tag: string) => (
                          <span key={tag} className="text-sm text-stone-600 bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-md font-medium">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.section>

          {/* ── FEED COMPOSER ── */}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <SectionHeading icon={<Send />} title="Del i feeden" />
            <PostComposer compact postType="car_update" carId={car.id}
              snapshotTitle={car.title} snapshotImageUrl={mainImage?.image_url} snapshotEntityType="car" />
          </motion.section>

        </div>
      </div>
    </Layout>
  );
}

/* ─── Shared UI helpers ─── */

function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h2 className="flex items-center gap-2 text-base font-semibold text-stone-500">
      <span className="text-stone-400 [&>svg]:w-[18px] [&>svg]:h-[18px]">{icon}</span>
      {title}
    </h2>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-semibold text-stone-500 block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-400 hover:text-teal-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-stone-100">
      <Pencil className="w-4 h-4" /> Rediger
    </button>
  );
}

function SaveButton({ onClick, isSaving }: { onClick: () => void; isSaving: boolean }) {
  return (
    <button onClick={onClick} disabled={isSaving}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-stone-800 hover:bg-stone-900 disabled:opacity-50 px-4 py-1.5 rounded-lg transition-colors">
      <Save className="w-4 h-4" /> {isSaving ? 'Lagrer...' : 'Lagre'}
    </button>
  );
}

function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1 text-sm font-medium text-stone-400 hover:text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors">
      <X className="w-4 h-4" /> Avbryt
    </button>
  );
}
