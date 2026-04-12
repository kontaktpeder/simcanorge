import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Car, ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { Helmet } from "react-helmet-async";
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
import carSilhouette from "@/assets/car-silhouette.png";
import BilgarasjeLoader from "@/components/ui/BilgarasjeLoader";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

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
  const [panelExpanded, setPanelExpanded] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Filters — initialize from URL search params
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState<BilerFilterState>(() => ({
    ...EMPTY_BILER_FILTER,
    brand: searchParams.get("brand") ?? "",
    model: searchParams.get("model") ?? "",
    year: searchParams.get("year") ?? "",
    decade: searchParams.get("decade") ?? "",
  }));

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
      query = query.ilike("brand", filterState.brand);
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
      query = query.eq("year", parseInt(filterState.year, 10));
    } else if (filterState.decade) {
      const dec = parseInt(filterState.decade, 10);
      if (Number.isFinite(dec)) {
        query = query.gte("year", dec).lte("year", dec + 9);
      }
    }
    if (searchQuery.trim()) {
      const q = `%${searchQuery.trim()}%`;
      query = query.or(`title.ilike.${q},brand.ilike.${q},model.ilike.${q},story.ilike.${q}`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching cars:", error);
    } else {
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

  useEffect(() => {
    setCurrentPage(0);
  }, [filterState, searchQuery]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterState.brand) params.set("brand", filterState.brand);
    if (filterState.model) params.set("model", filterState.model);
    if (filterState.year) params.set("year", filterState.year);
    if (filterState.decade) params.set("decade", filterState.decade);
    const next = params.toString();
    const current = searchParams.toString();
    if (next !== current) {
      setSearchParams(params, { replace: true });
    }
  }, [filterState.brand, filterState.model, filterState.year, filterState.decade]);

  useEffect(() => {
    fetchCars(currentPage);
  }, [currentPage, filterState, searchQuery]);

  const hasActiveFilters = filterState.category !== 'alle' || filterState.brand !== '' || filterState.model !== '' || filterState.variant !== '' || filterState.body_type !== '' || filterState.year !== '' || filterState.decade !== '' || searchQuery !== '';
  const activeFilterCount = [
    filterState.category !== 'alle',
    filterState.brand !== '',
    filterState.model !== '',
    filterState.variant !== '',
    filterState.body_type !== '',
    filterState.year !== '',
    filterState.decade !== '',
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
      <Helmet>
        <title>Arkivet — Biler dokumentert i Norge | Bilgarasje.no</title>
        <meta name="description" content="Utforsk historier om biler i Norge. Søk etter merke, modell og årstall i bilarkivet." />
      </Helmet>

      <div className="flex relative lg:h-[calc(100vh-4rem)] lg:overflow-hidden">
        {/* Side Panel — desktop only, mobile uses drawer */}
        <div className="hidden lg:block shrink-0">
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
              expanded={panelExpanded}
              onExpandedChange={setPanelExpanded}
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
            expanded={true}
            onExpandedChange={() => {}}
          />
        </div>

        {/* Main content area */}
        <div className="flex-1 min-w-0 lg:overflow-y-auto">

          {/* ─── HERO HEADER ─── */}
          <section
            className="relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #4a3d30 0%, #3a2e24 40%, #2a2118 100%)' }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(196,150,44,0.08) 0%, transparent 60%)' }} />

            <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-5 md:px-8">
              <div className="flex flex-col justify-center min-h-[120px] sm:min-h-[140px] md:min-h-[170px] py-6 md:py-8">
                <p
                  className="text-[10px] sm:text-[11px] tracking-[0.3em] uppercase mb-1"
                  style={{ ...oswald, fontWeight: 500, background: 'linear-gradient(135deg, #F5A623, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  bilgarasje.no
                </p>
                <h1
                  className="text-[1.4rem] sm:text-[1.8rem] md:text-[2.2rem] leading-[0.93] uppercase tracking-[0.02em] text-white font-bold italic"
                  style={{ ...chakra, textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}
                >
                  Arkivet
                </h1>
                <p className="text-[12px] sm:text-[13px] text-white/30 mt-1.5 max-w-md">
                  Historier om biler i Norge — søk, filtrer og utforsk
                </p>
              </div>
            </div>
          </section>

          {/* Mobile filter bar */}
          <div
            className="lg:hidden flex items-center gap-3 px-4 py-3 border-b"
            style={{ background: '#eee7dd', borderColor: 'rgba(58,46,36,0.08)' }}
          >
            <button
              onClick={() => setSidePanelOpen(true)}
              className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] font-bold px-3 py-2 rounded bg-[#3a2e24]/[0.06] hover:bg-[#3a2e24]/[0.1] transition-colors"
              style={oswald}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filter
              {activeFilterCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 text-[9px] bg-[#c4962c] text-white rounded-full">{activeFilterCount}</span>
              )}
            </button>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setFilterState(EMPTY_BILER_FILTER);
                  setSearchQuery('');
                }}
                className="flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-[#c4962c] hover:text-[#a07820] transition-colors"
                style={oswald}
              >
                <X className="w-3 h-3" />
                Nullstill
              </button>
            )}
            <span
              className="ml-auto text-[11px] text-[#3a2e24]/30"
              style={{ ...oswald, letterSpacing: '0.05em' }}
            >
              {totalCount} biler
            </span>
          </div>

          {/* Newsprint background */}
          <NewsprintBackground />

          {/* Editorial Feed */}
          <section
            className="relative py-8 md:py-12 lg:py-16"
            style={{ background: 'transparent' }}
          >
            {/* Car silhouette watermark */}
            <div className="absolute bottom-0 left-0 right-0 pointer-events-none flex justify-center overflow-hidden" style={{ opacity: 0.02 }}>
              <img
                src={carSilhouette}
                alt=""
                className="w-[80%] max-w-[1000px] translate-y-[30%]"
                style={{ transform: 'scaleX(-1)', filter: 'brightness(0) opacity(1)' }}
              />
            </div>

            <div className="w-full px-3 md:px-6 lg:px-8 xl:px-12 relative z-10">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <BilgarasjeLoader size={220} />
                </div>
              ) : cars.length === 0 ? (
                <div className="text-center py-20">
                  <Car className="w-16 h-16 mx-auto mb-4 text-[#3a2e24]/15" />
                  <h2
                    className="text-[1.2rem] uppercase text-[#3a2e24]/40 font-bold tracking-[0.08em] mb-2"
                    style={oswald}
                  >
                    Ingen biler funnet
                  </h2>
                  <p className="text-[13px] text-[#3a2e24]/25 mb-4">
                    {hasActiveFilters ? "Prøv å endre søket" : "Ingen biler er publisert ennå"}
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={() => { setFilterState(EMPTY_BILER_FILTER); setSearchQuery(''); }}
                      className="text-[12px] uppercase tracking-[0.15em] text-[#c4962c] hover:text-[#a07820] font-bold transition-colors border-b border-[#c4962c]/30 hover:border-[#c4962c]/60 pb-0.5"
                      style={oswald}
                    >
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
                          className="flex items-center gap-1.5 px-4 py-2 text-[12px] uppercase tracking-[0.15em] transition-colors"
                          style={{
                            ...oswald,
                            color: currentPage === 0 ? 'rgba(58,46,36,0.2)' : 'rgba(58,46,36,0.6)',
                            cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                          }}
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
                                className="w-10 h-10 text-lg transition-colors"
                                style={{
                                  fontFamily: "'Playfair Display', serif",
                                  color: currentPage === pageNum ? '#c4962c' : 'rgba(58,46,36,0.3)',
                                  borderBottom: currentPage === pageNum ? '2px solid #c4962c' : '2px solid transparent',
                                }}
                              >
                                {pageNum + 1}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage >= totalPages - 1}
                          className="flex items-center gap-1.5 px-4 py-2 text-[12px] uppercase tracking-[0.15em] transition-colors"
                          style={{
                            ...oswald,
                            color: currentPage >= totalPages - 1 ? 'rgba(58,46,36,0.2)' : 'rgba(58,46,36,0.6)',
                            cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <span className="hidden sm:inline">Neste</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <p
                        className="text-[11px] text-[#3a2e24]/25 tracking-[0.08em] uppercase"
                        style={oswald}
                      >
                        Side {currentPage + 1} av {totalPages} · {totalCount} {totalCount === 1 ? 'bil' : 'biler'} totalt
                      </p>
                    </div>
                  )}

                  {totalPages <= 1 && (
                    <p
                      className="text-center mt-16 text-[11px] text-[#3a2e24]/25 tracking-[0.08em] uppercase"
                      style={oswald}
                    >
                      {totalCount} {totalCount === 1 ? 'bil' : 'biler'} dokumentert
                    </p>
                  )}
                </>
              )}
            </div>
          </section>

          {/* CTA */}
          <section
            className="py-16 md:py-24 border-t"
            style={{ background: 'linear-gradient(180deg, #e8e1d6 0%, #eee7dd 100%)', borderColor: 'rgba(58,46,36,0.08)' }}
          >
            <div className="container mx-auto px-4 text-center max-w-2xl">
              <h2
                className="text-[1.4rem] md:text-[1.8rem] leading-[0.95] uppercase font-bold italic text-[#3a2e24] mb-4"
                style={chakra}
              >
                Har du en historie å dele?
              </h2>
              <p className="text-[14px] text-[#3a2e24]/40 mb-8 leading-relaxed">
                Vi dokumenterer biler i Norge.
                Bidra med din bil og bli del av arkivet.
              </p>
              <Link
                to="/send-inn"
                className="inline-block text-[12px] uppercase tracking-[0.2em] text-[#c4962c] hover:text-[#a07820] font-bold transition-colors border-b border-[#c4962c]/30 hover:border-[#c4962c]/60 pb-0.5"
                style={oswald}
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
                    <span
                      className="text-4xl md:text-6xl lg:text-8xl text-white/90 block mb-2 md:mb-4"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {car.year}
                    </span>
                  )}
                  <span
                    className="text-[10px] md:text-[11px] tracking-[0.2em] text-white/50 uppercase block mb-2"
                    style={oswald}
                  >
                    {car.brand}
                  </span>
                  <h2
                    className="text-[1.2rem] md:text-[1.8rem] lg:text-[2.2rem] text-white leading-tight mb-3 md:mb-4 uppercase font-bold italic"
                    style={chakra}
                  >
                    {car.title}
                  </h2>
                  {excerpt && (
                    <p className="hidden md:block text-white/70 text-sm lg:text-base max-w-2xl leading-relaxed mb-4 line-clamp-2">
                      {excerpt}
                    </p>
                  )}
                  <span
                    className="inline-block text-[11px] md:text-[12px] text-[#F5A623] tracking-[0.15em] uppercase group-hover:tracking-[0.25em] transition-all"
                    style={oswald}
                  >
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
                  <span
                    className="text-3xl md:text-4xl text-[#c4962c]/70"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {car.year}
                  </span>
                )}
                <span
                  className="text-[10px] tracking-[0.15em] text-[#3a2e24]/35 uppercase"
                  style={oswald}
                >
                  {car.brand}
                </span>
              </div>
              <h3
                className="text-[14px] md:text-[16px] tracking-[0.03em] uppercase font-bold italic text-[#3a2e24]"
                style={chakra}
              >
                {car.title}
              </h3>
              {excerpt && (
                <p className="text-[#3a2e24]/40 text-sm line-clamp-2">
                  {excerpt}
                </p>
              )}
              <span
                className="inline-block text-[10px] tracking-[0.15em] text-[#c4962c] uppercase pt-2"
                style={oswald}
              >
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
                  <span
                    className="text-2xl md:text-3xl text-white/90 block"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {car.year}
                  </span>
                )}
                <h3
                  className="text-[12px] md:text-[13px] tracking-[0.03em] text-white uppercase font-bold italic"
                  style={chakra}
                >
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
          <LinkWrapper className="block p-5 md:p-6 bg-[#f5efe6]/60 border border-[#3a2e24]/[0.06] transition-all duration-500 hover:-translate-y-1 hover:shadow-md hover:border-[#3a2e24]/[0.12]">
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
                  <span
                    className="text-4xl md:text-5xl text-[#c4962c]/50 block leading-none"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {car.year}
                  </span>
                )}
                <span
                  className="text-[10px] tracking-[0.15em] text-[#3a2e24]/30 uppercase block"
                  style={oswald}
                >
                  {car.brand} · {car.model}
                </span>
                <h3
                  className="text-[14px] md:text-[16px] tracking-[0.03em] uppercase leading-tight font-bold italic text-[#3a2e24]"
                  style={chakra}
                >
                  {car.title}
                </h3>
                {excerpt && (
                  <p className="text-[#3a2e24]/35 text-sm line-clamp-2 leading-relaxed">
                    {excerpt}
                  </p>
                )}
                <span
                  className="inline-block text-[10px] tracking-[0.15em] text-[#c4962c] uppercase pt-2"
                  style={oswald}
                >
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
