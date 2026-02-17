import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOwnerProfile } from '@/hooks/useOwnerProfile';
import {
  useMyListings,
  useUpdateMarketplaceItem,
  useInsertMarketplaceImages,
  useDeleteMarketplaceImage,
  useDeleteMarketplaceItem,
  useMarketplaceCategories,
} from '@/hooks/useMarketplace';
import { compressImages, generateImageId, getMarketplaceImagePath } from '@/lib/imageCompression';
import { supabase } from '@/integrations/supabase/client';
import { GarageLayout } from '@/components/ui/garage/GarageLayout';
import { EnamelCard } from '@/components/ui/garage/EnamelCard';
import { BigActionButton } from '@/components/ui/garage/BigActionButton';
import { SectionHeader } from '@/components/ui/garage/SectionHeader';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingBag, ChevronLeft, Save, Loader2, ImagePlus, X, Trash2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';

export default function RedigerAnnonse() {
  const { itemId } = useParams<{ itemId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: ownerProfile } = useOwnerProfile(user?.id);
  const { data: listings, isLoading: listingsLoading } = useMyListings(user?.id);
  const item = listings?.find((i: any) => i.id === itemId);
  const { data: categories } = useMarketplaceCategories();

  const updateItem = useUpdateMarketplaceItem();
  const insertImages = useInsertMarketplaceImages();
  const deleteImage = useDeleteMarketplaceImage();
  const deleteItem = useDeleteMarketplaceItem();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceNote, setPriceNote] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<{ id: string; image_url: string; sort_order: number }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setDescription(item.description || '');
      setPrice(item.price != null ? String(item.price) : '');
      setPriceNote(item.price_note || '');
      setCategoryId(item.category_id || '');
      setLocation(item.location || '');
      const imgs = [...(item.marketplace_images || [])].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      setExistingImages(imgs.map((img: any) => ({ id: img.id, image_url: img.image_url, sort_order: img.sort_order ?? 0 })));
    }
  }, [item]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login?returnUrl=/dashboard/mine-annonser');
  }, [user, authLoading, navigate]);

  if (authLoading || listingsLoading) {
    return (
      <Layout>
        <div className="container py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user || !itemId) return null;

  if (listings && !item) {
    navigate('/dashboard/mine-annonser');
    return null;
  }

  if (item && ownerProfile && item.owner_id !== ownerProfile.id) {
    navigate('/dashboard/mine-annonser');
    return null;
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

  const removeNewImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imageId: string) => {
    if (!confirm('Fjerne dette bildet?')) return;
    await deleteImage.mutateAsync({ imageId, itemId: itemId! });
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const uploadNewImages = async (): Promise<{ image_url: string; sort_order: number }[]> => {
    if (images.length === 0) return [];
    const compressed = await compressImages(images);
    const uploaded: { image_url: string; sort_order: number }[] = [];
    const baseOrder = existingImages.length;
    for (let i = 0; i < compressed.length; i++) {
      const { file } = compressed[i];
      const imageId = generateImageId();
      const filePath = getMarketplaceImagePath(itemId!, imageId);
      const { error } = await supabase.storage.from('simca-images').upload(filePath, file, { contentType: 'image/webp' });
      if (error) continue;
      const { data } = supabase.storage.from('simca-images').getPublicUrl(filePath);
      uploaded.push({ image_url: data.publicUrl, sort_order: baseOrder + i });
    }
    return uploaded;
  };

  const handleSubmit = async () => {
    if (!title.trim() || !itemId || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await updateItem.mutateAsync({
        id: itemId,
        updates: {
          title: title.trim(),
          description: description.trim() || null,
          price: price ? parseFloat(price) : null,
          price_note: priceNote.trim() || null,
          category_id: categoryId || null,
          location: location.trim() || null,
        },
      });

      const newUploaded = await uploadNewImages();
      if (newUploaded.length > 0) {
        await insertImages.mutateAsync({ itemId, images: newUploaded });
      }

      navigate('/dashboard/mine-annonser');
    } catch (err) {
      console.error('Update error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canEdit = item?.status === 'draft' || item?.status === 'submitted';

  return (
    <GarageLayout
      title="Rediger annonse"
      subtitle="Markedsplass"
      description="Oppdater annonsen din."
    >
      <Link to="/dashboard/mine-annonser" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ChevronLeft className="h-4 w-4" /> Tilbake til dine annonser
      </Link>

      <SectionHeader title="Annonsedetaljer" icon={<ShoppingBag className="h-5 w-5" />} />

      <EnamelCard className="mt-4">
        <div className="p-4 sm:p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Tittel *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tittel" disabled={!canEdit} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} disabled={!canEdit} className="min-h-[100px]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Pris (kr)</Label>
              <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} disabled={!canEdit} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price-note">Prisnotat</Label>
              <Input id="price-note" value={priceNote} onChange={(e) => setPriceNote(e.target.value)} disabled={!canEdit} />
            </div>
          </div>

          {categories && categories.length > 0 && (
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={!canEdit}>
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

          <div className="space-y-2">
            <Label htmlFor="location">Sted</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} disabled={!canEdit} />
          </div>

          <div className="space-y-2">
            <Label>Bilder</Label>
            <div className="flex flex-wrap gap-2">
              {existingImages.map((img) => (
                <div key={img.id} className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => removeExistingImage(img.id)}
                      className="absolute top-1 right-1 p-0.5 bg-black/50 rounded-full text-white hover:bg-black/70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              {imagePreviews.map((src, i) => (
                <div key={`new-${i}`} className="relative w-20 h-20 rounded-lg overflow-hidden">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  {canEdit && (
                    <button type="button" onClick={() => removeNewImage(i)} className="absolute top-1 right-1 p-0.5 bg-black/50 rounded-full text-white">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              {canEdit && (
                <>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary/50"
                  >
                    <ImagePlus className="w-6 h-6 text-muted-foreground" />
                  </button>
                </>
              )}
            </div>
            {!canEdit && <p className="text-xs text-muted-foreground">Publiserte eller arkiverte annonser kan ikke redigeres.</p>}
          </div>

          {canEdit && (
            <div className="flex flex-col sm:flex-row gap-3">
              <BigActionButton
                onClick={handleSubmit}
                disabled={!title.trim() || isSubmitting}
                icon={isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                className="flex-1"
              >
                {isSubmitting ? 'Lagrer...' : 'Lagre endringer'}
              </BigActionButton>
              <button
                type="button"
                onClick={async () => {
                  if (!confirm('Er du sikker på at du vil slette denne annonsen? Dette kan ikke angres.')) return;
                  await deleteItem.mutateAsync(itemId!);
                  navigate('/dashboard/mine-annonser');
                }}
                disabled={deleteItem.isPending}
                className="text-sm text-destructive hover:underline py-2"
              >
                <Trash2 className="h-4 w-4 inline mr-1" />
                Slett annonse
              </button>
            </div>
          )}
        </div>
      </EnamelCard>
    </GarageLayout>
  );
}
