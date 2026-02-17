import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { ArrowLeft, Check, ChevronLeft, ChevronRight } from "lucide-react";
import toolboxIcon from "@/assets/toolbox-blue.png";
import { getOptimizedImageUrl, getThumbnailUrl } from "@/lib/imageUtils";
import { ImageLightbox } from "@/components/ui/image-lightbox";

interface PartImage {
  id: string;
  image_url: string;
  sort_order: number;
}

interface PartDetail {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category_id: string | null;
  price_min: number | null;
  price_max: number | null;
  price_note: string | null;
  condition: string | null;
  part_images: PartImage[];
}

interface Category {
  id: string;
  name: string;
}

const CONDITION_LABELS: Record<string, { label: string; className: string }> = {
  "Ny": { label: "Ny", className: "bg-green-700/90 text-white" },
  "NOS": { label: "New Old Stock", className: "bg-amber-700/90 text-white" },
  "Brukt": { label: "Brukt", className: "bg-muted-foreground/80 text-white" },
  "Original": { label: "Original", className: "bg-foreground/80 text-white" },
  "Repro": { label: "Reproduksjon", className: "bg-primary/80 text-white" },
};

function formatPrice(part: PartDetail): string | null {
  if (part.price_min != null && part.price_max != null) return `${part.price_min}–${part.price_max} kr`;
  if (part.price_min != null) return `${part.price_min} kr`;
  if (part.price_max != null) return `${part.price_max} kr`;
  return null;
}

