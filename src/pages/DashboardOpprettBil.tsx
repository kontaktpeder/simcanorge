import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GarageLayout } from '@/components/ui/garage/GarageLayout';
import { EnamelCard } from '@/components/ui/garage/EnamelCard';
import { BigActionButton } from '@/components/ui/garage/BigActionButton';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Car, Upload, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CAR_BRANDS, getModelsForBrand, getVariantsForModel } from '@/data/carBrands';
import { CAR_BODY_TYPES } from '@/data/carBodyTypes';
import { compressImages, generateImageId, getCarImagePath } from '@/lib/imageCompression';

const CATEGORIES = [
  { value: 'registrert', label: 'Registrert' },
  { value: 'prosjekt', label: 'Prosjekt' },
  { value: 'veteran', label: 'Veteranbil' },
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

export default function DashboardOpprettBil() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [createdCarId, setCreatedCarId] = useState<string | null>(null);
  const [uploadedCount, setUploadedCount] = useState(0);

  // Form
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [variant, setVariant] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [year, setYear] = useState('');
  const [category, setCategory] = useState('registrert');
  const [story, setStory] = useState('');

  // Consent fields
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
        <div className="container py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  const availableModels = brand ? getModelsForBrand(brand) : [];
  const availableVariants = brand && model ? getVariantsForModel(brand, model) : [];

  const handleCreateCar = async () => {
    if (!brand || !model) {
      toast.error('Merke og modell er påkrevd');
      return;
    }

    if (allowEdits === null) {
      toast.error('Du må velge om du godkjenner redigering');
      return;
    }

    if (clubLinkRequested && !clubPageId) {
      toast.error('Velg ønsket klubb');
      return;
    }

    setIsSaving(true);
    try {
      const title = [brand, model, variant].filter(Boolean).join(' ');
      const baseSlug = generateSlug(title);
      const slug = `${baseSlug}-${Date.now().toString(36)}`;

      const userEmail = user.email || '';

      const submissionPayload = {
        submitted_at: new Date().toISOString(),
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
      };

      // 1. Create car
      const { data: car, error: carError } = await supabase
        .from('cars')
        .insert({
          title,
          slug,
          brand,
          model,
          variant: variant || null,
          body_type: bodyType || null,
          year: year ? parseInt(year) : null,
          category,
          story: story || null,
          source: 'owner_self' as any,
          status: 'draft' as any,
          created_by_user_id: user.id,
          allow_edits: allowEdits === true,
          submission_payload: submissionPayload,
        })
        .select('id')
        .single();

      if (carError) {
        console.error('Car create error:', carError);
        toast.error('Kunne ikke opprette bil: ' + (carError.message || 'Ukjent feil'));
        return;
      }

      // 2. Claim ownership
      const { error: ownerError } = await supabase
        .from('car_owners')
        .insert({
          car_id: car.id,
          user_id: user.id,
          email: userEmail,
          role: 'owner',
        });

      if (ownerError) {
        console.error('Owner claim error:', ownerError);
        toast.error('Bil opprettet, men kunne ikke knytte deg som eier. Kontakt admin.');
      }

      // 3. Club link request via RPC
      if (clubLinkRequested && selectedClub) {
        try {
          const { data: rpcResult } = await supabase.rpc('create_page_car_link_request', {
            p_car_id: car.id,
            p_page_id: selectedClub.id,
            p_message: clubMessage.trim() || null,
          });
          const rpcData = rpcResult as { success?: boolean } | null;
          if (rpcData && !rpcData.success) {
            console.warn('Club link request RPC returned:', rpcData);
          }
        } catch (rpcErr) {
          console.error('Club link request failed:', rpcErr);
        }
      }

      setCreatedCarId(car.id);
      setStep('images');
      toast.success('Bil opprettet! Last opp bilder for å kunne publisere.');
    } catch (err: any) {
      console.error('Unexpected error:', err);
      toast.error('Uventet feil ved opprettelse');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !createdCarId) return;

    setIsUploading(true);
    try {
      const results = await compressImages(Array.from(files));
      let successCount = 0;

      for (const result of results) {
        const imageId = generateImageId();
        const filePath = getCarImagePath(createdCarId, imageId);

        const { error: uploadError } = await supabase.storage
          .from('simca-images')
          .upload(filePath, result.file, { contentType: 'image/webp' });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('simca-images')
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from('car_images')
          .insert({
            car_id: createdCarId,
            image_url: urlData.publicUrl,
            sort_order: uploadedCount + successCount,
          });

        if (dbError) {
          console.error('DB error:', dbError);
        } else {
          successCount++;
        }
      }

      setUploadedCount(prev => prev + successCount);
      toast.success(`${successCount} bilde(r) lastet opp`);
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Feil ved bildeopplasting');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePublish = async () => {
    if (!createdCarId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('cars')
        .update({ published_at: new Date().toISOString(), status: 'published' as any })
        .eq('id', createdCarId);

      if (error) {
        console.error('Publish error:', error);
        if (error.message?.includes('Merke')) {
          toast.error('Merke må være satt før publisering');
        } else if (error.message?.includes('Modell')) {
          toast.error('Modell må være satt før publisering');
        } else if (error.message?.includes('bilde')) {
          toast.error('Minst ett bilde kreves for publisering');
        } else {
          toast.error('Kunne ikke publisere: ' + error.message);
        }
        return;
      }

      setStep('done');
      toast.success('Bilen er publisert!');
    } catch (err) {
      toast.error('Uventet feil ved publisering');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = () => {
    toast.success('Bilen er lagret som kladd. Du finner den under «Mine biler».');
    navigate('/dashboard/mine-biler');
  };

  // ─── STEP: Done ───
  if (step === 'done') {
    return (
      <GarageLayout
        title="Bil publisert"
        subtitle="Bilgarasje"
        showBackButton
        backTo="/dashboard/mine-biler"
        backLabel="Til bilgarasjen"
      >
        <EnamelCard>
          <div className="text-center py-12 px-4">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-600" />
            <h2 className="text-xl font-bold mb-2">Bilen er publisert!</h2>
            <p className="text-muted-foreground mb-6">
              Bilen er nå synlig på nettsiden. Du kan redigere detaljer og bilder når som helst.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <BigActionButton onClick={() => navigate(`/dashboard/bil/${createdCarId}`)}>
                Gå til bilen
              </BigActionButton>
              <BigActionButton variant="outline" onClick={() => navigate('/dashboard/mine-biler')}>
                Til bilgarasjen
              </BigActionButton>
            </div>
          </div>
        </EnamelCard>
      </GarageLayout>
    );
  }

  // ─── STEP: Images ───
  if (step === 'images') {
    return (
      <GarageLayout
        title="Last opp bilder"
        subtitle="Bilgarasje"
        description="Last opp minst ett bilde for å kunne publisere bilen."
        showBackButton
        backTo="/dashboard/mine-biler"
        backLabel="Til bilgarasjen"
      >
        <div className="space-y-6">
          <EnamelCard>
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <Upload className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">Bilder</h3>
                {uploadedCount > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {uploadedCount} lastet opp
                  </span>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />

              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full h-24 border-dashed"
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Laster opp...
                  </span>
                ) : (
                  <span className="flex flex-col items-center gap-1">
                    <Upload className="w-5 h-5" />
                    <span className="text-sm">Klikk for å laste opp bilder</span>
                  </span>
                )}
              </Button>

              {uploadedCount === 0 && (
                <div className="flex items-start gap-2 mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Minst ett bilde kreves for å publisere bilen.
                  </p>
                </div>
              )}
            </div>
          </EnamelCard>

          <div className="flex flex-col sm:flex-row gap-3">
            <BigActionButton
              onClick={handlePublish}
              disabled={uploadedCount === 0 || isSaving}
              className="flex-1"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publiserer...
                </span>
              ) : (
                'Publiser bilen'
              )}
            </BigActionButton>
            <BigActionButton variant="outline" onClick={handleSaveDraft} className="flex-1">
              Lagre som kladd
            </BigActionButton>
          </div>
        </div>
      </GarageLayout>
    );
  }

  // ─── STEP: Info ───
  return (
    <GarageLayout
      title="Opprett ny bil"
      subtitle="Bilgarasje"
      description="Fyll inn informasjon om bilen din."
      showBackButton
      backTo="/dashboard/mine-biler"
      backLabel="Til bilgarasjen"
    >
      <EnamelCard>
        <div className="p-5 sm:p-6 space-y-5">
          {/* Brand */}
          <div className="space-y-2">
            <Label>Merke *</Label>
            <Select value={brand} onValueChange={(v) => { setBrand(v); setModel(''); setVariant(''); }}>
              <SelectTrigger><SelectValue placeholder="Velg merke" /></SelectTrigger>
              <SelectContent>
                {CAR_BRANDS.map(b => (
                  <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label>Modell *</Label>
            {availableModels.length > 0 ? (
              <Select value={model} onValueChange={(v) => { setModel(v); setVariant(''); }}>
                <SelectTrigger><SelectValue placeholder="Velg modell" /></SelectTrigger>
                <SelectContent>
                  {availableModels.map(m => (
                    <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Skriv modellnavn" />
            )}
          </div>

          {/* Variant */}
          <div className="space-y-2">
            <Label>Variant</Label>
            {availableVariants.length > 0 ? (
              <Select value={variant} onValueChange={setVariant}>
                <SelectTrigger><SelectValue placeholder="Velg variant (valgfritt)" /></SelectTrigger>
                <SelectContent>
                  {availableVariants.map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={variant} onChange={(e) => setVariant(e.target.value)} placeholder="Variant (valgfritt)" />
            )}
          </div>

          {/* Body type */}
          <div className="space-y-2">
            <Label>Karosseri</Label>
            <Select value={bodyType} onValueChange={setBodyType}>
              <SelectTrigger><SelectValue placeholder="Velg karosseri (valgfritt)" /></SelectTrigger>
              <SelectContent>
                {CAR_BODY_TYPES.map(bt => (
                  <SelectItem key={bt.id} value={bt.id}>{bt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year */}
          <div className="space-y-2">
            <Label>Årstall</Label>
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="f.eks. 1964"
              min={1900}
              max={2030}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Story */}
          <div className="space-y-2">
            <Label>Historien bak bilen</Label>
            <Textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Fortell om bilens historie, restaurering eller hva som gjør den spesiell..."
              rows={4}
            />
          </div>

          {/* ── Consent: Redigering ── */}
          <div className="space-y-2 p-3 sm:p-4 bg-muted/30 rounded-lg border-2 border-muted">
            <p className="font-semibold text-base mb-2">Godkjenning for redigering *</p>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3">
              Vi kan rette små skrivefeil, tydeliggjøre detaljer og legge til teknisk info. Innholdet endres ikke helt – vi bygger videre på det du har sendt inn.
            </p>
            <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <input type="radio" name="allowEdits" checked={allowEdits === true} onChange={() => setAllowEdits(true)} className="w-5 h-5 mt-0.5 accent-primary flex-shrink-0" />
              <span className="text-sm text-foreground font-medium">
                Ja, jeg godkjenner at Simca Norge kan redigere og forbedre innsendelsen min.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <input type="radio" name="allowEdits" checked={allowEdits === false} onChange={() => setAllowEdits(false)} className="w-5 h-5 mt-0.5 accent-primary flex-shrink-0" />
              <span className="text-sm text-foreground font-medium">
                Nei, jeg ønsker at innholdet publiseres som det er.
              </span>
            </label>
          </div>

          {/* ── Consent: Klubbtilknytning ── */}
          <div className="p-3 sm:p-4 bg-muted/30 rounded-lg border-2 border-muted">
            <p className="font-semibold text-base mb-2 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Knytte bilen til en klubb
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3">
              Ønsker du at bilen skal vises på en klubbside? Klubben/admin godkjenner koblingen.
            </p>
            <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                checked={clubLinkRequested}
                onChange={(e) => {
                  setClubLinkRequested(e.target.checked);
                  if (!e.target.checked) { setClubPageId(''); setClubMessage(''); }
                }}
                className="w-5 h-5 mt-0.5 accent-primary flex-shrink-0"
              />
              <span className="text-sm text-foreground font-medium">
                Ja, jeg ønsker å knytte bilen til en klubb på Bilgarasjen
              </span>
            </label>

            {clubLinkRequested && (
              <div className="mt-3 space-y-3 pl-8">
                <div>
                  <Label className="text-sm font-medium">Velg klubb *</Label>
                  <select
                    value={clubPageId}
                    onChange={(e) => setClubPageId(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-md border bg-background mt-1"
                  >
                    <option value="">Velg klubb...</option>
                    {clubs?.map(club => (
                      <option key={club.id} value={club.id}>{club.title}</option>
                    ))}
                  </select>
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

          {/* ── Consent: Instagram ── */}
          <div className="p-3 sm:p-4 bg-muted/30 rounded-lg border-2 border-muted">
            <p className="font-semibold text-base mb-2">Deling på Instagram</p>
            <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                checked={allowInstagram}
                onChange={(e) => setAllowInstagram(e.target.checked)}
                className="w-5 h-5 mt-0.5 accent-primary flex-shrink-0"
              />
              <span className="text-sm text-foreground font-medium">
                Jeg godkjenner at bilder og beskrivelse av bilen min deles på Simca Norge sin{' '}
                <a
                  href="https://www.instagram.com/simcanorge/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-accent"
                >
                  Instagram
                </a>.
              </span>
            </label>
          </div>

          <BigActionButton
            onClick={handleCreateCar}
            disabled={isSaving || !brand || !model || allowEdits === null}
            className="w-full"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Oppretter...
              </span>
            ) : (
              'Neste: Last opp bilder'
            )}
          </BigActionButton>
        </div>
      </EnamelCard>
    </GarageLayout>
  );
}
