import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Car, ChevronLeft, ChevronRight, SlidersHorizontal, X, Link2 } from "lucide-react";
import { RelationshipRequestDialog } from "@/components/car/relationship/RelationshipRequestDialog";
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
// NewsprintBackground removed — Premium Dark theme uses solid dark background
import { BilerSidePanel, EMPTY_BILER_FILTER, type BilerFilterState } from "@/components/biler/BilerSidePanel";
import { SpotCarDialog } from "@/components/car/SpotCarDialog";
import { SaveCarButton } from "@/components/car/SaveCarButton";
import { FEATURES } from "@/config/features";
import carSilhouette from "@/assets/car-silhouette.png";
import { BrandLoader } from "@/components/brand/BrandLoader";
import { resolveSpottingCoverFromRow } from "@/lib/spottingMedia";
import { ExploreSectionNav } from "@/components/explore/ExploreSectionNav";
import { EXPLORE_SECTION_NAV_HEIGHT_PX } from "@/lib/exploreNav";

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
  source?: string | null;
  identification_status?: string | null;
  car_images: {
    image_url: string;
    alt_text: string | null;
    sort_order?: number | null;
  }[];
  car_events?: {
    visibility: string;
    occurred_at: string;
    car_event_images: { image_url: string; sort_order: number; alt_text?: string | null }[] | null;
  }[] | null;
  image_count?: number;
  event_count?: number;
}


const ITEMS_PER_PAGE = 20;

