import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useCart } from "@/hooks/useCart";
import { useMarkedsplassFeed, useMarkedsplassCategories } from "@/hooks/useMarkedsplassFeed";
import { CONDITION_COLORS } from "@/lib/markedsplassUtils";
import { getThumbnailUrl } from "@/lib/imageUtils";
import { Input } from "@/components/ui/input";
import {
  Search, Plus, Info, Wrench, Check, Briefcase,
  ChevronRight, ChevronDown, X, Filter, Grid3X3, List,
} from "lucide-react";
import { toast } from "sonner";
import toolboxIcon from "@/assets/toolbox-blue.png";
import type { FeedItem } from "@/lib/markedsplassUtils";

export default function Markedsplass() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: feedItems, isLoading } = useMarkedsplassFeed(
    filter as any,
    searchQuery || undefined
  );
  const { data: cats } = useMarkedsplassCategories();
  const { items: cartItems, addItem, removeItem, isInCart, itemCount } = useCart();

  const handleToggleCart = (item: FeedItem) => {
    if (isInCart(item.type, item.id)) {
      removeItem(item.type, item.id);
      toast.info(`${item.title} fjernet fra verktøykassen`);
    } else {
      addItem({
        type: item.type,
        id: item.id,
        slug: item.slug,
        title: item.title,
        ...(item.type === "listing" && item.ownerId ? {
          owner_id: item.ownerId,
          owner_name: item.ownerName || null,
        } : {}),
      });
      toast.success(`${item.title} lagt til i verktøykassen`);
    }
  };

  const filterLabel =
    filter === "all" ? "Alt" :
    filter === "parts" ? "Bildeler" :
    cats?.marketplaceCategories.find((c) => c.id === filter)?.name || "Filter";

  const filteredItems = feedItems || [];

  return (
    <Layout>
      <Helmet>
        <title>Markedsplass | Simca Norge</title>
        <meta name="description" content="Kjøp og selg deler, tilbehør og biler fra Simca-entusiaster i Norge." />
      </Helmet>

      <PageHeader
        title="MARKEDSPLASS"
        subtitle="Bildeler, tilbehør og annonser fra Simca, Talbot og Matra-entusiaster"
      />

      {/* Toolbox Banner */}
      {itemCount > 0 && (
        <div className="bg-accent text-accent-foreground py-2 md:py-3 sticky top-16 z-40 shadow-md">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 md:w-5 md:h-5" />
              <span className="font-medium text-sm md:text-base">
                {itemCount} vare{itemCount !== 1 ? "r" : ""}
              </span>
            </div>
            <Link
              to="/foresporsel"
              className="bg-accent-foreground text-accent px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium rounded-full flex items-center gap-1"
            >
              SE ALLE
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-muted/50 border-b border-border sticky top-16 z-30">
        <div className="container mx-auto px-4 py-2 flex items-center gap-2">
          <button
            onClick={() => setShowCategorySheet(true)}
            className="flex items-center gap-2 bg-card border border-border rounded-full px-3 py-1.5 text-sm font-medium hover:border-primary transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="max-w-[120px] truncate">{filterLabel}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
          {filter !== "all" && (
            <button
              onClick={() => setFilter("all")}
              className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2 py-1.5 text-xs font-medium"
            >
              <X className="w-3 h-3" />
              Nullstill
            </button>
          )}

          {/* Search inline */}
          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-8 text-sm"
            />
          </div>

          <div className="flex items-center bg-card border border-border rounded-full p-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-full transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-full transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>

          <span className="text-xs text-muted-foreground hidden sm:block">
            {filteredItems.length} treff
          </span>
        </div>
      </div>

      {/* Category Sheet */}
      {showCategorySheet && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowCategorySheet(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl max-h-[70vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <h3 className="font-display text-lg">Velg kategori</h3>
              <button onClick={() => setShowCategorySheet(false)} className="p-2 -m-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-1">
              <button
                onClick={() => { setFilter("all"); setShowCategorySheet(false); }}
                className={`w-full text-left py-3 px-4 rounded-lg ${filter === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                <span className="font-medium">Alt</span>
              </button>
              <button
                onClick={() => { setFilter("parts"); setShowCategorySheet(false); }}
                className={`w-full text-left py-3 px-4 rounded-lg ${filter === "parts" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                <span className="font-medium">Bildeler (lager)</span>
              </button>
              {cats?.marketplaceCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setFilter(cat.id); setShowCategorySheet(false); }}
                  className={`w-full text-left py-3 px-4 rounded-lg ${filter === cat.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  <span className="font-medium">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Banner + CTA */}
      <section className="container mx-auto px-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4 shrink-0" />
            Alt som legges ut av privatpersoner må godkjennes.
          </div>
          <Link
            to="/start-annonse"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors w-fit"
          >
            <Plus className="h-4 w-4" />
            Opprett annonse
          </Link>
        </div>
      </section>

      {/* Listing */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <img src={toolboxIcon} alt="" className="w-16 h-16 object-contain animate-pulse" />
          <p className="text-muted-foreground font-display text-lg uppercase tracking-wider">Laster…</p>
        </div>
      ) : (
        <section className="min-h-screen relative" style={{ background: "hsl(42, 30%, 95%)" }}>
          {/* Paper texture */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            }}
          />

          <div className="container mx-auto px-4 py-6 md:py-10 relative z-10">
            {filteredItems.length === 0 ? (
              <div
                className="rounded-sm text-center py-16"
                style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(0,0,0,0.06)" }}
              >
                <Wrench className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">
                  {searchQuery ? "Ingen treff" : "Ingen varer ennå"}
                </p>
              </div>
            ) : viewMode === "list" ? (
              /* LIST VIEW */
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <FeedListItem key={`${item.type}-${item.id}`} item={item} inCart={isInCart(item.type, item.id)} onToggleCart={() => handleToggleCart(item)} />
                ))}
              </div>
            ) : (
              /* GRID VIEW */
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-7 auto-rows-fr">
                {filteredItems.map((item, index) => (
                  <FeedGridItem key={`${item.type}-${item.id}`} item={item} index={index} inCart={isInCart(item.type, item.id)} onToggleCart={() => handleToggleCart(item)} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="bg-primary text-primary-foreground py-6 md:py-8">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-base md:text-xl mb-2">Fant du ikke det du lette etter?</h2>
          <p className="text-sm opacity-90 mb-4">Ta kontakt så hjelper vi deg</p>
          <Link
            to="/kontakt"
            className="inline-flex items-center gap-2 bg-card text-foreground px-4 py-2 rounded-full text-sm font-medium hover:bg-card/90 transition-colors"
          >
            Kontakt oss
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </Layout>
  );
}

// Grid card component
function FeedGridItem({
  item,
  index,
  inCart,
  onToggleCart,
}: {
  item: FeedItem;
  index: number;
  inCart: boolean;
  onToggleCart: () => void;
}) {
  const detailUrl = `/annonse/${item.slug}`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.03 * Math.min(index, 10) }}
    >
      <Link
        to={detailUrl}
        className="rounded-sm overflow-hidden group flex flex-col cursor-pointer h-full"
        style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="aspect-[4/3] relative overflow-hidden bg-muted">
          {item.coverImage ? (
            <img
              src={getThumbnailUrl(item.coverImage, 400)}
              alt={item.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Wrench className="w-8 h-8 text-muted-foreground/50" />
            </div>
          )}
          {item.condition && (
            <span className={`absolute top-2 left-2 text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-sm ${CONDITION_COLORS[item.condition] || "bg-muted text-foreground"}`}>
              {item.condition}
            </span>
          )}
        </div>

        <div className="p-3 md:p-4 flex flex-col flex-1">
          {item.categoryName && (
            <span className="inline-block text-muted-foreground text-[10px] uppercase tracking-wider mb-1">
              {item.categoryName}
            </span>
          )}
          <h3 className="font-display text-xl md:text-3xl leading-tight line-clamp-2 uppercase tracking-wide">
            {item.title}
          </h3>
          {item.price && (
            <p className="font-serif text-lg md:text-xl text-foreground font-bold mt-2 leading-none">
              {item.price}
            </p>
          )}
          {item.priceNote && (
            <p className="text-[10px] md:text-[11px] text-muted-foreground mt-0.5 italic">{item.priceNote}</p>
          )}
          {item.ownerName && (
            <p className="text-xs text-muted-foreground mt-1">
              {item.ownerName}
              {item.location && ` · ${item.location}`}
            </p>
          )}

          <div className="mt-auto pt-3 border-t border-foreground/5">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleCart(); }}
              className={`w-full py-2 text-xs font-medium rounded-sm flex items-center justify-center gap-1.5 transition-all ${
                inCart
                  ? "bg-green-700 text-white"
                  : "border border-foreground/20 text-foreground hover:bg-foreground hover:text-background"
              }`}
            >
              {inCart ? (
                <><Check className="w-4 h-4" />Lagt til</>
              ) : (
                <><img src={toolboxIcon} alt="" className="w-6 h-6 object-contain" />Legg i verktøykassa</>
              )}
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// List item component
function FeedListItem({
  item,
  inCart,
  onToggleCart,
}: {
  item: FeedItem;
  inCart: boolean;
  onToggleCart: () => void;
}) {
  const detailUrl = `/annonse/${item.slug}`;
  return (
    <Link
      to={detailUrl}
      className="rounded-sm overflow-hidden flex"
      style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(0,0,0,0.06)" }}
    >
      <div className="w-28 md:w-40 flex-shrink-0 relative" style={{ aspectRatio: "4/3" }}>
        {item.coverImage ? (
          <img src={getThumbnailUrl(item.coverImage, 300)} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Wrench className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        {item.condition && (
          <span className={`absolute top-2 left-2 text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-sm ${CONDITION_COLORS[item.condition] || "bg-muted text-foreground"}`}>
            {item.condition}
          </span>
        )}
      </div>
      <div className="flex-1 p-3 md:p-4 flex flex-col justify-between min-w-0">
        <div>
          {item.categoryName && (
            <span className="inline-block text-muted-foreground text-[10px] uppercase tracking-wider mb-1">
              {item.categoryName}
            </span>
          )}
          <h3 className="font-display text-xl md:text-3xl leading-tight uppercase tracking-wide">{item.title}</h3>
          {item.price && <p className="font-serif text-lg md:text-xl text-foreground font-bold mt-2">{item.price}</p>}
          {item.priceNote && <p className="text-[11px] text-muted-foreground mt-0.5 italic">{item.priceNote}</p>}
          {item.ownerName && <p className="text-xs text-muted-foreground mt-1">{item.ownerName}{item.location && ` · ${item.location}`}</p>}
        </div>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleCart(); }}
          className={`self-end mt-2 px-3 py-1.5 text-xs font-medium rounded-sm flex items-center gap-1.5 transition-all ${
            inCart
              ? "bg-green-700 text-white"
              : "border border-foreground/20 text-foreground hover:bg-foreground hover:text-background"
          }`}
        >
          {inCart ? <><Check className="w-3.5 h-3.5" />Lagt til</> : <><img src={toolboxIcon} alt="" className="w-5 h-5 object-contain" />Verktøykassa</>}
        </button>
      </div>
    </Link>
  );
}
