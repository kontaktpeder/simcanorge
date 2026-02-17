import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { Plus, Check, Wrench, ChevronRight, Briefcase, ChevronDown, X, Filter, Grid3X3, List } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

interface Part {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category_id: string | null;
  price_min: number | null;
  price_max: number | null;
  price_note: string | null;
  condition: string | null;
  part_images?: { id: string; image_url: string; sort_order: number }[];
}

function getPartCoverImage(part: Part): string | null {
  if (part.part_images?.length) {
    const sorted = [...part.part_images].sort((a, b) => a.sort_order - b.sort_order);
    return sorted[0]?.image_url ?? null;
  }
  return part.image_url;
}

function formatPartPrice(part: Part): string | null {
  if (part.price_min != null && part.price_max != null) return `${part.price_min}–${part.price_max} kr`;
  if (part.price_min != null) return `${part.price_min} kr`;
  if (part.price_max != null) return `${part.price_max} kr`;
  return null;
}

const CONDITION_COLORS: Record<string, string> = {
  "Ny": "bg-green-700/90 text-white",
  "NOS": "bg-amber-700/90 text-white",
  "Brukt": "bg-muted-foreground/80 text-white",
  "Original": "bg-foreground/80 text-white",
  "Repro": "bg-primary/80 text-white",
};