const Biler = () => {
  const [cars, setCars] = useState<CarPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [relationshipTarget, setRelationshipTarget] = useState<{ id: string; title: string } | null>(null);

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
        published_at, category, editorial_status, source, identification_status,
        car_images(image_url, alt_text, sort_order),
        car_events(visibility, occurred_at, car_event_images(image_url, sort_order))
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

      <ExploreSectionNav />

      {/* Subtract global header (4rem) AND ExploreSectionNav (52px) so split panel + scroll works */}
      <div className="flex relative lg:h-[calc(100vh-4rem-52px)] lg:overflow-hidden" style={{ background: '#070b10' }}>
        {/* Side Panel — desktop only, mobile uses drawer */}
        <div className="hidden lg:block shrink-0">
          <div className="lg:h-[calc(100vh-4rem-52px)] lg:overflow-y-auto">
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

          {/* ─── HERO HEADER (Premium Dark — popping) ─── */}
          <section
            className="relative overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #050810 0%, #0a1422 60%, #0a1218 100%)' }}
          >
            {/* Multi-layer ambient glow */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 80% at 75% 30%, rgba(52,234,184,0.18) 0%, transparent 60%)' }} />
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 40% 60% at 15% 80%, rgba(52,234,184,0.10) 0%, transparent 60%)' }} />
            {/* Diagonal stripe texture */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(135deg, #34eab8 0px, #34eab8 1px, transparent 1px, transparent 14px)' }} />
            {/* Shimmer accent line bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(52,234,184,0.8) 50%, transparent 100%)', boxShadow: '0 0 12px rgba(52,234,184,0.4)' }} />

            <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-5 md:px-8">
              <div className="flex flex-col justify-center min-h-[200px] sm:min-h-[260px] md:min-h-[320px] py-8 md:py-14">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34eab8] animate-pulse" style={{ boxShadow: '0 0 8px rgba(52,234,184,0.8)' }} />
                  <p
                    className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase"
                    style={{ ...oswald, fontWeight: 600, color: '#34eab8' }}
                  >
                    bilgarasje.no — arkivet
                  </p>
                </div>
                <h1
                  className="text-[1.6rem] sm:text-[2.2rem] md:text-[2.8rem] lg:text-[3.2rem] leading-[1.05] tracking-[0.005em] font-bold"
                  style={{
                    ...chakra,
                    background: 'linear-gradient(180deg, #ffffff 0%, #ffffff 60%, rgba(52,234,184,0.85) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 24px rgba(52,234,184,0.18))',
                  }}
                >
                  Bilgarasjens dokumenterte biler
                </h1>
                <p className="text-[13px] sm:text-[15px] md:text-[16px] text-white/65 mt-4 max-w-2xl leading-relaxed" style={oswald}>
                  Les bilens unike historie, reisen den har hatt og hvem som eier den i dag.
                </p>
                <div className="flex items-center gap-3 mt-5 pt-4 border-t border-white/[0.08] max-w-md">
                  <p className="text-[1.1rem] sm:text-[1.3rem] font-bold text-[#34eab8] leading-none" style={chakra}>{totalCount}</p>
                  <p className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-white/40" style={oswald}>Biler dokumentert</p>
                </div>
              </div>
            </div>
          </section>


          {/* Mobile filter bar */}
          <div
            className="lg:hidden flex items-center gap-3 px-4 py-3 border-b"
            style={{ background: '#0a1218', borderColor: 'rgba(52,234,184,0.12)' }}
          >
            <button
              onClick={() => setSidePanelOpen(true)}
              className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] font-bold px-3 py-2 rounded text-white/80 hover:text-white transition-colors"
              style={{ ...oswald, background: 'rgba(52,234,184,0.08)', border: '1px solid rgba(52,234,184,0.2)' }}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filter
              {activeFilterCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 text-[9px] bg-[#34eab8] text-[#070b10] rounded-full font-bold">{activeFilterCount}</span>
              )}
            </button>
            <SpotCarDialog />
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setFilterState(EMPTY_BILER_FILTER);
                  setSearchQuery('');
                }}
                className="flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-[#34eab8] hover:text-white transition-colors"
                style={oswald}
              >
                <X className="w-3 h-3" />
                Nullstill
              </button>
            )}
            <span
              className="ml-auto text-[11px] text-white/40"
              style={{ ...oswald, letterSpacing: '0.05em' }}
            >
              {totalCount} biler
            </span>
          </div>

          {/* Editorial Feed (Premium Dark) */}
          <section
            className="relative py-8 md:py-12 lg:py-16"
            style={{ background: '#070b10' }}
          >
            {/* Ambient teal glow watermark */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(52,234,184,0.05) 0%, transparent 50%)' }} />
            <div className="absolute bottom-0 left-0 right-0 pointer-events-none flex justify-center overflow-hidden" style={{ opacity: 0.04 }}>
              <img
                src={carSilhouette}
                alt=""
                className="w-[80%] max-w-[1000px] translate-y-[30%]"
                style={{ transform: 'scaleX(-1)', filter: 'brightness(2) invert(1)' }}
              />
            </div>

            <div className="w-full px-3 md:px-6 lg:px-8 xl:px-12 relative z-10">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <BrandLoader size={220} />
                </div>
              ) : cars.length === 0 ? (
                <div className="text-center py-20">
                  <Car className="w-16 h-16 mx-auto mb-4 text-white/20" />
                  <h2
                    className="text-[1.2rem] uppercase text-white/60 font-bold tracking-[0.08em] mb-2"
                    style={oswald}
                  >
                    Ingen biler funnet
                  </h2>
                  <p className="text-[13px] text-white/35 mb-4">
                    {hasActiveFilters ? "Prøv å endre søket" : "Ingen biler er publisert ennå"}
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={() => { setFilterState(EMPTY_BILER_FILTER); setSearchQuery(''); }}
                      className="text-[12px] uppercase tracking-[0.15em] text-[#34eab8] hover:text-white font-bold transition-colors border-b border-[#34eab8]/30 hover:border-[#34eab8]/60 pb-0.5"
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
                                  ...chakra,
                                  color: currentPage === pageNum ? '#34eab8' : 'rgba(255,255,255,0.4)',
                                  borderBottom: currentPage === pageNum ? '2px solid #34eab8' : '2px solid transparent',
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
                            color: currentPage >= totalPages - 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
                            cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <span className="hidden sm:inline">Neste</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <p
                        className="text-[11px] text-white/30 tracking-[0.08em] uppercase"
                        style={oswald}
                      >
                        Side {currentPage + 1} av {totalPages} · {totalCount} {totalCount === 1 ? 'bil' : 'biler'} totalt
                      </p>
                    </div>
                  )}

                  {totalPages <= 1 && (
                    <p
                      className="text-center mt-16 text-[11px] text-white/30 tracking-[0.08em] uppercase"
                      style={oswald}
                    >
                      {totalCount} {totalCount === 1 ? 'bil' : 'biler'} dokumentert
                    </p>
                  )}
                </>
              )}
            </div>
          </section>

          {/* CTA (Premium Dark) */}
          <section
            className="relative py-16 md:py-24 border-t overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #070b10 0%, #0a1218 100%)', borderColor: 'rgba(52,234,184,0.15)' }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(52,234,184,0.08) 0%, transparent 60%)' }} />
            <div className="container mx-auto px-4 text-center max-w-2xl relative z-10">
              <h2
                className="text-[1.6rem] md:text-[2.2rem] leading-[0.95] uppercase font-bold italic text-white mb-4"
                style={chakra}
              >
                Har du en historie å dele?
              </h2>
              <p className="text-[14px] text-white/50 mb-8 leading-relaxed" style={oswald}>
                Vi dokumenterer biler i Norge.
                Bidra med din bil og bli del av arkivet.
              </p>
              <Link
                to="/legg-til-bil"
                className="inline-flex items-center gap-2 px-7 py-3 text-[12px] uppercase tracking-[0.2em] text-[#070b10] font-bold transition-all hover:scale-[1.03] rounded-full"
                style={{
                  ...chakra,
                  background: 'linear-gradient(135deg, #34eab8 0%, #2dd4a8 100%)',
                  boxShadow: '0 8px 24px rgba(52,234,184,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
                }}
              >
                Send inn din bil →
              </Link>
            </div>
          </section>

          
        </div>
      </div>
      {relationshipTarget && (
        <RelationshipRequestDialog
          open={!!relationshipTarget}
          onOpenChange={(o) => !o && setRelationshipTarget(null)}
          carId={relationshipTarget.id}
          carTitle={relationshipTarget.title}
          source="biler_list"
        />
      )}
    </Layout>
  );
};

