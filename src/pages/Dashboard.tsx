import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { GarageLayout } from '@/components/ui/garage/GarageLayout';
import { Bell, CheckCircle, X, ChevronRight, Settings, Send, Car, ShoppingBag, FileText, Calendar, User, Inbox, UserPlus } from 'lucide-react';
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

  if (!user) return null;

  const filledFields = ownerProfile ? [
    ownerProfile.bio,
    ownerProfile.location,
    ownerProfile.avatar_url,
    (ownerProfile.favorite_brands?.length ?? 0) > 0 ? true : null,
  ].filter(Boolean).length : 0;
  const profileNeedsAttention = !ownerProfile || filledFields < 2;

  const kontoAction = (
    <Link
      to="/konto"
      className="inline-flex items-center gap-2 px-3 py-2 text-[11px] uppercase tracking-[0.12em] font-semibold text-white/50 hover:text-white/80 border border-white/[0.1] hover:border-white/[0.2] rounded transition-all"
      style={oswald}
    >
      <Settings className="w-3.5 h-3.5" />
      Konto
    </Link>
  );

  return (
    <GarageLayout
      title="Min side"
      subtitle="Bilgarasje"
      description="Bilene dine, profilen din og annonsene dine."
      headerAction={kontoAction}
    >
      {/* ─── KOM I GANG ─── */}
      {!personProfile && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-6">
          <Link to="/kom-i-gang" className="block touch-manipulation">
            <div className="p-5 sm:p-6 border border-[#c4962c]/30 bg-[#c4962c]/[0.06] group hover:bg-[#c4962c]/[0.1] transition-all rounded-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#c4962c]/15 flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-5 h-5 text-[#c4962c]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[14px] sm:text-[15px] font-bold uppercase tracking-[0.04em] text-white" style={chakra}>
                    Kom i gang
                  </h3>
                  <p className="text-[12px] text-white/40 mt-0.5">
                    Sett opp profilen din for å få tilgang til alle funksjoner
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#c4962c]/40 group-hover:text-[#c4962c] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* ─── VARSLER ─── */}
      {notifications && notifications.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-8">
          <div className="border border-[#c4962c]/15 rounded-sm overflow-hidden" style={{ background: 'linear-gradient(180deg, #f5efe6 0%, #f0e9df 100%)' }}>
            <div className="px-5 py-3 border-b border-[#c4962c]/10 flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-[#c4962c]" />
              <span className="text-[11px] uppercase tracking-[0.15em] font-semibold text-[#3a2e24]/60" style={oswald}>
                Varsler ({notifications.length})
              </span>
            </div>
            <div className="divide-y divide-[#c4962c]/5">
              {notifications.map((notif: any) => (
                <div key={notif.id} className="px-5 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-[#3a2e24]" style={chakra}>{notif.title}</p>
                    <p className="text-[12px] text-[#3a2e24]/50 mt-0.5">{notif.body}</p>
                    <p className="text-[10px] text-[#3a2e24]/30 mt-1">
                      {new Date(notif.created_at).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {notif.link && (
                      <Link to={notif.link} onClick={() => markAsRead(notif.id)}>
                        <button className="px-3 py-1.5 text-[10px] uppercase tracking-[0.1em] font-bold text-[#0f0d0b] hover:brightness-110 transition-all rounded-sm" style={{ background: 'linear-gradient(135deg, #d4a017, #e8c547, #c4962c)' }}>
                          Vis
                        </button>
                      </Link>
                    )}
                    <button onClick={() => markAsRead(notif.id)} className="p-1.5 text-[#3a2e24]/20 hover:text-[#3a2e24]/50 transition-colors">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════
          SEKSJON 1 — Garasje & Marked
          ═══════════════════════════════════════════════ */}
      <SectionLabel label="Garasje & Marked" delay={0.05} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <DashCard to="/dashboard/mine-biler" icon={Car} delay={0.1} data-guide="my-cars-card">
          <DashTitle>Mine biler</DashTitle>
          <DashDesc>Se og rediger bilene dine</DashDesc>
          <DashCount>{carsLoading ? '—' : carCount || 0}</DashCount>
        </DashCard>

        <DashCard to="/dashboard/mine-annonser" icon={ShoppingBag} delay={0.15}>
          <DashTitle>Mine annonser</DashTitle>
          <DashDesc>
            {ownerProfile?.approved_at
              ? (myListings?.length ?? 0) === 0 ? 'Opprett din første annonse' : 'Se og rediger annonsene dine'
              : ownerProfile ? 'Venter på godkjenning' : 'Opprett entusiastprofil for å selge'}
          </DashDesc>
          <DashCount>{myListings?.length || 0}</DashCount>
        </DashCard>
      </div>

      {/* ═══════════════════════════════════════════════
          SEKSJON 2 — Sider & Arrangementer
          ═══════════════════════════════════════════════ */}
      {personProfile && (
        <>
          <SectionLabel label="Sider & Arrangementer" delay={0.2} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <DashCard to="/dashboard/sider" icon={FileText} delay={0.25}>
              <DashTitle>Mine sider</DashTitle>
              <DashDesc>
                {personProfile.can_create_pages
                  ? (myPages?.length ?? 0) === 0 ? 'Opprett din første side' : 'Se og rediger sidene dine'
                  : 'Be om tilgang eller se status'}
              </DashDesc>
              <DashCount>{myPages?.length || 0}</DashCount>
            </DashCard>

            <DashCard to="/dashboard/events" icon={Calendar} delay={0.3}>
              <DashTitle>Mine arrangementer</DashTitle>
              <DashDesc>Opprett og administrer biltreff og events</DashDesc>
              <DashCount>{myEvents?.length || 0}</DashCount>
            </DashCard>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════
          SEKSJON 3 — Profil & Forespørsler
          ═══════════════════════════════════════════════ */}
      <SectionLabel label="Profil & Innboks" delay={0.3} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <DashCard to="/dashboard/min-profil" icon={User} delay={0.35} highlight={profileNeedsAttention}>
          <DashTitle>{profileNeedsAttention ? '⚡ Entusiastprofil' : 'Entusiastprofil'}</DashTitle>
          <DashDesc>
            {ownerProfile
              ? (profileNeedsAttention ? 'Fullfør profilen din →' : 'Vises i eier- og selgerprofil')
              : 'Opprett entusiastprofil →'}
          </DashDesc>
        </DashCard>

        <DashCard to="/dashboard/innboks" icon={Inbox} delay={0.4}>
          <DashTitle>Innboks</DashTitle>
          <DashDesc>
            {(myInquiries?.pending ?? 0) > 0
              ? `${myInquiries!.pending} venter på svar`
              : 'Forespørsler og klubbtilknytning'}
          </DashDesc>
          <DashCount>{myInquiries?.total || 0}</DashCount>
        </DashCard>
      </div>

      {/* ═══════════════════════════════════════════════
          STOR CTA — Send inn bil
          ═══════════════════════════════════════════════ */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.45 }}>
        <div
          onClick={handleOpenForm}
          className="cursor-pointer rounded-sm border border-[#c4962c]/20 hover:border-[#c4962c]/40 transition-all duration-300 overflow-hidden group hover:shadow-[0_8px_30px_-10px_rgba(196,150,44,0.15)]"
          style={{ background: 'linear-gradient(135deg, #f5efe6 0%, #ede5d8 100%)' }}
        >
          <div className="flex items-center justify-between px-6 sm:px-8 py-6 sm:py-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #d4a017, #c4962c)' }}>
                <Send className="w-5 h-5 text-[#0f0d0b]" />
              </div>
              <div>
                <h3 className="text-[17px] sm:text-[20px] font-bold uppercase tracking-[0.03em] text-[#3a2e24] group-hover:text-[#8b6914] transition-colors" style={chakra}>
                  Opprett bil
                </h3>
                <p className="text-[12px] sm:text-[13px] text-[#3a2e24]/45 mt-0.5">
                  Legg til en ny bil i garasjen din — del historien bak bilen
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#c4962c]/40 group-hover:text-[#c4962c] group-hover:translate-x-1 transition-all flex-shrink-0" />
          </div>
        </div>
      </motion.div>

      {/* Send inn bil skjema */}
      <AnimatePresence>
        {showCarForm && (
          <motion.div
            ref={formRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mt-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold uppercase tracking-[0.04em] text-white" style={chakra}>
                Send inn ny bil
              </h3>
              <button
                onClick={() => setShowCarForm(false)}
                className="px-3 py-1.5 text-[11px] uppercase tracking-[0.1em] font-bold text-white/40 hover:text-white/70 border border-white/[0.1] hover:border-white/[0.2] rounded-sm transition-all flex items-center gap-2"
                style={oswald}
              >
                <X className="w-3.5 h-3.5" />
                Lukk
              </button>
            </div>

            <div className="border border-[#c4962c]/10 rounded-sm p-5 sm:p-6" style={{ background: 'linear-gradient(180deg, #f5efe6 0%, #f0e9df 100%)' }}>
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

const chakraFont = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;
const oswaldFont = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

function SectionLabel({ label, delay }: { label: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay }} className="mb-3">
      <div className="flex items-center gap-3">
        <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-white/30 font-semibold" style={oswaldFont}>
          {label}
        </p>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>
    </motion.div>
  );
}

function DashCard({ children, to, icon: Icon, delay, highlight, ...rest }: {
  children: React.ReactNode; to: string; icon: any; delay: number; highlight?: boolean; [k: string]: any;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }} {...rest}>
      <Link to={to} className="block h-full touch-manipulation group">
        <div className={`h-full rounded-sm p-5 sm:p-6 transition-all duration-300 border ${
          highlight
            ? 'border-[#c4962c]/30 hover:border-[#c4962c]/50 hover:shadow-[0_8px_30px_-10px_rgba(196,150,44,0.15)]'
            : 'border-[#c4962c]/10 hover:border-[#c4962c]/25 hover:shadow-[0_8px_30px_-10px_rgba(196,150,44,0.1)]'
        }`} style={{ background: 'linear-gradient(180deg, #f5efe6 0%, #f0e9df 100%)' }}>
          <div className="flex items-start justify-between mb-3">
            <Icon className="w-5 h-5 text-[#3a2e24]/25 group-hover:text-[#c4962c]/60 transition-colors" strokeWidth={1.5} />
            <ChevronRight className="w-4 h-4 text-[#3a2e24]/15 group-hover:text-[#3a2e24]/40 group-hover:translate-x-0.5 transition-all" />
          </div>
          {children}
        </div>
      </Link>
    </motion.div>
  );
}

function DashTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[14px] sm:text-[15px] font-bold uppercase tracking-[0.04em] text-[#3a2e24] group-hover:text-[#8b6914] transition-colors leading-tight mb-1" style={chakraFont}>
      {children}
    </h3>
  );
}

function DashDesc({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] text-[#3a2e24]/50 leading-relaxed">{children}</p>;
}

function DashCount({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[1.8rem] sm:text-[2.2rem] font-bold text-[#3a2e24] leading-none mt-3" style={chakraFont}>
      {children}
    </p>
  );
}
