import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { CarEventsList } from '@/components/car/CarEventsList';
import {
  Car, Wrench, Loader2, XCircle,
  Pencil, Save, X, Upload, Trash2, Clock, Send,
  ChevronLeft, ChevronRight, Star, ImageIcon, BookOpen, Info, ArrowLeft,
  CheckCircle2, Circle, ExternalLink, User
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { compressImages, generateImageId, getCarImagePath } from '@/lib/imageCompression';
import { useCarBrands, useCarModels } from '@/hooks/useCarCatalog';
import { CAR_BODY_TYPES } from '@/data/carBodyTypes';
import { motion } from 'framer-motion';
import { PostComposer } from '@/components/feed/PostComposer';
import { FEATURES } from '@/config/features';
import { RelationshipTypeField } from '@/components/car/RelationshipTypeField';
import { RELATIONSHIP_LABELS, type RelationshipType } from '@/lib/relationshipTypes';
import { useUpdateCarRelationship } from '@/hooks/useUpdateCarRelationship';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { canEditCarInDashboard } from '@/lib/carEditAccess';

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

import { CAR_CATEGORIES } from '@/data/carCategories';
const CATEGORIES = CAR_CATEGORIES.map(c => ({ value: c.id, label: c.label }));

const statusLabel = (s: string) => {
  switch (s) {
    case 'published': return { text: 'PUBLISERT', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' };
    case 'draft': return { text: 'KLADD', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25' };
    case 'submitted': return { text: 'INNSENDT', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/25' };
    case 'archived': return { text: 'ARKIVERT', cls: 'bg-white/5 text-white/30 border-white/10' };
    default: return { text: s.toUpperCase(), cls: 'bg-white/5 text-white/30 border-white/10' };
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
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false);

  const [basicForm, setBasicForm] = useState({
    brand: "", model: "", variant: "", body_type: "", year: "", category: "registrert", tags: "",
  });
  const [storyForm, setStoryForm] = useState("");
  const [modelOtherMode, setModelOtherMode] = useState(false);
  const [isEditingRelationship, setIsEditingRelationship] = useState(false);
  const [relationshipType, setRelationshipType] = useState<RelationshipType | "">("current_owner");
  const [relationshipNote, setRelationshipNote] = useState("");
  const [relationshipIsPublic, setRelationshipIsPublic] = useState(true);
  const updateRelationship = useUpdateCarRelationship();
  const { data: catalogBrands = [] } = useCarBrands();
  const selectedBrandId = catalogBrands.find(b => b.name === basicForm.brand)?.id ?? null;
  const { data: catalogModels = [] } = useCarModels(selectedBrandId);
  const availableModels = catalogModels;

  useEffect(() => {
    if (!authLoading && !user) navigate('/login?returnUrl=/dashboard');
  }, [user, authLoading, navigate]);

  const { data: carData, isLoading } = useQuery({
    queryKey: ['my-car', carId, user?.id],
    queryFn: async () => {
      if (!user || !carId) return null;
      const { data: myOwnerRows } = await supabase
        .from('car_owners')
        .select('user_id, role')
        .eq('car_id', carId)
        .eq('user_id', user.id);
      if (!canEditCarInDashboard(user.id, myOwnerRows ?? [])) return { hasAccess: false };
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

  // My relationship row for this car (v1, behind feature flag)
  const { data: myRelationship } = useQuery({
    queryKey: ['my-car-relationship', carId, user?.id],
    queryFn: async () => {
      if (!carId || !user) return null;
      const { data } = await supabase
        .from('car_owners')
        .select('relationship_type, relationship_note, relationship_is_public')
        .eq('car_id', carId)
        .eq('user_id', user.id)
        .maybeSingle();
      return data as {
        relationship_type: RelationshipType | null;
        relationship_note: string | null;
        relationship_is_public: boolean | null;
      } | null;
    },
    enabled: !!carId && !!user && FEATURES.relationshipModelV1,
  });

  useEffect(() => {
    if (myRelationship) {
      setRelationshipType(myRelationship.relationship_type ?? "current_owner");
      setRelationshipNote(myRelationship.relationship_note ?? "");
      setRelationshipIsPublic(myRelationship.relationship_is_public ?? true);
    }
  }, [myRelationship]);

  const saveRelationship = async () => {
    if (!user || !carId || !relationshipType) return;
    try {
      await updateRelationship.mutateAsync({
        carId,
        userId: user.id,
        relationshipType: relationshipType as RelationshipType,
        relationshipNote,
        isPublic: relationshipIsPublic,
      });
      toast.success('Relasjonen er oppdatert');
      setIsEditingRelationship(false);
      queryClient.invalidateQueries({ queryKey: ['my-car-relationship', carId, user.id] });
    } catch (err: any) {
      toast.error(err?.message || 'Kunne ikke lagre');
    }
  };

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
    setShowUnpublishDialog(false);
    setIsPublishing(true);
    try {
      const { error } = await supabase.from('cars').update({ published_at: null, status: 'draft' as any }).eq('id', car.id);
      if (error) { toast.error(`Kunne ikke skjule bilen: ${error.message}`); return; }
      toast.success('Bilen er skjult fra Bilgarasjen');
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
        try { await supabase.rpc('notify_admins_images_added', { _car_id: car.id, _car_title: car.title }); } catch { }
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
    return <Layout><div className="min-h-[60vh] flex items-center justify-center bg-background"><Loader2 className="w-7 h-7 animate-spin text-primary/80" /></div></Layout>;
  }
  if (!user) return null;
  if (carData && !carData.hasAccess) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-background">
          <XCircle className="w-12 h-12 text-destructive/40 mb-4" />
          <p className="text-lg font-bold uppercase tracking-wider text-muted-foreground" style={oswald}>Ingen tilgang</p>
          <Link to="/dashboard/mine-biler" className="mt-4 text-sm text-primary hover:text-primary/80 font-semibold uppercase tracking-wider" style={oswald}>← Tilbake</Link>
        </div>
      </Layout>
    );
  }
  if (!car) {
    return <Layout><div className="min-h-[60vh] flex flex-col items-center justify-center bg-background"><Car className="w-12 h-12 text-muted-foreground/70 mb-4" /><p className="text-lg font-bold uppercase tracking-wider text-muted-foreground/80" style={oswald}>Bilen finnes ikke</p></div></Layout>;
  }

  const sortedImages = [...(car.car_images || [])].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
  const mainImage = sortedImages[0];
  const sideImages = sortedImages.slice(1, 3);
  const restImages = sortedImages.slice(3);
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
  const moveCarImageLeft = async (index: number) => { if (index <= 0) return; const next = [...sortedImages]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; await persistCarImageOrder(next); };
  const moveCarImageRight = async (index: number) => { if (index >= sortedImages.length - 1) return; const next = [...sortedImages]; [next[index], next[index + 1]] = [next[index + 1], next[index]]; await persistCarImageOrder(next); };
  const setCarMainImage = async (index: number) => { if (index <= 0) return; const next = [...sortedImages]; const [picked] = next.splice(index, 1); next.unshift(picked); await persistCarImageOrder(next); };

  const isPublished = car.status === 'published';
  const isArchived = car.status === 'archived';
  const brandOk = !!(car.brand && car.brand.trim());
  const modelOk = !!(car.model && car.model.trim());
  const imagesOk = (car.car_images?.length || 0) >= 1;
  const canPublish = brandOk && modelOk && imagesOk && !isArchived && !isPublished;

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #070b10 0%, #0c1219 40%, #060a0f 100%)' }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 700px 400px at 20% 80%, rgba(45,212,168,0.07) 0%, transparent 65%)' }} />
          {mainImage && (
            <div className="absolute inset-0 pointer-events-none">
              <img src={mainImage.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15 saturate-50 blur-[1px]" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(7,11,16,0.6) 0%, rgba(7,11,16,0.9) 60%, rgba(7,11,16,1) 100%)' }} />
            </div>
          )}
          <div className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none overflow-hidden">
            <div className="h-full w-full" style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(45,212,168,0.4) 30%, rgba(52,234,184,0.6) 50%, rgba(45,212,168,0.4) 70%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 4s ease-in-out infinite',
            }} />
          </div>
          <div className="relative z-10 max-w-[900px] mx-auto px-5 sm:px-8 pt-8 pb-10 sm:pt-10 sm:pb-14">
            <Link to="/garasje"
              className="inline-flex items-center gap-1.5 text-white/30 hover:text-white/60 mb-6 transition-colors text-[13px] uppercase tracking-[0.15em] font-semibold"
              style={oswald}>
              <ArrowLeft className="w-4 h-4" /> Garasje
            </Link>
            <div className="flex items-center gap-3 mb-3">
              {car.overhauled && (
                <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.1em] font-bold text-emerald-400/70" style={oswald}>
                  <Wrench className="w-3.5 h-3.5" /> Overhalt
                </span>
              )}
            </div>
            {car.year && (
              <span className="text-[1.5rem] sm:text-[1.8rem] font-bold text-primary/20 leading-none block mb-0.5" style={chakra}>{car.year}</span>
            )}
            <h1 className="text-[1.5rem] sm:text-[2rem] md:text-[2.4rem] leading-[0.95] uppercase tracking-wide text-white font-bold"
              style={chakra}>
              {car.title}
            </h1>
            <div className="mt-4 h-[2px] w-48 rounded-full" style={{
              background: 'linear-gradient(90deg, hsl(168 70% 42% / 0.6) 0%, hsl(168 70% 42% / 0.15) 70%, transparent 100%)',
            }} />
            {isPublished && car.slug && (
              <Link to={`/biler/${car.slug}`}
                className="inline-flex items-center gap-1.5 mt-4 text-[12px] uppercase tracking-[0.12em] font-bold text-primary/50 hover:text-primary transition-colors" style={oswald}>
                <ExternalLink className="w-3.5 h-3.5" /> Se offentlig side
              </Link>
            )}
          </div>
        </section>
        <div className="max-w-[900px] mx-auto px-5 sm:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16">
          {!isArchived && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
              {isPublished ? (
                <div className="flex items-center justify-between py-3 px-5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06]">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-[13px] uppercase tracking-[0.08em] font-bold" style={oswald}>Bilen er live</span>
                  </div>
                  <button onClick={() => setShowUnpublishDialog(true)} disabled={isPublishing}
                    className="text-[13px] uppercase tracking-[0.08em] font-bold text-muted-foreground/80 hover:text-muted-foreground transition-colors" style={oswald}>
                    {isPublishing ? '...' : 'Skjul midlertidig'}
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-border/40 bg-card/50 p-5 space-y-4">
                  {openRequest && (
                    <div className="flex items-center gap-3 bg-amber-500/[0.08] border border-amber-500/20 rounded-lg p-3">
                      <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                      <p className="text-[13px] text-amber-400/80 flex-1 font-semibold uppercase tracking-wide" style={oswald}>Åpen forespørsel</p>
                      <button onClick={cancelRequest} className="text-[12px] uppercase tracking-wider font-bold text-muted-foreground/80 hover:text-muted-foreground" style={oswald}>Avbryt</button>
                    </div>
                  )}
                  <div>
                    <p className="text-[14px] uppercase tracking-[0.08em] font-bold text-foreground/90" style={oswald}>Bilen din ligger og venter</p>
                    <p className="text-[13px] text-muted-foreground mt-1">Klar til å la andre som er glad i bil få se den?</p>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    {[
                      { ok: brandOk, label: 'Merke' },
                      { ok: modelOk, label: 'Modell' },
                      { ok: imagesOk, label: 'Minst 1 bilde' },
                    ].map(({ ok, label }) => (
                      <span key={label} className={`inline-flex items-center gap-1.5 text-[13px] uppercase tracking-[0.06em] font-semibold ${ok ? 'text-emerald-400' : 'text-muted-foreground/70'}`} style={oswald}>
                        {ok ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />} {label}
                      </span>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <button onClick={handlePublish} disabled={!canPublish || isPublishing}
                      className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold text-[13px] uppercase tracking-[0.1em] px-6 py-3 rounded-lg transition-all hover:brightness-110 disabled:opacity-40 shadow-[0_0_20px_rgba(45,212,168,0.15)]"
                      style={chakra}>
                      <Send className="w-4 h-4" /> {isPublishing ? 'Publiserer...' : 'Publiser bilen'}
                    </button>
                    <p className="text-[11px] text-muted-foreground/70">Du kan alltid skjule den igjen.</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <SectionHeading icon={<ImageIcon />} title="BILDER" />
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" multiple className="hidden" />
            {sortedImages.length > 0 ? (
              <div className="space-y-3">
                <div className={`grid gap-2.5 ${sideImages.length > 0 ? 'grid-cols-1 sm:grid-cols-[1fr_0.42fr]' : 'grid-cols-1'}`}>
                  <div className="relative group aspect-[16/10] rounded-xl overflow-hidden bg-secondary/30">
                    <img src={mainImage.image_url} alt={mainImage.alt_text || car.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3">
                      <span className="bg-black/50 backdrop-blur-sm text-white text-[11px] uppercase tracking-[0.08em] font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1" style={oswald}>
                        <Star className="w-3 h-3 fill-current" /> Hovedbilde
                      </span>
                    </div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 flex items-center justify-center gap-2">
                      <button onClick={() => deleteImage(mainImage.id)} className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white p-2.5 rounded-full"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  {sideImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-1 gap-2.5">
                      {sideImages.map((img: any, i: number) => {
                        const realIndex = i + 1;
                        return (
                          <div key={img.id} className="relative group aspect-[4/3] sm:aspect-auto sm:h-full rounded-xl overflow-hidden bg-secondary/30">
                            <img src={img.image_url} alt={img.alt_text || car.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 flex items-center justify-center gap-1.5">
                              <button onClick={() => setCarMainImage(realIndex)} disabled={isReorderingImages} className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white p-2 rounded-full" title="Sett som hovedbilde"><Star className="w-3.5 h-3.5" /></button>
                              <button onClick={() => deleteImage(img.id)} className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white p-2 rounded-full"><Trash2 className="w-3.5 h-3.5" /></button>
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
                        <div key={img.id} className="relative group aspect-[4/3] rounded-lg overflow-hidden bg-secondary/30">
                          <img src={img.image_url} alt={img.alt_text || car.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 flex items-center justify-center gap-1.5">
                            {realIndex > 0 && <button onClick={() => moveCarImageLeft(realIndex)} disabled={isReorderingImages} className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white p-1.5 rounded-full"><ChevronLeft className="w-3.5 h-3.5" /></button>}
                            <button onClick={() => setCarMainImage(realIndex)} disabled={isReorderingImages} className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white p-1.5 rounded-full"><Star className="w-3.5 h-3.5" /></button>
                            {realIndex < sortedImages.length - 1 && <button onClick={() => moveCarImageRight(realIndex)} disabled={isReorderingImages} className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white p-1.5 rounded-full"><ChevronRight className="w-3.5 h-3.5" /></button>}
                            <button onClick={() => deleteImage(img.id)} className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white p-1.5 rounded-full"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <button onClick={() => fileInputRef.current?.click()} disabled={isUploadingImages}
                  className="inline-flex items-center gap-2 text-[13px] uppercase tracking-[0.1em] font-bold text-muted-foreground/80 hover:text-primary transition-colors mt-1" style={oswald}>
                  <Upload className="w-4 h-4" />
                  {isUploadingImages ? 'Laster opp...' : 'Last opp flere bilder'}
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border/40 rounded-xl py-14 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/[0.03] transition-all"
                onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" strokeWidth={1.2} />
                <p className="text-[14px] uppercase tracking-[0.08em] font-bold text-muted-foreground/80" style={oswald}>
                  {isUploadingImages ? 'Laster opp...' : 'Last opp bilder'}
                </p>
                <p className="text-[13px] text-muted-foreground/70 mt-1" style={oswald}>Første bilde blir hovedbilde</p>
              </div>
            )}
          </motion.section>
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <CarEventsList carId={car.id} />
          </motion.section>
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between mb-4">
              <SectionHeading icon={<BookOpen />} title="HISTORIEN" />
              {!isEditingStory ? (
                <ActionBtn onClick={() => setIsEditingStory(true)}><Pencil className="w-3.5 h-3.5" /> Rediger</ActionBtn>
              ) : (
                <div className="flex gap-2">
                  <ActionBtn variant="primary" onClick={saveStory} disabled={isSaving}><Save className="w-3.5 h-3.5" /> {isSaving ? '...' : 'Lagre'}</ActionBtn>
                  <ActionBtn onClick={() => { setIsEditingStory(false); setStoryForm(car.story || ""); }}><X className="w-3.5 h-3.5" /> Avbryt</ActionBtn>
                </div>
              )}
            </div>
            <div className="max-w-[660px]">
              {isEditingStory ? (
                <Textarea value={storyForm} onChange={(e) => setStoryForm(e.target.value)}
                  placeholder="Fortell historien om bilen din..."
                  rows={8}
                  className="bg-card border-border text-[15px] text-foreground leading-[1.8] focus:border-primary/40 focus:ring-primary/20 rounded-lg min-h-[180px]" />
              ) : car.story ? (
                <p className="text-[15px] text-foreground/90 whitespace-pre-wrap leading-[1.8]">{car.story}</p>
              ) : (
                <p className="text-[15px] text-muted-foreground/70 italic leading-[1.8]">
                  Ingen historie lagt til ennå. Trykk «Rediger» for å fortelle historien om bilen din.
                </p>
              )}
            </div>
          </motion.section>
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="flex items-center justify-between mb-4">
              <SectionHeading icon={<Info />} title="GRUNNINFO" />
              {!isEditingBasic ? (
                <ActionBtn onClick={() => setIsEditingBasic(true)}><Pencil className="w-3.5 h-3.5" /> Rediger</ActionBtn>
              ) : (
                <div className="flex gap-2">
                  <ActionBtn variant="primary" onClick={saveBasicInfo} disabled={isSaving}><Save className="w-3.5 h-3.5" /> {isSaving ? '...' : 'Lagre'}</ActionBtn>
                  <ActionBtn onClick={() => {
                    setIsEditingBasic(false);
                    if (car) setBasicForm({ brand: car.brand || "", model: car.model || "", variant: car.variant || "", body_type: car.body_type || "", year: car.year?.toString() || "", category: car.category || "registrert", tags: car.tags?.join(", ") || "" });
                  }}><X className="w-3.5 h-3.5" /> Avbryt</ActionBtn>
                </div>
              )}
            </div>
            <div className="rounded-xl border border-border/40 bg-card/50 p-5 sm:p-6">
              {isEditingBasic ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <FieldLabel label="Merke">
                    <Select value={basicForm.brand} onValueChange={(v) => setBasicForm({ ...basicForm, brand: v, model: "" })}>
                      <SelectTrigger className="h-11 bg-card border-border text-[15px] text-foreground"><SelectValue placeholder="Velg merke" /></SelectTrigger>
                      <SelectContent>{catalogBrands.map(b => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </FieldLabel>
                  <FieldLabel label="Modell">
                    {availableModels.length > 0 && !modelOtherMode ? (
                      <Select
                        value={availableModels.some(m => m.name === basicForm.model) ? basicForm.model : ''}
                        onValueChange={(v) => {
                          if (v === '__other__') {
                            setModelOtherMode(true);
                            setBasicForm({ ...basicForm, model: '' });
                          } else {
                            setBasicForm({ ...basicForm, model: v });
                          }
                        }}
                      >
                        <SelectTrigger className="h-11 bg-card border-border text-[15px] text-foreground"><SelectValue placeholder="Velg modell" /></SelectTrigger>
                        <SelectContent>
                          {availableModels.map(m => <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>)}
                          <SelectItem value="__other__">Annet (skriv inn)</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          value={basicForm.model}
                          onChange={(e) => setBasicForm({ ...basicForm, model: e.target.value })}
                          placeholder="Skriv inn modell"
                          className="h-11 bg-card border-border text-[15px] text-foreground flex-1"
                        />
                        {availableModels.length > 0 && (
                          <button
                            type="button"
                            onClick={() => { setModelOtherMode(false); setBasicForm({ ...basicForm, model: '' }); }}
                            className="px-3 text-xs text-muted-foreground hover:text-foreground underline whitespace-nowrap"
                          >
                            Velg fra liste
                          </button>
                        )}
                      </div>
                    )}
                  </FieldLabel>
                  <FieldLabel label="Variant">
                    <Input value={basicForm.variant} onChange={(e) => setBasicForm({ ...basicForm, variant: e.target.value })}
                      placeholder="f.eks. GLS" className="h-11 bg-card border-border text-[15px] text-foreground" />
                  </FieldLabel>
                  <FieldLabel label="Karosseri">
                    <Select value={basicForm.body_type} onValueChange={(v) => setBasicForm({ ...basicForm, body_type: v })}>
                      <SelectTrigger className="h-11 bg-card border-border text-[15px] text-foreground"><SelectValue placeholder="Velg type" /></SelectTrigger>
                      <SelectContent>{CAR_BODY_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </FieldLabel>
                  <FieldLabel label="Årsmodell">
                    <Input type="number" value={basicForm.year} onChange={(e) => setBasicForm({ ...basicForm, year: e.target.value })}
                      placeholder="1972" className="h-11 bg-card border-border text-[15px] text-foreground" />
                  </FieldLabel>
                  <FieldLabel label="Kategori">
                    <Select value={basicForm.category} onValueChange={(v) => setBasicForm({ ...basicForm, category: v })}>
                      <SelectTrigger className="h-11 bg-card border-border text-[15px] text-foreground"><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </FieldLabel>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <FieldLabel label="Tags (kommaseparert)">
                      <Input value={basicForm.tags} onChange={(e) => setBasicForm({ ...basicForm, tags: e.target.value })}
                        placeholder="original, restaurert, rallye" className="h-11 bg-card border-border text-[15px] text-foreground" />
                    </FieldLabel>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4">
                  {[
                    ['Merke', car.brand], ['Modell', car.model], ['Variant', car.variant],
                    ['Karosseri', car.body_type], ['Årsmodell', car.year], ['Kategori', car.category],
                  ].map(([label, value]) => (
                    <div key={label as string}>
                      <span className="text-[12px] uppercase tracking-[0.12em] font-bold text-muted-foreground/80 block mb-1" style={oswald}>{label}</span>
                      <p className="text-[15px] text-foreground/90 capitalize font-medium">{value || '—'}</p>
                    </div>
                  ))}
                  {car.tags && car.tags.length > 0 && (
                    <div className="col-span-full mt-2">
                      <span className="text-[12px] uppercase tracking-[0.12em] font-bold text-muted-foreground/80 block mb-2" style={oswald}>Tags</span>
                      <div className="flex flex-wrap gap-2">
                        {car.tags.map((tag: string) => (
                          <span key={tag} className="text-[13px] text-foreground/85 bg-secondary border border-border px-2.5 py-1 rounded-md font-medium">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.section>
          {FEATURES.relationshipModelV1 && (
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
              <div className="flex items-center justify-between mb-4">
                <SectionHeading icon={<User />} title="MIN RELASJON TIL BILEN" />
                {!isEditingRelationship ? (
                  <ActionBtn onClick={() => setIsEditingRelationship(true)}><Pencil className="w-3.5 h-3.5" /> Rediger</ActionBtn>
                ) : (
                  <div className="flex gap-2">
                    <ActionBtn variant="primary" onClick={saveRelationship} disabled={updateRelationship.isPending}>
                      <Save className="w-3.5 h-3.5" /> {updateRelationship.isPending ? '...' : 'Lagre'}
                    </ActionBtn>
                    <ActionBtn onClick={() => {
                      setIsEditingRelationship(false);
                      setRelationshipType(myRelationship?.relationship_type ?? "current_owner");
                      setRelationshipNote(myRelationship?.relationship_note ?? "");
                      setRelationshipIsPublic(myRelationship?.relationship_is_public ?? true);
                    }}><X className="w-3.5 h-3.5" /> Avbryt</ActionBtn>
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-border/40 bg-card/50 p-5 sm:p-6 max-w-[660px]">
                {isEditingRelationship ? (
                  <div className="space-y-4">
                    <RelationshipTypeField
                      value={relationshipType}
                      note={relationshipNote}
                      onChange={({ value, note }) => {
                        setRelationshipType(value);
                        setRelationshipNote(note);
                      }}
                    />
                    <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={relationshipIsPublic}
                        onChange={(e) => setRelationshipIsPublic(e.target.checked)}
                        className="w-5 h-5 mt-0.5 accent-primary flex-shrink-0"
                      />
                      <span className="text-sm text-foreground/90">
                        Vis denne relasjonen offentlig på bilens side
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[12px] uppercase tracking-[0.12em] font-bold text-muted-foreground/80" style={oswald}>Relasjon</p>
                    <p className="text-[15px] text-foreground/90 font-medium">
                      {relationshipType ? RELATIONSHIP_LABELS[relationshipType as RelationshipType] : '—'}
                    </p>
                    {relationshipType === 'other' && relationshipNote && (
                      <p className="text-[14px] text-muted-foreground italic">"{relationshipNote}"</p>
                    )}
                    <p className="text-[12px] text-muted-foreground/80 mt-2">
                      {relationshipIsPublic ? 'Vises offentlig på bilens side' : 'Skjult fra offentlig visning'}
                    </p>
                  </div>
                )}
              </div>
            </motion.section>
          )}
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <SectionHeading icon={<Send />} title="DEL I FEEDEN" />
            <PostComposer compact postType="car_update" carId={car.id}
              snapshotTitle={car.title} snapshotImageUrl={mainImage?.image_url} snapshotEntityType="car" />
          </motion.section>
        </div>
      </div>

      <AlertDialog open={showUnpublishDialog} onOpenChange={setShowUnpublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Skjul bilen midlertidig?</AlertDialogTitle>
            <AlertDialogDescription>
              Bilen forsvinner fra Bilgarasjen og blir liggende trygt i garasjen din. Du kan vise den frem igjen når som helst.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnpublish}>Skjul midlertidig</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}

const sectionOswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h2 className="flex items-center gap-2 text-[14px] uppercase tracking-[0.12em] font-bold text-muted-foreground/80" style={sectionOswald}>
      <span className="text-primary/80 [&>svg]:w-[18px] [&>svg]:h-[18px]">{icon}</span>
      {title}
    </h2>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[13px] uppercase tracking-[0.08em] font-bold text-muted-foreground/80 block mb-2" style={sectionOswald}>{label}</label>
      {children}
    </div>
  );
}

function ActionBtn({ onClick, disabled, children, variant = 'ghost' }: {
  onClick?: () => void; disabled?: boolean; children: React.ReactNode; variant?: 'primary' | 'ghost';
}) {
  const cls = variant === 'primary'
    ? 'bg-primary text-primary-foreground hover:brightness-110'
    : 'text-muted-foreground/80 hover:text-foreground hover:bg-white/[0.04]';
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.08em] font-bold px-3 py-2 rounded-lg transition-all active:scale-95 disabled:opacity-40 ${cls}`}
      style={sectionOswald}>
      {children}
    </button>
  );
}