interface EditorialBlockProps {
  block: CarBlock<CarPost>;
  index: number;
  onRequestRelationship?: (car: { id: string; title: string }) => void;
}

function EditorialBlock({ block, index, onRequestRelationship }: EditorialBlockProps): React.ReactNode {
  const { car, module, size } = block;
  const gridClasses = getGridClasses(size);

  const sortedImages = [...(car.car_images ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  let primaryImage: string | undefined = sortedImages[0]?.image_url;
  let imageAlt: string = sortedImages[0]?.alt_text || car.title;
  if (!primaryImage) {
    const cover = resolveSpottingCoverFromRow(car as any);
    if (cover?.image_url) {
      primaryImage = cover.image_url;
      imageAlt = cover.alt_text || car.title;
    }
  }

  const isUnknownSpotting =
    car.source === "spotting" &&
    (car.identification_status === "unknown" || car.identification_status === "needs_review");

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

  const displayTitle = isUnknownSpotting ? "Ukjent bil" : car.title;
  const displaySubtitle = isUnknownSpotting ? "Hjelp med å identifisere bil" : null;

  const showSave = FEATURES.savedCars && !FEATURES.simpleLaunchMode;
  const saveOverlay = showSave ? (
    <div className="absolute top-2 right-2 z-20">
      <SaveCarButton
        carId={car.id}
        className="bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full !min-h-[36px] !min-w-[36px] text-white"
      />
    </div>
  ) : null;

  const showRelCta = !!onRequestRelationship && !isUnknownSpotting;
  const relButton = showRelCta ? (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onRequestRelationship!({ id: car.id, title: car.title });
      }}
      className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-[#34eab8] hover:text-white border border-[#34eab8]/30 hover:border-[#34eab8]/70 rounded-full px-3 py-1.5 transition-colors bg-black/20 backdrop-blur-sm"
      style={oswald}
    >
      <Link2 className="w-3 h-3" />
      Knytt relasjon
    </button>
  ) : null;

  switch (module) {
    case 'hero':
      return (
        <article className={`${gridClasses} relative group`}>
          {saveOverlay}
          {relButton && <div className="absolute top-3 left-3 z-30">{relButton}</div>}
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
                      className="text-4xl md:text-6xl lg:text-8xl text-white/95 block mb-2 md:mb-4 font-bold"
                      style={chakra}
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
                    {displayTitle}
                  </h2>
                  {displaySubtitle && (
                    <p className="text-[#34eab8] text-[12px] md:text-[13px] uppercase tracking-[0.15em] mb-3" style={oswald}>
                      {displaySubtitle}
                    </p>
                  )}
                  {!isUnknownSpotting && excerpt && (
                    <p className="hidden md:block text-white/70 text-sm lg:text-base max-w-2xl leading-relaxed mb-4 line-clamp-2">
                      {excerpt}
                    </p>
                  )}
                  <span
                    className="inline-block text-[11px] md:text-[12px] text-[#34eab8] tracking-[0.15em] uppercase group-hover:tracking-[0.25em] transition-all"
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
        <article className={`${gridClasses} group relative`}>
          {saveOverlay}
          <LinkWrapper className="block">
            <div className="relative aspect-[3/2] overflow-hidden bg-white/5 mb-4">
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
                    className="text-3xl md:text-4xl text-[#34eab8]/80"
                    style={chakra}
                  >
                    {car.year}
                  </span>
                )}
                <span
                  className="text-[10px] tracking-[0.15em] text-white/40 uppercase"
                  style={oswald}
                >
                  {car.brand}
                </span>
              </div>
              <h3
                className="text-[14px] md:text-[16px] tracking-[0.03em] uppercase font-bold italic text-white group-hover:text-[#34eab8] transition-colors"
                style={chakra}
              >
                {displayTitle}
              </h3>
              {displaySubtitle ? (
                <p className="text-[#34eab8] text-[11px] uppercase tracking-[0.12em]" style={oswald}>{displaySubtitle}</p>
              ) : excerpt && (
                <p className="text-white/50 text-sm line-clamp-2" style={oswald}>
                  {excerpt}
                </p>
              )}
              <div className="flex items-center gap-3 pt-1">
                <span
                  className="inline-block text-[10px] tracking-[0.15em] text-[#34eab8] uppercase"
                  style={oswald}
                >
                  Les historien →
                </span>
                {relButton}
              </div>
            </div>
          </LinkWrapper>
        </article>
      );

    case 'standard':
      return (
        <article className={`${gridClasses} group relative`}>
          {saveOverlay}
          {relButton && <div className="absolute top-2 left-2 z-30">{relButton}</div>}
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
                    className="text-2xl md:text-3xl text-[#34eab8] block font-bold"
                    style={chakra}
                  >
                    {car.year}
                  </span>
                )}
                <h3
                  className="text-[12px] md:text-[13px] tracking-[0.03em] text-white uppercase font-bold italic"
                  style={chakra}
                >
                  {isUnknownSpotting ? "Ukjent bil" : car.model}
                </h3>
                {displaySubtitle && (
                  <p className="text-[#34eab8] text-[10px] uppercase tracking-[0.12em] mt-1" style={oswald}>{displaySubtitle}</p>
                )}
              </div>
            </div>
          </LinkWrapper>
        </article>
      );

    case 'archive':
      return (
        <article className={`${gridClasses} group relative`}>
          {saveOverlay}
          <LinkWrapper className="block p-5 md:p-6 bg-white/[0.03] border border-white/[0.08] transition-all duration-500 hover:-translate-y-1 hover:bg-white/[0.05] hover:border-[#34eab8]/30 rounded-lg">
            <div className="flex gap-5 md:gap-6 items-start">
              {primaryImage && (
                <div className="w-24 h-24 md:w-28 md:h-28 flex-shrink-0 overflow-hidden bg-white/5 transition-transform duration-500 group-hover:-translate-y-0.5 rounded">
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
                    className="text-4xl md:text-5xl text-[#34eab8]/60 block leading-none"
                    style={chakra}
                  >
                    {car.year}
                  </span>
                )}
                <span
                  className="text-[10px] tracking-[0.15em] text-white/35 uppercase block"
                  style={oswald}
                >
                  {car.brand} · {car.model}
                </span>
                <h3
                  className="text-[14px] md:text-[16px] tracking-[0.03em] uppercase leading-tight font-bold italic text-white group-hover:text-[#34eab8] transition-colors"
                  style={chakra}
                >
                  {displayTitle}
                </h3>
                {displaySubtitle ? (
                  <p className="text-[#34eab8] text-[11px] uppercase tracking-[0.12em]" style={oswald}>{displaySubtitle}</p>
                ) : excerpt && (
                  <p className="text-white/40 text-sm line-clamp-2 leading-relaxed" style={oswald}>
                    {excerpt}
                  </p>
                )}
                <div className="flex items-center gap-3 pt-2">
                  <span
                    className="inline-block text-[10px] tracking-[0.15em] text-[#34eab8] uppercase"
                    style={oswald}
                  >
                    Les historien →
                  </span>
                  {relButton}
                </div>
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
