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
import { GarageIcon } from '@/components/ui/GarageIcon';
import { useMyPersonProfile } from '@/hooks/useMyPersonProfile';
import { UserPlus } from 'lucide-react';

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
  const { data: personProfile } = useMyPersonProfile();

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
      description="Her finner du bilene dine, profilen din og annonsene dine."
    >
      {/* Notifikasjoner */}
      {notifications && notifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="border-2 border-foreground/15 bg-card/90 backdrop-blur-sm">
            <div className="px-6 py-4 border-b-2 border-foreground/15 flex items-center gap-3">
              <Bell className="w-5 h-5 text-foreground" />
              <h3 className="font-display text-lg uppercase tracking-wider text-foreground">
                Varsler ({notifications.length})
              </h3>
            </div>
            <div className="divide-y divide-foreground/10">
              {notifications.map((notif: any) => (
                <div key={notif.id} className="px-6 py-5 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-display text-base uppercase tracking-wide">{notif.title}</p>
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
                        <button className="px-4 py-2 border-2 border-foreground/20 font-display text-sm uppercase tracking-wider hover:bg-foreground/5 transition-colors min-h-[44px]">
                          Vis
                        </button>
                      </Link>
                    )}
                    <button
                      onClick={() => markAsRead(notif.id)}
                      className="p-2 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Kom i gang – vis kun hvis person_profile mangler */}
        {!personProfile && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="sm:col-span-2"
          >
            <Link to="/kom-i-gang" className="block touch-manipulation">
              <div className="p-6 sm:p-8 border-2 border-primary bg-card shadow-lg shadow-primary/10 group hover:border-primary/80 transition-all relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <UserPlus className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl uppercase tracking-wider text-primary mb-1">
                      Kom i gang
                    </h3>
                    <p className="text-base text-muted-foreground">
                      Sett opp profilen din for å få tilgang til alle funksjoner – det tar under ett minutt.
                    </p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-primary/50 ml-auto flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Mine biler */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Link to="/dashboard/mine-biler" className="block h-full touch-manipulation" data-guide="my-cars-card">
            <div className="h-full p-6 sm:p-8 border-2 border-foreground/15 bg-card/90 backdrop-blur-sm group hover:bg-card hover:border-foreground/25 transition-all min-h-[180px]">
              <p className="font-display text-sm uppercase tracking-wider text-muted-foreground mb-5">
                Garasje
              </p>
              <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-wider mb-2 group-hover:text-primary transition-colors">
                Mine biler
              </h3>
              <p className="text-base text-muted-foreground">
                Se og rediger bilene dine
              </p>
              <p className="text-base text-muted-foreground/70 mt-1 leading-snug">
                Biler med flere bilder, tekst og historiske hendelser får større oppslag på Biler-siden
              </p>
              <p className="font-display text-4xl sm:text-5xl text-foreground leading-none mt-4">
                {carsLoading ? '—' : carCount || 0}
              </p>
            </div>
          </Link>
        </motion.div>

        {/* Mine annonser */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Link to="/dashboard/mine-annonser" className="block h-full touch-manipulation">
            <div className="h-full p-6 sm:p-8 border-2 border-foreground/15 bg-card/90 backdrop-blur-sm group hover:bg-card hover:border-foreground/25 transition-all min-h-[180px]">
              <p className="font-display text-sm uppercase tracking-wider text-muted-foreground mb-5">
                Markedsplass
              </p>
              <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-wider mb-2 group-hover:text-primary transition-colors">
                Mine annonser
              </h3>
              <p className="text-base text-muted-foreground">
                {ownerProfile?.approved_at
                  ? (myListings?.length ?? 0) === 0
                    ? 'Opprett din første annonse'
                    : 'Se og rediger annonsene dine'
                  : ownerProfile
                    ? 'Venter på godkjenning'
                    : 'Opprett entusiastprofil for å selge'}
              </p>
              <p className="font-display text-4xl sm:text-5xl text-foreground leading-none mt-4">
                {myListings?.length || 0}
              </p>
            </div>
          </Link>
        </motion.div>

        {/* Entusiastprofil */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div 
            className={`h-full p-6 sm:p-8 border-2 backdrop-blur-sm group cursor-pointer transition-all touch-manipulation relative overflow-hidden min-h-[180px] ${
              profileNeedsAttention 
                ? 'border-primary bg-card shadow-lg shadow-primary/10' 
                : 'border-foreground/15 bg-card/90 hover:bg-card hover:border-foreground/25'
            }`}
            onClick={handleOpenOwnerProfile}
            data-guide="owner-profile-card"
          >
            {profileNeedsAttention && (
              <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: 'hsl(2, 85%, 40%)' }} />
            )}
            
            <p className="font-display text-sm uppercase tracking-wider text-muted-foreground mb-5">
              Profil
            </p>
            <h3 className={`font-display text-2xl sm:text-3xl uppercase tracking-wider mb-2 transition-colors ${
              profileNeedsAttention ? 'text-primary' : 'group-hover:text-primary'
            }`}>
              Entusiastprofil
            </h3>
            <p className={`text-base ${profileNeedsAttention ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              {ownerProfile 
                ? (profileNeedsAttention ? 'Fullfør profilen din →' : 'Vises i eier- og selgerprofil') 
                : 'Opprett entusiastprofil →'}
            </p>
            {profileNeedsAttention && (
              <p className="text-sm text-muted-foreground mt-2">
                {ownerProfile ? `${filledFields} av 2 felt fylt ut` : 'Kom i gang her'}
              </p>
            )}
          </div>
        </motion.div>

        {/* Forespørsler */}
        {ownerProfile && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <Link to="/dashboard/mine-foresporsler" className="block h-full touch-manipulation">
              <div className="h-full p-6 sm:p-8 border-2 border-foreground/15 bg-card/90 backdrop-blur-sm group hover:bg-card hover:border-foreground/25 transition-all min-h-[180px]">
                <p className="font-display text-sm uppercase tracking-wider text-muted-foreground mb-5">
                  Innboks
                </p>
                <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-wider mb-2 group-hover:text-primary transition-colors">
                  Forespørsler
                </h3>
                <p className="text-base text-muted-foreground">
                  {(myInquiries?.pending ?? 0) > 0
                    ? `${myInquiries!.pending} venter på svar`
                    : 'Se forespørsler fra kjøpere'}
                </p>
                <p className="font-display text-4xl sm:text-5xl text-foreground leading-none mt-4">
                  {myInquiries?.total || 0}
                </p>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Send inn ny bil */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div 
            className="h-full p-6 sm:p-8 border-2 border-foreground/15 bg-card/90 backdrop-blur-sm group cursor-pointer hover:bg-card hover:border-foreground/25 transition-all touch-manipulation min-h-[180px]" 
            onClick={handleOpenForm}
          >
            <p className="font-display text-sm uppercase tracking-wider text-muted-foreground mb-5">
              Innsending
            </p>
            <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-wider mb-2 group-hover:text-primary transition-colors">
              Send inn bil
            </h3>
            <p className="text-base text-muted-foreground">
              Legg til en ny bil i garasjen din
            </p>
          </div>
        </motion.div>

        {/* Konto */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <Link to="/konto" className="block h-full touch-manipulation">
            <div className="h-full p-6 sm:p-8 border-2 border-foreground/15 bg-card/90 backdrop-blur-sm group hover:bg-card hover:border-foreground/25 transition-all min-h-[180px]">
              <p className="font-display text-sm uppercase tracking-wider text-muted-foreground mb-5">
                Innstillinger
              </p>
              <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-wider mb-2 group-hover:text-primary transition-colors">
                Konto
              </h3>
              <p className="text-base text-muted-foreground">
                Innlogging, personvern og innstillinger
              </p>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Hjelp og veiledning – midlertidig skjult */}

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
                className="px-5 py-3 border-2 border-foreground/20 font-display text-sm uppercase tracking-wider text-foreground hover:bg-foreground/5 transition-colors flex items-center gap-2 min-h-[48px]"
              >
                <X className="w-4 h-4" />
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
                className="px-5 py-3 border-2 border-foreground/20 font-display text-sm uppercase tracking-wider text-foreground hover:bg-foreground/5 transition-colors flex items-center gap-2 min-h-[48px]"
              >
                <X className="w-4 h-4" />
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
