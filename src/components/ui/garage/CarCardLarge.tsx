import { Car, ImagePlus, Plus } from 'lucide-react';
import { StatusBadge, getCarStatus } from '@/components/car/StatusBadge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CarCardLargeProps {
  car: {
    id: string;
    title: string;
    status?: 'submitted' | 'draft' | 'published' | 'archived';
    published_at?: string | null;
    year?: number | null;
    category?: string;
    car_images?: Array<{ image_url: string; sort_order: number | null }>;
    updated_at: string;
  };
  onClick?: () => void;
  showQuickActions?: boolean;
  onAddImages?: () => void;
  onAddEvent?: () => void;
  index?: number;
}

export function CarCardLarge({
  car,
  onClick,
  showQuickActions = false,
  onAddImages,
  onAddEvent,
  index = 0,
}: CarCardLargeProps) {
  const sortedImages = [...(car.car_images || [])].sort(
    (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
  );
  const mainImage = sortedImages[0];
  const status = getCarStatus(car);

  const cardContent = (
    <>
      {/* Bilde */}
      <div className="w-24 h-24 sm:w-32 sm:h-28 md:w-36 md:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
        {mainImage ? (
          <img
            src={mainImage.image_url}
            alt={car.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-0.5 sm:py-1">
        <h3 className="font-display text-base sm:text-lg md:text-xl line-clamp-2 group-hover:text-primary transition-colors leading-tight">
          {car.title}
        </h3>
        
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
          <StatusBadge status={status} size="md" />
          {car.year && (
            <span className="text-xs sm:text-sm text-muted-foreground">{car.year}</span>
          )}
          {car.category && (
            <span className="text-xs sm:text-sm text-muted-foreground capitalize">{car.category}</span>
          )}
        </div>
        
        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2 hidden sm:block">
          Sist oppdatert: {new Date(car.updated_at).toLocaleDateString('nb-NO')}
        </p>
      </div>

      {/* Quick Actions */}
      {showQuickActions && (
        <div className="flex flex-col gap-2 shrink-0">
          {onAddImages && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddImages();
              }}
              className="p-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
              aria-label="Legg til bilder"
            >
              <ImagePlus className="w-5 h-5 text-primary" />
            </button>
          )}
          {onAddEvent && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddEvent();
              }}
              className="p-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
              aria-label="Legg til hendelse"
            >
              <Plus className="w-5 h-5 text-primary" />
            </button>
          )}
        </div>
      )}
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      {onClick ? (
        <button
          onClick={onClick}
          className={cn(
            'flex gap-3 sm:gap-4 w-full text-left',
            'bg-card border-2 border-chrome rounded-xl p-3 sm:p-4',
            'shadow-md hover:shadow-lg hover:-translate-y-1',
            'transition-all duration-200 group cursor-pointer',
            'active:scale-[0.98] min-h-[100px] sm:min-h-[120px]'
          )}
        >
          {cardContent}
        </button>
      ) : (
        <div
          className={cn(
            'flex gap-4',
            'bg-card border-2 border-chrome rounded-xl p-4',
            'shadow-md group'
          )}
        >
          {cardContent}
        </div>
      )}
    </motion.div>
  );
}
