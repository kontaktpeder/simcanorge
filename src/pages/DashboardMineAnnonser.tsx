import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { GarageLayout } from '@/components/ui/garage/GarageLayout';
import { EnamelCard } from '@/components/ui/garage/EnamelCard';
import { BigActionButton } from '@/components/ui/garage/BigActionButton';
import { ShoppingBag, Plus, Clock, Eye, Archive, Loader2, User, Send } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOwnerProfile } from '@/hooks/useOwnerProfile';
import { useMyListings } from '@/hooks/useMarketplace';
import { useRequestSellerApproval } from '@/hooks/useRequestSellerApproval';

export default function DashboardMineAnnonser() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: ownerProfile, isLoading: profileLoading } = useOwnerProfile(user?.id);
  const { data: listings, isLoading: listingsLoading } = useMyListings(user?.id);
  const requestApproval = useRequestSellerApproval();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?returnUrl=/dashboard/mine-annonser');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || profileLoading) {
    return (
      <Layout>
        <div className="container py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  const canCreateListing = ownerProfile?.approved_at;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><Eye className="h-3 w-3 mr-1" />Publisert</Badge>;
      case 'submitted':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="h-3 w-3 mr-1" />Venter</Badge>;
      case 'archived':
        return <Badge variant="secondary"><Archive className="h-3 w-3 mr-1" />Arkivert</Badge>;
      default:
        return <Badge variant="outline">Utkast</Badge>;
    }
  };

  return (
    <GarageLayout
      title="Dine annonser"
      subtitle="Markedsplass"
      description="Se og administrer annonser du har lagt ut på markedsplassen."
    >
      {/* Status messages */}
      {!ownerProfile && (
        <EnamelCard className="mb-6">
          <div className="p-5 text-center">
            <p className="text-muted-foreground mb-3">Du må opprette en Entusiastprofil før du kan legge ut annonser.</p>
            <Link to="/dashboard?showOwnerProfile=true">
              <BigActionButton icon={<Plus className="w-4 h-4" />}>Opprett profil</BigActionButton>
            </Link>
          </div>
        </EnamelCard>
      )}

      {ownerProfile && !ownerProfile.approved_at && (
        <EnamelCard className="mb-6">
          <div className="p-5">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Profil venter på godkjenning</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Du kan opprette annonser når admin har godkjent Entusiastprofilen din.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-4 ml-8">
              <Link to="/dashboard?showOwnerProfile=true">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-1.5" />
                  Se min profil
                </Button>
              </Link>
              <Button
                size="sm"
                onClick={() => requestApproval.mutate()}
                disabled={requestApproval.isPending}
              >
                <Send className="h-4 w-4 mr-1.5" />
                {requestApproval.isPending ? 'Sender...' : 'Be om å bli godkjent selger'}
              </Button>
            </div>
          </div>
        </EnamelCard>
      )}

      {/* Create listing button */}
      {canCreateListing && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Link to="/dashboard/opprett-annonse">
            <BigActionButton icon={<Plus className="w-5 h-5" />} className="w-full sm:w-auto">
              Ny annonse
            </BigActionButton>
          </Link>
        </motion.div>
      )}

      {/* Listings */}
      {listingsLoading ? (
        <div className="text-center py-12 text-muted-foreground">Laster annonser...</div>
      ) : listings && listings.length > 0 ? (
        <div className="grid gap-4">
          {listings.map((item: any, index: number) => {
            const images = [...(item.marketplace_images || [])].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
            const mainImage = images[0];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <EnamelCard className="overflow-hidden">
                  <div className="flex gap-4 p-4">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-muted overflow-hidden shrink-0">
                      {mainImage ? (
                        <img src={mainImage.image_url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-base line-clamp-1">{item.title}</h3>
                        {getStatusBadge(item.status)}
                      </div>
                      {item.price && (
                        <p className="text-primary font-bold mt-1">{Number(item.price).toLocaleString('nb-NO')} kr</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Opprettet {new Date(item.created_at).toLocaleDateString('nb-NO')}
                      </p>
                      <Link
                        to={`/dashboard/annonse/${item.id}/rediger`}
                        className="text-sm text-primary hover:underline mt-2 inline-block"
                      >
                        Rediger annonse
                      </Link>
                    </div>
                  </div>
                </EnamelCard>
              </motion.div>
            );
          })}
        </div>
      ) : ownerProfile?.approved_at ? (
        <EnamelCard>
          <div className="text-center py-12">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">Du er klar til å selge.</p>
            <p className="text-xs text-muted-foreground mb-4">Alt som legges ut må godkjennes før publisering.</p>
            <Link to="/dashboard/opprett-annonse">
              <BigActionButton icon={<Plus className="w-4 h-4" />}>Opprett første annonse</BigActionButton>
            </Link>
          </div>
        </EnamelCard>
      ) : null}
    </GarageLayout>
  );
}
