import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { GarageLayout } from '@/components/ui/garage/GarageLayout';
import { EnamelCard } from '@/components/ui/garage/EnamelCard';
import { BigActionButton } from '@/components/ui/garage/BigActionButton';
import { SectionHeader } from '@/components/ui/garage/SectionHeader';
import { Car, Clock, Settings, Bell, CheckCircle, Send, X, User, HelpCircle, Sparkles, ShoppingBag, Plus, ExternalLink, Inbox } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SendInnBilForm } from '@/components/car/SendInnBilForm';
import { OwnerProfileSection } from '@/components/car/OwnerProfileSection';
import { useOwnerProfile } from '@/hooks/useOwnerProfile';
import { useGuide } from '@/hooks/useGuide';
import { useMyListings } from '@/hooks/useMarketplace';

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { startGuide } = useGuide();
  const [showCarForm, setShowCarForm] = useState(false);
  const [showOwnerProfile, setShowOwnerProfile] = useState(() => {
    // Sjekk URL-parameter kun ved første render
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const shouldShow = params.get('showOwnerProfile') === 'true';
      if (shouldShow) {
        // Fjern parameteren fra URL umiddelbart
        window.history.replaceState({}, '', '/dashboard');
      }
      return shouldShow;
    }
    return false;
  });
  const formRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  
  // Hent entusiastprofil for å vise status
  const { data: ownerProfile } = useOwnerProfile(user?.id);
  const { data: myListings } = useMyListings(user?.id);

  // Redirect hvis ikke innlogget
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?returnUrl=/dashboard');
    }
  }, [user, authLoading, navigate]);

  // Scroll til eierprofil hvis åpnet via URL
  useEffect(() => {
    if (showOwnerProfile && profileRef.current) {
      setTimeout(() => {
        profileRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    }
  }, []);

  // Hent antall biler
  const { data: carCount, isLoading: carsLoading } = useQuery({
    queryKey: ['my-cars-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from('car_owners')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('role', 'owner');
      return count || 0;
    },
    enabled: !!user
  });

  // Hent forespørsler for selger
  const { data: myInquiries } = useQuery({
    queryKey: ['my-inquiries-summary', ownerProfile?.id],
    queryFn: async () => {
      if (!ownerProfile?.id) return { total: 0, pending: 0 };
      const { data, error } = await supabase
        .from('inquiries')
        .select('id, status')
        .eq('recipient_owner_id', ownerProfile.id);
      if (error) throw error;
      const total = data?.length || 0;
      const pending = data?.filter(i => i.status === 'pending').length || 0;
      return { total, pending };
    },
    enabled: !!ownerProfile?.id,
  });

  // Hent uleste notifikasjoner
  const { data: notifications } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user
  });

  // Marker som lest
  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
  };

  // Åpne skjema og scroll til det
  const handleOpenForm = () => {
    setShowCarForm(true);
    setShowOwnerProfile(false);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Åpne profil og scroll til det
  const handleOpenOwnerProfile = () => {
    setShowOwnerProfile(true);
    setShowCarForm(false);
    setTimeout(() => {
      profileRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Lukk profil
  const handleCloseOwnerProfile = () => {
    setShowOwnerProfile(false);
  };

  // Start mine biler-guide
  const handleStartMyCarsGuide = () => {
    startGuide('my-cars');
  };

  // Start profil-guide
  const handleStartOwnerProfileGuide = () => {
    startGuide('owner-profile');
  };

  // Håndter suksess
  const handleFormSuccess = () => {
    setShowCarForm(false);
    queryClient.invalidateQueries({ queryKey: ['my-cars-count', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['my-cars', user?.id] });
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <GarageLayout
      title="Min side"
      subtitle="Bilgarasje"
      description="Her finner du bilene dine. Trykk på en bil for å legge til bilder og historie."
    >
      {/* Notifikasjoner */}
      {notifications && notifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <EnamelCard className="overflow-hidden p-0">
            <div className="p-5 border-b border-border">
              <h3 className="font-display text-xl flex items-center gap-2">
                <Bell className="w-6 h-6 text-primary" />
                Varsler ({notifications.length})
              </h3>
            </div>
            <div className="divide-y divide-border">
              {notifications.map((notif: any) => (
                <div key={notif.id} className="p-5 flex items-start justify-between gap-4 bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="flex-1">
                    <p className="font-medium text-base">{notif.title}</p>
                    <p className="text-base text-muted-foreground mt-1">{notif.body}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {new Date(notif.created_at).toLocaleDateString('nb-NO', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {notif.link && (
                      <Link to={notif.link} onClick={() => markAsRead(notif.id)}>
                        <BigActionButton
                          variant="secondary"
                          size="lg"
                          icon={<ExternalLink className="w-4 h-4" />}
                        >
                          Gå til annonse
                        </BigActionButton>
                      </Link>
                    )}
                    <BigActionButton
                      variant="ghost"
                      size="lg"
                      onClick={() => markAsRead(notif.id)}
                      icon={<CheckCircle className="w-5 h-5" />}
                    >
                      Lest
                    </BigActionButton>
                  </div>
                </div>
              ))}
            </div>
          </EnamelCard>
        </motion.div>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        
        {/* Mine biler - kort */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Link to="/dashboard/mine-biler" className="block h-full touch-manipulation" data-guide="my-cars-card">
            <EnamelCard className="h-full min-h-[140px] sm:min-h-[160px] group">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="p-2.5 sm:p-3 bg-primary/10 rounded-xl flex-shrink-0">
                  <Car className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl sm:text-3xl text-primary">
                    {carsLoading ? '...' : carCount || 0}
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {carCount === 1 ? 'bil' : 'biler'}
                  </p>
                </div>
              </div>
              <h3 className="font-display text-lg sm:text-xl mb-1 sm:mb-2 group-hover:text-primary transition-colors">
                Mine biler
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground line-clamp-2">
                Se og rediger biler du eier
              </p>
            </EnamelCard>
          </Link>
        </motion.div>

        {/* Send inn ny bil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <EnamelCard 
            className="h-full min-h-[140px] sm:min-h-[160px] group cursor-pointer touch-manipulation" 
            onClick={handleOpenForm}
          >
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="p-2.5 sm:p-3 bg-primary/10 rounded-xl flex-shrink-0">
                <Send className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
            </div>
            <h3 className="font-display text-lg sm:text-xl mb-1 sm:mb-2 group-hover:text-primary transition-colors">
              Send inn ny bil
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground line-clamp-2">
              Legg til en ny bil i din garasje
            </p>
          </EnamelCard>
        </motion.div>

        {/* Min profil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          {(() => {
            const filledFields = ownerProfile ? [
              ownerProfile.bio,
              ownerProfile.location,
              ownerProfile.avatar_url,
              (ownerProfile.favorite_brands?.length ?? 0) > 0 ? true : null,
            ].filter(Boolean).length : 0;
            const needsAttention = !ownerProfile || filledFields < 2;
            return (
              <EnamelCard 
                className={`h-full min-h-[140px] sm:min-h-[160px] group cursor-pointer touch-manipulation relative overflow-hidden ${needsAttention ? 'ring-2 ring-primary shadow-lg shadow-primary/10' : ''}`}
                onClick={handleOpenOwnerProfile}
                data-guide="owner-profile-card"
              >
                {needsAttention && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
                )}
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className={`p-2.5 sm:p-3 rounded-xl flex-shrink-0 ${needsAttention ? 'bg-primary text-primary-foreground animate-pulse' : 'bg-primary/10'}`}>
                    <User className={`w-6 h-6 sm:w-8 sm:h-8 ${needsAttention ? '' : 'text-primary'}`} />
                  </div>
                  {ownerProfile?.visible_public && (
                    <span className="text-[10px] sm:text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                      Offentlig
                    </span>
                  )}
                </div>
                <h3 className="font-display text-lg sm:text-xl mb-1 sm:mb-2 group-hover:text-primary transition-colors">
                  {needsAttention ? 'Entusiastprofil' : 'Min profil'}
                </h3>
                <p className={`text-sm sm:text-base line-clamp-2 ${needsAttention ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {ownerProfile ? (needsAttention ? 'Fullfør entusiastprofilen din →' : 'Rediger entusiastprofil') : 'Opprett entusiastprofil →'}
                </p>
                {needsAttention && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {ownerProfile ? `${filledFields}/2 felt fylt ut` : 'Kom i gang her'}
                  </p>
                )}
              </EnamelCard>
            );
          })()}
        </motion.div>

        {/* Dine annonser */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          <Link to="/dashboard/mine-annonser" className="block h-full touch-manipulation">
            <EnamelCard className="h-full min-h-[140px] sm:min-h-[160px] group">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="p-2.5 sm:p-3 bg-primary/10 rounded-xl flex-shrink-0">
                  <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl sm:text-3xl text-primary">
                    {myListings?.length || 0}
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {(myListings?.length || 0) === 1 ? 'annonse' : 'annonser'}
                  </p>
                </div>
              </div>
              <h3 className="font-display text-lg sm:text-xl mb-1 sm:mb-2 group-hover:text-primary transition-colors">
                Dine annonser
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground line-clamp-2">
                {ownerProfile?.approved_at
                  ? (myListings?.length ?? 0) === 0
                    ? 'Du er klar til å selge. Opprett din første annonse.'
                    : 'Se og rediger annonser du har lagt ut'
                  : ownerProfile
                    ? 'Entusiastprofil venter på godkjenning'
                    : 'Opprett entusiastprofil for å legge ut annonser'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Alt som legges ut må godkjennes før publisering.
              </p>
              {ownerProfile && !ownerProfile.approved_at && (
                <Link
                  to="/dashboard?showOwnerProfile=true"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-2"
                >
                  <User className="h-3.5 w-3.5" />
                  Se profil og be om godkjenning
                </Link>
              )}
              {ownerProfile?.approved_at && (
                <Link
                  to="/dashboard/opprett-annonse"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-2"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {(myListings?.length ?? 0) === 0 ? 'Opprett første annonse' : 'Opprett annonse'}
                </Link>
              )}
            </EnamelCard>
          </Link>
        </motion.div>

        {/* Mine forespørsler */}
        {ownerProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.37 }}
          >
            <Link to="/dashboard/mine-foresporsler" className="block h-full touch-manipulation">
              <EnamelCard className="h-full min-h-[140px] sm:min-h-[160px] group">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="p-2.5 sm:p-3 bg-primary/10 rounded-xl flex-shrink-0 relative">
                    <Inbox className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                    {(myInquiries?.pending ?? 0) > 0 && (
                      <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {myInquiries!.pending}
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="font-display text-lg sm:text-xl mb-1 sm:mb-2 group-hover:text-primary transition-colors">
                  Mine forespørsler
                  {(myInquiries?.total ?? 0) > 0 && (
                    <span className="ml-2 text-muted-foreground text-sm font-normal">({myInquiries!.total})</span>
                  )}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground line-clamp-2">
                  {(myInquiries?.pending ?? 0) > 0
                    ? `${myInquiries!.pending} venter på svar`
                    : 'Se forespørsler fra kjøpere'}
                </p>
              </EnamelCard>
            </Link>
          </motion.div>
        )}

        {/* Konto */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Link to="/konto" className="block h-full touch-manipulation">
            <EnamelCard className="h-full min-h-[140px] sm:min-h-[160px] group">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="p-2.5 sm:p-3 bg-primary/10 rounded-xl flex-shrink-0">
                  <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>
              </div>
              <h3 className="font-display text-lg sm:text-xl mb-1 sm:mb-2 group-hover:text-primary transition-colors">
                Konto
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground line-clamp-2">
                Innlogging, personvern og innstillinger
              </p>
            </EnamelCard>
          </Link>
        </motion.div>

        {/* Hjelp og veiledning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="sm:col-span-2"
        >
          <EnamelCard>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="p-2.5 sm:p-3 bg-primary/10 rounded-xl flex-shrink-0">
                  <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-lg sm:text-xl mb-0.5">
                    Hjelp og veiledning
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Start en interaktiv guide
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <BigActionButton
                  onClick={() => startGuide('full')}
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  Full guide
                </BigActionButton>
                
                <BigActionButton
                  variant="secondary"
                  onClick={handleStartMyCarsGuide}
                  icon={<Car className="w-4 h-4" />}
                >
                  Mine biler
                </BigActionButton>
                
                <BigActionButton
                  variant="secondary"
                  onClick={handleStartOwnerProfileGuide}
                  icon={<User className="w-4 h-4" />}
                >
                   Min profil
                </BigActionButton>
              </div>
            </div>
          </EnamelCard>
        </motion.div>

      </div>

      {/* Send inn ny bil skjema */}
      <AnimatePresence>
        {showCarForm && (
          <motion.div
            ref={formRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mt-8"
          >
            <div className="flex items-center justify-between mb-4">
              <SectionHeader 
                title="Send inn ny bil" 
                icon={<Send className="w-6 h-6" />} 
              />
              <BigActionButton
                variant="ghost"
                size="lg"
                onClick={() => setShowCarForm(false)}
                icon={<X className="w-5 h-5" />}
              >
                Lukk
              </BigActionButton>
            </div>
            
            <SendInnBilForm
              onSuccess={handleFormSuccess}
              onCancel={() => setShowCarForm(false)}
              showCancelButton={false}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profil seksjon */}
      <AnimatePresence>
        {showOwnerProfile && user && (
          <motion.div
            ref={profileRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mt-8"
          >
            <div className="flex items-center justify-between mb-4">
              <SectionHeader 
                title="Min profil" 
                icon={<User className="w-6 h-6" />} 
              />
              <BigActionButton
                variant="ghost"
                size="lg"
                onClick={handleCloseOwnerProfile}
                icon={<X className="w-5 h-5" />}
              >
                Lukk
              </BigActionButton>
            </div>
            
            <OwnerProfileSection userId={user.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </GarageLayout>
  );
}
