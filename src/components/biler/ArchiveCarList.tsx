import { Link } from 'react-router-dom';
import { getResponsiveImageProps } from '@/lib/imageUtils';

interface CarData {
  id: string;
  slug: string;
  title: string;
  brand?: string | null;
  model: string;
  year?: number | null;
  story?: string | null;
  category: string;
  car_images?: Array<{ image_url: string; alt_text?: string | null }>;
}

interface ArchiveCarListProps {
  cars: CarData[];
}

export function ArchiveCarList({ cars }: ArchiveCarListProps) {
  if (cars.length === 0) return null;

  return (
    <section className="mb-12 md:mb-20">
      {/* Newspaper-style list */}
      <div className="border-t-2 border-foreground/20">
        {cars.map((car) => (
          <ArchiveCarItem key={car.id} car={car} />
        ))}
      </div>
    </section>
  );
}

function ArchiveCarItem({ car }: { car: CarData }) {
  const mainImage = car.car_images?.[0];
  
  // Very short excerpt for archive
  const excerpt = car.story 
    ? car.story.slice(0, 100).trim() + (car.story.length > 100 ? '…' : '')
    : null;

  return (
    <Link 
      to={`/biler/${car.slug}`}
      className="group flex items-start gap-4 py-4 border-b border-foreground/10 hover:bg-muted/30 transition-colors px-2 -mx-2"
    >
      {/* Small thumbnail (optional) */}
      {mainImage && (
        <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 overflow-hidden bg-muted">
          <img
            {...getResponsiveImageProps(
              mainImage.image_url,
              mainImage.alt_text || car.title,
              { sizes: '80px', loading: 'lazy' }
            )}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3 mb-1">
          {/* Year as primary identifier */}
          {car.year && (
            <span className="font-serif text-xl md:text-2xl text-primary/70 leading-none">
              {car.year}
            </span>
          )}
          
          {/* Model */}
          <span className="font-display text-sm text-muted-foreground uppercase tracking-wide">
            {car.brand || 'Simca'} {car.model}
          </span>
        </div>
        
        {/* Title */}
        <h3 className="font-display text-base md:text-lg leading-tight group-hover:text-primary transition-colors">
          {car.title}
        </h3>
        
        {/* Brief excerpt on desktop */}
        {excerpt && (
          <p className="hidden md:block text-sm text-muted-foreground mt-1 line-clamp-1">
            {excerpt}
          </p>
        )}
      </div>
      
      {/* Arrow indicator */}
      <span className="text-muted-foreground group-hover:text-primary transition-colors self-center">
        →
      </span>
    </Link>
  );
}
