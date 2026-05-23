import { Link } from "react-router-dom";
import { useRelatedCars, type RelatedCar } from "@/hooks/useRelatedCars";
import { brandHubPath } from "@/lib/brandSlug";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const mono = { fontFamily: "'Courier New', 'Courier', monospace" } as const;

function firstImage(car: RelatedCar): string | null {
  const sorted = [...(car.car_images ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  return sorted[0]?.image_url ?? null;
}

function CarTile({ car }: { car: RelatedCar }) {
  const img = firstImage(car);
  return (
    <Link
      to={`/biler/${car.slug}`}
      className="group block overflow-hidden rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
    >
      {img ? (
        <img
          src={img}
          alt={car.title}
          loading="lazy"
          className="w-full aspect-[4/3] object-cover group-hover:scale-[1.02] transition-transform duration-500"
        />
      ) : (
        <div className="w-full aspect-[4/3] bg-white/[0.04]" />
      )}
      <div className="px-3 py-2">
        <p
          className="text-[13px] uppercase tracking-[0.08em] text-white/85 truncate"
          style={oswald}
        >
          {car.title}
        </p>
        {car.year && (
          <p className="text-[10px] text-white/40 mt-0.5" style={mono}>
            {car.year}
          </p>
        )}
      </div>
    </Link>
  );
}

interface Props {
  carId: string;
  brand: string | null | undefined;
  model: string | null | undefined;
}

export function RelatedCarsSection({ carId, brand, model }: Props) {
  const { data } = useRelatedCars({ carId, brand, model });
  if (!brand) return null;

  const sameModel = data?.sameModel ?? [];
  const sameBrand = data?.sameBrand ?? [];
  if (sameModel.length === 0 && sameBrand.length === 0) return null;

  return (
    <section className="border-t border-white/[0.06] py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-end justify-between mb-6">
          <h2
            className="text-[13px] uppercase tracking-[0.22em] text-white/70"
            style={oswald}
          >
            Flere i arkivet
          </h2>
          <Link
            to={brandHubPath(brand)}
            className="text-[11px] uppercase tracking-[0.18em] text-white/50 hover:text-white/90 transition-colors"
            style={oswald}
          >
            Se alle {brand} →
          </Link>
        </div>

        {sameModel.length > 0 && (
          <div className="mb-8">
            <p
              className="text-[10px] uppercase tracking-[0.28em] text-white/35 mb-3"
              style={mono}
            >
              Samme modell
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {sameModel.map((c) => (
                <CarTile key={c.id} car={c} />
              ))}
            </div>
          </div>
        )}

        {sameBrand.length > 0 && (
          <div>
            <p
              className="text-[10px] uppercase tracking-[0.28em] text-white/35 mb-3"
              style={mono}
            >
              Samme merke
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {sameBrand.map((c) => (
                <CarTile key={c.id} car={c} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