export default function DelDetalj() {
  const { partId } = useParams<{ partId: string }>();
  const [part, setPart] = useState<PartDetail | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const { addItem, removeItem, isInCart } = useCart();
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!partId) return;
    const fetchPart = async () => {
      const { data } = await supabase
        .from("parts")
        .select("id, title, description, image_url, category_id, price_min, price_max, price_note, condition, part_images(id, image_url, sort_order)")
        .eq("id", partId)
        .eq("published", true)
        .single();

      if (data) {
        const p = data as unknown as PartDetail;
        setPart(p);
        if (p.category_id) {
          const { data: cat } = await supabase
            .from("categories")
            .select("id, name")
            .eq("id", p.category_id)
            .single();
          if (cat) setCategory(cat);
        }
      }
      setIsLoading(false);
    };
    fetchPart();
  }, [partId]);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground font-display tracking-wider">Laster…</div>
        </div>
      </Layout>
    );
  }

  if (!part) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <h1 className="font-display text-2xl">Del ikke funnet</h1>
          <Link to="/deler" className="btn-enamel-blue">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbake til deler
          </Link>
        </div>
      </Layout>
    );
  }

  // Build ordered images array
  const allImages: string[] = [];
  if (part.part_images?.length) {
    const sorted = [...part.part_images].sort((a, b) => a.sort_order - b.sort_order);
    sorted.forEach(img => allImages.push(img.image_url));
  }
  if (part.image_url && !allImages.includes(part.image_url)) {
    allImages.unshift(part.image_url);
  }

  const price = formatPrice(part);
  const inCart = isInCart(part.id);
  const conditionInfo = part.condition ? CONDITION_LABELS[part.condition] : null;

  const handlePrev = () => setActiveImage(i => (i - 1 + allImages.length) % allImages.length);
  const handleNext = () => setActiveImage(i => (i + 1) % allImages.length);

  const handleToggleCart = () => {
    if (inCart) {
      removeItem(part.id);
    } else {
      addItem({ part_id: part.id, part_title: part.title });
    }
  };

  return (
    <Layout>
      <PageHeader title="DELEKATALOG" subtitle={category?.name || "Detaljer"} />

      <section className="poster-section">
        <div className="container mx-auto px-4 relative z-10">
          {/* Back link */}
          <Link
            to="/deler"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 font-display uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            Tilbake til deler
          </Link>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              {/* LEFT: Image gallery */}
              <div>
                {allImages.length > 0 ? (
                  <div>
                    {/* Main image */}
                    <div
                      className="relative aspect-square overflow-hidden rounded-sm bg-muted cursor-pointer"
                      style={{ border: '1px solid rgba(0,0,0,0.06)' }}
                      onClick={() => setLightboxOpen(true)}
                    >
                      <img
                        src={getOptimizedImageUrl(allImages[activeImage], { width: 800 })}
                        alt={`${part.title} – bilde ${activeImage + 1}`}
                        className="w-full h-full object-contain"
                      />

                      {/* Nav arrows */}
                      {allImages.length > 1 && (
                        <>
                          <button
                            onClick={handlePrev}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors shadow-md"
                            aria-label="Forrige bilde"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={handleNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors shadow-md"
                            aria-label="Neste bilde"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}

                      {/* Counter */}
                      {allImages.length > 1 && (
                        <span className="absolute bottom-2 right-2 text-[10px] bg-foreground/70 text-background px-2 py-0.5 rounded-full font-medium">
                          {activeImage + 1} / {allImages.length}
                        </span>
                      )}
                    </div>

                    {/* Thumbnail strip */}
                    {allImages.length > 1 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                        {allImages.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveImage(idx)}
                            className={`flex-shrink-0 w-16 h-16 rounded-sm overflow-hidden transition-all ${
                              idx === activeImage
                                ? "ring-2 ring-accent opacity-100"
                                : "opacity-50 hover:opacity-80"
                            }`}
                          >
                            <img
                              src={getThumbnailUrl(img, 120)}
                              alt={`Miniatyrbilde ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="aspect-square rounded-sm bg-muted flex items-center justify-center"
                    style={{ border: '1px solid rgba(0,0,0,0.06)' }}
                  >
                    <span className="text-muted-foreground text-sm">Ingen bilder</span>
                  </div>
                )}
              </div>

              {/* RIGHT: Info */}
              <div className="flex flex-col">
                {/* Category */}
                {category && (
                  <span className="text-muted-foreground text-[11px] uppercase tracking-widest mb-2 font-medium">
                    {category.name}
                  </span>
                )}

                {/* Title */}
                <h1 className="font-display text-3xl md:text-5xl leading-tight uppercase tracking-wide mb-4">
                  {part.title}
                </h1>

                {/* Condition badge */}
                {conditionInfo && (
                  <span className={`inline-block self-start text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-sm mb-4 ${conditionInfo.className}`}>
                    {conditionInfo.label}
                  </span>
                )}

                {/* Price */}
                {price && (
                  <p className="font-serif text-2xl md:text-3xl text-foreground font-bold leading-none mb-1">
                    {price}
                  </p>
                )}

                {/* Price note */}
                {part.price_note && (
                  <p className="text-xs text-muted-foreground italic mb-4">{part.price_note}</p>
                )}

                {/* Divider */}
                <div className="border-t border-foreground/10 my-4" />

                {/* Description */}
                {part.description && (
                  <div className="prose prose-sm max-w-none mb-6">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {part.description}
                    </p>
                  </div>
                )}

                {/* CTA */}
                <div className="mt-auto pt-4">
                  <button
                    onClick={handleToggleCart}
                    className={`w-full py-3 text-sm font-display uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 transition-all ${
                      inCart
                        ? "bg-green-700 text-white"
                        : "border border-foreground/20 text-foreground hover:bg-foreground hover:text-background"
                    }`}
                  >
                    {inCart ? (
                      <><Check className="w-5 h-5" />Lagt til i verktøykassa</>
                    ) : (
                      <><img src={toolboxIcon} alt="" className="w-7 h-7 object-contain" />Legg i verktøykassa</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ImageLightbox
        images={allImages.map((url, i) => ({ url, alt: `${part.title} – bilde ${i + 1}` }))}
        initialIndex={activeImage}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </Layout>
  );
}
