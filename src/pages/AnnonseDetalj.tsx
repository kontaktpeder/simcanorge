import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useMarketplaceItemBySlug } from "@/hooks/useMarketplace";
import { useCart } from "@/hooks/useCart";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { getOptimizedImageUrl, getThumbnailUrl } from "@/lib/imageUtils";
import { Badge } from "@/components/ui/badge";
import { CONDITION_COLORS } from "@/lib/markedsplassUtils";
import {
  ShoppingBag, MapPin, User, ChevronRight, ChevronLeft, ArrowLeft, Check, Wrench,
} from "lucide-react";
import toolboxIcon from "@/assets/toolbox-blue.png";

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

      // Try matching by slug
      const { data: bySlug } = await query.eq("slug", slug).maybeSingle();
      let result = bySlug;

      // Fallback: try by ID (for old /deler/:partId URLs)
      if (!result) {
        const { data: byId } = await supabase
          .from("parts")
          .select("id, title, slug, description, image_url, category_id, price_min, price_max, price_note, condition, part_images(id, image_url, sort_order)")
          .eq("published", true)
          .eq("id", slug)
          .maybeSingle();
        result = byId;
      }

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
  const inCart = isInCart(part.id);
  const conditionInfo = part.condition ? CONDITION_LABELS[part.condition] : null;

  const handleToggleCart = () => {
    if (inCart) {
      removeItem(part.id);
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

      <section className="poster-section">
        <div className="container mx-auto px-4 relative z-10">
          <Link to="/markedsplass" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 font-display uppercase tracking-wider">
            <ArrowLeft className="w-4 h-4" /> Tilbake
          </Link>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              {/* Images */}
              <div>
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
              <div className="flex flex-col">
                {category && <span className="text-muted-foreground text-[11px] uppercase tracking-widest mb-2 font-medium">{category.name}</span>}
                <h1 className="font-display text-3xl md:text-5xl leading-tight uppercase tracking-wide mb-4">{part.title}</h1>
                {conditionInfo && (
                  <span className={`inline-block self-start text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-sm mb-4 ${conditionInfo.className}`}>{conditionInfo.label}</span>
                )}
                {price && <p className="font-serif text-2xl md:text-3xl text-foreground font-bold leading-none mb-1">{price}</p>}
                {part.price_note && <p className="text-xs text-muted-foreground italic mb-4">{part.price_note}</p>}
                <div className="border-t border-foreground/10 my-4" />
                {part.description && (
                  <div className="prose prose-sm max-w-none mb-6">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{part.description}</p>
                  </div>
                )}
                <div className="mt-auto pt-4">
                  <button onClick={handleToggleCart} className={`w-full py-3 text-sm font-display uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 transition-all ${inCart ? "bg-green-700 text-white" : "border border-foreground/20 text-foreground hover:bg-foreground hover:text-background"}`}>
                    {inCart ? <><Check className="w-5 h-5" />Lagt til i verktøykassa</> : <><img src={toolboxIcon} alt="" className="w-7 h-7 object-contain" />Legg i verktøykassa</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ImageLightbox images={allImages.map((url, i) => ({ url, alt: `${part.title} – bilde ${i + 1}` }))} initialIndex={activeImage} isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} />
    </Layout>
  );
}

// ==================== MARKETPLACE DETAIL VIEW ====================
function MarketplaceDetailView({ item }: { item: any }) {
  const { addItem, removeItem, isInCart } = useCart();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const images = [...(item.marketplace_images || [])].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
  const owner = item.owners as any;
  const category = item.marketplace_categories as any;
  const inCart = isInCart(item.id);

  const handleToggleCart = () => {
    if (inCart) {
      removeItem(item.id);
    } else {
      addItem({ type: "listing", id: item.id, slug: item.slug, title: item.title });
    }
  };

  const allImageUrls = images.map((img: any) => img.image_url);

  return (
    <Layout>
      <Helmet>
        <title>{item.title} | Markedsplass – Simca Norge</title>
        <meta name="description" content={item.description?.slice(0, 160) || `${item.title} til salgs på Simca Norge`} />
      </Helmet>

      <section className="container py-8 sm:py-12">
        <Link to="/markedsplass" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-6">
          <ChevronLeft className="h-4 w-4" /> Markedsplass
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            {images.length > 0 ? (
              <div className="grid gap-2">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted cursor-pointer" onClick={() => setLightboxOpen(true)}>
                  <img src={images[0].image_url} alt={item.title} className="w-full h-full object-cover" />
                </div>
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {images.slice(1, 5).map((img: any) => (
                      <div key={img.id} className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer" onClick={() => { setActiveImage(images.indexOf(img)); setLightboxOpen(true); }}>
                        <img src={img.image_url} alt={img.alt_text || item.title} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-[4/3] rounded-xl bg-muted flex items-center justify-center">
                <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-2xl sm:text-3xl font-bold">{item.title}</h1>
              {item.price && <p className="text-2xl font-bold text-primary mt-2">{Number(item.price).toLocaleString("nb-NO")} kr</p>}
              {item.price_note && <p className="text-sm text-muted-foreground mt-1">{item.price_note}</p>}
              {category && <Badge variant="secondary" className="mt-3">{category.name}</Badge>}
              {item.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
                  <MapPin className="h-3.5 w-3.5" /> {item.location}
                </p>
              )}
            </motion.div>

            {item.description && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h2 className="text-lg font-semibold mb-2">Beskrivelse</h2>
                <div className="prose prose-gray max-w-none text-foreground/90 whitespace-pre-line">{item.description}</div>
              </motion.div>
            )}

            {/* Add to cart CTA */}
            <button onClick={handleToggleCart} className={`w-full py-3 text-sm font-display uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 transition-all ${inCart ? "bg-green-700 text-white" : "border border-foreground/20 text-foreground hover:bg-foreground hover:text-background"}`}>
              {inCart ? <><Check className="w-5 h-5" />Lagt til i verktøykassa</> : <><img src={toolboxIcon} alt="" className="w-7 h-7 object-contain" />Legg i verktøykassa</>}
            </button>
          </div>

          <div className="space-y-4">
            {owner && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl border p-5 sm:p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Selger</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{owner.display_name}</p>
                    {owner.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {owner.location}
                      </p>
                    )}
                  </div>
                </div>
                {owner.slug && (
                  <Link to={`/profil/${owner.slug}`} className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                    Se profil <ChevronRight className="h-3 w-3" />
                  </Link>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </section>

      <ImageLightbox images={allImageUrls.map((url: string, i: number) => ({ url, alt: `${item.title} – bilde ${i + 1}` }))} initialIndex={activeImage} isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} />
    </Layout>
  );
}
