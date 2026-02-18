import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useOwnerProfile } from '@/hooks/useOwnerProfile';
import {
  useMyListings,
  useUpdateMarketplaceItem,
  useInsertMarketplaceImages,
  useDeleteMarketplaceImage,
  useDeleteMarketplaceItem,
} from '@/hooks/useMarketplace';
import { useUnifiedCategories, getRootCategories } from '@/hooks/useUnifiedCategories';
import { DelerAnnonseForm } from '@/components/markedsplass/DelerAnnonseForm';
import { compressImages, generateImageId, getMarketplaceImagePath, type CompressionProgress } from '@/lib/imageCompression';
import { ImageUploadProgress } from '@/components/ui/image-upload-progress';
import { supabase } from '@/integrations/supabase/client';
import type { ItemFormValues } from '@/lib/itemSubmit';
import { GarageLayout } from '@/components/ui/garage/GarageLayout';
import { EnamelCard } from '@/components/ui/garage/EnamelCard';
import { SectionHeader } from '@/components/ui/garage/SectionHeader';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Loader2, ImagePlus, X, Trash2, Pencil, Clock } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { toast } from 'sonner';

export default function RedigerAnnonse() {
  const { itemId } = useParams<{ itemId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: ownerProfile } = useOwnerProfile(user?.id);
  const { data: listings, isLoading: listingsLoading } = useMyListings(user?.id);
  const item = listings?.find((i: any) => i.id === itemId);
  const { data: categories = [] } = useUnifiedCategories();
  const roots = getRootCategories(categories);

  const updateItem = useUpdateMarketplaceItem();
  const insertImages = useInsertMarketplaceImages();
  const deleteImage = useDeleteMarketplaceImage();
  const deleteItem = useDeleteMarketplaceItem();

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<{ id: string; image_url: string; sort_order: number }[]>([]);
  const [uploadProgress, setUploadProgress] = useState<CompressionProgress | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item?.marketplace_images) {
      const imgs = [...item.marketplace_images].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
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

  const canEdit = item?.status === 'draft' || item?.status === 'submitted';

  const samleobjekterRoot = roots.find((r) => r.slug === 'samleobjekter');
  const delerRoot = roots.find((r) => r.slug === 'deler');

  const initialValues: Partial<ItemFormValues> = item
    ? {
        title: item.title || '',
        description: item.description || '',
        rootCategoryId: samleobjekterRoot?.id ?? delerRoot?.id ?? roots[0]?.id ?? '',
        categoryId: item.category_id || '',
        priceMin: item.price != null ? String(item.price) : '',
        priceMax: '',
        priceNote: item.price_note || '',
        condition: '',
        showLocation: !!item.location,
      }
    : {};

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
    const compressed = await compressImages(images, (p) => setUploadProgress(p));
    const uploaded: { image_url: string; sort_order: number }[] = [];
    const baseOrder = existingImages.length;
    for (let i = 0; i < compressed.length; i++) {
      const { file } = compressed[i];
      const imageId = generateImageId();
      const filePath = getMarketplaceImagePath(itemId!, imageId);

      setUploadProgress({
        stage: 'uploading',
        current: i + 1,
        total: compressed.length,
        percentage: Math.round(((i + 1) / compressed.length) * 100),
      });

      const { error } = await supabase.storage.from('simca-images').upload(filePath, file, { contentType: 'image/webp' });
      if (error) continue;
      const { data } = supabase.storage.from('simca-images').getPublicUrl(filePath);
      uploaded.push({ image_url: data.publicUrl, sort_order: baseOrder + i });
    }
    return uploaded;
  };

  const handleSubmit = async (values: ItemFormValues) => {
    if (!itemId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const price = values.priceMin ? Number(values.priceMin) : values.priceMax ? Number(values.priceMax) : null;
      const location = values.showLocation && ownerProfile?.location
        ? ownerProfile.location.trim()
        : null;
      await updateItem.mutateAsync({
        id: itemId,
        updates: {
          title: values.title.trim(),
          description: values.description.trim() || null,
          price,
          price_note: values.priceNote.trim() || null,
          category_id: values.categoryId || null,
          location,
        },
      });
      const newUploaded = await uploadNewImages();
      if (newUploaded.length > 0) {
        await insertImages.mutateAsync({ itemId, images: newUploaded });
      }
      toast.success('Endringene er lagret');
      await queryClient.refetchQueries({ queryKey: ['my-listings', user?.id] });
      navigate('/dashboard/mine-annonser');
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Kunne ikke lagre endringene');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <GarageLayout title="Rediger annonse" subtitle="Markedsplass" description="Oppdater annonsen din.">
      <Link to="/dashboard/mine-annonser" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-6">
        <ChevronLeft className="h-4 w-4" /> Tilbake til dine annonser
      </Link>

      <SectionHeader title="Rediger annonse" icon={<Pencil className="h-5 w-5" />} />

      <EnamelCard className="mt-4">
        <div className="p-4 sm:p-6">
          <DelerAnnonseForm
            initialValues={initialValues}
            onSubmit={handleSubmit}
            submitLabel="Lagre endringer"
            isSubmitting={isSubmitting}
            disabled={!canEdit}
            profileLocation={ownerProfile?.location ?? null}
          >
            {/* Bilder */}
            <div className="space-y-2">
              <Label>Bilder</Label>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
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
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary/50 transition-colors"
                  >
                    <ImagePlus className="w-6 h-6 text-muted-foreground" />
                  </button>
                )}
              </div>
              {!canEdit && <p className="text-xs text-muted-foreground">Publiserte eller arkiverte annonser kan ikke redigeres.</p>}
            </div>

            {uploadProgress && <ImageUploadProgress progress={uploadProgress} />}

            {/* Info banner */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mt-0.5 shrink-0" />
              <p>Endringer må godkjennes på nytt av admin.</p>
            </div>
          </DelerAnnonseForm>
        </div>
      </EnamelCard>

      {canEdit && (
        <button
          type="button"
          onClick={async () => {
            if (!confirm('Er du sikker på at du vil slette denne annonsen? Dette kan ikke angres.')) return;
            await deleteItem.mutateAsync(itemId!);
            navigate('/dashboard/mine-annonser');
          }}
          disabled={deleteItem.isPending}
          className="text-sm text-destructive hover:underline py-2 mt-4"
        >
          <Trash2 className="h-4 w-4 inline mr-1" />
          Slett annonse
        </button>
      )}
    </GarageLayout>
  );
}
