import { Link } from 'react-router-dom';
import { getResponsiveImageProps, IMAGE_SIZES } from '@/lib/imageUtils';

interface HeroCarModuleProps {
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
}

export function HeroCarModule({ car }: HeroCarModuleProps) {
  const mainImage = car.car_images?.[0];
  
  // Extract a short excerpt from story
  const excerpt = car.story 
    ? car.story.slice(0, 200).trim() + (car.story.length > 200 ? '…' : '')
    : null;

  return (
    <article className="relative w-full mb-12 md:mb-20">
      {/* Full-width image container */}
      <Link 
        to={`/biler/${car.slug}`}
        className="block relative aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-muted"
      >
        {mainImage ? (
          <img
            {...getResponsiveImageProps(
              mainImage.image_url,
              mainImage.alt_text || car.title,
              { sizes: '100vw', priority: true }
            )}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/10" />
        )}
        
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Text overlay - positioned in margin */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-16">
          <div className="max-w-4xl">
            {/* Year as dominant element */}
            {car.year && (
              <span className="font-serif text-4xl md:text-6xl lg:text-8xl text-white/90 block mb-2 md:mb-4">
                {car.year}
              </span>
            )}
            
            {/* Title */}
            <h2 className="font-display text-2xl md:text-4xl lg:text-5xl text-white leading-tight mb-3 md:mb-4">
              {car.title}
            </h2>
            
            {/* Excerpt on larger screens */}
            {excerpt && (
              <p className="hidden md:block text-white/80 text-lg lg:text-xl max-w-2xl leading-relaxed mb-4">
                {excerpt}
              </p>
            )}
            
            {/* CTA */}
            <span className="inline-block font-display text-sm md:text-base text-accent tracking-wider uppercase">
              Les historien →
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
