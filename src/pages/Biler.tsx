import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { Car, ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { 
  groupCarsByModule, 
  type EditorialModule 
} from "@/lib/carEditorialResolver";
import { 
  interleaveEditorialFeed,
  getGridClasses,
  type CarBlock,
} from "@/lib/editorialFeed";
import { 
  HeroCarModule, 
  FeatureCarModule,
  MonthlyCoverModule,
} from "@/components/biler";
import { NewsprintBackground } from "@/components/editorial/NewsprintBackground";
import { BilerSidePanel, EMPTY_BILER_FILTER, type BilerFilterState } from "@/components/biler/BilerSidePanel";

interface CarPost {
  id: string;
  title: string;
  slug: string;
  brand: string | null;
  model: string;
  year: number | null;
  story: string | null;
  tags: string[];
  featured: boolean;
  published_at: string | null;
  category: string;
  editorial_status: string | null;
  car_images: {
    image_url: string;
    alt_text: string | null;
    sort_order?: number | null;
  }[];
  image_count?: number;
  event_count?: number;
}

const ITEMS_PER_PAGE = 20;

const Biler = () => {
  const [cars, setCars] = useState<CarPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState<BilerFilterState>(EMPTY_BILER_FILTER);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Fetch cars with pagination
  const fetchCars = async (page: number = 0) => {
    setIsLoading(true);

    const from = page * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase
      .from("cars")
      .select(`
        id, title, slug, brand, model, year, story, tags, featured, 
        published_at, category, editorial_status,
        car_images(image_url, alt_text, sort_order)
      `, { count: 'exact' })
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .range(from, to);

    // Apply filters
    if (filterState.category !== "alle") {
      query = query.eq("category", filterState.category);
    }
    if (filterState.brand) {
      query = query.eq("brand", filterState.brand);
    }
    if (filterState.model) {
      query = query.eq("model", filterState.model);
    }
    if (filterState.variant) {
      query = query.eq("variant", filterState.variant);
    }
    if (filterState.body_type) {
      query = query.eq("body_type", filterState.body_type);
    }
    if (filterState.year) {
      query = query.eq("year", parseInt(filterState.year));
    }
    if (searchQuery.trim()) {
      const q = `%${searchQuery.trim()}%`;
      query = query.or(`title.ilike.${q},brand.ilike.${q},model.ilike.${q},story.ilike.${q}`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching cars:", error);
    } else {
      // Enrich with counts for scoring
      const carsWithCounts = await Promise.all(
        (data || []).map(async (car) => {
          const { count: imageCount } = await supabase
            .from("car_images")
            .select("id", { count: "exact", head: true })
            .eq("car_id", car.id);
          
          const { count: eventCount } = await supabase
            .from("car_events")
            .select("id", { count: "exact", head: true })
            .eq("car_id", car.id);

          return {
            ...car,
            image_count: imageCount || 0,
            event_count: eventCount || 0,
          } as CarPost;
        })
      );

      setCars(carsWithCounts);
      setTotalCount(count || 0);
    }

    setIsLoading(false);
  };

  // Fetch category counts
  const fetchCategoryCounts = async () => {
    const { data } = await supabase
      .from("cars")
      .select("category")
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString());

    if (data) {
      const counts: Record<string, number> = { alle: data.length };
      const cats = ['registrert', 'restaurering', 'historisk', 'vrak'];
      cats.forEach(cat => {
        counts[cat] = data.filter(c => c.category === cat).length;
      });
      setCategoryCounts(counts);
    }
  };

  useEffect(() => {
    fetchCategoryCounts();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [filterState, searchQuery]);

  // Fetch cars when page or filters change
  useEffect(() => {
    fetchCars(currentPage);
  }, [currentPage, filterState, searchQuery]);

  const hasActiveFilters = filterState.category !== 'alle' || filterState.brand !== '' || filterState.model !== '' || filterState.variant !== '' || filterState.body_type !== '' || filterState.year !== '' || searchQuery !== '';
  const activeFilterCount = [
    filterState.category !== 'alle',
    filterState.brand !== '',
    filterState.model !== '',
    filterState.variant !== '',
    filterState.body_type !== '',
    filterState.year !== '',
    searchQuery !== '',
  ].filter(Boolean).length;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Extract "månedens bil" first
  const monthlyCar = cars.find(c => c.featured || c.editorial_status === 'manedens_bil');
  const remainingCars = cars.filter(c => c.id !== monthlyCar?.id);
  const groupedCars = groupCarsByModule(remainingCars);
  const editorialFeed = interleaveEditorialFeed(groupedCars);

  return (
    <Layout hideFooter>
      <div className="flex relative lg:h-[calc(100vh-4rem)] lg:overflow-hidden">
        {/* Side Panel — desktop only, mobile uses drawer */}
        <div className="hidden lg:block shrink-0 lg:w-[300px]">
          <div className="lg:h-[calc(100vh-4rem)] lg:overflow-y-auto">
            <BilerSidePanel
              open={sidePanelOpen}
              onOpenChange={setSidePanelOpen}
              filterState={filterState}
              onFilterChange={setFilterState}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              resultCount={totalCount}
              categoryCounts={categoryCounts}
            />
          </div>
        </div>

        {/* Mobile drawer instance */}
        <div className="lg:hidden">
          <BilerSidePanel
            open={sidePanelOpen}
            onOpenChange={setSidePanelOpen}
            filterState={filterState}
            onFilterChange={setFilterState}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            resultCount={totalCount}
            categoryCounts={categoryCounts}
          />
        </div>

        {/* Main content area */}
        <div className="flex-1 min-w-0 lg:overflow-y-auto">
          {/* Newsprint background */}
          <NewsprintBackground />

          <PageHeader 
            title="ARKIVET" 
            subtitle="Historier om Simca, Talbot og Matra i Norge" 
          />

          {/* Mobile filter bar */}
          <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-foreground/10" style={{ background: "hsl(36,16%,82%)" }}>
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
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setFilterState(EMPTY_BILER_FILTER);
                  setSearchQuery('');
                }}
                className="flex items-center gap-1 text-accent font-display text-[10px] uppercase tracking-wider px-2 py-1.5 border border-accent/30 hover:bg-accent hover:text-accent-foreground transition-all"
              >
                <X className="w-3 h-3" />
                Nullstill
              </button>
            )}
            <span className="ml-auto font-serif text-xs text-muted-foreground italic">
              {totalCount} biler
            </span>
          </div>

          {/* Editorial Feed */}
          <section className="py-8 md:py-12 lg:py-16 relative">
            <div className="w-full px-3 md:px-6 lg:px-8 xl:px-12">
              {isLoading ? (
                <div className="text-center py-20 text-muted-foreground">
                  <div className="font-serif text-2xl mb-2">Laster arkivet...</div>
                </div>
              ) : cars.length === 0 ? (
                <div className="text-center py-20">
                  <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                  <h2 className="font-display text-xl mb-2">Ingen biler funnet</h2>
                  <p className="text-muted-foreground mb-4">
                    {hasActiveFilters ? "Prøv å endre søket" : "Ingen biler er publisert ennå"}
                  </p>
                  {hasActiveFilters && (
                    <button onClick={() => { setFilterState(EMPTY_BILER_FILTER); setSearchQuery(''); }} className="text-primary hover:underline">
                      Nullstill filter
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {monthlyCar && <MonthlyCoverModule car={monthlyCar} />}

                  <div 
                    className="grid grid-cols-12 gap-2 md:gap-3 lg:gap-4 auto-rows-auto"
                    style={{ gridAutoFlow: 'dense' }}
                  >
                    {editorialFeed.map((block, index) => (
                      <EditorialBlock 
                        key={block.key} 
                        block={block} 
                        index={index}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-16 flex flex-col items-center gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 0}
                          className={`flex items-center gap-1.5 px-4 py-2 font-display text-sm uppercase tracking-wider transition-colors ${
                            currentPage === 0 
                              ? "text-muted-foreground/40 cursor-not-allowed" 
                              : "text-foreground hover:text-primary"
                          }`}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span className="hidden sm:inline">Forrige</span>
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) {
                              pageNum = i;
                            } else if (currentPage < 3) {
                              pageNum = i;
                            } else if (currentPage > totalPages - 4) {
                              pageNum = totalPages - 5 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`w-10 h-10 font-serif text-lg transition-colors ${
                                  currentPage === pageNum
                                    ? "text-primary border-b-2 border-primary"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                {pageNum + 1}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage >= totalPages - 1}
                          className={`flex items-center gap-1.5 px-4 py-2 font-display text-sm uppercase tracking-wider transition-colors ${
                            currentPage >= totalPages - 1 
                              ? "text-muted-foreground/40 cursor-not-allowed" 
                              : "text-foreground hover:text-primary"
                          }`}
                        >
                          <span className="hidden sm:inline">Neste</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-muted-foreground text-sm font-display tracking-wider">
                        Side {currentPage + 1} av {totalPages} · {totalCount} {totalCount === 1 ? 'bil' : 'biler'} totalt
                      </p>
                    </div>
                  )}

                  {totalPages <= 1 && (
                    <p className="text-center text-muted-foreground mt-16 text-sm font-display tracking-wider">
                      {totalCount} {totalCount === 1 ? 'bil' : 'biler'} dokumentert
                    </p>
                  )}
                </>
              )}
            </div>
          </section>

          {/* CTA */}
          <section className="py-16 md:py-24 bg-primary/5 border-t border-foreground/10">
            <div className="container mx-auto px-4 text-center max-w-2xl">
              <h2 className="font-serif text-3xl md:text-4xl mb-4">
                Har du en historie å dele?
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Vi dokumenterer Simca, Talbot og Matra i Norge. 
                Bidra med din bil og bli del av arkivet.
              </p>
              <Link 
                to="/send-inn" 
                className="inline-block font-display text-sm tracking-wider uppercase text-primary hover:underline"
              >
                Send inn din bil →
              </Link>
            </div>
          </section>

          <Footer />
        </div>
      </div>
    </Layout>
  );
};

interface EditorialBlockProps {
  block: CarBlock<CarPost>;
  index: number;
}

function EditorialBlock({ block, index }: EditorialBlockProps): React.ReactNode {
  const { car, module, size } = block;
  const gridClasses = getGridClasses(size);
  
  const sortedImages = [...(car.car_images ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const primaryImage = sortedImages[0]?.image_url;
  const imageAlt = sortedImages[0]?.alt_text || car.title;
  
  const excerpt = car.story 
    ? car.story.slice(0, module === 'hero' ? 200 : module === 'feature' ? 150 : 80) + (car.story.length > 80 ? '...' : '')
    : null;

  const carLink = car.slug ? `/biler/${car.slug}` : null;
  
  if (!carLink) {
    console.warn(`Car missing slug: ${car.id} - ${car.title}`);
  }

  const LinkWrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    if (!carLink) {
      return <div className={className} title="Mangler slug">{children}</div>;
    }
    return <Link to={carLink} className={className}>{children}</Link>;
  };

  switch (module) {
    case 'hero':
      return (
        <article className={`${gridClasses} relative group`}>
          <LinkWrapper className="block">
            <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-muted">
              {primaryImage && (
                <img 
                  src={primaryImage} 
                  alt={imageAlt}
                  className="w-full h-full object-cover object-center transition-all duration-500 group-hover:scale-[1.01]"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-14">
                <div className="max-w-4xl">
                  {car.year && (
                    <span className="font-serif text-4xl md:text-6xl lg:text-8xl text-white/90 block mb-2 md:mb-4">
                      {car.year}
                    </span>
                  )}
                  <span className="font-display text-xs md:text-sm tracking-[0.2em] text-white/60 uppercase block mb-2">
                    {car.brand}
                  </span>
                  <h2 className="font-display text-2xl md:text-4xl lg:text-5xl text-white leading-tight mb-3 md:mb-4">
                    {car.title}
                  </h2>
                  {excerpt && (
                    <p className="hidden md:block text-white/80 text-lg lg:text-xl max-w-2xl leading-relaxed mb-4 line-clamp-2">
                      {excerpt}
                    </p>
                  )}
                  <span className="inline-block font-display text-sm md:text-base text-accent tracking-wider uppercase group-hover:tracking-widest transition-all">
                    Les historien →
                  </span>
                </div>
              </div>
            </div>
          </LinkWrapper>
        </article>
      );

    case 'feature':
      return (
        <article className={`${gridClasses} group`}>
          <LinkWrapper className="block">
            <div className="relative aspect-[3/2] overflow-hidden bg-muted mb-4">
              {primaryImage && (
                <img 
                  src={primaryImage} 
                  alt={imageAlt}
                  className="w-full h-full object-cover object-center transition-all duration-500 group-hover:-translate-y-1.5 group-hover:scale-[1.01]"
                />
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                {car.year && (
                  <span className="font-serif text-3xl md:text-4xl text-primary/80">
                    {car.year}
                  </span>
                )}
                <span className="font-display text-xs tracking-[0.15em] text-muted-foreground uppercase">
                  {car.brand}
                </span>
              </div>
              <h3 className="font-display text-lg md:text-xl tracking-wide uppercase">
                {car.title}
              </h3>
              {excerpt && (
                <p className="text-muted-foreground text-sm line-clamp-2">
                  {excerpt}
                </p>
              )}
              <span className="inline-block font-display text-xs tracking-[0.15em] text-primary uppercase pt-2">
                Les historien →
              </span>
            </div>
          </LinkWrapper>
        </article>
      );

    case 'standard':
      return (
        <article className={`${gridClasses} group`}>
          <LinkWrapper className="block">
            <div className="relative aspect-[4/3] overflow-hidden bg-muted transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-lg">
              {primaryImage && (
                <img 
                  src={primaryImage} 
                  alt={imageAlt}
                  className="w-full h-full object-cover object-center"
                />
              )}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                {car.year && (
                  <span className="font-serif text-2xl md:text-3xl text-white/90 block">
                    {car.year}
                  </span>
                )}
                <h3 className="font-display text-sm md:text-base tracking-wide text-white uppercase">
                  {car.model}
                </h3>
              </div>
            </div>
          </LinkWrapper>
        </article>
      );

    case 'archive':
      return (
        <article className={`${gridClasses} group`}>
          <LinkWrapper className="block p-5 md:p-6 bg-card/60 border border-foreground/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-md hover:border-foreground/20">
            <div className="flex gap-5 md:gap-6 items-start">
              {primaryImage && (
                <div className="w-24 h-24 md:w-28 md:h-28 flex-shrink-0 overflow-hidden bg-muted transition-transform duration-500 group-hover:-translate-y-0.5">
                  <img 
                    src={primaryImage} 
                    alt={imageAlt}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-1.5">
                {car.year && (
                  <span className="font-serif text-4xl md:text-5xl text-primary/70 block leading-none">
                    {car.year}
                  </span>
                )}
                <span className="font-display text-xs tracking-[0.15em] text-muted-foreground uppercase block">
                  {car.brand} · {car.model}
                </span>
                <h3 className="font-display text-lg md:text-xl tracking-wide uppercase leading-tight">
                  {car.title}
                </h3>
                {excerpt && (
                  <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                    {excerpt}
                  </p>
                )}
                <span className="inline-block font-display text-xs tracking-[0.15em] text-primary uppercase pt-2">
                  Les historien →
                </span>
              </div>
            </div>
          </LinkWrapper>
        </article>
      );

    default:
      return null;
  }
}

export default Biler;
