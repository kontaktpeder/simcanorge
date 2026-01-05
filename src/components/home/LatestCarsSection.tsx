import { Link } from "react-router-dom";
import { ArrowRight, Car } from "lucide-react";

// Placeholder data - will be replaced with real data from Supabase
const placeholderCars = [
  {
    id: 1,
    title: "Aronde fra Drøbak",
    model: "Aronde",
    year: 1959,
    slug: "aronde-drobak-1959",
  },
  {
    id: 2,
    title: "Rally-legenden fra Bergen",
    model: "1000 Rallye",
    year: 1972,
    slug: "1000-rallye-bergen-1972",
  },
  {
    id: 3,
    title: "Vedette i original stand",
    model: "Vedette",
    year: 1956,
    slug: "vedette-original-1956",
  },
];

export function LatestCarsSection() {
  return (
    <section className="poster-section">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4">
          <h2 className="headline-md">
            NYESTE HISTORIER
          </h2>
          <Link 
            to="/biler" 
            className="font-display text-xl text-accent hover:underline inline-flex items-center gap-2"
          >
            Se alle
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {placeholderCars.map((car) => (
            <Link 
              key={car.id}
              to={`/biler/${car.slug}`}
              className="retro-card group hover-lift"
            >
              <div className="aspect-[4/3] bg-muted rounded mb-4 flex items-center justify-center">
                <Car className="w-16 h-16 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-primary text-primary-foreground px-2 py-1 text-sm font-display">
                  {car.model}
                </span>
                <span className="bg-accent text-accent-foreground px-2 py-1 text-sm font-display">
                  {car.year}
                </span>
              </div>
              <h3 className="font-display text-2xl group-hover:text-accent transition-colors">
                {car.title}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
