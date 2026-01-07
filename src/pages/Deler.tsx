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
}
const Deler = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const {
    items,
    addItem,
    removeItem,
    isInCart,
    itemCount
  } = useCart();
  useEffect(() => {
    const fetchData = async () => {
      const [categoriesRes, partsRes] = await Promise.all([supabase.from("categories").select("*").order("name"), supabase.from("parts").select("*").eq("published", true).order("title")]);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (partsRes.data) setParts(partsRes.data);
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
      addItem({
        part_id: part.id,
        part_title: part.title
      });
      toast.success(`${part.title} lagt til i verktøykassen`);
    }
  };
  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    const category = categories.find(c => c.id === categoryId);
    return category?.name;
  };
  const selectedCategoryName = selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : "Alle deler";
  return <Layout>
      <PageHeader title="DELER" subtitle="Finn deler til din Simca – legg i verktøykassen så sjekker vi hylla!" />

      {/* Toolbox Banner - Compact sticky */}
      {itemCount > 0 && <div className="bg-accent text-accent-foreground py-2 md:py-3 sticky top-16 z-40 shadow-md">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 md:w-5 md:h-5" />
              <span className="font-medium text-sm md:text-base">
                {itemCount} del{itemCount !== 1 ? "er" : ""}
              </span>
            </div>
            <Link to="/foresporsel" className="bg-accent-foreground text-accent px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium rounded-full flex items-center gap-1">
              SE ALLE
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>}

      {/* Filter bar - finn.no style */}
      <div className="bg-muted/50 border-b border-border sticky top-16 z-30">
        <div className="container mx-auto px-4 py-2 flex items-center gap-2">
          {/* Category filter button */}
          <button onClick={() => setShowCategorySheet(true)} className="flex items-center gap-2 bg-card border border-border rounded-full px-3 py-1.5 text-sm font-medium hover:border-primary transition-colors">
            <Filter className="w-4 h-4" />
            <span className="max-w-[120px] truncate">{selectedCategoryName}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Clear filter */}
          {selectedCategory && <button onClick={() => setSelectedCategory(null)} className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2 py-1.5 text-xs font-medium">
              <X className="w-3 h-3" />
              Nullstill
            </button>}

          {/* Spacer */}
          <div className="flex-1" />

          {/* View toggle */}
          <div className="flex items-center bg-card border border-border rounded-full p-0.5">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-full transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>

          {/* Result count */}
          <span className="text-xs text-muted-foreground hidden sm:block">
            {filteredParts.length} treff
          </span>
        </div>
      </div>

      {/* Category sheet overlay */}
      {showCategorySheet && <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowCategorySheet(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl max-h-[70vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <h3 className="font-display text-lg">Velg kategori</h3>
              <button onClick={() => setShowCategorySheet(false)} className="p-2 -m-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-1">
              <button onClick={() => {
            setSelectedCategory(null);
            setShowCategorySheet(false);
          }} className={`w-full text-left py-3 px-4 rounded-lg flex items-center justify-between ${!selectedCategory ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                <span className="font-medium">Alle deler</span>
                <span className="text-sm opacity-70">{parts.length}</span>
              </button>

              {parentCategories.map(parent => {
            const children = getChildren(parent.id);
            const parentPartCount = parts.filter(p => p.category_id === parent.id || children.some(c => c.id === p.category_id)).length;
            return <div key={parent.id}>
                    <button onClick={() => {
                setSelectedCategory(parent.id);
                setShowCategorySheet(false);
              }} className={`w-full text-left py-3 px-4 rounded-lg flex items-center justify-between ${selectedCategory === parent.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                      <span className="font-medium">{parent.name}</span>
                      <span className="text-sm opacity-70">{parentPartCount}</span>
                    </button>

                    {children.length > 0 && <div className="ml-4 border-l-2 border-border pl-2">
                        {children.map(child => {
                  const childPartCount = parts.filter(p => p.category_id === child.id).length;
                  return <button key={child.id} onClick={() => {
                    setSelectedCategory(child.id);
                    setShowCategorySheet(false);
                  }} className={`w-full text-left py-2 px-3 rounded-lg text-sm flex items-center justify-between ${selectedCategory === child.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                              <span>{child.name}</span>
                              <span className="opacity-70">{childPartCount}</span>
                            </button>;
                })}
                      </div>}
                  </div>;
          })}
            </div>
          </div>
        </div>}

      {/* Parts listing */}
      <section className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-4">
          {isLoading ? <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="bg-card rounded-lg p-4 animate-pulse flex gap-3">
                  <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>)}
            </div> : filteredParts.length === 0 ? <div className="bg-card rounded-lg text-center py-12">
              <Wrench className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                {selectedCategory ? "Ingen deler i denne kategorien" : "Ingen deler lagt til ennå"}
              </p>
            </div> : viewMode === 'list' ? (/* List view - finn.no style */
        <div className="space-y-2">
              {filteredParts.map(part => {
            const inCart = isInCart(part.id);
            return <div key={part.id} className="bg-card rounded-lg border border-border overflow-hidden flex">
                    {/* Thumbnail */}
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-muted flex-shrink-0">
                      {part.image_url ? <img src={part.image_url} alt={part.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">
                          <Wrench className="w-6 h-6 text-muted-foreground" />
                        </div>}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                      <div>
                        {/* Category tag */}
                        {part.category_id && <span className="inline-block bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded mb-1">
                            {getCategoryName(part.category_id)}
                          </span>}
                        
                        {/* Title */}
                        <h3 className="font-medium text-sm md:text-base leading-tight line-clamp-2">
                          {part.title}
                        </h3>
                        
                        {/* Description */}
                        {part.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {part.description}
                          </p>}
                      </div>

                      {/* Add button */}
                      <button onClick={() => handleAddToCart(part)} className={`self-end mt-2 px-3 py-1.5 text-xs font-medium rounded-full flex items-center gap-1 transition-colors ${inCart ? "bg-green-600 text-white" : "bg-accent text-accent-foreground hover:bg-accent/80"}`}>
                        {inCart ? <>
                            <Check className="w-3 h-3" />
                            Lagt til
                          </> : <>
                            <Plus className="w-3 h-3" />
                            Legg til
                          </>}
                      </button>
                    </div>
                  </div>;
          })}
            </div>) : (/* Grid view */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredParts.map(part => {
            const inCart = isInCart(part.id);
            return <div key={part.id} className="bg-card rounded-lg border border-border overflow-hidden">
                    {/* Image */}
                    <div className="aspect-square bg-muted relative">
                      {part.image_url ? <img src={part.image_url} alt={part.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">
                          <Wrench className="w-8 h-8 text-muted-foreground" />
                        </div>}
                      
                      {/* Quick add button */}
                      <button onClick={() => handleAddToCart(part)} className={`absolute bottom-2 right-2 p-2 rounded-full shadow-lg transition-colors ${inCart ? "bg-green-600 text-white" : "bg-card text-foreground hover:bg-accent"}`}>
                        {inCart ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-2.5">
                      {part.category_id && <span className="inline-block bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded mb-1">
                          {getCategoryName(part.category_id)}
                        </span>}
                      <h3 className="font-medium text-xs md:text-sm leading-tight line-clamp-2">
                        {part.title}
                      </h3>
                    </div>
                  </div>;
          })}
            </div>)}
        </div>
      </section>

      {/* CTA - Compact */}
      <section className="bg-primary text-primary-foreground py-6 md:py-8">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-base md:text-xl mb-2">Fant du ikke det du lette etter?</h2>
          <p className="text-sm opacity-90 mb-4">
            Ta kontakt så hjelper vi deg
          </p>
          <a href="mailto:kontaktpeder@gmail.com" className="inline-flex items-center gap-2 bg-card text-foreground px-4 py-2 rounded-full text-sm font-medium hover:bg-card/90 transition-colors">
            Send melding
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    </Layout>;
};
export default Deler;