import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { Car, Filter, X, Search, History, CheckCircle, Wrench, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { CAR_BRANDS } from "@/data/carBrands";
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
  }[];
  image_count?: number;
  event_count?: number;
}

const BRANDS = CAR_BRANDS.map(b => b.name);
const ITEMS_PER_PAGE = 20;

const CATEGORIES = [{
  id: "alle",
  label: "Alle biler",
  icon: Car,
  description: null
}, {
  id: "registrert",
  label: "Registrerte biler",
  icon: CheckCircle,
  description: "Biler som kjører på veien i dag."
}, {
  id: "restaurering",
  label: "Restaureringsprosjekter",
  icon: Wrench,
  description: "Biler under overhaling."
}, {
  id: "historisk",
  label: "Historiske biler",
  icon: History,
  description: "Biler som lever gjennom historier."
}, {
  id: "vrak",
  label: "Vrak",
  icon: AlertTriangle,
  description: "Biler som ikke er kjørbare."
}];

const Biler = () => {
  const [cars, setCars] = useState<CarPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedDecade, setSelectedDecade] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("alle");

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
        car_images(image_url, alt_text)
      `, { count: 'exact' })
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .range(from, to);

    // Apply filters
    if (selectedCategory !== "alle") {
      query = query.eq("category", selectedCategory);
    }
    if (selectedBrand) {
      query = query.eq("brand", selectedBrand);
    }
    if (selectedDecade) {
      const decadeStart = parseInt(selectedDecade);
      const decadeEnd = decadeStart + 9;
      query = query.gte("year", decadeStart).lte("year", decadeEnd);
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
      CATEGORIES.forEach(cat => {
        if (cat.id !== "alle") {
          counts[cat.id] = data.filter(c => c.category === cat.id).length;
        }
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
  }, [selectedCategory, selectedBrand, selectedDecade, searchQuery]);

  // Fetch cars when page or filters change
  useEffect(() => {
    fetchCars(currentPage);
  }, [currentPage, selectedCategory, selectedBrand, selectedDecade, searchQuery]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedBrand("");
    setSelectedDecade("");
  };

  const hasActiveFilters = searchQuery || selectedBrand || selectedDecade;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Extract "månedens bil" first - either featured=true or editorial_status='manedens_bil'
  const monthlyCar = cars.find(c => c.featured || c.editorial_status === 'manedens_bil');
  const remainingCars = cars.filter(c => c.id !== monthlyCar?.id);

  // Build editorial feed: group → interleave → render as mixed magazine layout
  const groupedCars = groupCarsByModule(remainingCars);
  const editorialFeed = interleaveEditorialFeed(groupedCars);

  return (
    <Layout contained>
      {/* Newsprint background - only on /biler */}
      <NewsprintBackground />

      <PageHeader 
        title="ARKIVET" 
        subtitle="Historier om Simca, Talbot og Matra i Norge" 
      />

      {/* Category Tabs */}
      <section className="py-6 md:py-8 border-b border-foreground/10 bg-[hsl(36,16%,82%)]/60 backdrop-blur-sm">
        <div className="container mx-auto px-3 md:px-4">
          <div className="flex justify-center gap-2 md:gap-4 flex-wrap">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 font-display text-xs md:text-sm transition-all ${
                    isActive
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{cat.label.split(' ')[0]}</span>
                  <span className="text-[10px] text-muted-foreground">
                    ({categoryCounts[cat.id] || 0})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Filters Bar - minimal */}
      <section className="border-b border-foreground/10 sticky top-20 z-40 backdrop-blur-sm bg-[hsl(36,16%,82%)]/80">
        <div className="container mx-auto py-3 px-4">
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Søk i arkivet..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-transparent border-b border-foreground/20 focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
                showFilters || hasActiveFilters ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="flex flex-wrap justify-center gap-3 mt-4 pt-4 border-t border-foreground/5 animate-fade-in">
              <select
                value={selectedBrand}
                onChange={e => setSelectedBrand(e.target.value)}
                className="px-3 py-1.5 text-sm bg-card border border-foreground/10 rounded focus:outline-none focus:border-primary"
              >
                <option value="">Alle merker</option>
                {BRANDS.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>

              <select
                value={selectedDecade}
                onChange={e => setSelectedDecade(e.target.value)}
                className="px-3 py-1.5 text-sm bg-card border border-foreground/10 rounded focus:outline-none focus:border-primary"
              >
                <option value="">Alle tiår</option>
                <option value="1950">1950-tallet</option>
                <option value="1960">1960-tallet</option>
                <option value="1970">1970-tallet</option>
                <option value="1980">1980-tallet</option>
              </select>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary hover:underline"
                >
                  <X className="w-3.5 h-3.5" />
                  Nullstill
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Editorial Feed - Magazine Layout */}
      <section className="py-8 md:py-12 lg:py-16 relative">
        {/* Full-width container */}
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
                <button onClick={clearFilters} className="text-primary hover:underline">
                  Nullstill filter
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Månedens bil - Cover module at top */}
              {monthlyCar && (
                <MonthlyCoverModule car={monthlyCar} />
              )}

              {/* Dense grid - tighter gaps, auto-flow dense fills holes */}
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

              {/* Pagination - Magazine style */}
              {totalPages > 1 && (
                <div className="mt-16 flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2">
                    {/* Previous */}
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

                    {/* Page numbers */}
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

                    {/* Next */}
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

                  {/* Page info */}
                  <p className="text-muted-foreground text-sm font-display tracking-wider">
                    Side {currentPage + 1} av {totalPages} · {totalCount} {totalCount === 1 ? 'bil' : 'biler'} totalt
                  </p>
                </div>
              )}

              {/* Count footer - only show if single page */}
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
    </Layout>
  );
};

/**
 * Editorial Block - renders a single car in the feed
 * Uses different layouts based on module type and size
 */
interface EditorialBlockProps {
  block: CarBlock<CarPost>;
  index: number;
}

function EditorialBlock({ block, index }: EditorialBlockProps): React.ReactNode {
  const { car, module, size } = block;
  const gridClasses = getGridClasses(size);
  
  // Get primary image
  const primaryImage = car.car_images?.[0]?.image_url;
  const imageAlt = car.car_images?.[0]?.alt_text || car.title;
  
  // Get excerpt from story
  const excerpt = car.story 
    ? car.story.slice(0, module === 'hero' ? 200 : module === 'feature' ? 150 : 80) + (car.story.length > 80 ? '...' : '')
    : null;

  // Build correct link - verify slug exists
  const carLink = car.slug ? `/biler/${car.slug}` : null;
  
  // Guard: if no slug, log warning and don't make clickable
  if (!carLink) {
    console.warn(`Car missing slug: ${car.id} - ${car.title}`);
  }

  // Wrapper for links with optional disabled state
  const LinkWrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    if (!carLink) {
      return <div className={className} title="Mangler slug">{children}</div>;
    }
    return <Link to={carLink} className={className}>{children}</Link>;
  };

  // Render based on module type
  switch (module) {
    case 'hero':
      // TopStory style - newspaper lead article (not cover, that's MonthlyCoverModule)
      return (
        <article className={`${gridClasses} relative group`}>
          <LinkWrapper className="block">
            {/* Full-width image with gradient */}
            <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-muted">
              {primaryImage && (
                <img 
                  src={primaryImage} 
                  alt={imageAlt}
                  className="w-full h-full object-cover object-center transition-all duration-500 group-hover:scale-[1.01]"
                />
              )}
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              
              {/* Text overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-14">
                <div className="max-w-4xl">
                  {/* Year as dominant element */}
                  {car.year && (
                    <span className="font-serif text-4xl md:text-6xl lg:text-8xl text-white/90 block mb-2 md:mb-4">
                      {car.year}
                    </span>
                  )}
                  
                  {/* Brand */}
                  <span className="font-display text-xs md:text-sm tracking-[0.2em] text-white/60 uppercase block mb-2">
                    {car.brand}
                  </span>
                  
                  {/* Title */}
                  <h2 className="font-display text-2xl md:text-4xl lg:text-5xl text-white leading-tight mb-3 md:mb-4">
                    {car.title}
                  </h2>
                  
                  {/* Excerpt on larger screens */}
                  {excerpt && (
                    <p className="hidden md:block text-white/80 text-lg lg:text-xl max-w-2xl leading-relaxed mb-4 line-clamp-2">
                      {excerpt}
                    </p>
                  )}
                  
                  {/* CTA */}
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
            {/* Image with float on hover */}
            <div className="relative aspect-[3/2] overflow-hidden bg-muted mb-4">
              {primaryImage && (
                <img 
                  src={primaryImage} 
                  alt={imageAlt}
                  className="w-full h-full object-cover object-center transition-all duration-500 group-hover:-translate-y-1.5 group-hover:scale-[1.01]"
                />
              )}
            </div>
            
            {/* Text content */}
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
            {/* Compact card with float on hover */}
            <div className="relative aspect-[4/3] overflow-hidden bg-muted transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-lg">
              {primaryImage && (
                <img 
                  src={primaryImage} 
                  alt={imageAlt}
                  className="w-full h-full object-cover object-center"
                />
              )}
              {/* Bottom gradient */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
              
              {/* Text at bottom */}
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
      // Archive as full-width notis card with hover float
      return (
        <article className={`${gridClasses} group`}>
          <LinkWrapper className="block p-5 md:p-6 bg-card/60 border border-foreground/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-md hover:border-foreground/20">
            <div className="flex gap-5 md:gap-6 items-start">
              {/* Thumbnail with float */}
              {primaryImage && (
                <div className="w-24 h-24 md:w-28 md:h-28 flex-shrink-0 overflow-hidden bg-muted transition-transform duration-500 group-hover:-translate-y-0.5">
                  <img 
                    src={primaryImage} 
                    alt={imageAlt}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              )}
              
              {/* Text content */}
              <div className="flex-1 min-w-0 space-y-1.5">
                {/* Year */}
                {car.year && (
                  <span className="font-serif text-4xl md:text-5xl text-primary/70 block leading-none">
                    {car.year}
                  </span>
                )}
                
                {/* Brand/model */}
                <span className="font-display text-xs tracking-[0.15em] text-muted-foreground uppercase block">
                  {car.brand} · {car.model}
                </span>
                
                {/* Title */}
                <h3 className="font-display text-lg md:text-xl tracking-wide uppercase leading-tight">
                  {car.title}
                </h3>
                
                {/* Excerpt */}
                {excerpt && (
                  <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                    {excerpt}
                  </p>
                )}
                
                {/* CTA */}
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
