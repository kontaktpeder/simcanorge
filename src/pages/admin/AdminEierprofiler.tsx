import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, MapPin, Eye, EyeOff, Search, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAllOwnerProfiles, useUpdateOwnerProfile } from '@/hooks/useOwnerProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export default function AdminEierprofiler() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: profiles, isLoading } = useAllOwnerProfiles();
  const updateProfile = useUpdateOwnerProfile();

  // Get car counts for each owner
  const { data: carCounts } = useQuery({
    queryKey: ['owner-car-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('car_owners')
        .select('user_id')
        .eq('role', 'owner');
      
      if (error) throw error;
      
      // Count cars per user
      const counts: Record<string, number> = {};
      data?.forEach(row => {
        counts[row.user_id] = (counts[row.user_id] || 0) + 1;
      });
      return counts;
    },
  });

  const filteredProfiles = profiles?.filter(profile => {
    const query = searchQuery.toLowerCase();
    return (
      profile.display_name.toLowerCase().includes(query) ||
      profile.location?.toLowerCase().includes(query) ||
      profile.favorite_brands?.some(b => b.toLowerCase().includes(query))
    );
  })?.sort((a, b) => {
    // Unapproved first, then approved
    const aPending = !a.approved_at ? 0 : 1;
    const bPending = !b.approved_at ? 0 : 1;
    return aPending - bPending;
  });

  const handleToggleVisibility = async (profileId: string, currentValue: boolean) => {
    await updateProfile.mutateAsync({
      id: profileId,
      updates: { visible_public: !currentValue },
    });
  };

  return (
    <AdminLayout title="Entusiastprofiler">
      <div className="space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk etter navn, sted eller merke..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Profiles List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Laster profiler...
          </div>
        ) : filteredProfiles && filteredProfiles.length > 0 ? (
          <div className="grid gap-4">
            {filteredProfiles.map((profile, index) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={`bg-card border rounded-lg p-4 sm:p-5 ${
                  !profile.approved_at
                    ? 'border-amber-400 ring-1 ring-amber-200'
                    : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {(profile as any).avatar_url ? (
                      <img src={(profile as any).avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-base sm:text-lg">
                          {profile.display_name}
                        </h3>
                        
                        {profile.location && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            {profile.location}
                          </p>
                        )}
                      </div>

                      {/* Status + Visibility toggle */}
                      <div className="flex items-center gap-3">
                        {profile.approved_at ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                            Godkjent
                          </Badge>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                              Venter på godkjenning
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateProfile.mutateAsync({
                                  id: profile.id,
                                  updates: { approved_at: new Date().toISOString() },
                                });
                              }}
                              disabled={updateProfile.isPending}
                              className="text-xs"
                            >
                              Godkjenn
                            </Button>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          {profile.visible_public ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                          <Switch
                            checked={profile.visible_public}
                            onCheckedChange={() => handleToggleVisibility(profile.id, profile.visible_public)}
                            disabled={updateProfile.isPending}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Favorite brands */}
                    {profile.favorite_brands && profile.favorite_brands.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {profile.favorite_brands.map(brand => (
                          <Badge key={brand} variant="secondary" className="text-xs">
                            {brand}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Bio preview */}
                    {profile.bio && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                        {profile.bio}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <span className="text-xs text-muted-foreground">
                        {carCounts?.[profile.user_id] || 0} bil(er)
                      </span>
                      
                      {profile.slug && profile.visible_public && (
                        <Link
                          to={`/profil/${profile.slug}`}
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Se offentlig side
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card border rounded-lg">
            <User className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'Ingen profiler funnet' : 'Ingen profiler opprettet ennå'}
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