const Deler = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { items, addItem, removeItem, isInCart, itemCount } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      const [categoriesRes, partsRes] = await Promise.all([
        supabase.from("categories").select("*").order("name"),
        supabase
          .from("parts")
          .select("id, title, description, image_url, category_id, price_min, price_max, price_note, condition, part_images(id, image_url, sort_order)")
          .eq("published", true)
          .order("title"),
      ]);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (partsRes.data) setParts(partsRes.data as unknown as Part[]);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const parentCategories = categories.filter(c => !c.parent_id);
  const getChildren = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  const filteredParts = selectedCategory ? parts.filter(p => {
    const childIds = getChildren(selectedCategory).map(c => c.id);
    return p.category_id === selectedCategory || childIds.includes(p.category_id || "");
  }) : parts;

  const handleAddToCart = (part: Part) => {
    if (isInCart(part.id)) {
      removeItem(part.id);
      toast.info(`${part.title} fjernet fra verktøykassen`);
    } else {
      addItem({ part_id: part.id, part_title: part.title });
      toast.success(`${part.title} lagt til i verktøykassen`);
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    return categories.find(c => c.id === categoryId)?.name;
  };

  const selectedCategoryName = selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : "Alle deler";

  return (
    <Layout>
      <PageHeader title="DELER" subtitle="Finn deler til din Simca – legg i verktøykassen så sjekker vi hylla!" />

      {/* Toolbox Banner */}
      {itemCount > 0 && (
        <div className="bg-accent text-accent-foreground py-2 md:py-3 sticky top-16 z-40 shadow-md">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 md:w-5 md:h-5" />
              <span className="font-medium text-sm md:text-base">{itemCount} del{itemCount !== 1 ? "er" : ""}</span>
            </div>
            <Link to="/foresporsel" className="bg-accent-foreground text-accent px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium rounded-full flex items-center gap-1">
              SE ALLE
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-muted/50 border-b border-border sticky top-16 z-30">
        <div className="container mx-auto px-4 py-2 flex items-center gap-2">
          <button onClick={() => setShowCategorySheet(true)} className="flex items-center gap-2 bg-card border border-border rounded-full px-3 py-1.5 text-sm font-medium hover:border-primary transition-colors">
            <Filter className="w-4 h-4" />
            <span className="max-w-[120px] truncate">{selectedCategoryName}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
          {selectedCategory && (
            <button onClick={() => setSelectedCategory(null)} className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2 py-1.5 text-xs font-medium">
              <X className="w-3 h-3" />
              Nullstill
            </button>
          )}
          <div className="flex-1" />
          <div className="flex items-center bg-card border border-border rounded-full p-0.5">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-full transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">{filteredParts.length} treff</span>
        </div>
      </div>

      {/* Category sheet overlay */}
      {showCategorySheet && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowCategorySheet(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl max-h-[70vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <h3 className="font-display text-lg">Velg kategori</h3>
              <button onClick={() => setShowCategorySheet(false)} className="p-2 -m-2"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-1">
              <button onClick={() => { setSelectedCategory(null); setShowCategorySheet(false); }} className={`w-full text-left py-3 px-4 rounded-lg flex items-center justify-between ${!selectedCategory ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                <span className="font-medium">Alle deler</span>
                <span className="text-sm opacity-70">{parts.length}</span>
              </button>
              {parentCategories.map(parent => {
                const children = getChildren(parent.id);
                const parentPartCount = parts.filter(p => p.category_id === parent.id || children.some(c => c.id === p.category_id)).length;
                return (
                  <div key={parent.id}>
                    <button onClick={() => { setSelectedCategory(parent.id); setShowCategorySheet(false); }} className={`w-full text-left py-3 px-4 rounded-lg flex items-center justify-between ${selectedCategory === parent.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                      <span className="font-medium">{parent.name}</span>
                      <span className="text-sm opacity-70">{parentPartCount}</span>
                    </button>
                    {children.length > 0 && (
                      <div className="ml-4 border-l-2 border-border pl-2">
                        {children.map(child => {
                          const childPartCount = parts.filter(p => p.category_id === child.id).length;
                          return (
                            <button key={child.id} onClick={() => { setSelectedCategory(child.id); setShowCategorySheet(false); }} className={`w-full text-left py-2 px-3 rounded-lg text-sm flex items-center justify-between ${selectedCategory === child.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                              <span>{child.name}</span>
                              <span className="opacity-70">{childPartCount}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Parts listing — newsprint background */}
      <section className="min-h-screen relative" style={{ background: 'hsl(42, 30%, 95%)' }}>
        {/* Subtle paper texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }} />

        <div className="container mx-auto px-4 py-6 md:py-10 relative z-10">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="rounded-sm overflow-hidden animate-pulse" style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div className="aspect-[4/3] bg-muted" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-5 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredParts.length === 0 ? (
            <div className="rounded-sm text-center py-16" style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <Wrench className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                {selectedCategory ? "Ingen deler i denne kategorien" : "Ingen deler lagt til ennå"}
              </p>
            </div>
          ) : viewMode === 'list' ? (
            /* ——— LIST VIEW ——— */
            <div className="space-y-3">
              {filteredParts.map(part => {
                const inCart = isInCart(part.id);
                const coverImage = getPartCoverImage(part);
                const price = formatPartPrice(part);
                return (
                  <div
                    key={part.id}
                    className="rounded-sm overflow-hidden flex"
                    style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.06)' }}
                  >
                    <div className="w-28 md:w-40 flex-shrink-0 relative" style={{ aspectRatio: '4/3' }}>
                      {coverImage ? (
                        <img src={coverImage} alt={part.title} className="w-full h-full object-cover object-center" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Wrench className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      {part.condition && (
                        <span className={`absolute top-2 left-2 text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-sm ${CONDITION_COLORS[part.condition] || 'bg-muted text-foreground'}`}>
                          {part.condition}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 p-3 md:p-4 flex flex-col justify-between min-w-0">
                      <div>
                        {part.category_id && (
                          <span className="inline-block text-muted-foreground text-[10px] uppercase tracking-wider mb-1">
                            {getCategoryName(part.category_id)}
                          </span>
                        )}
                        <h3 className="font-display text-sm md:text-base leading-tight uppercase tracking-wide">{part.title}</h3>
                        {price && (
                          <p className="font-serif text-lg md:text-xl text-foreground font-bold mt-2">{price}</p>
                        )}
                        {part.price_note && <p className="text-[11px] text-muted-foreground mt-0.5 italic">{part.price_note}</p>}
                        {part.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{part.description}</p>}
                      </div>
                      <button
                        onClick={() => handleAddToCart(part)}
                        className={`self-end mt-2 px-3 py-1.5 text-xs font-medium rounded-sm flex items-center gap-1.5 transition-all ${
                          inCart
                            ? "bg-green-700 text-white"
                            : "border border-foreground/20 text-foreground hover:bg-foreground hover:text-background"
                        }`}
                      >
                        {inCart ? <><Check className="w-3 h-3" />Lagt til</> : <><Plus className="w-3 h-3" />Verktøykassa</>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ——— GRID VIEW (3 columns, magazine cards) ——— */
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-7">
              {filteredParts.map(part => {
                const inCart = isInCart(part.id);
                const coverImage = getPartCoverImage(part);
                const price = formatPartPrice(part);
                return (
                  <div
                    key={part.id}
                    className="rounded-sm overflow-hidden group"
                    style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.06)' }}
                  >
                    {/* Image with fixed aspect ratio */}
                    <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                      {coverImage ? (
                        <img src={coverImage} alt={part.title} className="w-full h-full object-cover object-center" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Wrench className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                      )}
                      {/* Condition badge */}
                      {part.condition && (
                        <span className={`absolute top-2 left-2 text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-sm ${CONDITION_COLORS[part.condition] || 'bg-muted text-foreground'}`}>
                          {part.condition}
                        </span>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="p-3 md:p-4">
                      {/* Category tag */}
                      {part.category_id && (
                        <span className="inline-block text-muted-foreground text-[10px] uppercase tracking-wider mb-1">
                          {getCategoryName(part.category_id)}
                        </span>
                      )}

                      {/* Title */}
                      <h3 className="font-display text-sm md:text-base leading-tight line-clamp-2 uppercase tracking-wide">
                        {part.title}
                      </h3>

                      {/* Price — hero element, serif, large */}
                      {price && (
                        <p className="font-serif text-lg md:text-xl text-foreground font-bold mt-2 leading-none">
                          {price}
                        </p>
                      )}

                      {/* Price note */}
                      {part.price_note && (
                        <p className="text-[10px] md:text-[11px] text-muted-foreground mt-0.5 italic">{part.price_note}</p>
                      )}

                      {/* Thin rule + CTA */}
                      <div className="mt-3 pt-3 border-t border-foreground/5">
                        <button
                          onClick={() => handleAddToCart(part)}
                          className={`w-full py-2 text-xs font-medium rounded-sm flex items-center justify-center gap-1.5 transition-all ${
                            inCart
                              ? "bg-green-700 text-white"
                              : "border border-foreground/20 text-foreground hover:bg-foreground hover:text-background"
                          }`}
                        >
                          {inCart ? <><Check className="w-3.5 h-3.5" />Lagt til</> : <><Plus className="w-3.5 h-3.5" />Legg i verktøykassa</>}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-6 md:py-8">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-base md:text-xl mb-2">Fant du ikke det du lette etter?</h2>
          <p className="text-sm opacity-90 mb-4">Ta kontakt så hjelper vi deg</p>
          <Link to="/kontakt" className="inline-flex items-center gap-2 bg-card text-foreground px-4 py-2 rounded-full text-sm font-medium hover:bg-card/90 transition-colors">
            Kontakt oss
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default Deler;
