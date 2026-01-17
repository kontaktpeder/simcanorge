import { Link } from 'react-router-dom';
import { getResponsiveImageProps } from '@/lib/imageUtils';

interface MonthlyCoverModuleProps {
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

/**
 * MonthlyCoverModule - Premium "cover" layout for månedens bil
 * 
 * Distinct from TopStory/Hero:
 * - Full-width with split layout (image left, cover panel right)
 * - Dark panel with accent highlights
 * - "Månedens bil" badge
 * - More prominent, cover-like typography
 */
export function MonthlyCoverModule({ car }: MonthlyCoverModuleProps) {
  const mainImage = car.car_images?.[0];
  
  // Longer excerpt for cover
  const excerpt = car.story 
    ? car.story.slice(0, 280).trim() + (car.story.length > 280 ? '…' : '')
    : null;

  return (
    <article className="relative w-full mb-8 md:mb-12 lg:mb-16">
      <Link 
        to={`/biler/${car.slug}`}
        className="group block"
      >
        {/* Cover layout: image + panel */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] xl:grid-cols-[1fr,420px]">
          
          {/* Main image - clean, no overlay */}
          <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[500px] xl:min-h-[560px] overflow-hidden bg-muted">
            {mainImage ? (
              <img
                {...getResponsiveImageProps(
                  mainImage.image_url,
                  mainImage.alt_text || car.title,
                  { sizes: '100vw', priority: true }
                )}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20" />
            )}
            
            {/* "Månedens bil" badge - positioned on image */}
            <div className="absolute top-4 left-4 md:top-6 md:left-6 lg:top-8 lg:left-8">
              <div className="bg-accent text-accent-foreground px-4 py-2 md:px-5 md:py-2.5 font-display uppercase text-xs md:text-sm tracking-[0.15em] border-2 border-foreground shadow-[3px_3px_0_0_hsl(var(--foreground))]">
                Månedens bil
              </div>
            </div>
          </div>
          
          {/* Cover panel - dark with accent details */}
          <div className="bg-foreground text-background p-6 md:p-8 lg:p-10 xl:p-12 flex flex-col justify-center relative overflow-hidden">
            {/* Decorative line accent */}
            <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
            
            {/* Year - dominant display */}
            {car.year && (
              <span className="font-serif text-6xl md:text-7xl lg:text-8xl xl:text-9xl text-background/20 absolute -top-4 -right-4 select-none pointer-events-none">
                {car.year}
              </span>
            )}
            
            <div className="relative z-10">
              {/* Year - readable version */}
              {car.year && (
                <span className="font-serif text-4xl md:text-5xl lg:text-6xl text-accent block mb-3">
                  {car.year}
                </span>
              )}
              
              {/* Brand & model */}
              <span className="font-display text-xs md:text-sm tracking-[0.2em] text-background/60 uppercase block mb-3">
                {car.brand || 'Simca'} · {car.model}
              </span>
              
              {/* Title - cover style */}
              <h2 className="font-display text-2xl md:text-3xl lg:text-4xl text-background tracking-wide uppercase leading-tight mb-4 lg:mb-6">
                {car.title}
              </h2>
              
              {/* Excerpt */}
              {excerpt && (
                <p className="text-background/70 text-sm md:text-base leading-relaxed mb-6 lg:mb-8 line-clamp-4 lg:line-clamp-5">
                  {excerpt}
                </p>
              )}
              
              {/* CTA with hover animation */}
              <span className="inline-flex items-center gap-2 font-display text-sm tracking-[0.15em] text-accent uppercase transition-all group-hover:tracking-[0.25em] group-hover:gap-3">
                Les historien
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
