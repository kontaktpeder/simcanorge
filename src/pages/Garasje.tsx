import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMyPersonProfile } from '@/hooks/useMyPersonProfile';
import { Layout } from '@/components/layout/Layout';
import { Helmet } from 'react-helmet-async';
import { Loader2, Plus, Car, User, Send, ChevronRight, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

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

  const carCount = myCars?.length || 0;
  const publishedCars = myCars?.filter(c => c.cars?.published_at) || [];
  const firstCar = myCars?.[0];

  return (
    <Layout>
      <Helmet>
        <title>Min garasje — Bilgarasje.no</title>
      </Helmet>

      <div className="min-h-[calc(100vh-4rem)]" style={{ background: 'linear-gradient(135deg, #070b10 0%, #0c1219 40%, #060a0f 100%)' }}>

        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden border-b border-white/[0.06]">
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 30% 60%, rgba(45,212,168,0.06) 0%, transparent 60%)' }} />

          {/* Accent line */}
          <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, transparent 0%, #2dd4a8 30%, #34eab8 50%, #2dd4a8 70%, transparent 100%)' }} />

          <div className="relative z-10 max-w-[1100px] mx-auto px-4 sm:px-5 md:px-8 py-10 sm:py-14 md:py-16">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p
                  className="text-[10px] sm:text-[11px] tracking-[0.3em] uppercase mb-2"
                  style={{ ...oswald, fontWeight: 500, background: 'linear-gradient(135deg, #2dd4a8, #34eab8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  bilgarasje.no
                </p>
                <h1
                  className="text-[1.6rem] sm:text-[2rem] md:text-[2.6rem] leading-[0.93] uppercase tracking-[0.02em] text-white font-bold italic"
                  style={{ ...chakra, textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}
                >
                  Min garasje
                </h1>
                {profile ? (
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-[13px] text-white/50" style={oswald}>{profile.display_name}</span>
                    {profile.location && (
                      <span className="flex items-center gap-1 text-[11px] text-white/30">
                        <MapPin className="w-3 h-3" />
                        {profile.location}
                      </span>
                    )}
                  </div>
                ) : (
                  <Link
                    to="/dashboard/min-profil"
                    className="inline-flex items-center gap-1.5 mt-3 text-[12px] text-[#2dd4a8]/70 hover:text-[#2dd4a8] transition-colors"
                    style={oswald}
                  >
                    <User className="w-3.5 h-3.5" />
                    Gjør garasjen personlig
                  </Link>
                )}
                <p className="text-[12px] text-white/25 mt-2" style={oswald}>
                  {carCount} {carCount === 1 ? 'bil' : 'biler'} i garasjen
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CAR GRID ─── */}
        <section className="max-w-[1100px] mx-auto px-4 sm:px-5 md:px-8 py-8 sm:py-12">
          <h2
            className="text-[13px] tracking-[0.15em] uppercase text-white/40 mb-5"
            style={oswald}
          >
            Dine biler
          </h2>

          {carCount === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/[0.08] p-8 sm:p-12 text-center"
              style={{ background: 'linear-gradient(180deg, hsl(215 25% 11%) 0%, hsl(215 25% 9%) 100%)' }}
            >
              <Car className="w-10 h-10 text-white/15 mx-auto mb-4" />
              <p className="text-[15px] text-white/50 mb-1" style={chakra}>Garasjen er tom — foreløpig</p>
              <p className="text-[12px] text-white/25 mb-6">Legg til din første bil og start historien.</p>
              <Link
                to="/send-inn"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-[13px] tracking-[0.1em] uppercase font-bold text-[#070b10] transition-all hover:scale-[1.03]"
                style={{ ...chakra, background: 'linear-gradient(135deg, #34eab8 0%, #2ab89a 100%)', boxShadow: '0 0 24px rgba(45,212,168,0.3)' }}
              >
                <Plus className="w-4 h-4" />
                Legg til bil
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {myCars?.map((item, i) => {
                const car = item.cars;
                if (!car) return null;
                const img = car.car_images?.sort((a: CarImage, b: CarImage) => (a.sort_order ?? 99) - (b.sort_order ?? 99))[0];
                const isPublished = !!car.published_at;
                return (
                  <motion.div
                    key={car.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={isPublished ? `/biler/${car.slug}` : `/dashboard/bil/${car.id}`}
                      className="group block rounded-xl overflow-hidden border border-white/[0.08] hover:border-[#2dd4a8]/30 transition-all duration-300"
                      style={{ background: 'linear-gradient(180deg, hsl(215 25% 12%) 0%, hsl(215 25% 9%) 100%)' }}
                    >
                      <div className="aspect-[4/5] relative overflow-hidden bg-black/30">
                        {img ? (
                          <img
                            src={img.image_url}
                            alt={car.title}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Car className="w-8 h-8 text-white/10" />
                          </div>
                        )}
                        {!isPublished && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold bg-amber-500/20 text-amber-300 backdrop-blur-sm" style={oswald}>
                            Kladd
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-[12px] sm:text-[13px] text-white/80 font-semibold truncate" style={chakra}>{car.title}</p>
                        {car.year && (
                          <p className="text-[10px] text-white/25 mt-0.5" style={oswald}>{car.year}</p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}

              {/* Add car tile */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: carCount * 0.05 }}
              >
                <Link
                  to="/send-inn"
                  className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/[0.08] hover:border-[#2dd4a8]/30 transition-all duration-300 aspect-[4/5]"
                >
                  <Plus className="w-6 h-6 text-white/15 group-hover:text-[#2dd4a8]/60 transition-colors mb-2" />
                  <span className="text-[11px] uppercase tracking-[0.12em] text-white/20 group-hover:text-white/40 transition-colors" style={oswald}>
                    Legg til bil
                  </span>
                </Link>
              </motion.div>
            </div>
          )}
        </section>

        {/* ─── OPPDATERINGER ─── */}
        <section className="max-w-[1100px] mx-auto px-4 sm:px-5 md:px-8 pb-8">
          <h2
            className="text-[13px] tracking-[0.15em] uppercase text-white/40 mb-4"
            style={oswald}
          >
            Oppdateringer
          </h2>

          {(!notifications || notifications.length === 0) ? (
            <div
              className="rounded-xl border border-white/[0.06] p-6 text-center"
              style={{ background: 'hsl(215 25% 10%)' }}
            >
              <p className="text-[12px] text-white/25" style={oswald}>Ingen oppdateringer ennå. Aktivitet rundt bilene dine vises her.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  to={n.link || '/garasje'}
                  className="flex items-start gap-3 rounded-lg border border-white/[0.06] px-4 py-3 hover:border-white/[0.12] transition-colors"
                  style={{ background: n.is_read ? 'transparent' : 'hsl(215 25% 11%)' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-white/60 font-medium truncate" style={oswald}>{n.title}</p>
                    <p className="text-[11px] text-white/30 truncate mt-0.5">{n.body}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-white/15 flex-shrink-0 mt-0.5" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ─── CTA BUTTONS ─── */}
        <section className="max-w-[1100px] mx-auto px-4 sm:px-5 md:px-8 pb-16">
          <div className="h-px bg-white/[0.06] mb-8" />
          <h2
            className="text-[13px] tracking-[0.15em] uppercase text-white/40 mb-5"
            style={oswald}
          >
            Dette er bare starten
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { label: 'Legg til ny bil', to: '/send-inn', icon: Plus },
              { label: 'Fortell historien', to: firstCar ? `/biler/${firstCar.cars?.slug}` : '/send-inn', icon: Send },
              { label: 'Gjør garasjen personlig', to: '/dashboard/min-profil', icon: User },
            ].map((cta) => (
              <Link
                key={cta.label}
                to={cta.to}
                className="flex items-center justify-center gap-2.5 py-4 rounded-lg text-[13px] tracking-[0.1em] uppercase font-bold text-[#070b10] transition-all hover:scale-[1.02] hover:brightness-110"
                style={{ ...chakra, background: 'linear-gradient(135deg, #34eab8 0%, #2ab89a 100%)', boxShadow: '0 0 20px rgba(45,212,168,0.25)' }}
              >
                <cta.icon className="w-4 h-4" />
                {cta.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
