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
 * MonthlyCoverModule – magazine-style cover matching /biler look & feel
 * Light bg, font-serif year, font-display title, accent badge.
 */
export function MonthlyCoverModule({ car }: MonthlyCoverModuleProps) {
  const mainImage = car.car_images?.[0];

  const excerpt = car.story
    ? car.story.slice(0, 240).trim() + (car.story.length > 240 ? '…' : '')
    : null;

  return (
    <article className="relative w-full mb-12 md:mb-20">
      <Link to={`/biler/${car.slug}`} className="group block">
        {/* Section label – matches grid headers */}
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <span className="font-display uppercase tracking-[0.2em] text-[11px] md:text-xs text-accent">
            Månedens bil
          </span>
          <span className="flex-1 h-px bg-foreground/15" />
        </div>

        {/* Two-column magazine cover */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr,1fr] gap-4 md:gap-8 items-stretch">
          {/* Image */}
          <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[480px] overflow-hidden bg-muted">
            {mainImage ? (
              <img
                {...getResponsiveImageProps(
                  mainImage.image_url,
                  mainImage.alt_text || car.title,
                  { sizes: '(min-width: 1024px) 60vw, 100vw', priority: true },
                )}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/10" />
            )}
          </div>

          {/* Text panel – light, serif year, display title */}
          <div className="flex flex-col justify-center px-1 md:px-2 lg:pl-4">
            {car.year && (
              <span className="font-serif text-5xl md:text-6xl lg:text-7xl text-primary/80 leading-none mb-3 md:mb-4">
                {car.year}
              </span>
            )}

            <span className="font-display uppercase tracking-[0.18em] text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">
              {car.brand ? `${car.brand} · ${car.model}` : car.model}
            </span>

            <h2 className="font-display text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-foreground leading-[1.05] mb-4 md:mb-6 group-hover:text-primary transition-colors">
              {car.title}
            </h2>

            {excerpt && (
              <p className="text-foreground/70 text-base md:text-lg leading-relaxed mb-6 md:mb-8 line-clamp-4 md:line-clamp-5 max-w-prose">
                {excerpt}
              </p>
            )}

            <span className="inline-flex items-center gap-2 font-display text-xs md:text-sm uppercase tracking-[0.2em] text-accent transition-all group-hover:gap-3">
              Les historien
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
