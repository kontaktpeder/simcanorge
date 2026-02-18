import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { GarageLayout } from '@/components/ui/garage/GarageLayout';
import { EnamelCard } from '@/components/ui/garage/EnamelCard';
import { BigActionButton } from '@/components/ui/garage/BigActionButton';
import { SectionHeader } from '@/components/ui/garage/SectionHeader';
import { Car, Clock, Settings, Bell, CheckCircle, Send, X, User, HelpCircle, Sparkles, ShoppingBag, Plus, ExternalLink, Inbox, ChevronRight } from 'lucide-react';
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
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const shouldShow = params.get('showOwnerProfile') === 'true';
      if (shouldShow) {
        window.history.replaceState({}, '', '/dashboard');
      }
      return shouldShow;
    }
    return false;
  });
  const formRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  
  const { data: ownerProfile } = useOwnerProfile(user?.id);
  const { data: myListings } = useMyListings(user?.id);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?returnUrl=/dashboard');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (showOwnerProfile && profileRef.current) {
      setTimeout(() => {
        profileRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    }
  }, []);

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

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
  };

  const handleOpenForm = () => {
    setShowCarForm(true);
    setShowOwnerProfile(false);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleOpenOwnerProfile = () => {
    setShowOwnerProfile(true);
    setShowCarForm(false);
    setTimeout(() => {
      profileRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleCloseOwnerProfile = () => {
    setShowOwnerProfile(false);
  };

  const handleStartMyCarsGuide = () => {
    startGuide('my-cars');
  };

  const handleStartOwnerProfileGuide = () => {
    startGuide('owner-profile');
  };

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

  // Entusiastprofil progress
  const filledFields = ownerProfile ? [
    ownerProfile.bio,
    ownerProfile.location,
    ownerProfile.avatar_url,
    (ownerProfile.favorite_brands?.length ?? 0) > 0 ? true : null,
  ].filter(Boolean).length : 0;
  const profileNeedsAttention = !ownerProfile || filledFields < 2;

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
          className="mb-8"
        >
          <div className="border-2 border-foreground/10 bg-card/80 backdrop-blur-sm">
            <div className="px-5 py-4 border-b-2 border-foreground/10 flex items-center gap-3">
              <Bell className="w-4 h-4 text-foreground" />
              <h3 className="font-display text-xs uppercase tracking-[0.3em] text-foreground">
                Varsler · {notifications.length}
              </h3>
            </div>
            <div className="divide-y divide-foreground/5">
              {notifications.map((notif: any) => (
                <div key={notif.id} className="px-5 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-display text-sm uppercase tracking-wide">{notif.title}</p>
                    <p className="font-serif italic text-sm text-muted-foreground mt-1">{notif.body}</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-2">
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
                        <button className="px-3 py-1.5 border border-foreground/20 font-display text-[10px] uppercase tracking-[0.15em] hover:bg-foreground/5 transition-colors">
                          Vis
                        </button>
                      </Link>
                    )}
                    <button
                      onClick={() => markAsRead(notif.id)}
                      className="px-3 py-1.5 font-display text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Dashboard Grid – editorial magazine layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-foreground/10 border-2 border-foreground/10">
        
        {/* Mine biler */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Link to="/dashboard/mine-biler" className="block h-full touch-manipulation" data-guide="my-cars-card">
            <div className="h-full p-6 sm:p-8 bg-card/80 backdrop-blur-sm group hover:bg-card transition-colors">
              <div className="flex items-start justify-between mb-6">
                <p className="font-display text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                  Garasje
                </p>
                <div className="text-right">
                  <p className="font-display text-3xl sm:text-4xl text-foreground leading-none">
                    {carsLoading ? '—' : carCount || 0}
                  </p>
                  <p className="font-serif italic text-xs text-muted-foreground mt-1">
                    {carCount === 1 ? 'bil' : 'biler'}
                  </p>
                </div>
              </div>
              <h3 className="font-display text-xl sm:text-2xl uppercase tracking-wider mb-2 group-hover:text-primary transition-colors">
                Mine biler
              </h3>
              <p className="font-serif italic text-sm text-muted-foreground">
                Se og rediger biler du eier
              </p>
              <ChevronRight className="w-4 h-4 text-muted-foreground mt-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </motion.div>

        {/* Send inn ny bil */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div 
            className="h-full p-6 sm:p-8 bg-card/80 backdrop-blur-sm group cursor-pointer hover:bg-card transition-colors touch-manipulation" 
            onClick={handleOpenForm}
          >
            <p className="font-display text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-6">
              Innsending
            </p>
            <h3 className="font-display text-xl sm:text-2xl uppercase tracking-wider mb-2 group-hover:text-primary transition-colors">
              Send inn bil
            </h3>
            <p className="font-serif italic text-sm text-muted-foreground">
              Legg til en ny bil i din garasje
            </p>
            <div className="mt-4 w-8 h-8 border-2 border-foreground/15 flex items-center justify-center group-hover:border-primary group-hover:text-primary transition-colors">
              <Plus className="w-4 h-4" />
            </div>
          </div>
        </motion.div>

        {/* Entusiastprofil */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div 
            className={`h-full p-6 sm:p-8 backdrop-blur-sm group cursor-pointer transition-colors touch-manipulation relative overflow-hidden ${
              profileNeedsAttention 
                ? 'bg-card' 
                : 'bg-card/80 hover:bg-card'
            }`}
            onClick={handleOpenOwnerProfile}
            data-guide="owner-profile-card"
          >
            {profileNeedsAttention && (
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'hsl(2, 85%, 40%)' }} />
            )}
            <div className="flex items-start justify-between mb-6">
              <p className="font-display text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                Profil
              </p>
              {ownerProfile?.visible_public && (
                <span className="font-display text-[10px] uppercase tracking-[0.2em] text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700 px-2 py-0.5">
                  Offentlig
                </span>
              )}
            </div>
            <h3 className={`font-display text-xl sm:text-2xl uppercase tracking-wider mb-2 transition-colors ${
              profileNeedsAttention ? 'text-primary' : 'group-hover:text-primary'
            }`}>
              {profileNeedsAttention ? 'Entusiastprofil' : 'Min profil'}
            </h3>
            <p className={`font-serif italic text-sm ${profileNeedsAttention ? 'text-foreground' : 'text-muted-foreground'}`}>
              {ownerProfile 
                ? (profileNeedsAttention ? 'Fullfør entusiastprofilen din →' : 'Rediger entusiastprofil') 
                : 'Opprett entusiastprofil →'}
            </p>
            {profileNeedsAttention && (
              <p className="font-display text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-3">
                {ownerProfile ? `${filledFields} av 2 felt fylt ut` : 'Kom i gang'}
              </p>
            )}
          </div>
        </motion.div>

        {/* Dine annonser */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <Link to="/dashboard/mine-annonser" className="block h-full touch-manipulation">
            <div className="h-full p-6 sm:p-8 bg-card/80 backdrop-blur-sm group hover:bg-card transition-colors">
              <div className="flex items-start justify-between mb-6">
                <p className="font-display text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                  Markedsplass
                </p>
                <div className="text-right">
                  <p className="font-display text-3xl sm:text-4xl text-foreground leading-none">
                    {myListings?.length || 0}
                  </p>
                  <p className="font-serif italic text-xs text-muted-foreground mt-1">
                    {(myListings?.length || 0) === 1 ? 'annonse' : 'annonser'}
                  </p>
                </div>
              </div>
              <h3 className="font-display text-xl sm:text-2xl uppercase tracking-wider mb-2 group-hover:text-primary transition-colors">
                Dine annonser
              </h3>
              <p className="font-serif italic text-sm text-muted-foreground">
                {ownerProfile?.approved_at
                  ? (myListings?.length ?? 0) === 0
                    ? 'Du er klar til å selge. Opprett din første annonse.'
                    : 'Se og rediger annonser du har lagt ut'
                  : ownerProfile
                    ? 'Entusiastprofil venter på godkjenning'
                    : 'Opprett entusiastprofil for å legge ut annonser'}
              </p>
              {ownerProfile && !ownerProfile.approved_at && (
                <Link
                  to="/dashboard?showOwnerProfile=true"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 font-display text-[10px] uppercase tracking-[0.15em] text-primary hover:underline mt-3"
                >
                  <User className="h-3 w-3" />
                  Se profil og be om godkjenning
                </Link>
              )}
              {ownerProfile?.approved_at && (
                <Link
                  to="/dashboard/opprett-annonse"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 font-display text-[10px] uppercase tracking-[0.15em] text-primary hover:underline mt-3"
                >
                  <Plus className="h-3 w-3" />
                  {(myListings?.length ?? 0) === 0 ? 'Opprett første annonse' : 'Opprett annonse'}
                </Link>
              )}
              <p className="font-serif italic text-[11px] text-muted-foreground/60 mt-2">
                Alt som legges ut må godkjennes før publisering.
              </p>
            </div>
          </Link>
        </motion.div>

        {/* Mine forespørsler */}
        {ownerProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Link to="/dashboard/mine-foresporsler" className="block h-full touch-manipulation">
              <div className="h-full p-6 sm:p-8 bg-card/80 backdrop-blur-sm group hover:bg-card transition-colors">
                <div className="flex items-start justify-between mb-6">
                  <p className="font-display text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                    Innboks
                  </p>
                  {(myInquiries?.pending ?? 0) > 0 && (
                    <span className="font-display text-[10px] uppercase tracking-[0.2em] text-destructive border border-destructive/30 px-2 py-0.5">
                      {myInquiries!.pending} nye
                    </span>
                  )}
                </div>
                <h3 className="font-display text-xl sm:text-2xl uppercase tracking-wider mb-2 group-hover:text-primary transition-colors">
                  Forespørsler
                  {(myInquiries?.total ?? 0) > 0 && (
                    <span className="ml-2 font-serif italic text-sm font-normal text-muted-foreground">({myInquiries!.total})</span>
                  )}
                </h3>
                <p className="font-serif italic text-sm text-muted-foreground">
                  {(myInquiries?.pending ?? 0) > 0
                    ? `${myInquiries!.pending} venter på svar`
                    : 'Se forespørsler fra kjøpere'}
                </p>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Konto */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <Link to="/konto" className="block h-full touch-manipulation">
            <div className="h-full p-6 sm:p-8 bg-card/80 backdrop-blur-sm group hover:bg-card transition-colors">
              <p className="font-display text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-6">
                Innstillinger
              </p>
              <h3 className="font-display text-xl sm:text-2xl uppercase tracking-wider mb-2 group-hover:text-primary transition-colors">
                Konto
              </h3>
              <p className="font-serif italic text-sm text-muted-foreground">
                Innlogging, personvern og innstillinger
              </p>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Hjelp og veiledning – editorial strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="mt-px"
      >
        <div className="border-2 border-foreground/10 border-t-0 bg-card/80 backdrop-blur-sm p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-display text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-1">
                Veiledning
              </p>
              <p className="font-serif italic text-sm text-muted-foreground">
                Start en interaktiv guide for å bli kjent med garasjen
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => startGuide('full')}
                className="px-4 py-2 font-display text-[10px] uppercase tracking-[0.2em] text-primary-foreground transition-colors flex items-center gap-2"
                style={{ background: 'hsl(2, 85%, 40%)' }}
              >
                <Sparkles className="w-3 h-3" />
                Full guide
              </button>
              
              <button
                onClick={handleStartMyCarsGuide}
                className="px-4 py-2 border border-foreground/20 font-display text-[10px] uppercase tracking-[0.2em] text-foreground hover:bg-foreground/5 transition-colors flex items-center gap-2"
              >
                <Car className="w-3 h-3" />
                Mine biler
              </button>
              
              <button
                onClick={handleStartOwnerProfileGuide}
                className="px-4 py-2 border border-foreground/20 font-display text-[10px] uppercase tracking-[0.2em] text-foreground hover:bg-foreground/5 transition-colors flex items-center gap-2"
              >
                <User className="w-3 h-3" />
                Entusiastprofil
              </button>
            </div>
          </div>
        </div>
      </motion.div>

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
              <button
                onClick={() => setShowCarForm(false)}
                className="px-4 py-2 border border-foreground/20 font-display text-[10px] uppercase tracking-[0.2em] text-foreground hover:bg-foreground/5 transition-colors flex items-center gap-2"
              >
                <X className="w-3.5 h-3.5" />
                Lukk
              </button>
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
                title="Entusiastprofil" 
                icon={<User className="w-6 h-6" />} 
              />
              <button
                onClick={handleCloseOwnerProfile}
                className="px-4 py-2 border border-foreground/20 font-display text-[10px] uppercase tracking-[0.2em] text-foreground hover:bg-foreground/5 transition-colors flex items-center gap-2"
              >
                <X className="w-3.5 h-3.5" />
                Lukk
              </button>
            </div>
            
            <OwnerProfileSection userId={user.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </GarageLayout>
  );
}
