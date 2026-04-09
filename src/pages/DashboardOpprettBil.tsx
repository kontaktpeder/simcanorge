import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { GarageLayout } from '@/components/ui/garage/GarageLayout';
import { EnamelCard } from '@/components/ui/garage/EnamelCard';
import { BigActionButton } from '@/components/ui/garage/BigActionButton';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Car, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CAR_BRANDS, getModelsForBrand, getVariantsForModel } from '@/data/carBrands';
import { CAR_BODY_TYPES } from '@/data/carBodyTypes';
import { compressImages, generateImageId, getCarImagePath } from '@/lib/imageCompression';
import { motion } from 'framer-motion';

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

    setIsSaving(true);
    try {
      const title = [brand, model, variant].filter(Boolean).join(' ');
      const baseSlug = generateSlug(title);
      const slug = `${baseSlug}-${Date.now().toString(36)}`;

      const userEmail = user.email || '';

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
        // Still proceed — car exists
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
        // The trigger will raise exceptions for missing requirements
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

          <BigActionButton
            onClick={handleCreateCar}
            disabled={isSaving || !brand || !model}
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
