import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMyPersonProfile } from '@/hooks/useMyPersonProfile';
import { Layout } from '@/components/layout/Layout';
import { Helmet } from 'react-helmet-async';
import { Loader2, Plus, Car, Eye, Pencil, Upload, BookOpen, User, ChevronRight, MapPin, CalendarPlus, Users, Settings, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import garageBackground from '@/assets/garage-background.jpg';
import { FEATURES } from '@/config/features';
import { useFeatures } from '@/hooks/useFeatures';
import { DriveControls } from '@/components/car/DriveControls';
import { SaveCarButton } from '@/components/car/SaveCarButton';
import { SpotCarDialog } from '@/components/car/SpotCarDialog';
import { StartSessionButton, ActiveSessionBanner } from '@/components/activity';
import { useActivitySession } from '@/hooks/useActivitySession';

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

interface CarImage {
  id: string;
  image_url: string;
  sort_order: number | null;
}

interface CarData {
  id: string;
  title: string;
  slug: string;
  status: string;
  year: number | null;
  brand: string | null;
  model: string;
  published_at: string | null;
  car_images: CarImage[];
}

interface MyCar {
  car_id: string;
  role: string;
  cars: CarData;
}

export default function Garasje() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: profile } = useMyPersonProfile();
  const features = useFeatures();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?returnUrl=/garasje');
    }
  }, [user, authLoading, navigate]);

  const { data: myCars, isLoading: carsLoading } = useQuery({
    queryKey: ['my-cars-garasje', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('car_owners')
        .select(`
          car_id,
          role,
          cars:car_id (
            id, title, slug, status, year, brand, model, published_at,
            car_images(id, image_url, sort_order)
          )
        `)
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as MyCar[]) || [];
    },
    enabled: !!user,
  });

  const { data: notifications } = useQuery({
    queryKey: ['garasje-notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, body, type, created_at, link, is_read')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  if (authLoading || carsLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center" style={{ background: '#070b10' }}>
          <Loader2 className="w-8 h-8 animate-spin text-[#2dd4a8]" />
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  const firstCar = myCars?.[0];
  const otherCars = myCars?.slice(1) || [];
  const carCount = myCars?.length || 0;

  return (
    <Layout>
      <Helmet>
        <title>Min garasje — Bilgarasje.no</title>
      </Helmet>

      <div className="min-h-[calc(100vh-4rem)] relative">
        {/* Garage background */}
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
          style={{ backgroundImage: `url(${garageBackground})` }}
        />
        <div className="fixed inset-0 -z-10" style={{ background: 'linear-gradient(180deg, rgba(7,11,16,0.80) 0%, rgba(7,11,16,0.88) 50%, rgba(7,11,16,0.94) 100%)' }} />

        <div className="max-w-[1000px] mx-auto px-4 sm:px-5 md:px-8">

          {/* ─── HERO CAR ─── */}
          {firstCar?.cars ? (
            <HeroCarSection car={firstCar.cars} profile={profile} />
          ) : (
            <EmptyGarageHero />
          )}

          {/* ─── ACTIVITY SESSION ─── */}
          {FEATURES.activitySessions && !FEATURES.simpleLaunchMode && (
            <ActivitySection />
          )}

          {/* ─── OTHER CARS ─── */}
          {otherCars.length > 0 && (
            <section className="mt-10">
              <h2 className="text-[12px] tracking-[0.2em] uppercase text-white/30 mb-4" style={oswald}>
                Flere biler i garasjen
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {otherCars.map((item, i) => {
                  const car = item.cars;
                  if (!car) return null;
                  const img = car.car_images?.sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99))[0];
                  const isPublished = !!car.published_at;
                  return (
                    <motion.div
                      key={car.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        to={isPublished ? `/biler/${car.slug}` : `/dashboard/bil/${car.id}`}
                        className="group block rounded-xl overflow-hidden border border-white/[0.06] hover:border-[#2dd4a8]/30 transition-all"
                        style={{ background: 'hsl(215 25% 10%)' }}
                      >
                        <div className="aspect-[16/10] relative overflow-hidden bg-black/30">
                          {img ? (
                            <img src={img.image_url} alt={car.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center"><Car className="w-7 h-7 text-white/10" /></div>
                          )}
                          {!isPublished && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold bg-amber-500/20 text-amber-300 backdrop-blur-sm" style={oswald}>Kladd</span>
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="text-[12px] text-white/70 font-semibold truncate" style={chakra}>{car.title}</p>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
                {/* Add car tile */}
                <Link
                  to="/legg-til-bil"
                  className="group flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.06] hover:border-[#2dd4a8]/30 transition-all aspect-[16/10]"
                >
                  <Plus className="w-5 h-5 text-white/15 group-hover:text-[#2dd4a8]/60 transition-colors mb-1" />
                  <span className="text-[10px] uppercase tracking-[0.12em] text-white/20 group-hover:text-white/40" style={oswald}>Legg til bil</span>
                </Link>
              </div>
            </section>
          )}

          {/* ─── SNARVEIER ─── */}
          <section className="mt-10">
            <h2 className="text-[12px] tracking-[0.2em] uppercase text-white/30 mb-4" style={oswald}>
              Snarveier
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {!FEATURES.simpleLaunchMode && (
                <>
                  <ShortcutTile to="/dashboard/events/opprett" icon={<CalendarPlus className="w-5 h-5" />} label="Opprett arrangement" />
                  <ShortcutTile to="/dashboard/sider" icon={<Users className="w-5 h-5" />} label="Klubber & sider" />
                </>
              )}
              <ShortcutTile to="/dashboard/min-profil" icon={<UserCircle className="w-5 h-5" />} label="Min profil" />
              <ShortcutTile to="/konto" icon={<Settings className="w-5 h-5" />} label="Konto" />
              {FEATURES.spotting && !FEATURES.simpleLaunchMode && (
                <div className="contents">
                  <SpotCarDialog
                    trigger={
                      <button
                        type="button"
                        className="group flex flex-col items-center gap-2 py-4 rounded-xl border border-white/[0.06] hover:border-[#2dd4a8]/30 transition-all text-center"
                        style={{ background: 'hsl(215 25% 10%)' }}
                      >
                        <Eye className="w-5 h-5 text-white/30 group-hover:text-[#2dd4a8]/70 transition-colors" />
                        <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.1em] text-white/40 group-hover:text-white/60 transition-colors" style={oswald}>Spot bil</span>
                      </button>
                    }
                  />
                </div>
              )}
              {FEATURES.simpleLaunchMode && (
                <>
                  <ComingSoonTile icon={<CalendarPlus className="w-5 h-5" />} label="Arrangementer" />
                  <ComingSoonTile icon={<Users className="w-5 h-5" />} label="Klubber & sider" />
                </>
              )}
            </div>
          </section>

          {/* ─── OPPDATERINGER ─── */}
          <section className="mt-10 pb-16">
            <h2 className="text-[12px] tracking-[0.2em] uppercase text-white/30 mb-4" style={oswald}>
              Oppdateringer
            </h2>
            {FEATURES.simpleLaunchMode ? (
              <div className="rounded-xl border border-white/[0.06] p-6 text-center" style={{ background: 'hsl(215 25% 10%)' }}>
                <p className="text-[12px] text-[#2dd4a8]/70 uppercase tracking-[0.2em] mb-1" style={oswald}>Kommer snart</p>
                <p className="text-[11px] text-white/30" style={oswald}>Varsler og innboks åpner ved full lansering.</p>
              </div>
            ) : (!notifications || notifications.length === 0) ? (
              <div className="rounded-xl border border-white/[0.06] p-6 text-center" style={{ background: 'hsl(215 25% 10%)' }}>
                <p className="text-[12px] text-white/25" style={oswald}>Ingen oppdateringer ennå. Aktivitet rundt bilene dine vises her.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    to={n.link || '/garasje'}
                    className="flex items-start gap-3 rounded-lg border border-white/[0.06] px-4 py-3 hover:border-white/[0.1] transition-colors"
                    style={{ background: n.is_read ? 'transparent' : 'hsl(215 25% 11%)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-white/50 font-medium truncate" style={oswald}>{n.title}</p>
                      <p className="text-[11px] text-white/25 truncate mt-0.5">{n.body}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-white/15 flex-shrink-0 mt-0.5" />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}

/* ─── Hero Car Section ─── */
function HeroCarSection({ car, profile }: { car: CarData; profile: any }) {
  const img = car.car_images?.sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99))[0];
  const isPublished = !!car.published_at;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-6 sm:pt-8"
    >
      {/* Profile hint */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] tracking-[0.3em] uppercase text-white/25" style={oswald}>
          {profile?.display_name || 'Min garasje'}
        </p>
        {!profile && (
          <Link to="/dashboard/min-profil" className="text-[10px] text-[#2dd4a8]/50 hover:text-[#2dd4a8] transition-colors" style={oswald}>
            Gjør garasjen personlig →
          </Link>
        )}
      </div>

      {/* Large horizontal car image */}
      <div className="rounded-2xl overflow-hidden border border-white/[0.06] relative" style={{ background: 'hsl(215 25% 8%)' }}>
        <div className="aspect-[2.5/1] sm:aspect-[3/1] relative overflow-hidden bg-black/40">
          {img ? (
            <img
              src={img.image_url}
              alt={car.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Car className="w-16 h-16 text-white/10" />
            </div>
          )}
          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: 'linear-gradient(to top, rgba(7,11,16,0.95) 0%, rgba(7,11,16,0.6) 50%, transparent 100%)' }} />

          {/* Title + status over image */}
          <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-1">
              {isPublished ? (
                <span className="px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold bg-[#2dd4a8]/20 text-[#2dd4a8] backdrop-blur-sm" style={oswald}>Publisert</span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold bg-amber-500/20 text-amber-300 backdrop-blur-sm" style={oswald}>Kladd</span>
              )}
            </div>
            <h1
              className="text-[1.4rem] sm:text-[1.8rem] md:text-[2.2rem] leading-[0.95] uppercase tracking-[0.01em] text-white font-bold"
              style={{ ...chakra, textShadow: '0 2px 16px rgba(0,0,0,0.6)' }}
            >
              {car.title}
            </h1>
            {car.year && (
              <p className="text-[12px] text-white/40 mt-1" style={oswald}>{car.year}</p>
            )}
          </div>
        </div>
      </div>

      {/* Status text */}
      <p className="text-[13px] text-white/40 mt-4 mb-5" style={oswald}>
        {isPublished
          ? 'Bilen din er synlig i garasjen.'
          : 'Bilen din er inne i garasjen — gjør den klar for visning.'}
      </p>

      {/* Action buttons */}
      <div className="grid sm:grid-cols-2 gap-2.5">
        {isPublished ? (
          <>
            <ActionButton to={`/biler/${car.slug}`} icon={<Eye className="w-4 h-4" />} label="Se bilen offentlig" primary />
            <ActionButton to={`/dashboard/bil/${car.id}`} icon={<Pencil className="w-4 h-4" />} label="Rediger bilen" />
          </>
        ) : (
          <>
            <ActionButton to={`/dashboard/bil/${car.id}`} icon={<Pencil className="w-4 h-4" />} label="Legg til flere detaljer om bilen" primary />
            <ActionButton to="/legg-til-bil" icon={<Plus className="w-4 h-4" />} label="Legg inn ny bil" />
          </>
        )}
      </div>

      {/* Activity MVP — hidden behind flags during simple launch */}
      {FEATURES.savedCars && !FEATURES.simpleLaunchMode && (
        <div className="mt-3">
          <SaveCarButton carId={car.id} variant="full" />
        </div>
      )}
      {FEATURES.driveMode && !FEATURES.simpleLaunchMode && (
        <div className="mt-3">
          <DriveControls carId={car.id} />
        </div>
      )}

      {/* Contextual nudge */}
      <p className="text-[11px] text-white/20 mt-4" style={oswald}>
        Dette er starten på garasjen din. Gjør bilen klar, del historien, eller legg til flere.
      </p>
    </motion.section>
  );
}

/* ─── Empty state ─── */
function EmptyGarageHero() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="pt-10 sm:pt-16 pb-8"
    >
      <div
        className="rounded-2xl border border-white/[0.08] p-8 sm:p-14 text-center"
        style={{ background: 'linear-gradient(180deg, hsl(215 25% 11%) 0%, hsl(215 25% 9%) 100%)' }}
      >
        <Car className="w-12 h-12 text-white/10 mx-auto mb-5" />
        <h1
          className="text-[1.6rem] sm:text-[2rem] uppercase tracking-[0.02em] text-white font-bold mb-2"
          style={chakra}
        >
          Min garasje
        </h1>
        <p className="text-[13px] text-white/40 mb-1" style={oswald}>Garasjen er tom — foreløpig.</p>
        <p className="text-[11px] text-white/20 mb-8" style={oswald}>Legg til din første bil og start historien.</p>
        <Link
          to="/legg-til-bil"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg text-[13px] tracking-[0.1em] uppercase font-bold text-[#070b10] transition-all hover:scale-[1.03]"
          style={{ ...chakra, background: 'linear-gradient(135deg, #34eab8 0%, #2ab89a 100%)', boxShadow: '0 0 24px rgba(45,212,168,0.3)' }}
        >
          <Plus className="w-4 h-4" />
          Legg inn bilen din
        </Link>
      </div>
    </motion.section>
  );
}

/* ─── Activity Section ─── */
function ActivitySection() {
  const { activeSession, isLoading } = useActivitySession();
  if (isLoading) return null;
  return (
    <section className="mt-8">
      <h2 className="text-[12px] tracking-[0.2em] uppercase text-white/30 mb-4" style={oswald}>
        Aktivitet
      </h2>
      {activeSession ? (
        <ActiveSessionBanner />
      ) : (
        <div
          className="rounded-2xl border border-white/[0.06] p-5 flex flex-col sm:flex-row sm:items-center gap-3"
          style={{ background: 'hsl(215 25% 10%)' }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-white/70 font-semibold" style={chakra}>Ute med bilen?</p>
            <p className="text-[11px] text-white/30 mt-0.5" style={oswald}>Start en tur og samle øyeblikk underveis.</p>
          </div>
          <StartSessionButton />
        </div>
      )}
    </section>
  );
}
function ActionButton({ to, icon, label, primary = false }: { to: string; icon: React.ReactNode; label: string; primary?: boolean }) {
  return (
    <Link
      to={to}
      className={`flex items-center justify-center gap-2.5 py-3.5 rounded-lg text-[12px] tracking-[0.08em] uppercase font-bold transition-all hover:scale-[1.02] ${
        primary ? 'text-[#070b10]' : 'text-white/70 border border-white/[0.1] hover:border-white/[0.2] hover:text-white'
      }`}
      style={primary
        ? { ...chakra, background: 'linear-gradient(135deg, #34eab8 0%, #2ab89a 100%)', boxShadow: '0 0 20px rgba(45,212,168,0.25)' }
        : { ...chakra, background: 'hsl(215 25% 11%)' }
      }
    >
      {icon}
      {label}
    </Link>
  );
}

/* ─── Shortcut Tile ─── */
function ShortcutTile({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-center gap-2 py-4 rounded-xl border border-white/[0.06] hover:border-[#2dd4a8]/30 transition-all text-center"
      style={{ background: 'hsl(215 25% 10%)' }}
    >
      <span className="text-white/30 group-hover:text-[#2dd4a8]/70 transition-colors">{icon}</span>
      <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.1em] text-white/40 group-hover:text-white/60 transition-colors" style={oswald}>{label}</span>
    </Link>
  );
}

/* ─── Coming Soon Tile (locked) ─── */
function ComingSoonTile({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div
      aria-disabled="true"
      title="Kommer snart"
      className="relative flex flex-col items-center gap-2 py-4 rounded-xl border border-dashed border-white/[0.08] text-center cursor-not-allowed select-none"
      style={{ background: 'hsl(215 25% 9%)' }}
    >
      <span className="text-white/15">{icon}</span>
      <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.1em] text-white/25" style={oswald}>{label}</span>
      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-[0.15em] font-bold text-[#2dd4a8]/80" style={{ ...oswald, background: 'rgba(45,212,168,0.1)' }}>Snart</span>
    </div>
  );
}
