import { Link } from 'react-router-dom';
import { getResponsiveImageProps, IMAGE_SIZES } from '@/lib/imageUtils';
import { Car } from 'lucide-react';

interface CarData {
  id: string;
  slug: string;
  title: string;
  brand?: string | null;
  model: string;
  year?: number | null;
  category: string;
  car_images?: Array<{ image_url: string; alt_text?: string | null }>;
}

interface StandardCarGridProps {
  cars: CarData[];
}

export function StandardCarGrid({ cars }: StandardCarGridProps) {
  if (cars.length === 0) return null;

  return (
    <section className="mb-12 md:mb-20">
      {/* Asymmetric masonry-like grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        {cars.map((car, index) => (
          <StandardCarCard 
            key={car.id} 
            car={car} 
            // Vary heights for magazine feel
            tall={index % 5 === 0 || index % 7 === 0}
          />
        ))}
      </div>
    </section>
  );
}

interface StandardCarCardProps {
  car: CarData;
  tall?: boolean;
}

function StandardCarCard({ car, tall = false }: StandardCarCardProps) {
  const mainImage = car.car_images?.[0];

  return (
    <Link 
      to={`/biler/${car.slug}`}
      className="group block"
    >
      {/* Image container with varying aspect ratios */}
      <div className={`relative overflow-hidden bg-muted mb-3 ${
        tall ? 'aspect-[3/4]' : 'aspect-[4/3]'
      }`}>
        {mainImage ? (
          <img
            {...getResponsiveImageProps(
              mainImage.image_url,
              mainImage.alt_text || car.title,
              { sizes: IMAGE_SIZES.card, loading: 'lazy' }
            )}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car className="w-10 h-10 text-muted-foreground/40" />
          </div>
        )}
      </div>
      
      {/* Minimal text - year prominent */}
      <div className="px-1">
        {car.year && (
          <span className="font-serif text-2xl md:text-3xl text-primary/70 block leading-none">
            {car.year}
          </span>
        )}
        <h3 className="font-display text-sm md:text-base leading-tight mt-1 group-hover:text-primary transition-colors line-clamp-2">
          {car.model}
        </h3>
      </div>
    </Link>
  );
}
