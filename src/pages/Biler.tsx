import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { Car, Filter, X, Search, History, CheckCircle, Wrench, AlertTriangle } from "lucide-react";
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

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedDecade, setSelectedDecade] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("alle");

  // Fetch all cars with counts for scoring
  const fetchCars = async () => {
    setIsLoading(true);

    let query = supabase
      .from("cars")
      .select(`
        id, title, slug, brand, model, year, story, tags, featured, 
        published_at, category, editorial_status,
        car_images(image_url, alt_text)
      `)
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false });

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

    const { data, error } = await query;

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

  useEffect(() => {
    fetchCars();
  }, [selectedCategory, selectedBrand, selectedDecade, searchQuery]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedBrand("");
    setSelectedDecade("");
  };

  const hasActiveFilters = searchQuery || selectedBrand || selectedDecade;

  // Build editorial feed: group → interleave → render as mixed magazine layout
  const groupedCars = groupCarsByModule(cars);
  const editorialFeed = interleaveEditorialFeed(groupedCars);

  return (
    <Layout>
      {/* Newsprint background - only on /biler */}
      <NewsprintBackground />

      <PageHeader 
        title="ARKIVET" 
        subtitle="Historier om Simca, Talbot og Matra i Norge" 
      />

      {/* Category Tabs */}
      <section className="bg-gradient-to-b from-card via-card to-muted/20 py-6 md:py-8 border-b border-foreground/10">
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
              {/* Dense grid - tighter gaps, proper auto-flow */}
              <div 
                className="grid grid-cols-12 gap-3 md:gap-4 lg:gap-5 items-start"
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

              {/* Count footer */}
              <p className="text-center text-muted-foreground mt-16 text-sm font-display tracking-wider">
                {cars.length} {cars.length === 1 ? 'bil' : 'biler'} dokumentert
              </p>
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
      return (
        <article className={`${gridClasses} relative group`}>
          <LinkWrapper className="block">
            {/* Månedens bil - featured layout without text overlay */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr,340px] gap-0">
              {/* Clean image - no overlay */}
              <div className="relative aspect-[4/3] lg:aspect-[16/10] overflow-hidden bg-muted">
                {primaryImage && (
                  <img 
                    src={primaryImage} 
                    alt={imageAlt}
                    className="w-full h-full object-cover object-center transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-xl"
                  />
                )}
                {/* Badge */}
                <div className="absolute top-4 left-4 md:top-6 md:left-6 bg-accent text-accent-foreground px-3 py-1.5 md:px-4 md:py-2 font-display uppercase text-xs md:text-sm border-2 border-foreground shadow-brutal">
                  Månedens bil
                </div>
              </div>
              
              {/* Info panel */}
              <div className="bg-foreground text-background p-6 md:p-8 lg:p-10 flex flex-col justify-center">
                {car.year && (
                  <span className="font-serif text-5xl md:text-6xl lg:text-7xl text-background/90 block mb-3">
                    {car.year}
                  </span>
                )}
                <h2 className="font-display text-xl md:text-2xl lg:text-3xl text-background tracking-wide uppercase mb-4">
                  {car.title}
                </h2>
                {car.model && (
                  <span className="font-display text-sm md:text-base text-accent mb-4 block">
                    {car.model}
                  </span>
                )}
                {excerpt && (
                  <p className="text-background/70 text-sm md:text-base leading-relaxed mb-6 line-clamp-4">
                    {excerpt}
                  </p>
                )}
                <span className="font-display text-xs md:text-sm tracking-[0.2em] text-accent uppercase group-hover:tracking-[0.3em] transition-all">
                  Les historien →
                </span>
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
