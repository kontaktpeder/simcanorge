import { Link } from 'react-router-dom';
import { getResponsiveImageProps, IMAGE_SIZES } from '@/lib/imageUtils';

interface FeatureCarModuleProps {
  car: {
    id: string;
    slug: string;
    title: string;
    brand?: string | null;
    model: string;
    year?: number | null;
    story?: string | null;
    category: string;
    car_images?: Array<{ image_url: string; alt_text?: string | null }>;
  };
  reverse?: boolean; // Alternate layout direction
}

export function FeatureCarModule({ car, reverse = false }: FeatureCarModuleProps) {
  const mainImage = car.car_images?.[0];
  
  // Extract excerpt
  const excerpt = car.story 
    ? car.story.slice(0, 300).trim() + (car.story.length > 300 ? '…' : '')
    : null;

  return (
    <article className="mb-10 md:mb-16">
      <Link 
        to={`/biler/${car.slug}`}
        className={`group flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} gap-6 md:gap-10 lg:gap-16`}
      >
        {/* Image - ~60% width on desktop */}
        <div className="md:w-3/5 lg:w-2/3">
          <div className="relative aspect-[4/3] md:aspect-[3/2] overflow-hidden bg-muted">
            {mainImage ? (
              <img
                {...getResponsiveImageProps(
                  mainImage.image_url,
                  mainImage.alt_text || car.title,
                  { sizes: IMAGE_SIZES.featured }
                )}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/10" />
            )}
          </div>
        </div>
        
        {/* Text block - ~40% width on desktop */}
        <div className={`md:w-2/5 lg:w-1/3 flex flex-col justify-center ${reverse ? 'md:text-right' : ''}`}>
          {/* Year */}
          {car.year && (
            <span className="font-serif text-5xl md:text-6xl lg:text-7xl text-primary/80 block mb-3">
              {car.year}
            </span>
          )}
          
          {/* Model / Brand */}
          <span className="font-display text-sm tracking-widest text-muted-foreground uppercase mb-2">
            {car.brand || 'Simca'} · {car.model}
          </span>
          
          {/* Title */}
          <h2 className="font-display text-xl md:text-2xl lg:text-3xl leading-tight mb-4 group-hover:text-primary transition-colors">
            {car.title}
          </h2>
          
          {/* Excerpt */}
          {excerpt && (
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-6 line-clamp-4">
              {excerpt}
            </p>
          )}
          
          {/* CTA */}
          <span className="font-display text-sm tracking-wider text-primary uppercase group-hover:underline">
            Les historien →
          </span>
        </div>
      </Link>
    </article>
  );
}
