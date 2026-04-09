import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { ClubPageForCars } from "@/hooks/useClubCommunityCars";
import { useClubCommunityCars, firstCarImage, clubBrandToken } from "@/hooks/useClubCommunityCars";
import { Skeleton } from "@/components/ui/skeleton";

type Variant = "classic" | "modern";

export function ClubCommunityCars({ page, variant = "classic" }: { page: ClubPageForCars; variant?: Variant }) {
  const { data: cars, isLoading, isFetched } = useClubCommunityCars(page);
  const token = clubBrandToken(page);

  if (!token) return null;
  if (isFetched && (!cars || cars.length === 0)) return null;

  if (isLoading) {
    return (
      <div className="my-10">
        <div className={variant === "classic" ? "border-chrome rounded-xl p-6 md:p-9 bg-card" : "rounded-2xl border border-[#c4962c]/20 bg-[#faf7f2] p-6 md:p-9 shadow-sm"}>
          <Skeleton className="h-6 w-40 mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const listUrl = `/biler?brand=${encodeURIComponent(token)}`;

  const wrap =
    variant === "classic"
      ? "border-chrome rounded-xl p-6 md:p-9 bg-card"
      : "rounded-2xl border border-[#c4962c]/20 bg-[#faf7f2] p-6 md:p-9 shadow-sm";

  return (
    <div className="my-10">
      <div className={wrap}>
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground font-sans font-semibold mb-1">
              Miljøet
            </p>
            <h2 className={variant === "classic" ? "text-2xl font-display uppercase tracking-wide text-foreground" : "text-2xl font-bold text-[#3a2e24]"}>
              Biler fra miljøet
            </h2>
          </div>
          <Link
            to={listUrl}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-accent transition-colors"
          >
            Se alle biler
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {cars!.map((car) => {
            const img = firstCarImage(car);
            return (
              <Link
                key={car.id}
                to={`/biler/${car.slug}`}
                className="group block rounded-lg overflow-hidden bg-background/60 hover:shadow-md transition-shadow"
              >
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  {img ? (
                    <img
                      src={img}
                      alt={car.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-xs">
                      Bilde
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-sm font-semibold text-foreground truncate">{car.title}</p>
                  {car.year != null && <p className="text-xs text-muted-foreground">{car.year}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
