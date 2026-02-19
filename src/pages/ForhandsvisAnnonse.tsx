import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { useMyListings } from '@/hooks/useMarketplace';
import { useOwnerProfile } from '@/hooks/useOwnerProfile';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import { getOptimizedImageUrl, getThumbnailUrl } from '@/lib/imageUtils';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronLeft, ArrowLeft, Loader2, Eye } from 'lucide-react';
import toolboxIcon from '@/assets/toolbox-blue.png';
import { SafeAssetImage } from "@/components/ui/SafeAssetImage";

export default function ForhandsvisAnnonse() {
  const { itemId } = useParams<{ itemId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: listings, isLoading: listingsLoading } = useMyListings(user?.id);
  const { data: ownerProfile } = useOwnerProfile(user?.id);
  const item = listings?.find((i: any) => i.id === itemId);

  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (authLoading || listingsLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  if (listings && !item) {
    navigate('/dashboard/mine-annonser');
    return null;
  }

  if (!item) return null;

  const images = [...(item.marketplace_images || [])].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
  const allImages = images.map((img: any) => img.image_url);
  const category = item.categories as any;
  const priceDisplay = item.price != null ? `${Number(item.price).toLocaleString('nb-NO')} kr` : null;

  const statusLabel = item.status === 'published' ? 'Publisert' : item.status === 'submitted' ? 'Venter på godkjenning' : item.status === 'archived' ? 'Arkivert' : 'Utkast';

  return (
    <Layout>
      <Helmet>
        <title>Forhåndsvisning: {item.title} | Simca Norge</title>
      </Helmet>
      <PageHeader title="MARKEDSPLASS" subtitle={category?.name || 'Annonse'} />

      <section className="poster-section">
        <div className="container mx-auto px-4 relative z-10">
          {/* Preview banner */}
          <div className="flex items-center justify-between gap-4 mb-6 p-3 rounded-lg bg-muted border border-border">
            <div className="flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Forhåndsvisning</span>
              <Badge variant="secondary" className="text-xs">{statusLabel}</Badge>
            </div>
            <Link
              to="/dashboard/mine-annonser"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Tilbake
            </Link>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              {/* Images */}
              <div>
                {allImages.length > 0 ? (
                  <div>
                    <div
                      className="relative aspect-square overflow-hidden rounded-sm bg-muted cursor-pointer"
                      style={{ border: '1px solid rgba(0,0,0,0.06)' }}
                      onClick={() => setLightboxOpen(true)}
                    >
                      <img
                        src={getOptimizedImageUrl(allImages[activeImage], { width: 800 })}
                        alt={`${item.title} – bilde ${activeImage + 1}`}
                        className="w-full h-full object-contain"
                      />
                      {allImages.length > 1 && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); setActiveImage((i) => (i - 1 + allImages.length) % allImages.length); }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-md"
                            aria-label="Forrige"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setActiveImage((i) => (i + 1) % allImages.length); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-md"
                            aria-label="Neste"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      {allImages.length > 1 && (
                        <span className="absolute bottom-2 right-2 text-[10px] bg-foreground/70 text-background px-2 py-0.5 rounded-full font-medium">
                          {activeImage + 1} / {allImages.length}
                        </span>
                      )}
                    </div>
                    {allImages.length > 1 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                        {allImages.map((img: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setActiveImage(idx)}
                            className={`flex-shrink-0 w-16 h-16 rounded-sm overflow-hidden transition-all ${idx === activeImage ? 'ring-2 ring-accent opacity-100' : 'opacity-50 hover:opacity-80'}`}
                          >
                            <img src={getThumbnailUrl(img, 120)} alt={`Miniatyrbilde ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-square rounded-sm bg-muted flex items-center justify-center" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                    <span className="text-muted-foreground text-sm">Ingen bilder</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col">
                {category && (
                  <span className="text-muted-foreground text-[11px] uppercase tracking-widest mb-2 font-medium">{category.name}</span>
                )}
                <h1 className="font-display text-3xl md:text-5xl leading-tight uppercase tracking-wide mb-4">{item.title}</h1>
                {priceDisplay && (
                  <p className="font-serif text-2xl md:text-3xl text-foreground font-bold leading-none mb-1">{priceDisplay}</p>
                )}
                {item.price_note && (
                  <p className="text-xs text-muted-foreground italic mb-4">{item.price_note}</p>
                )}
                {ownerProfile && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {ownerProfile.display_name}
                    {ownerProfile.location && ` · ${ownerProfile.location}`}
                  </p>
                )}
                <div className="border-t border-foreground/10 my-4" />
                {item.description && (
                  <div className="prose prose-sm max-w-none mb-6">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.description}</p>
                  </div>
                )}
                <div className="mt-auto pt-4">
                  <button
                    disabled
                    className="w-full py-3 text-sm font-display uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 border border-foreground/20 text-foreground/50 cursor-not-allowed"
                  >
                    <SafeAssetImage src={toolboxIcon} alt="" className="w-7 h-7 object-contain opacity-50" />
                    Legg i verktøykassa
                  </button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Knappen er deaktivert i forhåndsvisning.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ImageLightbox
        images={allImages.map((url: string, i: number) => ({ url, alt: `${item.title} – bilde ${i + 1}` }))}
        initialIndex={activeImage}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </Layout>
  );
}
