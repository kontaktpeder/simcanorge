import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { GarageLayout } from '@/components/ui/garage/GarageLayout';
import { EnamelCard } from '@/components/ui/garage/EnamelCard';
import { BigActionButton } from '@/components/ui/garage/BigActionButton';
import { SectionHeader } from '@/components/ui/garage/SectionHeader';
import { Car, Clock, Settings, Bell, CheckCircle, Send, X, User } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SendInnBilForm } from '@/components/car/SendInnBilForm';
import { OwnerProfileSection } from '@/components/car/OwnerProfileSection';
import { useOwnerProfile } from '@/hooks/useOwnerProfile';

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
  
  // Hent eierprofil for å vise status
  const { data: ownerProfile } = useOwnerProfile(user?.id);

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

  // Åpne eierprofil og scroll til det
  const handleOpenOwnerProfile = () => {
    setShowOwnerProfile(true);
    setShowCarForm(false);
    setTimeout(() => {
      profileRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Lukk eierprofil
  const handleCloseOwnerProfile = () => {
    setShowOwnerProfile(false);
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
                  <BigActionButton
                    variant="ghost"
                    size="lg"
                    onClick={() => markAsRead(notif.id)}
                    icon={<CheckCircle className="w-5 h-5" />}
                  >
                    Lest
                  </BigActionButton>
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

        {/* Eierprofil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <EnamelCard 
            className="h-full min-h-[140px] sm:min-h-[160px] group cursor-pointer touch-manipulation" 
            onClick={handleOpenOwnerProfile}
            data-guide="owner-profile-card"
          >
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="p-2.5 sm:p-3 bg-primary/10 rounded-xl flex-shrink-0">
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              {ownerProfile?.visible_public && (
                <span className="text-[10px] sm:text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                  Offentlig
                </span>
              )}
            </div>
            <h3 className="font-display text-lg sm:text-xl mb-1 sm:mb-2 group-hover:text-primary transition-colors">
              Min eierprofil
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground line-clamp-2">
              {ownerProfile ? 'Rediger din eierprofil' : 'Opprett din eierprofil'}
            </p>
          </EnamelCard>
        </motion.div>

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

      {/* Eierprofil seksjon */}
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
                title="Min eierprofil" 
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
