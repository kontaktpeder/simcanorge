import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, MapPin, ChevronRight, Mail, Phone } from 'lucide-react';
import { useCarOwnerProfile } from '@/hooks/useOwnerProfile';

interface OwnerData {
  display_name: string;
  bio?: string | null;
  location?: string | null;
  slug?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
}

interface OwnerCardProps {
  carId?: string;
  owner?: OwnerData | null;
}

export function OwnerCard({ carId, owner: ownerProp }: OwnerCardProps) {
  const { data: fetchedOwner, isLoading } = useCarOwnerProfile(carId);

  const owner: OwnerData | null = ownerProp || (fetchedOwner as OwnerData | null);

  if ((!ownerProp && isLoading) || !owner) {
    return null;
  }

  // Truncate bio for preview
  const bioPreview = owner.bio 
    ? owner.bio.length > 200 
      ? owner.bio.slice(0, 200).trim() + '...'
      : owner.bio
    : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="my-8 sm:my-12"
    >
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
        <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        Selges av
      </h2>
      
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 md:p-8">
          {/* Owner name */}
          <h3 className="text-lg sm:text-xl font-semibold mb-1">
            {owner.display_name}
          </h3>
          
          {/* Location */}
          {owner.location && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-4">
              <MapPin className="h-3.5 w-3.5" />
              {owner.location}
            </p>
          )}
          
          {/* Bio */}
          {bioPreview && (
            <blockquote className="text-base sm:text-lg leading-relaxed text-foreground/90 italic border-l-4 border-primary/30 pl-4 my-4">
              "{bioPreview}"
            </blockquote>
          )}

          {/* Contact info */}
          {(owner.contact_email || owner.contact_phone) && (
            <div className="flex flex-col gap-1.5 my-4">
              {owner.contact_email && (
                <a href={`mailto:${owner.contact_email}`} className="text-sm text-primary hover:underline inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {owner.contact_email}
                </a>
              )}
              {owner.contact_phone && (
                <a href={`tel:${owner.contact_phone}`} className="text-sm text-primary hover:underline inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {owner.contact_phone}
                </a>
              )}
            </div>
          )}
          
          {/* Link to owner page */}
          {owner.slug && (
            <Link
              to={`/profil/${owner.slug}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors mt-4 group"
            >
              Se profil
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      </div>
    </motion.section>
  );
}
