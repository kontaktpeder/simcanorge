import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Car, Filter, X, Search } from "lucide-react";

interface CarPost {
  id: string;
  title: string;
  slug: string;
  model: string;
  year: number | null;
  story: string | null;
  overhauled: boolean;
  tags: string[];
  featured: boolean;
  published_at: string | null;
  car_images: { image_url: string; alt_text: string | null }[];
}

const MODELS = [
  "Aronde",
  "Vedette",
  "1000",
  "1000 Rallye",
  "1100",
  "1200",
  "1300",
  "1301",
  "1500",
  "1501",
  "Horizon",
  "Annet",
];

const Biler = () => {
  const [cars, setCars] = useState<CarPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedDecade, setSelectedDecade] = useState<string>("");
  const [showOverhauled, setShowOverhauled] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchCars = async () => {
      const { data, error } = await supabase
        .from("cars")
        .select(`
          id, title, slug, model, year, story, overhauled, tags, featured, published_at,
          car_images(image_url, alt_text)
        `)
        .not("published_at", "is", null)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false });

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
  const filteredCars = cars.filter((car) => {
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        car.title.toLowerCase().includes(query) ||
        car.model.toLowerCase().includes(query) ||
        car.story?.toLowerCase().includes(query) ||
        car.tags?.some((tag) => tag.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Model filter
    if (selectedModel && car.model !== selectedModel) return false;

    // Decade filter
    if (selectedDecade && car.year) {
      const decade = Math.floor(car.year / 10) * 10;
      if (decade.toString() !== selectedDecade) return false;
    }

    // Overhauled filter
    if (showOverhauled !== null && car.overhauled !== showOverhauled) return false;

    return true;
  });

  const featuredCars = filteredCars.filter((car) => car.featured);
  const regularCars = filteredCars.filter((car) => !car.featured);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedModel("");
    setSelectedDecade("");
    setShowOverhauled(null);
  };

  const hasActiveFilters =
    searchQuery || selectedModel || selectedDecade || showOverhauled !== null;

  return (
    <Layout>
      {/* Hero */}
      <section className="poster-section poster-section-blue">
        <div className="container mx-auto text-center">
          <h1 className="headline-lg mb-4">BILER & HISTORIER</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Utforsk samlingen av Simca-biler og historiene bak dem. 
            Fra restaurerte perler til originale klassikere.
          </p>
        </div>
      </section>

      {/* Filters Bar */}
      <section className="bg-card border-b-4 border-foreground sticky top-20 z-40">
        <div className="container mx-auto py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Søk etter bil..."
                className="w-full pl-10 pr-4 py-2 border-2 border-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Filter Toggle (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 border-2 border-foreground hover:bg-muted"
            >
              <Filter className="w-5 h-5" />
              Filter
              {hasActiveFilters && (
                <span className="bg-accent text-accent-foreground w-5 h-5 rounded-full text-xs flex items-center justify-center">
                  !
                </span>
              )}
            </button>

            {/* Desktop Filters */}
            <div className="hidden lg:flex items-center gap-4">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="px-4 py-2 border-2 border-foreground bg-card"
              >
                <option value="">Alle modeller</option>
                {MODELS.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>

              <select
                value={selectedDecade}
                onChange={(e) => setSelectedDecade(e.target.value)}
                className="px-4 py-2 border-2 border-foreground bg-card"
              >
                <option value="">Alle tiår</option>
                <option value="1950">1950-tallet</option>
                <option value="1960">1960-tallet</option>
                <option value="1970">1970-tallet</option>
                <option value="1980">1980-tallet</option>
              </select>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOverhauled === true}
                  onChange={(e) =>
                    setShowOverhauled(e.target.checked ? true : null)
                  }
                  className="w-4 h-4"
                />
                <span className="font-display text-sm">KUN OVERHALT</span>
              </label>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-accent hover:underline"
                >
                  <X className="w-4 h-4" />
                  Nullstill
                </button>
              )}
            </div>
          </div>

          {/* Mobile Filters Dropdown */}
          {showFilters && (
            <div className="lg:hidden mt-4 pt-4 border-t border-border space-y-4">
              <div>
                <label className="block font-display text-sm mb-2">MODELL</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-foreground bg-card"
                >
                  <option value="">Alle modeller</option>
                  {MODELS.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-display text-sm mb-2">TIÅR</label>
                <select
                  value={selectedDecade}
                  onChange={(e) => setSelectedDecade(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-foreground bg-card"
                >
                  <option value="">Alle tiår</option>
                  <option value="1950">1950-tallet</option>
                  <option value="1960">1960-tallet</option>
                  <option value="1970">1970-tallet</option>
                  <option value="1980">1980-tallet</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOverhauled === true}
                  onChange={(e) =>
                    setShowOverhauled(e.target.checked ? true : null)
                  }
                  className="w-4 h-4"
                />
                <span className="font-display">KUN OVERHALT</span>
              </label>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-accent hover:underline"
                >
                  <X className="w-4 h-4" />
                  Nullstill filter
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Gallery */}
      <section className="poster-section">
        <div className="container mx-auto">
          {isLoading ? (
            <div className="text-center py-12">Laster biler...</div>
          ) : filteredCars.length === 0 ? (
            <div className="retro-card text-center py-12">
              <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="headline-md mb-2">INGEN BILER FUNNET</h2>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters
                  ? "Prøv å endre filterene dine"
                  : "Ingen biler er publisert ennå"}
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="btn-retro">
                  Nullstill filter
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Featured Cars */}
              {featuredCars.length > 0 && (
                <div className="mb-12">
                  <h2 className="headline-md mb-6">UTVALGTE</h2>
                  <div className="grid md:grid-cols-2 gap-8">
                    {featuredCars.map((car) => (
                      <CarCard key={car.id} car={car} featured />
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Cars */}
              {regularCars.length > 0 && (
                <div>
                  {featuredCars.length > 0 && (
                    <h2 className="headline-md mb-6">ALLE BILER</h2>
                  )}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {regularCars.map((car) => (
                      <CarCard key={car.id} car={car} />
                    ))}
                  </div>
                </div>
              )}

              <p className="text-center text-muted-foreground mt-8">
                Viser {filteredCars.length} av {cars.length} biler
              </p>
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="poster-section poster-section-red">
        <div className="container mx-auto text-center">
          <h2 className="headline-md mb-4">HAR DU EN SIMCA?</h2>
          <p className="text-xl mb-6 opacity-90">
            Del historien om din franske klassiker med oss!
          </p>
          <Link to="/send-inn" className="btn-retro bg-accent-foreground text-accent">
            Send inn din bil
          </Link>
        </div>
      </section>
    </Layout>
  );
};

interface CarCardProps {
  car: CarPost;
  featured?: boolean;
}

function CarCard({ car, featured }: CarCardProps) {
  const mainImage = car.car_images?.[0];

  return (
    <Link
      to={`/biler/${car.slug}`}
      className={`retro-card group hover-lift ${featured ? "md:flex gap-6" : ""}`}
    >
      {/* Image */}
      <div
        className={`bg-muted rounded overflow-hidden mb-4 ${
          featured ? "md:w-1/2 md:mb-0 aspect-[4/3]" : "aspect-[4/3]"
        }`}
      >
        {mainImage ? (
          <img
            src={mainImage.image_url}
            alt={mainImage.alt_text || car.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={featured ? "md:w-1/2 md:flex md:flex-col md:justify-center" : ""}>
        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="bg-primary text-primary-foreground text-xs px-2 py-1 font-display">
            {car.model}
          </span>
          {car.year && (
            <span className="bg-accent text-accent-foreground text-xs px-2 py-1 font-display">
              {car.year}
            </span>
          )}
          {car.overhauled && (
            <span className="bg-green-600 text-white text-xs px-2 py-1 font-display">
              OVERHALT
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className={`font-display group-hover:text-accent transition-colors ${
            featured ? "text-3xl mb-3" : "text-xl mb-2"
          }`}
        >
          {car.title}
        </h3>

        {/* Story excerpt */}
        {car.story && (
          <p
            className={`text-muted-foreground ${
              featured ? "line-clamp-3" : "line-clamp-2 text-sm"
            }`}
          >
            {car.story}
          </p>
        )}

        {/* Tags */}
        {car.tags && car.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {car.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-muted px-2 py-1 text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export default Biler;
