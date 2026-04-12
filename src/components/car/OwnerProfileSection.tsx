import { motion } from 'framer-motion';
import { User, MapPin, Heart, Eye, EyeOff, Info, CheckCircle2, Circle, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useOwnerProfile } from '@/hooks/useOwnerProfile';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { EnamelCard } from '@/components/ui/garage/EnamelCard';
import { isSellerMinimumComplete, getSellerMinimumSteps } from '@/lib/sellerProfile';

interface OwnerProfileSectionProps {
  userId: string;
}

export function OwnerProfileSection({ userId }: OwnerProfileSectionProps) {
  const { data: profile, isLoading } = useOwnerProfile(userId);

  if (isLoading) {
    return (
      <EnamelCard className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </EnamelCard>
    );
  }

  if (!profile) {
    return (
      <div className="border-2 border-foreground/15 bg-card/90 backdrop-blur-sm p-6 sm:p-8 space-y-4">
        <p className="text-base text-muted-foreground">
          Du har ikke satt opp entusiastprofilen din ennå.
        </p>
        <Link to="/dashboard/min-profil">
          <Button>
            <User className="w-4 h-4 mr-2" />
            Sett opp profil
          </Button>
        </Link>
      </div>
    );
  }

  const sellerReady = isSellerMinimumComplete(profile);
  const sellerSteps = getSellerMinimumSteps(profile);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="border-2 border-foreground/15 bg-card/90 backdrop-blur-sm">
        <div className="p-6 sm:p-8 space-y-8">
          {/* Edit link */}
          <div className="flex justify-end">
            <Link to="/dashboard/min-profil">
              <Button variant="outline" size="sm">
                <Pencil className="w-4 h-4 mr-1" />
                Rediger profil
              </Button>
            </Link>
          </div>

          {/* Seller status */}
          {sellerReady ? (
            <div className="p-5 border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 mt-0.5 shrink-0 text-green-600" />
                <div className="space-y-1">
                  <p className="text-base font-display uppercase tracking-wider text-green-800 dark:text-green-300">
                    Klar til å selge
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Du kan opprette annonser på markedsplassen. Annonser godkjennes av admin før publisering.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30">
              <div className="flex items-start gap-4">
                <User className="h-6 w-6 mt-0.5 shrink-0 text-amber-600" />
                <div className="space-y-2">
                  <p className="text-base font-display uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    Fullfør profilen for å selge
                  </p>
                  <ul className="space-y-1.5">
                    {sellerSteps.map((step) => (
                      <li key={step.key} className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
                        {step.done ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-amber-400 shrink-0" />
                        )}
                        <span className={step.done ? "line-through opacity-60" : ""}>{step.label}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/dashboard/min-profil?rediger=1">
                    <Button size="sm" variant="outline" className="mt-2">
                      <Pencil className="w-3.5 h-3.5 mr-1.5" />
                      Fullfør selgerprofil
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="flex items-start gap-4 p-5 border-2 border-foreground/10 bg-muted/30">
            <Info className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
            <p className="text-base text-muted-foreground">
              Entusiastprofilen din er redaksjonelt innhold som vises på bilene dine og på din offentlige profilside.
            </p>
          </div>

          {/* Avatar + Name */}
          <div className="flex items-center gap-5">
            <Avatar className="h-20 w-20">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.display_name} />}
              <AvatarFallback className="text-xl">{profile.display_name?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-display text-xl uppercase tracking-wider">{profile.display_name}</h3>
              {profile.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-4 w-4" /> {profile.location}
                </p>
              )}
              <Badge variant={profile.visible_public ? "default" : "secondary"} className="mt-2">
                {profile.visible_public ? (
                  <><Eye className="h-3 w-3 mr-1" /> Offentlig</>
                ) : (
                  <><EyeOff className="h-3 w-3 mr-1" /> Skjult</>
                )}
              </Badge>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div>
              <p className="font-display text-sm uppercase tracking-wider text-muted-foreground mb-1">Om meg</p>
              <p className="text-base whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}

          {/* Favorite brands */}
          {profile.favorite_brands && profile.favorite_brands.length > 0 && (
            <div>
              <p className="font-display text-sm uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                <Heart className="h-4 w-4" /> Favorittmerker
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.favorite_brands.map((brand) => (
                  <Badge key={brand} variant="outline">{brand}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
