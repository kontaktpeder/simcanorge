import { Link } from "react-router-dom";
import { useRelatedCars, type RelatedCar } from "@/hooks/useRelatedCars";
import { brandHubPath } from "@/lib/brandSlug";
import { formatCarHeading } from "@/lib/carTitle";

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
      className="group block"
    >
      <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
        {img ? (
          <img
            src={img}
            alt={car.title}
            loading="lazy"
            className="w-full aspect-[4/3] object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        ) : (
          <div className="w-full aspect-[4/3]" />
        )}
      </div>
      <div className="pt-2">
        {car.year && (
          <p className="font-sans text-sm text-[#1c1917]/60">{car.year}</p>
        )}
        <p className="font-display text-xl uppercase leading-none text-[#071628] mt-0.5 truncate group-hover:text-[#C10D0D] transition-colors">
          {formatCarHeading({ title: car.title, brand: car.brand, model: car.model, year: car.year })}
        </p>
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
    <section className="border-t border-black/10 bg-[#f6f3ee] py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-end justify-between gap-4 mb-6">
          <h2 className="font-display text-3xl uppercase text-[#071628]">
            Flere i arkivet
          </h2>
          <Link
            to={brandHubPath(brand)}
            className="font-sans text-base text-[#C10D0D] hover:text-[#071628] transition-colors shrink-0"
          >
            Se alle {brand}
          </Link>
        </div>

        {sameModel.length > 0 && (
          <div className="mb-8">
            <p className="font-sans text-sm text-[#1c1917]/60 mb-3">
              Samme modell
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {sameModel.map((c) => (
                <CarTile key={c.id} car={c} />
              ))}
            </div>
          </div>
        )}

        {sameBrand.length > 0 && (
          <div>
            <p className="font-sans text-sm text-[#1c1917]/60 mb-3">
              Samme merke
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
