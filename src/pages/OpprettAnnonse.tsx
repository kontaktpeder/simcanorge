import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { GarageLayout } from '@/components/ui/garage/GarageLayout';
import { EnamelCard } from '@/components/ui/garage/EnamelCard';
import { BigActionButton } from '@/components/ui/garage/BigActionButton';
import { SectionHeader } from '@/components/ui/garage/SectionHeader';
import { ShoppingBag, Save, Loader2, Clock, ChevronLeft, ImagePlus, X } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useOwnerProfile } from '@/hooks/useOwnerProfile';
import { useCreateMarketplaceItem, useMarketplaceCategories, useInsertMarketplaceImages } from '@/hooks/useMarketplace';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { compressImages, generateImageId, getMarketplaceImagePath, type CompressionProgress } from '@/lib/imageCompression';
import { ImageUploadProgress } from '@/components/ui/image-upload-progress';
import { supabase } from '@/integrations/supabase/client';

export default function OpprettAnnonse() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: ownerProfile, isLoading: profileLoading } = useOwnerProfile(user?.id);
  const { data: categories } = useMarketplaceCategories();
  const createItem = useCreateMarketplaceItem();
  const insertImages = useInsertMarketplaceImages();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceNote, setPriceNote] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<CompressionProgress | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?returnUrl=/dashboard/opprett-annonse');
    }
  }, [user, authLoading, navigate]);

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

  if (!ownerProfile?.approved_at) {
    return (
      <GarageLayout title="Opprett annonse" subtitle="Markedsplass">
        <EnamelCard>
          <div className="p-6 text-center">
            <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-medium mb-2">
              {ownerProfile ? 'Profil venter på godkjenning' : 'Du trenger en Entusiastprofil'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {ownerProfile
                ? 'Du kan opprette annonser når admin har godkjent profilen din.'
                : 'Opprett en Entusiastprofil først for å legge ut annonser.'}
            </p>
            <Link to="/dashboard">
              <BigActionButton variant="secondary" icon={<ChevronLeft className="w-4 h-4" />}>
                Tilbake til Dashboard
              </BigActionButton>
            </Link>
          </div>
        </EnamelCard>
      </GarageLayout>
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
      if (error) {
        console.error('Upload error:', error);
        continue;
      }

      const { data } = supabase.storage.from('simca-images').getPublicUrl(filePath);
      uploaded.push({ image_url: data.publicUrl, sort_order: i });
    }
    return uploaded;
  };

  const handleSubmit = async () => {
    if (!title.trim() || !ownerProfile || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const data = await createItem.mutateAsync({
        owner_id: ownerProfile.id,
        title: title.trim(),
        description: description.trim() || null,
        price: price ? parseFloat(price) : null,
        price_note: priceNote.trim() || null,
        category_id: categoryId || null,
        location: location.trim() || ownerProfile.location || null,
        status: 'submitted',
      });

      if (images.length > 0 && data?.id) {
        const uploaded = await uploadImages(data.id);
        if (uploaded.length > 0) {
          await insertImages.mutateAsync({ itemId: data.id, images: uploaded });
        }
      }

      navigate('/dashboard/mine-annonser');
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <GarageLayout title="Opprett annonse" subtitle="Markedsplass" description="Fyll ut informasjon om det du ønsker å selge.">
      <Link to="/dashboard/mine-annonser" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-6">
        <ChevronLeft className="h-4 w-4" /> Tilbake til dine annonser
      </Link>

      <SectionHeader title="Ny annonse" icon={<ShoppingBag className="h-5 w-5" />} />

      <EnamelCard className="mt-4">
        <div className="p-4 sm:p-6 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Tittel *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="f.eks. Simca 1000 forgasser – Weber 32"
              className="max-w-lg"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beskriv det du selger – stand, tilstand, hva som er inkludert..."
              className="min-h-[120px] resize-y"
            />
          </div>

          {/* Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Pris (kr)</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="f.eks. 1500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price-note">Prisnotat</Label>
              <Input
                id="price-note"
                value={priceNote}
                onChange={(e) => setPriceNote(e.target.value)}
                placeholder="f.eks. Kan diskuteres, Byttes"
              />
            </div>
          </div>

          {/* Category */}
          {categories && categories.length > 0 && (
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Velg kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Sted</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={ownerProfile.location || 'f.eks. Oslo'}
              className="max-w-md"
            />
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label>Bilder (valgfritt)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-wrap gap-2">
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative w-20 h-20">
                  <img src={src} alt={`Bilde ${i + 1}`} className="w-full h-full object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 p-0.5 bg-black/50 rounded-full text-white hover:bg-black/70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary/50 transition-colors"
              >
                <ImagePlus className="w-6 h-6 text-muted-foreground" />
              </button>
            </div>
          </div>

          {uploadProgress && (
            <ImageUploadProgress progress={uploadProgress} />
          )}

          {/* Godkjenningsbanner */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mt-0.5 shrink-0" />
            <p>Alt som legges ut må godkjennes før publisering.</p>
          </div>

          {/* Submit */}
          <BigActionButton
            onClick={handleSubmit}
            disabled={!title.trim() || isSubmitting}
            icon={isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? 'Oppretter...' : 'Send inn annonse'}
          </BigActionButton>
        </div>
      </EnamelCard>
    </GarageLayout>
  );
}
