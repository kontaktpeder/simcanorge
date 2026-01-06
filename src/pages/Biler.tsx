import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { Car, Filter, X, Search, History, CheckCircle, Wrench, AlertTriangle } from "lucide-react";
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
      const matchesSearch = car.title.toLowerCase().includes(query) || 
        car.brand?.toLowerCase().includes(query) ||
        car.model.toLowerCase().includes(query) || 
        car.story?.toLowerCase().includes(query) || 
        car.tags?.some(tag => tag.toLowerCase().includes(query));
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

      {/* Category Tabs */}
      <section className="bg-gradient-to-b from-card to-muted/30 py-8 border-b-4 border-foreground">
        <div className="container mx-auto">
          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`group relative flex items-center gap-3 px-5 py-4 md:px-8 md:py-5 font-display text-sm md:text-base rounded-xl transition-all duration-300 transform hover:scale-105 ${isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105" : "bg-card border-2 border-foreground/20 hover:border-primary hover:bg-primary/5 text-foreground"}`}>
                  <Icon className={`w-6 h-6 md:w-7 md:h-7 transition-transform group-hover:scale-110 ${isActive ? 'animate-pulse' : ''}`} />
                  <span className="hidden sm:inline font-bold tracking-wide">{cat.label}</span>
                  <span className="sm:hidden font-bold">{cat.label.split(' ')[0]}</span>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full transition-colors ${isActive ? "bg-white/20 text-primary-foreground" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"}`}>
                    {categoryCounts[cat.id]}
                  </span>
                  {isActive && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-primary" />}
                </button>;
          })}
          </div>
        </div>
      </section>

      {/* Category Description */}
      {currentCategoryInfo?.description && <section className="bg-primary/5 border-b-2 border-primary/20 animate-fade-in">
          <div className="container mx-auto py-5">
            <div className="flex items-center justify-center gap-4 text-center">
              <currentCategoryInfo.icon className="w-8 h-8 text-primary shrink-0" />
              <p className="text-lg text-foreground/80 max-w-2xl">{currentCategoryInfo.description}</p>
            </div>
          </div>
        </section>}

      {/* Filters Bar */}
      <section className="bg-card/80 backdrop-blur-sm border-b-2 border-foreground/20 sticky top-20 z-40 shadow-md">
        <div className="container mx-auto py-5">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Søk etter bil, modell eller historie..." className="w-full pl-14 pr-6 py-4 text-lg border-3 border-foreground/30 bg-card rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary transition-all shadow-sm hover:shadow-md" />
            </div>

            {/* Filter Toggle (Mobile) */}
            <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden flex items-center gap-2 px-5 py-4 rounded-xl border-2 border-foreground/30 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
              <Filter className="w-5 h-5" />
              Filter
              {hasActiveFilters && <span className="bg-accent text-accent-foreground w-5 h-5 rounded-full text-xs flex items-center justify-center">
                  !
                </span>}
            </button>

            {/* Desktop Filters */}
            <div className="hidden lg:flex items-center gap-3">
              <select value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)} className="px-5 py-3 text-base border-2 border-foreground/30 bg-card rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:border-primary/50">
                <option value="">Alle merker</option>
                {BRANDS.map(brand => <option key={brand} value={brand}>
                    {brand}
                  </option>)}
              </select>

              <select value={selectedDecade} onChange={e => setSelectedDecade(e.target.value)} className="px-5 py-3 text-base border-2 border-foreground/30 bg-card rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer hover:border-primary/50">
                <option value="">Alle tiår</option>
                <option value="1950">1950-tallet</option>
                <option value="1960">1960-tallet</option>
                <option value="1970">1970-tallet</option>
                <option value="1980">1980-tallet</option>
              </select>

              {hasActiveFilters && <button onClick={clearFilters} className="flex items-center gap-2 px-4 py-3 bg-accent/10 text-accent rounded-lg hover:bg-accent hover:text-accent-foreground transition-all font-display">
                  <X className="w-5 h-5" />
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
      <section className="poster-section">
        <div className="container mx-auto">
          {isLoading ? <div className="text-center py-12 text-muted-foreground">Laster biler...</div> : filteredCars.length === 0 ? <div className="border-chrome card-enamel bg-card text-center py-12 animate-fade-in">
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
              {/* Featured Cars */}
              {featuredCars.length > 0 && <div className="mb-12 animate-fade-in">
                  <h2 className="headline-md mb-6">UTVALGTE</h2>
                  <div className="grid md:grid-cols-2 gap-8 stagger-children">
                    {featuredCars.map(car => <CarCard key={car.id} car={car} featured />)}
                  </div>
                </div>}

              {/* Regular Cars */}
              {regularCars.length > 0 && <div className="animate-fade-in-delay-1">
                  {featuredCars.length > 0 && <h2 className="headline-md mb-6">
                      {selectedCategory === "alle" ? "ALLE BILER" : currentCategoryInfo?.label.toUpperCase()}
                    </h2>}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                    {regularCars.map(car => <CarCard key={car.id} car={car} />)}
                  </div>
                </div>}

              <p className="text-center text-muted-foreground mt-8">
                Viser {filteredCars.length} av {cars.length} biler
              </p>
            </>}
        </div>
      </section>

      {/* CTA */}
      <section className="poster-section poster-section-red relative overflow-hidden">
        <div className="absolute inset-0 stripes-diagonal opacity-50" />
        <div className="container mx-auto text-center relative z-10">
          <h2 className="headline-md mb-4">HAR DU EN SIMCA?</h2>
          <p className="text-xl mb-6 opacity-90">
            Del historien om din franske klassiker med oss!
          </p>
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
}
function CarCard({
  car,
  featured
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
  return <Link to={`/biler/${car.slug}`} className={`border-chrome card-enamel bg-card group card-hover-glow ${featured ? "md:flex gap-6 p-6" : "p-4"}`}>
      {/* Image */}
      <div className={`bg-muted rounded-lg overflow-hidden mb-4 relative ${featured ? "md:w-1/2 md:mb-0 aspect-[4/3]" : "aspect-[4/3]"}`}>
        {mainImage ? <img src={mainImage.image_url} alt={mainImage.alt_text || car.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center">
            <Car className="w-16 h-16 text-muted-foreground" />
          </div>}
        {/* Category badge on image */}
        {categoryBadge && <span className={`absolute top-2 left-2 ${categoryBadge.color} text-white text-xs px-2 py-1 font-display rounded`}>
            {categoryBadge.label}
          </span>}
      </div>

      {/* Content */}
      <div className={featured ? "md:w-1/2 md:flex md:flex-col md:justify-center" : ""}>
        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="bg-primary text-primary-foreground text-xs px-2 py-1 font-display rounded">
            {car.model}
          </span>
          {car.year && <span className="bg-accent text-accent-foreground text-xs px-2 py-1 font-display rounded">
              {car.year}
            </span>}
        </div>

        {/* Title */}
        <h3 className={`font-display group-hover:text-primary transition-colors ${featured ? "text-3xl mb-3" : "text-xl mb-2"}`}>
          {car.title}
        </h3>

        {/* Story excerpt */}
        {car.story && <p className={`text-muted-foreground ${featured ? "line-clamp-3" : "line-clamp-2 text-sm"}`}>
            {car.story}
          </p>}

        {/* Tags */}
        {car.tags && car.tags.length > 0 && <div className="flex flex-wrap gap-1 mt-3">
            {car.tags.slice(0, 3).map(tag => <span key={tag} className="text-xs bg-muted px-2 py-1 text-muted-foreground rounded">
                #{tag}
              </span>)}
          </div>}
      </div>
    </Link>;
}
export default Biler;