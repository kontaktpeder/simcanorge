import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { GarageLayout } from '@/components/ui/garage/GarageLayout';
import { SectionHeader } from '@/components/ui/garage/SectionHeader';
import { Bell, CheckCircle, Send, X, ChevronRight } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SendInnBilForm } from '@/components/car/SendInnBilForm';

import { useOwnerProfile, useLegacyOwnerId } from '@/hooks/useOwnerProfile';
import { useGuide } from '@/hooks/useGuide';
import { useMyListings } from '@/hooks/useMarketplace';
import { useMyPersonProfile } from '@/hooks/useMyPersonProfile';
import { useMyPages } from '@/hooks/useMyPages';
import { useMyEvents } from '@/hooks/useMyEvents';
import { UserPlus } from 'lucide-react';

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;
const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { startGuide } = useGuide();
  const [showCarForm, setShowCarForm] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  
  const { data: ownerProfile } = useOwnerProfile(user?.id);
  const { data: legacyOwnerId } = useLegacyOwnerId(user?.id);
  const { data: myListings } = useMyListings(user?.id);
  const { data: personProfile } = useMyPersonProfile();
  const { data: myPages } = useMyPages();
  const { data: myEvents } = useMyEvents();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?returnUrl=/dashboard');
    }
  }, [user, authLoading, navigate]);

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
    queryKey: ['my-inquiries-summary', legacyOwnerId],
    queryFn: async () => {
      if (!legacyOwnerId) return { total: 0, pending: 0 };
      const { data, error } = await supabase
        .from('inquiries')
        .select('id, status')
        .eq('recipient_owner_id', legacyOwnerId);
      if (error) throw error;
      const total = data?.length || 0;
      const pending = data?.filter(i => i.status === 'pending').length || 0;
      return { total, pending };
    },
    enabled: !!legacyOwnerId,
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
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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

  const filledFields = ownerProfile ? [
    ownerProfile.bio,
    ownerProfile.location,
    ownerProfile.avatar_url,
    (ownerProfile.favorite_brands?.length ?? 0) > 0 ? true : null,
  ].filter(Boolean).length : 0;
  const profileNeedsAttention = !ownerProfile || filledFields < 2;

  const cardBase = "group block rounded-lg overflow-hidden border border-[#c4962c]/10 hover:border-[#c4962c]/25 transition-all duration-300 hover:shadow-[0_8px_30px_-10px_rgba(196,150,44,0.15)]";
  const cardBg = { background: 'linear-gradient(180deg, #f5efe6 0%, #f0e9df 100%)' };

  return (
    <GarageLayout
      title="Min side"
      subtitle="Bilgarasje"
      description="Bilene dine, profilen din og annonsene dine"
    >
      {/* Notifikasjoner */}
      {notifications && notifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="rounded-lg border border-[#c4962c]/20 overflow-hidden" style={{ background: 'linear-gradient(180deg, #f5efe6 0%, #f0e9df 100%)' }}>
            <div className="px-5 py-3 border-b border-[#c4962c]/10 flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-[#c4962c]" />
              <h3 className="text-[13px] uppercase tracking-[0.1em] font-bold text-[#3a2e24]" style={oswald}>
                Varsler ({notifications.length})
              </h3>
            </div>
            <div className="divide-y divide-[#c4962c]/5">
              {notifications.map((notif: any) => (
                <div key={notif.id} className="px-5 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-[14px] font-bold text-[#3a2e24]" style={chakra}>{notif.title}</p>
                    <p className="text-[13px] text-[#3a2e24]/55 mt-0.5">{notif.body}</p>
                    <p className="text-[11px] text-[#3a2e24]/35 mt-1.5">
                      {new Date(notif.created_at).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {notif.link && (
                      <Link to={notif.link} onClick={() => markAsRead(notif.id)}>
                        <button className="px-3 py-1.5 text-[11px] uppercase tracking-[0.1em] font-bold text-[#0f0d0b] hover:brightness-110 transition-all" style={{ background: 'linear-gradient(135deg, #d4a017, #e8c547, #c4962c)' }}>
                          Vis
                        </button>
                      </Link>
                    )}
                    <button onClick={() => markAsRead(notif.id)} className="p-2 text-[#3a2e24]/30 hover:text-[#3a2e24]/60 transition-colors">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* Kom i gang */}
        {!personProfile && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="sm:col-span-2 lg:col-span-3"
          >
            <Link to="/kom-i-gang" className="block touch-manipulation">
              <div className="rounded-lg border-2 border-[#c4962c]/30 p-5 sm:p-6 group hover:border-[#c4962c]/50 transition-all" style={{ background: 'linear-gradient(135deg, #f5efe6 0%, #ede5d8 100%)' }}>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #3a2e24, #4a3d30)' }}>
                    <UserPlus className="w-5 h-5 text-[#c4962c]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[15px] sm:text-[17px] font-bold uppercase tracking-[0.04em] text-[#3a2e24]" style={chakra}>
                      Kom i gang
                    </h3>
                    <p className="text-[13px] text-[#3a2e24]/50 mt-0.5">
                      Sett opp profilen din for å få tilgang til alle funksjoner
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#c4962c]/40 group-hover:text-[#c4962c] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Mine biler */}
        <DashboardCard delay={0.1} to="/dashboard/mine-biler" data-guide="my-cars-card">
          <CardLabel>Garasje</CardLabel>
          <CardTitle>Mine biler</CardTitle>
          <CardDesc>Se og rediger bilene dine</CardDesc>
          <CardCount>{carsLoading ? '—' : carCount || 0}</CardCount>
        </DashboardCard>

        {/* Mine annonser */}
        <DashboardCard delay={0.15} to="/dashboard/mine-annonser">
          <CardLabel>Markedsplass</CardLabel>
          <CardTitle>Mine annonser</CardTitle>
          <CardDesc>
            {ownerProfile?.approved_at
              ? (myListings?.length ?? 0) === 0
                ? 'Opprett din første annonse'
                : 'Se og rediger annonsene dine'
              : ownerProfile
                ? 'Venter på godkjenning'
                : 'Opprett entusiastprofil for å selge'}
          </CardDesc>
          <CardCount>{myListings?.length || 0}</CardCount>
        </DashboardCard>

        {/* Mine sider */}
        {personProfile && (
          <DashboardCard delay={0.2} to="/dashboard/sider">
            <CardLabel>Organisasjoner</CardLabel>
            <CardTitle>Mine sider</CardTitle>
            <CardDesc>
              {personProfile.can_create_pages
                ? (myPages?.length ?? 0) === 0 ? 'Opprett din første side' : 'Se og rediger sidene dine'
                : 'Be om tilgang eller se status'}
            </CardDesc>
            <CardCount>{myPages?.length || 0}</CardCount>
          </DashboardCard>
        )}

        {/* Mine arrangementer */}
        {personProfile && (
          <DashboardCard delay={0.25} to="/dashboard/events">
            <CardLabel>Events</CardLabel>
            <CardTitle>Mine arrangementer</CardTitle>
            <CardDesc>Opprett og administrer biltreff og events</CardDesc>
            <CardCount>{myEvents?.length || 0}</CardCount>
          </DashboardCard>
        )}

        {/* Entusiastprofil */}
        <DashboardCard delay={0.3} to="/dashboard/min-profil" highlight={profileNeedsAttention}>
          <CardLabel>Profil</CardLabel>
          <CardTitle highlight={profileNeedsAttention}>Entusiastprofil</CardTitle>
          <CardDesc>
            {ownerProfile
              ? (profileNeedsAttention ? 'Fullfør profilen din →' : 'Vises i eier- og selgerprofil')
              : 'Opprett entusiastprofil →'}
          </CardDesc>
          {profileNeedsAttention && (
            <p className="text-[11px] text-[#3a2e24]/35 mt-1">
              {ownerProfile ? `${filledFields} av 2 felt fylt ut` : 'Kom i gang her'}
            </p>
          )}
        </DashboardCard>

        {/* Forespørsler */}
        {ownerProfile && (
          <DashboardCard delay={0.35} to="/dashboard/mine-foresporsler">
            <CardLabel>Innboks</CardLabel>
            <CardTitle>Forespørsler</CardTitle>
            <CardDesc>
              {(myInquiries?.pending ?? 0) > 0
                ? `${myInquiries!.pending} venter på svar`
                : 'Se forespørsler fra kjøpere'}
            </CardDesc>
            <CardCount>{myInquiries?.total || 0}</CardCount>
          </DashboardCard>
        )}

        {/* Send inn ny bil */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <div
            onClick={handleOpenForm}
            className="h-full rounded-lg overflow-hidden border border-[#c4962c]/10 hover:border-[#c4962c]/25 transition-all duration-300 hover:shadow-[0_8px_30px_-10px_rgba(196,150,44,0.15)] cursor-pointer p-5 sm:p-6 min-h-[160px]"
            style={{ background: 'linear-gradient(180deg, #f5efe6 0%, #f0e9df 100%)' }}
          >
            <CardLabel>Innsending</CardLabel>
            <CardTitle>Send inn bil</CardTitle>
            <CardDesc>Legg til en ny bil i garasjen din</CardDesc>
          </div>
        </motion.div>

        {/* Konto */}
        <DashboardCard delay={0.45} to="/konto">
          <CardLabel>Innstillinger</CardLabel>
          <CardTitle>Konto</CardTitle>
          <CardDesc>Innlogging, personvern og innstillinger</CardDesc>
        </DashboardCard>
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
              <h3 className="text-[16px] font-bold uppercase tracking-[0.04em] text-[#3a2e24]" style={chakra}>
                Send inn ny bil
              </h3>
              <button
                onClick={() => setShowCarForm(false)}
                className="px-4 py-2 text-[11px] uppercase tracking-[0.1em] font-bold text-[#3a2e24]/60 hover:text-[#3a2e24] border border-[#c4962c]/15 hover:border-[#c4962c]/30 rounded transition-all flex items-center gap-2"
                style={oswald}
              >
                <X className="w-3.5 h-3.5" />
                Lukk
              </button>
            </div>

            <div className="rounded-lg border border-[#c4962c]/10 p-5 sm:p-6" style={{ background: 'linear-gradient(180deg, #f5efe6 0%, #f0e9df 100%)' }}>
              <SendInnBilForm
                onSuccess={handleFormSuccess}
                onCancel={() => setShowCarForm(false)}
                showCancelButton={false}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GarageLayout>
  );
}

/* ─── Sub-components ─── */

const chakraStyle = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;
const oswaldStyle = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

function DashboardCard({ children, delay, to, highlight, ...rest }: { children: React.ReactNode; delay: number; to: string; highlight?: boolean; [k: string]: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      {...rest}
    >
      <Link to={to} className="block h-full touch-manipulation">
        <div
          className={`h-full rounded-lg overflow-hidden border transition-all duration-300 hover:shadow-[0_8px_30px_-10px_rgba(196,150,44,0.15)] p-5 sm:p-6 min-h-[160px] ${
            highlight
              ? 'border-[#c4962c]/30 hover:border-[#c4962c]/50'
              : 'border-[#c4962c]/10 hover:border-[#c4962c]/25'
          }`}
          style={{ background: 'linear-gradient(180deg, #f5efe6 0%, #f0e9df 100%)' }}
        >
          {children}
        </div>
      </Link>
    </motion.div>
  );
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.2em] text-[#8b6914]/60 font-semibold mb-3" style={oswaldStyle}>
      {children}
    </p>
  );
}

function CardTitle({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <h3
      className={`text-[15px] sm:text-[17px] font-bold uppercase tracking-[0.04em] leading-tight mb-1 ${
        highlight ? 'text-[#8b6914]' : 'text-[#3a2e24] group-hover:text-[#8b6914]'
      } transition-colors`}
      style={chakraStyle}
    >
      {children}
    </h3>
  );
}

function CardDesc({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] sm:text-[13px] text-[#3a2e24]/50 leading-relaxed">{children}</p>;
}

function CardCount({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[2rem] sm:text-[2.5rem] font-bold text-[#3a2e24] leading-none mt-3" style={chakraStyle}>
      {children}
    </p>
  );
}
