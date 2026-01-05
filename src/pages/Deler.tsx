import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { ShoppingBag, Plus, Check, Wrench, ChevronRight } from "lucide-react";
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
  const { items, addItem, removeItem, isInCart, itemCount } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      const [categoriesRes, partsRes] = await Promise.all([
        supabase.from("categories").select("*").order("name"),
        supabase.from("parts").select("*").eq("published", true).order("title"),
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (partsRes.data) setParts(partsRes.data);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const parentCategories = categories.filter((c) => !c.parent_id);
  const getChildren = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId);

  const filteredParts = selectedCategory
    ? parts.filter((p) => {
        // Check if part belongs to selected category or its children
        const childIds = getChildren(selectedCategory).map((c) => c.id);
        return p.category_id === selectedCategory || childIds.includes(p.category_id || "");
      })
    : parts;

  const handleAddToCart = (part: Part) => {
    if (isInCart(part.id)) {
      removeItem(part.id);
      toast.info(`${part.title} fjernet fra forespørselen`);
    } else {
      addItem({ part_id: part.id, part_title: part.title });
      toast.success(`${part.title} lagt til i forespørselen`);
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    const category = categories.find((c) => c.id === categoryId);
    return category?.name;
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="poster-section poster-section-blue">
        <div className="container mx-auto text-center">
          <h1 className="headline-lg mb-4">DELER</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Bla gjennom vårt utvalg av deler til Simca-modeller. 
            Legg delene du er interessert i i forespørselen, så sjekker pappa hylla! 🔧
          </p>
        </div>
      </section>

      {/* Cart Banner */}
      {itemCount > 0 && (
        <div className="bg-accent text-accent-foreground py-4 sticky top-20 z-40">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-6 h-6" />
              <span className="font-display text-lg">
                {itemCount} del{itemCount !== 1 ? "er" : ""} i forespørselen
              </span>
            </div>
            <Link
              to="/foresporsel"
              className="bg-accent-foreground text-accent px-6 py-2 font-display hover:opacity-90 transition-opacity"
            >
              SE FORESPØRSEL
              <ChevronRight className="w-5 h-5 inline ml-1" />
            </Link>
          </div>
        </div>
      )}

      <section className="poster-section">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar - Categories */}
            <aside className="lg:col-span-1">
              <div className="retro-card sticky top-40">
                <h2 className="font-display text-xl mb-4">KATEGORIER</h2>
                
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left py-2 px-3 mb-2 transition-colors ${
                    !selectedCategory
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  Alle deler ({parts.length})
                </button>

                {parentCategories.map((parent) => {
                  const children = getChildren(parent.id);
                  const parentPartCount = parts.filter(
                    (p) =>
                      p.category_id === parent.id ||
                      children.some((c) => c.id === p.category_id)
                  ).length;

                  return (
                    <div key={parent.id} className="mb-2">
                      <button
                        onClick={() => setSelectedCategory(parent.id)}
                        className={`w-full text-left py-2 px-3 transition-colors font-medium ${
                          selectedCategory === parent.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        {parent.name} ({parentPartCount})
                      </button>

                      {children.length > 0 && (
                        <div className="ml-4 border-l-2 border-border">
                          {children.map((child) => {
                            const childPartCount = parts.filter(
                              (p) => p.category_id === child.id
                            ).length;
                            return (
                              <button
                                key={child.id}
                                onClick={() => setSelectedCategory(child.id)}
                                className={`w-full text-left py-1.5 px-3 text-sm transition-colors ${
                                  selectedCategory === child.id
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted"
                                }`}
                              >
                                {child.name} ({childPartCount})
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </aside>

            {/* Parts Grid */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <h2 className="headline-md">
                  {selectedCategory
                    ? categories.find((c) => c.id === selectedCategory)?.name.toUpperCase()
                    : "ALLE DELER"}
                </h2>
                <span className="text-muted-foreground">
                  {filteredParts.length} del{filteredParts.length !== 1 ? "er" : ""}
                </span>
              </div>

              {isLoading ? (
                <div className="text-center py-12">Laster deler...</div>
              ) : filteredParts.length === 0 ? (
                <div className="retro-card text-center py-12">
                  <Wrench className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {selectedCategory
                      ? "Ingen deler i denne kategorien ennå"
                      : "Ingen deler lagt til ennå"}
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredParts.map((part) => {
                    const inCart = isInCart(part.id);
                    return (
                      <div key={part.id} className="retro-card hover-lift">
                        {/* Image */}
                        <div className="aspect-square bg-muted mb-4 rounded overflow-hidden">
                          {part.image_url ? (
                            <img
                              src={part.image_url}
                              alt={part.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Wrench className="w-12 h-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Category badge */}
                        {part.category_id && (
                          <span className="inline-block bg-primary text-primary-foreground text-xs px-2 py-1 font-display mb-2">
                            {getCategoryName(part.category_id)}
                          </span>
                        )}

                        {/* Title */}
                        <h3 className="font-display text-xl mb-2">{part.title}</h3>

                        {/* Description */}
                        {part.description && (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {part.description}
                          </p>
                        )}

                        {/* Add to cart button */}
                        <button
                          onClick={() => handleAddToCart(part)}
                          className={`w-full py-3 font-display text-sm flex items-center justify-center gap-2 transition-colors ${
                            inCart
                              ? "bg-green-600 text-white border-2 border-green-600"
                              : "bg-accent text-accent-foreground border-2 border-foreground"
                          }`}
                        >
                          {inCart ? (
                            <>
                              <Check className="w-5 h-5" />
                              I FORESPØRSELEN
                            </>
                          ) : (
                            <>
                              <Plus className="w-5 h-5" />
                              LEGG I FORESPØRSEL
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="poster-section poster-section-red">
        <div className="container mx-auto text-center">
          <h2 className="headline-md mb-4">FANT DU IKKE DET DU LETTE ETTER?</h2>
          <p className="text-xl mb-6 opacity-90">
            Ta kontakt med oss så hjelper vi deg å finne riktig del.
          </p>
          <a
            href="mailto:kontaktpeder@gmail.com"
            className="btn-retro bg-accent-foreground text-accent inline-flex"
          >
            Send e-post
          </a>
        </div>
      </section>
    </Layout>
  );
};

export default Deler;
