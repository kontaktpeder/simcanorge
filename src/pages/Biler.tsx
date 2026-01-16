import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { Car, Filter, X, Search, History, CheckCircle, Wrench, AlertTriangle } from "lucide-react";
import { CAR_BRANDS } from "@/data/carBrands";
import { 
  groupCarsByModule, 
  getModuleOrder, 
  type EditorialModule 
} from "@/lib/carEditorialResolver";
import { 
  HeroCarModule, 
  FeatureCarModule, 
  StandardCarGrid, 
  ArchiveCarList 
} from "@/components/biler";

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
  const currentCategoryInfo = CATEGORIES.find(c => c.id === selectedCategory);

  // Group cars by editorial module
  const groupedCars = groupCarsByModule(cars);
  const moduleOrder = getModuleOrder();

  return (
    <Layout>
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
      <section className="bg-card/50 border-b border-foreground/5 sticky top-20 z-40">
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

      {/* Editorial Content */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
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
              {/* Render modules in order */}
              {moduleOrder.map((module) => {
                const moduleCars = groupedCars[module];
                if (moduleCars.length === 0) return null;

                return (
                  <ModuleSection 
                    key={module} 
                    module={module} 
                    cars={moduleCars} 
                  />
                );
              })}

              {/* Count footer */}
              <p className="text-center text-muted-foreground mt-12 text-sm font-display">
                {cars.length} {cars.length === 1 ? 'bil' : 'biler'} i arkivet
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

// Module section renderer
interface ModuleSectionProps {
  module: EditorialModule;
  cars: CarPost[];
}

function ModuleSection({ module, cars }: ModuleSectionProps): React.ReactNode {
  switch (module) {
    case 'hero':
      return (
        <div className="mb-8">
          {cars.map(car => (
            <HeroCarModule key={car.id} car={car} />
          ))}
        </div>
      );

    case 'feature':
      return (
        <div className="mb-8 md:mb-12">
          {/* Section label */}
          <h2 className="font-display text-xs tracking-[0.3em] text-muted-foreground uppercase mb-8 text-center">
            Utvalgte historier
          </h2>
          {cars.map((car, index) => (
            <FeatureCarModule 
              key={car.id} 
              car={car} 
              reverse={index % 2 === 1} 
            />
          ))}
        </div>
      );

    case 'standard':
      return (
        <div className="mb-8 md:mb-12">
          <h2 className="font-display text-xs tracking-[0.3em] text-muted-foreground uppercase mb-8 text-center">
            Galleriet
          </h2>
          <StandardCarGrid cars={cars} />
        </div>
      );

    case 'archive':
      return (
        <div className="mb-8 md:mb-12 max-w-3xl mx-auto">
          <h2 className="font-display text-xs tracking-[0.3em] text-muted-foreground uppercase mb-6 text-center">
            Arkivnotiser
          </h2>
          <ArchiveCarList cars={cars} />
        </div>
      );

    default:
      return null;
  }
}

export default Biler;
