import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Car, ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { SeoHead, SEO_COPY } from "@/components/seo";
import { BilerSidePanel, EMPTY_BILER_FILTER, type BilerFilterState } from "@/components/biler/BilerSidePanel";
import { SpotCarDialog } from "@/components/car/SpotCarDialog";
import { applyPublicCarsApprovalFilter } from "@/lib/publicCarsFilter";
import { BrandLoader } from "@/components/brand/BrandLoader";
import { resolveSpottingCoverFromRow } from "@/lib/spottingMedia";
import { formatCarHeading } from "@/lib/carTitle";

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

    let query = applyPublicCarsApprovalFilter(
      supabase
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
        .range(from, to),
    );

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
    const { data } = await applyPublicCarsApprovalFilter(
      supabase
        .from("cars")
        .select("category")
        .not("published_at", "is", null)
        .lte("published_at", new Date().toISOString()),
    );

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
    if (newPage >= 0 && newPage < totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  };

  return (
    <Layout>
      <SeoHead {...SEO_COPY.biler} />

      <div className="-mt-16 pt-16 min-h-full bg-[#f6f3ee] text-[#1c1917]">
        <section className="border-b border-black/10">
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 md:py-12">
            <p className="font-display text-lg tracking-[0.12em] uppercase text-[#C10D0D]">
              Simca Norge
            </p>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl uppercase leading-none text-[#071628] mt-1">
              Dokumenterte biler
            </h1>
            <p className="font-sans text-base md:text-lg text-[#1c1917]/75 mt-3 max-w-xl leading-relaxed">
              Les bilens historie, reisen den har hatt og hvem som eier den i dag.
            </p>
            <p className="font-sans text-base text-[#1c1917]/60 mt-4">
              {totalCount} {totalCount === 1 ? "bil" : "biler"}
            </p>
          </div>
        </section>

        <div className="flex items-start">
          <div className="hidden lg:block shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto bg-white border-r border-black/10">
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

          <div className="flex-1 min-w-0">
            <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-black/10 bg-white">
              <button
                onClick={() => setSidePanelOpen(true)}
                className="inline-flex items-center gap-2 font-display text-lg uppercase tracking-wide text-[#071628] px-3 py-1.5 rounded-xl border border-black/15 bg-[#f6f3ee]"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 text-sm bg-[#C10D0D] text-white rounded-full">{activeFilterCount}</span>
                )}
              </button>
              <SpotCarDialog />
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setFilterState(EMPTY_BILER_FILTER);
                    setSearchQuery("");
                  }}
                  className="inline-flex items-center gap-1 font-sans text-sm text-[#C10D0D]"
                >
                  <X className="w-3.5 h-3.5" />
                  Nullstill
                </button>
              )}
              <span className="ml-auto font-sans text-sm text-[#1c1917]/60">
                {totalCount} biler
              </span>
            </div>

            <section className="px-3 sm:px-5 md:px-8 py-6 md:py-10">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <BrandLoader size={180} />
                </div>
              ) : cars.length === 0 ? (
                <div className="text-center py-20">
                  <Car className="w-12 h-12 mx-auto mb-4 text-[#1c1917]/25" />
                  <h2 className="font-display text-3xl uppercase text-[#071628]">
                    Ingen biler funnet
                  </h2>
                  <p className="font-sans text-base text-[#1c1917]/60 mt-2">
                    {hasActiveFilters ? "Prøv å endre søket" : "Ingen biler er publisert ennå"}
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={() => { setFilterState(EMPTY_BILER_FILTER); setSearchQuery(""); }}
                      className="mt-4 font-display text-xl uppercase tracking-wide text-[#C10D0D]"
                    >
                      Nullstill filter
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                    {cars.map((car) => (
                      <CarCard key={car.id} car={car} />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-10 flex flex-col items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 0}
                          className="inline-flex items-center gap-1 px-3 py-2 font-sans text-base text-[#071628] disabled:opacity-30"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Forrige
                        </button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) pageNum = i;
                            else if (currentPage < 3) pageNum = i;
                            else if (currentPage > totalPages - 4) pageNum = totalPages - 5 + i;
                            else pageNum = currentPage - 2 + i;
                            const active = currentPage === pageNum;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`w-10 h-10 font-display text-xl ${active ? "text-[#C10D0D] border-b-2 border-[#C10D0D]" : "text-[#071628]/50"}`}
                              >
                                {pageNum + 1}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage >= totalPages - 1}
                          className="inline-flex items-center gap-1 px-3 py-2 font-sans text-base text-[#071628] disabled:opacity-30"
                        >
                          Neste
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="font-sans text-sm text-[#1c1917]/55">
                        Side {currentPage + 1} av {totalPages}
                      </p>
                    </div>
                  )}
                </>
              )}
            </section>

            <section className="border-t border-black/10 bg-white px-4 py-12 md:py-16 text-center">
              <h2 className="font-display text-3xl md:text-5xl uppercase text-[#071628]">
                Har du en historie å dele?
              </h2>
              <p className="font-sans text-base text-[#1c1917]/70 mt-3 mb-6 max-w-md mx-auto">
                Vi dokumenterer biler i Norge. Bidra med din bil og bli del av arkivet.
              </p>
              <Link to="/legg-til-bil" className="btn-enamel-red">
                Send inn din bil
              </Link>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

function carCover(car: CarPost): { url?: string; alt: string } {
  const sorted = [...(car.car_images ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const first = sorted[0];
  if (first?.image_url) return { url: first.image_url, alt: first.alt_text || car.title };
  const cover = resolveSpottingCoverFromRow(car as never);
  if (cover?.image_url) return { url: cover.image_url, alt: cover.alt_text || car.title };
  return { alt: car.title };
}

function CarCard({ car }: { car: CarPost }) {
  const image = carCover(car);
  const unknown =
    car.source === "spotting" &&
    (car.identification_status === "unknown" || car.identification_status === "needs_review");
  const title = unknown ? "Ukjent bil" : formatCarHeading({ title: car.title, brand: car.brand, model: car.model, year: car.year });
  const meta = [car.year, car.brand].filter(Boolean).join(" · ");
  const href = car.slug ? `/biler/${car.slug}` : null;
  const body = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-white border border-black/10">
        {image.url ? (
          <img
            src={image.url}
            alt={image.alt}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Car className="w-8 h-8 text-[#1c1917]/20" />
          </div>
        )}
      </div>
      <div className="pt-2">
        {meta && (
          <p className="font-sans text-sm text-[#1c1917]/60">{meta}</p>
        )}
        <h2 className="font-display text-xl sm:text-2xl uppercase leading-none text-[#071628] mt-0.5 line-clamp-2 group-hover:text-[#C10D0D] transition-colors">
          {title}
        </h2>
      </div>
    </>
  );

  if (!href) return <article className="group">{body}</article>;
  return (
    <article className="group">
      <Link to={href} className="block">{body}</Link>
    </article>
  );
}

export default Biler;
