import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useOwnerProfile, useLegacyOwnerId } from '@/hooks/useOwnerProfile';
import {
  useMyListings,
  useUpdateMarketplaceItem,
  useInsertMarketplaceImages,
  useDeleteMarketplaceImage,
  useDeleteMarketplaceItem,
  useReorderMarketplaceImages,
} from '@/hooks/useMarketplace';
import { useUnifiedCategories, getRootCategories } from '@/hooks/useUnifiedCategories';
import { DelerAnnonseForm } from '@/components/markedsplass/DelerAnnonseForm';
import { compressImages, generateImageId, getMarketplaceImagePath, type CompressionProgress } from '@/lib/imageCompression';
import { ImageUploadProgress } from '@/components/ui/image-upload-progress';
import { ImageUploadWithOrder, type ImageItem } from '@/components/shared/ImageUploadWithOrder';
import { supabase } from '@/integrations/supabase/client';
import type { ItemFormValues } from '@/lib/itemSubmit';
import { GarageLayout } from '@/components/ui/garage/GarageLayout';
import { EnamelCard } from '@/components/ui/garage/EnamelCard';
import { SectionHeader } from '@/components/ui/garage/SectionHeader';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Loader2, Trash2, Pencil, Clock, Send } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { toast } from 'sonner';
import { PostComposer } from '@/components/feed/PostComposer';

export default function RedigerAnnonse() {
  const { itemId } = useParams<{ itemId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: ownerProfile } = useOwnerProfile(user?.id);
  const { data: legacyOwnerId } = useLegacyOwnerId(user?.id);
  const { data: listings, isLoading: listingsLoading } = useMyListings(user?.id);
  const item = listings?.find((i: any) => i.id === itemId);
  const { data: categories = [] } = useUnifiedCategories();
  const roots = getRootCategories(categories);

  const updateItem = useUpdateMarketplaceItem();
  const insertImages = useInsertMarketplaceImages();
  const deleteImage = useDeleteMarketplaceImage();
  const deleteItem = useDeleteMarketplaceItem();
  const reorderImages = useReorderMarketplaceImages();

  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<ImageItem[]>([]);
  const [uploadProgress, setUploadProgress] = useState<CompressionProgress | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  

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

  if (item && legacyOwnerId && item.owner_id !== legacyOwnerId) {
    navigate('/dashboard/mine-annonser');
    return null;
  }

  const canEdit = ['draft', 'submitted', 'published', 'sold'].includes(item?.status ?? '');

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

  const handleReorder = async (reordered: ImageItem[]) => {
    setIsReordering(true);
    try {
      setExistingImages(reordered);
      await reorderImages.mutateAsync({
        images: reordered.map((img, i) => ({ id: img.id, sort_order: i })),
      });
    } finally {
      setIsReordering(false);
    }
  };

  const handleSetMain = async (index: number) => {
    // handled by ImageUploadWithOrder's internal setMain which calls onReorder
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Fjerne dette bildet?')) return;
    await deleteImage.mutateAsync({ imageId, itemId: itemId! });
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleUploadImages = async (files: File[]) => {
    setNewImages((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => setNewImagePreviews((p) => [...p, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const uploadNewImages = async (): Promise<{ image_url: string; sort_order: number }[]> => {
    if (newImages.length === 0) return [];
    const compressed = await compressImages(newImages, (p) => setUploadProgress(p));
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
              <ImageUploadWithOrder
                images={existingImages}
                maxImages={20}
                mainLabel="Hovedbilde"
                isUploading={isSubmitting}
                isReordering={isReordering}
                onReorder={handleReorder}
                onSetMain={handleSetMain}
                onDelete={handleDeleteImage}
                onUpload={handleUploadImages}
                emptyTitle="Ingen bilder ennå"
                emptyDescription="Last opp bilder til annonsen din."
                altFallback={item?.title || ''}
              />
              {newImagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <p className="text-xs text-muted-foreground w-full">Nye bilder (lagres ved innsending):</p>
                  {newImagePreviews.map((src, i) => (
                    <div key={`new-${i}`} className="relative w-20 h-20 rounded-lg overflow-hidden">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
              {!canEdit && <p className="text-xs text-muted-foreground">Kun arkiverte annonser kan ikke redigeres.</p>}
            </div>

            {uploadProgress && <ImageUploadProgress progress={uploadProgress} />}

            {item?.status === 'submitted' && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                <p>Annonsen venter på godkjenning av admin.</p>
              </div>
            )}
          </DelerAnnonseForm>
        </div>
      </EnamelCard>

      {/* Action CTAs */}
      {canEdit && (item?.status === 'published' || item?.status === 'sold' || true) && (
        <EnamelCard className="mt-4">
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-3">
            {item?.status === 'published' && (
              <button
                type="button"
                onClick={async () => {
                  await updateItem.mutateAsync({ id: itemId!, updates: { status: 'sold' } });
                  toast.success('Markert som solgt');
                  queryClient.invalidateQueries({ queryKey: ['my-listings'] });
                }}
                disabled={updateItem.isPending}
                className="flex-1 h-12 rounded-md font-semibold text-sm tracking-wide border-2 border-primary bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                Markér som solgt
              </button>
            )}
            {item?.status === 'sold' && (
              <button
                type="button"
                onClick={async () => {
                  await updateItem.mutateAsync({ id: itemId!, updates: { status: 'published' } });
                  toast.success('Fjernet solgt-status');
                  queryClient.invalidateQueries({ queryKey: ['my-listings'] });
                }}
                disabled={updateItem.isPending}
                className="flex-1 h-12 rounded-md font-semibold text-sm tracking-wide border-2 border-muted-foreground/30 bg-muted text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
              >
                Fjern solgt-status
              </button>
            )}
            <button
              type="button"
              onClick={async () => {
                if (!confirm('Er du sikker på at du vil slette denne annonsen? Dette kan ikke angres.')) return;
                await deleteItem.mutateAsync(itemId!);
                navigate('/dashboard/mine-annonser');
              }}
              disabled={deleteItem.isPending}
              className="flex-1 h-12 rounded-md font-semibold text-sm tracking-wide border-2 border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Slett annonse
            </button>
          </div>
        </EnamelCard>
      )}

      {item && (
        <EnamelCard className="mt-4">
          <SectionHeader
            title="Del i feeden"
            icon={<Send className="w-6 h-6" />}
            description="Del denne annonsen med bilsamfunnet"
          />
          <PostComposer
            compact
            postType="marketplace_published"
            marketplaceItemId={item.id}
            snapshotTitle={item.title}
            snapshotImageUrl={existingImages[0]?.image_url}
            snapshotEntityType="marketplace"
          />
        </EnamelCard>
      )}
    </GarageLayout>
  );
}
