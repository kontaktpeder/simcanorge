import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, ChevronRight, Store } from 'lucide-react';
import simcaBadge from '@/assets/simca-badge-logo.png';

export function SimcaNorgeSellerCard() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="my-8 sm:my-12"
    >
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
        <Store className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        Selges av
      </h2>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 md:p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 border">
              <img src={simcaBadge} alt="Bilgarasje.no" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-semibold">Bilgarasje.no</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Grimstad
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Denne annonsen selges av Bilgarasje.no. Lageret vårt holder til i Grimstad.
          </p>

          <Link
            to="/om-oss"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors mt-4 group"
          >
            Lær mer om oss
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
