import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useMarketplaceItemBySlug } from "@/hooks/useMarketplace";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";
import { PostComposer } from "@/components/feed/PostComposer";
import { CommentSection } from "@/components/comments/CommentSection";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { getOptimizedImageUrl, getThumbnailUrl } from "@/lib/imageUtils";
import {
  ChevronRight, ChevronLeft, ArrowLeft, Check, Share2, Pencil,
} from "lucide-react";
import { OwnerCard } from "@/components/car/OwnerCard";
import { SimcaNorgeSellerCard } from "@/components/car/SimcaNorgeSellerCard";
// toolbox icon served from public/

const CONDITION_LABELS: Record<string, { label: string; className: string }> = {
  "Ny": { label: "Ny", className: "bg-green-700/90 text-white" },
  "NOS": { label: "New Old Stock", className: "bg-amber-700/90 text-white" },
  "Brukt": { label: "Brukt", className: "bg-muted-foreground/80 text-white" },
  "Original": { label: "Original", className: "bg-foreground/80 text-white" },
  "Repro": { label: "Reproduksjon", className: "bg-primary/80 text-white" },
};

function formatPrice(priceMin: number | null, priceMax: number | null): string | null {
  if (priceMin != null && priceMax != null) return `${priceMin}–${priceMax} kr`;
  if (priceMin != null) return `${priceMin} kr`;
  if (priceMax != null) return `${priceMax} kr`;
  return null;
}

export default function AnnonseDetalj() {
  const { slug } = useParams<{ slug: string }>();

  // Try marketplace item first
  const { data: marketplaceItem, isLoading: mpLoading } = useMarketplaceItemBySlug(slug);

  // If no marketplace item, try parts
  const [part, setPart] = useState<any>(null);
  const [partCategory, setPartCategory] = useState<any>(null);
  const [partLoading, setPartLoading] = useState(false);

  useEffect(() => {
    if (mpLoading || marketplaceItem) return;
    if (!slug) return;

    setPartLoading(true);
    const fetchPart = async () => {
      // Try slug first, then ID
      let query = supabase
        .from("parts")
        .select("id, title, slug, description, image_url, category_id, price_min, price_max, price_note, condition, part_images(id, image_url, sort_order)")
        .eq("published", true);

      // Match by slug only
      const { data: bySlug } = await query.eq("slug", slug).maybeSingle();
      const result = bySlug;

      if (result) {
        setPart(result);
        if (result.category_id) {
          const { data: cat } = await supabase.from("categories").select("id, name").eq("id", result.category_id).single();
          if (cat) setPartCategory(cat);
        }
      }
      setPartLoading(false);
    };
    fetchPart();
  }, [slug, mpLoading, marketplaceItem]);

  const isLoading = mpLoading || partLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Laster…</div>
        </div>
      </Layout>
    );
  }

  // Render Part detail
  if (part) {
    return <PartDetailView part={part} category={partCategory} />;
  }

  // Render Marketplace item detail
  if (marketplaceItem) {
    return <MarketplaceDetailView item={marketplaceItem} />;
  }

  // Not found
  return (
    <Layout>
      <Helmet><title>Ikke funnet | Simca Norge</title></Helmet>
      <PageHeader title="Ikke funnet" subtitle="Denne varen finnes ikke eller er ikke publisert." />
      <div className="container py-12 text-center">
        <Link to="/markedsplass" className="text-primary hover:underline inline-flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" /> Tilbake til markedsplassen
        </Link>
      </div>
    </Layout>
  );
}

