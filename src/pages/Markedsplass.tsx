import { useState, useMemo, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useCart } from "@/hooks/useCart";
import { useMarkedsplassFeed } from "@/hooks/useMarkedsplassFeed";
import { CONDITION_COLORS } from "@/lib/markedsplassUtils";
import { getThumbnailUrl } from "@/lib/imageUtils";
import {
  Wrench, Check, Briefcase, Package, Car, Warehouse,
  ChevronRight, X, SlidersHorizontal, Lock
} from "lucide-react";
import { toast } from "sonner";
import type { FeedItem } from "@/lib/markedsplassUtils";
import { MarkedsplassSidePanel, EMPTY_FILTER, type MarkedsplassFilterState } from "@/components/markedsplass/MarkedsplassSidePanel";
import {
  useUnifiedCategories,
  getAllDescendants,
  getRootCategories,
} from "@/hooks/useUnifiedCategories";
import { LISTING_TYPES, type ListingTypeId } from "@/config/listingTypes";
import { CreateCTA } from "@/components/ui/CreateCTA";

const TYPE_ICONS: Record<ListingTypeId, React.ReactNode> = {
  deler: <Wrench className="w-8 h-8" />,
  samleobjekter: <Package className="w-8 h-8" />,
  biler: <Car className="w-8 h-8" />,
  lagerplass: <Warehouse className="w-8 h-8" />,
};

