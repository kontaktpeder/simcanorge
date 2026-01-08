import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { Car, Filter, X, Search, History, CheckCircle, Wrench, AlertTriangle, LayoutGrid, List } from "lucide-react";
import { CAR_BRANDS } from "@/data/carBrands";
interface CarPost {
  id: string;
  title: string;
  slug: string;
  brand: string | null;
  model: string;
  year: number | null;
  story: string | null;
  overhauled: boolean;
  tags: string[];
  featured: boolean;
  published_at: string | null;
  category: string;
  car_images: {
    image_url: string;
    alt_text: string | null;
  }[];
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
  description: "Biler som kjører på veien i dag. Registrert og i bruk på norske veier."
}, {
  id: "restaurering",
  label: "Restaureringsprosjekter",
  icon: Wrench,
  description: "Biler under overhaling. Prosessen er like viktig som sluttresultatet."
}, {
  id: "historisk",
  label: "Historiske biler",
  icon: History,
  description: "Biler som ikke lenger eksisterer, men lever videre gjennom bilder og historier."
}, {
  id: "vrak",
  label: "Vrak",
  icon: AlertTriangle,
  description: "Biler som finnes, men som av ulike årsaker ikke er kjørbare."
}];
const Biler = () => {
  const [cars, setCars] = useState<CarPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedDecade, setSelectedDecade] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("alle");
  const [viewMode, setViewMode] = useState<"gallery" | "list">("gallery");
  useEffect(() => {
    const fetchCars = async () => {
      const {
        data,
        error
      } = await supabase.from("cars").select(`
          id, title, slug, brand, model, year, story, overhauled, tags, featured, published_at, category,
          car_images(image_url, alt_text)
        `).not("published_at", "is", null).lte("published_at", new Date().toISOString()).order("published_at", {
        ascending: false
      });
      if (error) {
        console.error("Error fetching cars:", error);
      } else {
        setCars(data || []);
      }
      setIsLoading(false);
    };
    fetchCars();
  }, []);

  // Filter cars
  const filteredCars = cars.filter(car => {
    // Category filter
    if (selectedCategory !== "alle" && car.category !== selectedCategory) return false;

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = car.title.toLowerCase().includes(query) || car.brand?.toLowerCase().includes(query) || car.model.toLowerCase().includes(query) || car.story?.toLowerCase().includes(query) || car.tags?.some(tag => tag.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Brand filter
    if (selectedBrand && car.brand !== selectedBrand) return false;

    // Decade filter
    if (selectedDecade && car.year) {
      const decade = Math.floor(car.year / 10) * 10;
      if (decade.toString() !== selectedDecade) return false;
    }
    return true;
  });
  const featuredCars = filteredCars.filter(car => car.featured);
  const regularCars = filteredCars.filter(car => !car.featured);
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedBrand("");
    setSelectedDecade("");
  };
  const hasActiveFilters = searchQuery || selectedBrand || selectedDecade;
  const currentCategoryInfo = CATEGORIES.find(c => c.id === selectedCategory);

  // Count cars per category
  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    if (cat.id === "alle") {
      acc[cat.id] = cars.length;
    } else {
      acc[cat.id] = cars.filter(c => c.category === cat.id).length;
    }
    return acc;
  }, {} as Record<string, number>);
  return <Layout>
      <PageHeader title="BILER" subtitle="Utforsk samlingen av Simca-biler i Norge – fra registrerte klassikere til historiske perler" />

      {/* Category Tabs - symmetrical grid layout */}
      <section className="bg-gradient-to-b from-card via-card to-muted/20 py-6 md:py-10 border-b-2 border-chrome-mid">
        <div className="container mx-auto px-3 md:px-4">
          {/* Grid layout for symmetry */}
          <div className="grid grid-cols-5 gap-1.5 md:gap-3 max-w-4xl mx-auto">
            {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            // Short labels for mobile
            const mobileLabels: Record<string, string> = {
              "alle": "Alle",
              "registrert": "Reg.",
              "restaurering": "Rest.",
              "historisk": "Hist.",
              "vrak": "Vrak"
            };
            return <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`group relative flex flex-col items-center justify-center gap-1 md:gap-2 px-1.5 py-2.5 md:px-4 md:py-5 font-display text-[8px] md:text-sm rounded-lg md:rounded-xl transition-all duration-300 ${isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary/50" : "bg-card border border-foreground/10 hover:border-primary/50 hover:bg-primary/5 text-foreground hover:shadow-md"}`}>
                  {/* Icon with badge count */}
                  <div className="relative">
                    <Icon className={`w-4 h-4 md:w-7 md:h-7 transition-transform group-hover:scale-110 ${isActive ? '' : 'text-primary'}`} />
                    <span className={`absolute -top-1 -right-1.5 md:-top-2 md:-right-2.5 min-w-[14px] md:min-w-[20px] h-3.5 md:h-5 flex items-center justify-center text-[8px] md:text-xs font-bold rounded-full ${isActive ? "bg-white/25 text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
                      {categoryCounts[cat.id]}
                    </span>
                  </div>
                  
                  {/* Label - shorter on mobile */}
                  <span className="font-bold tracking-wide text-center leading-tight hidden md:block">
                    {cat.label.split(' ')[0]}
                  </span>
                  <span className="font-bold tracking-tight text-center leading-tight md:hidden">
                    {mobileLabels[cat.id]}
                  </span>
                  
                  {/* Active indicator */}
                  {isActive && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 md:w-12 h-0.5 md:h-1 bg-accent rounded-full" />}
                </button>;
          })}
          </div>
        </div>
      </section>

      {/* Category Description - mobile optimized */}
      {currentCategoryInfo?.description && <section className="bg-primary/5 border-b-2 border-primary/20 animate-fade-in">
          <div className="container mx-auto py-3 md:py-5 px-4">
            <div className="flex items-center justify-center gap-3 md:gap-4 text-center">
              <currentCategoryInfo.icon className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
              <p className="text-sm md:text-lg text-foreground/80 max-w-2xl">{currentCategoryInfo.description}</p>
            </div>
          </div>
        </section>}

      {/* Filters Bar - compact */}
      <section className="bg-card/80 backdrop-blur-sm border-b border-foreground/10 sticky top-20 z-40">
        <div className="container mx-auto py-2 md:py-3 px-2 md:px-4">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[140px] md:min-w-[200px]">
              <Search className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Søk..." className="w-full pl-8 md:pl-9 pr-3 py-1.5 md:py-2 text-sm border border-foreground/20 bg-card rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all" />
            </div>

            {/* View Toggle (Mobile) */}
            <div className="lg:hidden flex items-center border border-foreground/20 rounded-md overflow-hidden">
              <button 
                onClick={() => setViewMode("gallery")} 
                className={`p-1.5 transition-colors ${viewMode === "gallery" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                aria-label="Galleri-visning"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode("list")} 
                className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                aria-label="Liste-visning"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Toggle (Mobile) */}
            <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-foreground/20 text-sm hover:bg-muted transition-colors">
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Filter</span>
              {hasActiveFilters && <span className="bg-accent text-accent-foreground w-4 h-4 rounded-full text-[10px] flex items-center justify-center">!</span>}
            </button>

            {/* Desktop Filters */}
            <div className="hidden lg:flex items-center gap-2">
              <select value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)} className="px-3 py-1.5 text-sm border border-foreground/20 bg-card rounded-md focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:border-primary/50">
                <option value="">Alle merker</option>
                {BRANDS.map(brand => <option key={brand} value={brand}>
                    {brand}
                  </option>)}
              </select>

              <select value={selectedDecade} onChange={e => setSelectedDecade(e.target.value)} className="px-3 py-1.5 text-sm border border-foreground/20 bg-card rounded-md focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:border-primary/50">
                <option value="">Alle tiår</option>
                <option value="1950">1950-tallet</option>
                <option value="1960">1960-tallet</option>
                <option value="1970">1970-tallet</option>
                <option value="1980">1980-tallet</option>
              </select>

              {hasActiveFilters && <button onClick={clearFilters} className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm bg-accent/10 text-accent rounded-md hover:bg-accent hover:text-accent-foreground transition-all font-display">
                  <X className="w-3.5 h-3.5" />
                  Nullstill
                </button>}
            </div>
          </div>

          {/* Mobile Filters Dropdown */}
          {showFilters && <div className="lg:hidden mt-4 pt-4 border-t border-border space-y-4 animate-fade-in">
              <div>
                <label className="block font-display text-sm mb-2">MERKE</label>
                <select value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)} className="w-full px-4 py-2 border-2 border-foreground bg-card">
                  <option value="">Alle merker</option>
                  {BRANDS.map(brand => <option key={brand} value={brand}>
                      {brand}
                    </option>)}
                </select>
              </div>

              <div>
                <label className="block font-display text-sm mb-2">TIÅR</label>
                <select value={selectedDecade} onChange={e => setSelectedDecade(e.target.value)} className="w-full px-4 py-2 border-2 border-foreground bg-card">
                  <option value="">Alle tiår</option>
                  <option value="1950">1950-tallet</option>
                  <option value="1960">1960-tallet</option>
                  <option value="1970">1970-tallet</option>
                  <option value="1980">1980-tallet</option>
                </select>
              </div>

              {hasActiveFilters && <button onClick={clearFilters} className="flex items-center gap-1 text-accent hover:underline">
                  <X className="w-4 h-4" />
                  Nullstill filter
                </button>}
            </div>}
        </div>
      </section>

      {/* Gallery */}
      <section className="py-6 md:py-10">
        <div className="px-2 md:container md:mx-auto md:px-4">
          {isLoading ? <div className="text-center py-12 text-muted-foreground">Laster biler...</div> : filteredCars.length === 0 ? <div className="border-chrome card-enamel bg-card text-center py-12 animate-fade-in mx-2 md:mx-0">
              <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="headline-md mb-2">INGEN BILER FUNNET</h2>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters || selectedCategory !== "alle" ? "Prøv å endre filterene dine" : "Ingen biler er publisert ennå"}
              </p>
              {(hasActiveFilters || selectedCategory !== "alle") && <div className="flex gap-4 justify-center">
                  {hasActiveFilters && <button onClick={clearFilters} className="btn-enamel-red">
                      Nullstill filter
                    </button>}
                  {selectedCategory !== "alle" && <button onClick={() => setSelectedCategory("alle")} className="btn-enamel-blue">
                      Vis alle kategorier
                    </button>}
                </div>}
            </div> : <>
              {/* Featured Cars - månedens bil - full width */}
              {featuredCars.length > 0 && <div className="mb-6 md:mb-10 animate-fade-in">
                  <h2 className="headline-md mb-4 md:mb-5 px-1 md:px-0">MÅNEDENS BIL</h2>
                  <div className="space-y-3">
                    {featuredCars.map(car => <CarCard key={car.id} car={car} featured />)}
                  </div>
                </div>}

              {/* Regular Cars */}
              {regularCars.length > 0 && <div className="animate-fade-in-delay-1">
                  {featuredCars.length > 0 && <h2 className="headline-md mb-4 md:mb-6 px-1 md:px-0">
                      {selectedCategory === "alle" ? "ALLE BILER" : currentCategoryInfo?.label.toUpperCase()}
                    </h2>}
                  <div className={`grid stagger-children ${
                    viewMode === "list" 
                      ? "grid-cols-1 gap-2.5" 
                      : "grid-cols-2 gap-2 sm:gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  }`}>
                    {regularCars.map(car => <CarCard key={car.id} car={car} viewMode={viewMode} />)}
                  </div>
                </div>}

              <p className="text-center text-muted-foreground mt-6 md:mt-8 text-sm">
                Viser {filteredCars.length} av {cars.length} biler
              </p>
            </>}
        </div>
      </section>

      {/* CTA */}
      <section className="poster-section poster-section-red relative overflow-hidden">
        <div className="absolute inset-0 stripes-diagonal opacity-50" />
        <div className="container mx-auto text-center relative z-10">
          <h2 className="headline-md mb-4">HAR DU EN SIMCA,