// ==================== PART DETAIL VIEW ====================
function PartDetailView({ part, category }: { part: any; category: any }) {
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { addItem, removeItem, isInCart } = useCart();

  const allImages: string[] = [];
  if (part.part_images?.length) {
    const sorted = [...part.part_images].sort((a: any, b: any) => a.sort_order - b.sort_order);
    sorted.forEach((img: any) => allImages.push(img.image_url));
  }
  if (part.image_url && !allImages.includes(part.image_url)) {
    allImages.unshift(part.image_url);
  }

  const price = formatPrice(part.price_min, part.price_max);
  const inCart = isInCart("part", part.id);
  const conditionInfo = part.condition ? CONDITION_LABELS[part.condition] : null;

  const handleToggleCart = () => {
    if (inCart) {
      removeItem("part", part.id);
    } else {
      addItem({ type: "part", id: part.id, slug: part.slug || part.id, title: part.title });
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>{part.title} | Markedsplass – Simca Norge</title>
        <meta name="description" content={part.description?.slice(0, 160) || `${part.title} – bildel fra Simca Norge`} />
      </Helmet>
      <PageHeader title="MARKEDSPLASS" subtitle={category?.name || "Bildel"} />

      <section className="poster-section pb-[max(2rem,env(safe-area-inset-bottom))] sm:pb-[max(5rem,env(safe-area-inset-bottom))]">
        <div className="container mx-auto px-4 relative z-10">
          <Link to="/markedsplass" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 font-display uppercase tracking-wider">
            <ArrowLeft className="w-4 h-4" /> Tilbake
          </Link>

          <div className="max-w-5xl mx-auto overflow-hidden">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              {/* Images */}
              <div className="min-w-0">
                {allImages.length > 0 ? (
                  <div>
                    <div className="relative aspect-square overflow-hidden rounded-sm bg-muted cursor-pointer" style={{ border: "1px solid rgba(0,0,0,0.06)" }} onClick={() => setLightboxOpen(true)}>
                      <img src={getOptimizedImageUrl(allImages[activeImage], { width: 800 })} alt={`${part.title} – bilde ${activeImage + 1}`} className="w-full h-full object-contain" />
                      {allImages.length > 1 && (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); setActiveImage((i) => (i - 1 + allImages.length) % allImages.length); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-md" aria-label="Forrige">
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setActiveImage((i) => (i + 1) % allImages.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-md" aria-label="Neste">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      {allImages.length > 1 && (
                        <span className="absolute bottom-2 right-2 text-[10px] bg-foreground/70 text-background px-2 py-0.5 rounded-full font-medium">{activeImage + 1} / {allImages.length}</span>
                      )}
                    </div>
                    {allImages.length > 1 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                        {allImages.map((img, idx) => (
                          <button key={idx} onClick={() => setActiveImage(idx)} className={`flex-shrink-0 w-16 h-16 rounded-sm overflow-hidden transition-all ${idx === activeImage ? "ring-2 ring-accent opacity-100" : "opacity-50 hover:opacity-80"}`}>
                            <img src={getThumbnailUrl(img, 120)} alt={`Miniatyrbilde ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-square rounded-sm bg-muted flex items-center justify-center" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                    <span className="text-muted-foreground text-sm">Ingen bilder</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col min-w-0">
                {category && <span className="text-muted-foreground text-[11px] uppercase tracking-widest mb-2 font-medium">{category.name}</span>}
                <h1 className="font-display text-3xl md:text-5xl leading-tight uppercase tracking-wide mb-4 break-words">{part.title}</h1>
                {conditionInfo && (
                  <span className={`inline-block self-start text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-sm mb-4 ${conditionInfo.className}`}>{conditionInfo.label}</span>
                )}
                {price && <p className="font-serif text-2xl md:text-3xl text-foreground font-bold leading-none mb-1">{price}</p>}
                {part.price_note && <p className="text-xs text-muted-foreground italic mb-4">{part.price_note}</p>}
                <div className="border-t border-foreground/10 my-4" />
                {part.description && (
                  <div className="prose prose-sm max-w-none mb-6 overflow-hidden">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line break-words overflow-wrap-anywhere">{part.description}</p>
                  </div>
                )}
                <div className="mt-auto pt-4">
                  <button onClick={handleToggleCart} className={`w-full py-3 text-sm font-display uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 transition-all ${inCart ? "bg-green-700 text-white" : "border border-foreground/20 text-foreground hover:bg-foreground hover:text-background"}`}>
                    {inCart ? <><Check className="w-5 h-5" />Lagt til i verktøykassa</> : <><img src="/toolbox-blue.png" alt="" className="w-7 h-7 object-contain" />Legg i verktøykassa</>}
                  </button>
                </div>
              </div>
            </div>
            <SimcaNorgeSellerCard />
          </div>
        </div>
      </section>

      <ImageLightbox images={allImages.map((url, i) => ({ url, alt: `${part.title} – bilde ${i + 1}` }))} initialIndex={activeImage} isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} />
    </Layout>
  );
}

// ==================== MARKETPLACE DETAIL VIEW (same layout as PartDetailView) ====================
function MarketplaceDetailView({ item }: { item: any }) {
  const { addItem, removeItem, isInCart } = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { user } = useAuth();
  const { data: myProfile } = useMyPersonProfile();
  const [showFeedComposer, setShowFeedComposer] = useState(false);
  const isOwner = !!(myProfile && (item as any).person_profile_id === myProfile.id);
  const firstImage = (item as any).marketplace_images
    ?.slice()
    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.image_url ?? null;

  const images = [...(item.marketplace_images || [])].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
  const allImages = images.map((img: any) => img.image_url);
  const category = item.categories as any;
  const owner = (item as any).person_profiles || (item as any).owners;
  const priceDisplay = item.price != null ? `${Number(item.price).toLocaleString("nb-NO")} kr` : null;
  const inCart = isInCart("listing", item.id);

  const handleToggleCart = () => {
    if (inCart) {
      removeItem("listing", item.id);
    } else {
      addItem({
        type: "listing",
        id: item.id,
        slug: item.slug,
        title: item.title,
        ...(owner?.id ? { owner_id: owner.id, owner_name: owner.display_name || null } : {}),
      });
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>{item.title} | Markedsplass – Simca Norge</title>
        <meta name="description" content={item.description?.slice(0, 160) || `${item.title} til salgs på Simca Norge`} />
      </Helmet>
      <PageHeader title="MARKEDSPLASS" subtitle={category?.name || "Annonse"} />

      <section className="poster-section pb-[max(2rem,env(safe-area-inset-bottom))] sm:pb-[max(5rem,env(safe-area-inset-bottom))]">
        <div className="container mx-auto px-4 relative z-10">
          {isOwner && (
            <div className="bg-[#111315] border border-white/[0.08] mb-6 -mx-4 sm:mx-0">
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-[12px] uppercase tracking-[0.12em] text-white/40 font-sans font-medium">
                  Din annonse
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/dashboard/annonse/${item.id}/rediger`}
                    className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-white/60 hover:text-white bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10] px-3 py-1.5 transition-all font-sans"
                  >
                    <Pencil className="w-3 h-3" />
                    Rediger
                  </Link>
                  {!showFeedComposer && (
                    <button
                      onClick={() => setShowFeedComposer(true)}
                      className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-white/60 hover:text-white bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10] px-3 py-1.5 transition-all font-sans"
                    >
                      <Share2 className="w-3 h-3" />
                      Del til feed
                    </button>
                  )}
                </div>
              </div>
              {showFeedComposer && (
                <div className="px-4 pb-4">
                  <PostComposer
                    compact
                    postType="marketplace_published"
                    marketplaceItemId={item.id}
                    snapshotTitle={item.title}
                    snapshotImageUrl={firstImage}
                    snapshotEntityType="marketplace"
                    onClose={() => setShowFeedComposer(false)}
                  />
                </div>
              )}
            </div>
          )}
          <Link to="/markedsplass" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 font-display uppercase tracking-wider">
            <ArrowLeft className="w-4 h-4" /> Tilbake
          </Link>

          <div className="max-w-5xl mx-auto overflow-hidden">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              {/* Images */}
              <div className="min-w-0">
                {allImages.length > 0 ? (
                  <div>
                    <div className="relative aspect-square overflow-hidden rounded-sm bg-muted cursor-pointer" style={{ border: "1px solid rgba(0,0,0,0.06)" }} onClick={() => setLightboxOpen(true)}>
                      <img src={getOptimizedImageUrl(allImages[activeImage], { width: 800 })} alt={`${item.title} – bilde ${activeImage + 1}`} className="w-full h-full object-contain" />
                      {item.status === 'sold' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                          <span className="font-serif text-4xl md:text-5xl font-bold tracking-[0.3em] text-foreground/90 rotate-[-12deg] border-2 border-foreground/40 px-6 py-3 bg-background/80" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                            SOLGT
                          </span>
                        </div>
                      )}
                      {allImages.length > 1 && (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); setActiveImage((i) => (i - 1 + allImages.length) % allImages.length); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-md" aria-label="Forrige">
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setActiveImage((i) => (i + 1) % allImages.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-md" aria-label="Neste">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      {allImages.length > 1 && (
                        <span className="absolute bottom-2 right-2 text-[10px] bg-foreground/70 text-background px-2 py-0.5 rounded-full font-medium">{activeImage + 1} / {allImages.length}</span>
                      )}
                    </div>
                    {allImages.length > 1 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                        {allImages.map((img, idx) => (
                          <button key={idx} onClick={() => setActiveImage(idx)} className={`flex-shrink-0 w-16 h-16 rounded-sm overflow-hidden transition-all ${idx === activeImage ? "ring-2 ring-accent opacity-100" : "opacity-50 hover:opacity-80"}`}>
                            <img src={getThumbnailUrl(img, 120)} alt={`Miniatyrbilde ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-square rounded-sm bg-muted flex items-center justify-center" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                    <span className="text-muted-foreground text-sm">Ingen bilder</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col min-w-0">
                {category && <span className="text-muted-foreground text-[11px] uppercase tracking-widest mb-2 font-medium">{category.name}</span>}
                <h1 className="font-display text-3xl md:text-5xl leading-tight uppercase tracking-wide mb-4 break-words">{item.title}</h1>
                {priceDisplay && <p className="font-serif text-2xl md:text-3xl text-foreground font-bold leading-none mb-1">{priceDisplay}</p>}
                {item.price_note && <p className="text-xs text-muted-foreground italic mb-4">{item.price_note}</p>}
                <div className="border-t border-foreground/10 my-4" />
                {item.description && (
                  <div className="prose prose-sm max-w-none mb-6 overflow-hidden">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line break-words overflow-wrap-anywhere">{item.description}</p>
                  </div>
                )}
                <div className="mt-auto pt-4">
                  <button onClick={handleToggleCart} className={`w-full py-3 text-sm font-display uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 transition-all ${inCart ? "bg-green-700 text-white" : "border border-foreground/20 text-foreground hover:bg-foreground hover:text-background"}`}>
                    {inCart ? <><Check className="w-5 h-5" />Lagt til i verktøykassa</> : <><img src="/toolbox-blue.png" alt="" className="w-7 h-7 object-contain" />Legg i verktøykassa</>}
                  </button>
                </div>
              </div>
            </div>
            {owner && <OwnerCard owner={owner} />}
          </div>
        </div>
      </section>

      {/* Comments */}
      <section className="bg-[#f5f4f0] py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <CommentSection marketplaceItemId={item.id} />
        </div>
      </section>

      <ImageLightbox images={allImages.map((url: string, i: number) => ({ url, alt: `${item.title} – bilde ${i + 1}` }))} initialIndex={activeImage} isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} />
    </Layout>
  );
}