export default function Markedsplass() {
  const { branch } = useParams<{ branch?: string }>();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [filterState, setFilterState] = useState<MarkedsplassFilterState>(EMPTY_FILTER);

  const { data: allCategories = [] } = useUnifiedCategories();
  const roots = getRootCategories(allCategories);

  // Resolve branch to listing type and root category
  const branchType = branch
    ? LISTING_TYPES.find((t) => t.urlSegment === branch)
    : undefined;

  const branchRootCategoryId = useMemo(() => {
    if (!branchType) return undefined;
    return roots.find((r) => r.slug === branchType.slug)?.id;
  }, [branchType, roots]);

  // Redirect invalid or locked branches
  useEffect(() => {
    if (branch && (!branchType || branchType.locked)) {
      navigate('/markedsplass', { replace: true });
    }
  }, [branch, branchType, navigate]);

  // Sync branch root to filter state
  useEffect(() => {
    if (branchRootCategoryId) {
      setFilterState((prev) => ({
        ...prev,
        rootCategoryId: branchRootCategoryId,
        hovedkategoriId: '',
        categoryId: '',
      }));
    }
  }, [branchRootCategoryId]);

  const feedFilter = useMemo(() => {
    if (filterState.categoryId) return filterState.categoryId;
    if (filterState.hovedkategoriId) {
      const descendants = getAllDescendants(allCategories, filterState.hovedkategoriId);
      return [filterState.hovedkategoriId, ...descendants.map((d) => d.id)];
    }
    if (filterState.rootCategoryId) {
      const descendants = getAllDescendants(allCategories, filterState.rootCategoryId);
      return [filterState.rootCategoryId, ...descendants.map((d) => d.id)];
    }
    return "all";
  }, [filterState.categoryId, filterState.hovedkategoriId, filterState.rootCategoryId, allCategories]);

  const { data: feedItems, isLoading } = useMarkedsplassFeed(
    feedFilter as any,
    searchQuery || undefined
  );
  const { items: cartItems, addItem, removeItem, isInCart, itemCount } = useCart();

  const filteredItems = useMemo(() => {
    let items = feedItems || [];
    if (filterState.priceMin) {
      const min = Number(filterState.priceMin);
      items = items.filter((item) => {
        if (!item.price) return false;
        const numericPrice = parseInt(item.price.replace(/[^\d]/g, ''), 10);
        return !isNaN(numericPrice) && numericPrice >= min;
      });
    }
    if (filterState.priceMax) {
      const max = Number(filterState.priceMax);
      items = items.filter((item) => {
        if (!item.price) return true;
        const numericPrice = parseInt(item.price.replace(/[^\d]/g, ''), 10);
        return !isNaN(numericPrice) && numericPrice <= max;
      });
    }
    if (filterState.condition) {
      items = items.filter((item) => item.condition === filterState.condition);
    }
    return items;
  }, [feedItems, filterState.priceMin, filterState.priceMax, filterState.condition]);

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
          owner_name: item.ownerName || null
        } : {})
      });
      toast.success(`${item.title} lagt til i verktøykassen`);
    }
  };

  const activeFilterCount = Object.entries(filterState)
    .filter(([key, v]) => key !== 'rootCategoryId' && v !== '' && v !== false)
    .length;
  const showFeed = !!branch && !!branchType && !branchType.locked;

  return (
    <Layout hideFooter>
      <Helmet>
        <title>{branchType ? `${branchType.label} | Markedsplass` : 'Markedsplass'} | Simca Norge</title>
        <meta name="description" content="Kjøp og selg deler, tilbehør og biler fra Simca-entusiaster i Norge." />
      </Helmet>

      <CreateCTA
        createUrl="/dashboard/opprett-annonse"
        label="Legg ut annonse"
        description="Selg deler, biler eller utstyr."
        variant="strip"
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

      {showFeed ? (
        /* ── BRANCH VIEW: sidebar + feed ── */
        <div className="flex relative lg:h-[calc(100vh-4rem)] lg:overflow-hidden">
          {/* Side Panel — desktop only */}
          <div className="hidden lg:block shrink-0 lg:w-[300px]">
            <div className="lg:h-[calc(100vh-4rem)] lg:overflow-y-auto">
              <MarkedsplassSidePanel
                open={sidePanelOpen}
                onOpenChange={setSidePanelOpen}
                filterState={filterState}
                onFilterChange={setFilterState}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                resultCount={filteredItems.length}
                fixedRootCategoryId={branchRootCategoryId}
                showExploreOtherLink
              />
            </div>
          </div>

          {/* Mobile drawer instance */}
          <div className="lg:hidden">
            <MarkedsplassSidePanel
              open={sidePanelOpen}
              onOpenChange={setSidePanelOpen}
              filterState={filterState}
              onFilterChange={setFilterState}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              resultCount={filteredItems.length}
              fixedRootCategoryId={branchRootCategoryId}
              showExploreOtherLink
            />
          </div>

          {/* Feed area */}
          <div className="flex-1 min-w-0 lg:overflow-y-auto">
            <PageHeader
              title={branchType.label.toUpperCase()}
              subtitle={branchType.description || "Bildeler, tilbehør og annonser fra Simca, Talbot og Matra-entusiaster"}
            />

            {/* Mobile filter bar */}
            <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b-2 border-foreground/10" style={{ background: "hsl(42, 30%, 93%)" }}>
              <button
                onClick={() => setSidePanelOpen(true)}
                className="flex items-center gap-2 font-display text-xs uppercase tracking-wider px-3 py-2 border-2 border-foreground/20 hover:border-primary hover:text-primary transition-all bg-white"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-primary text-primary-foreground rounded-full">{activeFilterCount}</span>
                )}
              </button>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => setFilterState({ ...EMPTY_FILTER, rootCategoryId: branchRootCategoryId || '', hovedkategoriId: '' })}
                  className="flex items-center gap-1 text-accent font-display text-[10px] uppercase tracking-wider px-2 py-1.5 border border-accent/30 hover:bg-accent hover:text-accent-foreground transition-all"
                >
                  <X className="w-3 h-3" />
                  Nullstill
                </button>
              )}
              <span className="ml-auto font-serif text-xs text-muted-foreground italic">
                {filteredItems.length} treff
              </span>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <img src="/toolbox-blue.png" alt="" className="w-16 h-16 object-contain animate-pulse" />
                <p className="text-muted-foreground font-display text-lg uppercase tracking-wider">Laster…</p>
              </div>
            ) : (
              <section className="relative" style={{ background: "hsl(42, 30%, 95%)" }}>
                <div
                  className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`
                  }}
                />
                <div className="px-4 py-6 md:py-10 relative z-10">
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
                    <div className="space-y-3">
                      {filteredItems.map((item) => (
                        <FeedListItem key={`${item.type}-${item.id}`} item={item} inCart={isInCart(item.type, item.id)} onToggleCart={() => handleToggleCart(item)} />
                      ))}
                    </div>
                  ) : (
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
            <section className="relative overflow-hidden" style={{ background: "hsl(212, 80%, 15%)" }}>
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "hsl(2, 85%, 40%)" }} />
              <div className="container mx-auto px-4 py-12 md:py-20 text-center relative z-10">
                <p className="font-display text-[10px] md:text-xs uppercase tracking-[0.4em] text-white/40 mb-3">
                  Simca · Talbot · Matra
                </p>
                <h2 className="font-display text-3xl md:text-5xl lg:text-6xl text-white uppercase tracking-wider leading-none mb-4">
                  Fant du ikke<br />det du lette etter?
                </h2>
                <p className="font-serif text-sm md:text-lg italic text-white/60 max-w-md mx-auto mb-8">
                  Ta kontakt med oss — vi hjelper deg gjerne med å finne riktige deler.
                </p>
                <Link
                  to="/kontakt"
                  className="group inline-flex items-center gap-3 px-10 py-4 md:px-14 md:py-5 font-display text-sm md:text-base uppercase tracking-[0.2em] border-2 border-white/30 text-white hover:border-white hover:bg-white/5 transition-all"
                >
                  Kontakt oss
                  <ChevronRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </section>

            <Footer />
          </div>
        </div>
      ) : (
        /* ── LANDING VIEW: category cards ── */
        <>
          <PageHeader
            title="MARKEDSPLASS"
            subtitle="Bildeler, tilbehør og annonser fra Simca, Talbot og Matra-entusiaster"
          />

          <section className="relative" style={{ background: "hsl(42, 30%, 95%)" }}>
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "hsl(2, 85%, 40%)" }} />
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, currentColor 1px, currentColor 2px)',
                backgroundSize: '100% 4px',
              }}
            />
            <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
              <div className="text-center mb-10">
                <p className="font-display text-xs md:text-sm uppercase tracking-[0.4em] text-foreground/40 mb-2">
                  Simca · Talbot · Matra
                </p>
                <h2 className="font-display text-3xl md:text-5xl uppercase tracking-wider">
                  Velg kategori
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-8 max-w-3xl mx-auto">
                {LISTING_TYPES.map((type, index) => {
                  const isLocked = type.locked;
                  return (
                    <motion.div
                      key={type.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.08 * index }}
                    >
                      {isLocked ? (
                        <div
                          className="relative p-8 md:p-10 border-2 border-foreground/10 opacity-50 cursor-not-allowed"
                          style={{ background: 'rgba(255,255,255,0.7)' }}
                        >
                          <Lock className="absolute top-4 right-4 w-4 h-4 text-muted-foreground" />
                          <div className="text-foreground/30 mb-4">
                            {TYPE_ICONS[type.id]}
                          </div>
                          <h3 className="font-display text-2xl md:text-3xl uppercase tracking-wider text-foreground/40">
                            {type.label}
                          </h3>
                          {type.lockedMessage && (
                            <p className="font-serif italic text-sm md:text-base text-foreground/30 mt-3">
                              {type.lockedMessage}
                            </p>
                          )}
                        </div>
                      ) : (
                        <Link
                          to={`/markedsplass/${type.urlSegment}`}
                          className="group relative block p-8 md:p-10 border-2 border-foreground/15 hover:border-foreground/40 transition-all"
                          style={{ background: 'rgba(255,255,255,0.85)' }}
                        >
                          <div
                            className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: 'hsl(2, 85%, 40%)' }}
                          />
                          <div className="text-foreground/60 group-hover:text-foreground transition-colors mb-4">
                            {TYPE_ICONS[type.id]}
                          </div>
                          <h3 className="font-display text-2xl md:text-3xl uppercase tracking-wider group-hover:text-primary transition-colors">
                            {type.label}
                          </h3>
                          {type.description && (
                            <p className="font-serif italic text-sm md:text-base text-foreground/40 mt-3">
                              {type.description}
                            </p>
                          )}
                          <ChevronRight className="absolute top-1/2 right-6 -translate-y-1/2 w-5 h-5 text-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </Link>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Bottom CTA */}
          <section className="relative overflow-hidden" style={{ background: "hsl(212, 80%, 15%)" }}>
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "hsl(2, 85%, 40%)" }} />
            <div className="container mx-auto px-4 py-12 md:py-20 text-center relative z-10">
              <p className="font-display text-[10px] md:text-xs uppercase tracking-[0.4em] text-white/40 mb-3">
                Simca · Talbot · Matra
              </p>
              <h2 className="font-display text-3xl md:text-5xl lg:text-6xl text-white uppercase tracking-wider leading-none mb-4">
                Fant du ikke<br />det du lette etter?
              </h2>
              <p className="font-serif text-sm md:text-lg italic text-white/60 max-w-md mx-auto mb-8">
                Ta kontakt med oss — vi hjelper deg gjerne med å finne riktige deler.
              </p>
              <Link
                to="/kontakt"
                className="group inline-flex items-center gap-3 px-10 py-4 md:px-14 md:py-5 font-display text-sm md:text-base uppercase tracking-[0.2em] border-2 border-white/30 text-white hover:border-white hover:bg-white/5 transition-all"
              >
                Kontakt oss
                <ChevronRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </section>
        </>
      )}
    </Layout>
  );
}

// Grid card component
function FeedGridItem({
  item,
  index,
  inCart,
  onToggleCart,
}: { item: FeedItem; index: number; inCart: boolean; onToggleCart: () => void }) {
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
        <div className="aspect-[3/4] relative overflow-hidden bg-muted">
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
          {item.type === 'listing' && item.status === 'sold' && (
            <span className="absolute top-2 right-2 font-serif text-xs font-bold tracking-wider px-2 py-1 rounded-sm border border-foreground/50 bg-background/95 text-foreground shadow-sm">
              SOLGT
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
            <p className="font-serif text-sm md:text-lg text-foreground font-bold leading-none mt-1">
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
                <><img src="/toolbox-blue.png" alt="" className="w-6 h-6 object-contain" />Legg i verktøykassa</>
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
}: { item: FeedItem; inCart: boolean; onToggleCart: () => void }) {
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
        {item.type === 'listing' && item.status === 'sold' && (
          <span className="absolute top-2 right-2 font-serif text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-sm border border-foreground/50 bg-background/95 text-foreground">
            SOLGT
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
          {inCart ? <><Check className="w-3.5 h-3.5" />Lagt til</> : <><img src="/toolbox-blue.png" alt="" className="w-5 h-5 object-contain" />Verktøykassa</>}
        </button>
      </div>
    </Link>
  );
}