TALBOT ELLER MATRA?  
  </h2>
          <p className="text-xl mb-6 opacity-90">Del historien om din franske klassiker med oss, så vi kan få den ut på siden!</p>
          <Link to="/send-inn" className="btn-retro bg-accent-foreground text-primary-foreground">
            Send inn din bil
          </Link>
        </div>
      </section>
    </Layout>;
};
interface CarCardProps {
  car: CarPost;
  featured?: boolean;
  viewMode?: "gallery" | "list";
}
function CarCard({
  car,
  featured,
  viewMode = "gallery"
}: CarCardProps) {
  const mainImage = car.car_images?.[0];
  const getCategoryBadge = () => {
    switch (car.category) {
      case "registrert":
        return {
          label: "REGISTRERT",
          color: "bg-green-600"
        };
      case "restaurering":
        return {
          label: "RESTAURERING",
          color: "bg-orange-500"
        };
      case "historisk":
        return {
          label: "HISTORISK",
          color: "bg-blue-600"
        };
      case "vrak":
        return {
          label: "VRAK",
          color: "bg-gray-600"
        };
      default:
        return null;
    }
  };
  const categoryBadge = getCategoryBadge();
  const isListView = viewMode === "list" && !featured;
  
  // Featured: horizontal full-width layout
  if (featured) {
    return <Link to={`/biler/${car.slug}`} className="border-chrome card-enamel bg-card group card-hover-glow flex flex-col sm:flex-row gap-4 p-4">
      {/* Image - wider aspect ratio */}
      <div className="sm:w-2/5 lg:w-1/3 bg-muted rounded-lg overflow-hidden relative aspect-[16/10] sm:aspect-[4/3] flex-shrink-0">
        {mainImage ? <img src={mainImage.image_url} alt={mainImage.alt_text || car.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center">
            <Car className="w-16 h-16 text-muted-foreground" />
          </div>}
        {categoryBadge && <span className={`absolute top-2 left-2 ${categoryBadge.color} text-white text-[10px] px-2 py-0.5 font-display rounded tracking-wide`}>
            {categoryBadge.label}
          </span>}
        <span className="absolute top-2 right-2 bg-accent text-accent-foreground text-[10px] px-2 py-0.5 font-display rounded tracking-wide">
          ★ MÅNEDENS
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 font-display rounded">
            {car.model}
          </span>
          {car.year && <span className="bg-accent text-accent-foreground text-xs px-2 py-0.5 font-display rounded">
              {car.year}
            </span>}
        </div>
        <h3 className="font-display text-xl md:text-2xl group-hover:text-primary transition-colors mb-2">
          {car.title}
        </h3>
        {car.story && <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
            {car.story}
          </p>}
        {car.tags && car.tags.length > 0 && <div className="flex flex-wrap gap-1.5 mt-3">
            {car.tags.slice(0, 4).map(tag => <span key={tag} className="text-xs bg-muted px-2 py-0.5 text-muted-foreground rounded">
                #{tag}
              </span>)}
          </div>}
      </div>
    </Link>;
  }
  
  // Gallery view: vertical card with dominant image
  if (!isListView) {
    return <Link to={`/biler/${car.slug}`} className="border-chrome card-enamel bg-card group card-hover-glow p-1.5 sm:p-2">
      {/* Image - dominant, ~65-70% of card */}
      <div className="bg-muted rounded overflow-hidden relative aspect-[4/3]">
        {mainImage ? <img src={mainImage.image_url} alt={mainImage.alt_text || car.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center">
            <Car className="w-10 h-10 text-muted-foreground" />
          </div>}
        {categoryBadge && <span className={`absolute top-1 left-1 ${categoryBadge.color} text-white text-[7px] px-1 py-0.5 font-display rounded tracking-wide`}>
            {categoryBadge.label}
          </span>}
      </div>

      {/* Content - minimal: title + year only */}
      <div className="pt-1.5 px-0.5">
        <h3 className="font-display text-xs sm:text-sm group-hover:text-primary transition-colors leading-tight line-clamp-2">
          {car.title}
        </h3>
        <div className="flex items-center gap-1 mt-1">
          {car.year && <span className="text-[9px] sm:text-[10px] text-muted-foreground font-display">
              {car.year}
            </span>}
          <span className="text-[9px] sm:text-[10px] text-muted-foreground">•</span>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground font-display">
            {car.model}
          </span>
        </div>
      </div>
    </Link>;
  }
  
  // List view: horizontal card with image left, text right
  return <Link to={`/biler/${car.slug}`} className="border-chrome card-enamel bg-card group card-hover-glow flex gap-3 p-2">
      {/* Image - 40-45% width */}
      <div className="w-[42%] sm:w-[38%] bg-muted rounded overflow-hidden relative aspect-[4/3] flex-shrink-0">
        {mainImage ? <img src={mainImage.image_url} alt={mainImage.alt_text || car.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center">
            <Car className="w-8 h-8 text-muted-foreground" />
          </div>}
        {categoryBadge && <span className={`absolute top-1 left-1 ${categoryBadge.color} text-white text-[7px] px-1 py-0.5 font-display rounded tracking-wide`}>
            {categoryBadge.label}
          </span>}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
        <div className="flex flex-wrap items-center gap-1 mb-1">
          <span className="bg-primary text-primary-foreground font-display rounded text-[8px] px-1 py-0.5">
            {car.model}
          </span>
          {car.year && <span className="bg-accent text-accent-foreground font-display rounded text-[8px] px-1 py-0.5">
              {car.year}
            </span>}
        </div>

        <h3 className="font-display group-hover:text-primary transition-colors leading-tight text-sm line-clamp-2 mb-1">
          {car.title}
        </h3>

        {car.story && <p className="text-muted-foreground line-clamp-2 text-[10px] leading-relaxed hidden sm:block">
            {car.story}
          </p>}
      </div>
    </Link>;
}
export default Biler;