import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Car, Loader2, Plus, ChevronRight, ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import carSilhouette from '@/assets/car-silhouette.png';

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
  status: 'submitted' | 'draft' | 'published' | 'archived';
  source: string;
  year: number | null;
  category: string;
  created_at: string;
  updated_at: string;
  car_images: CarImage[];
}

interface MyCar {
  car_id: string;
  role: string;
  cars: CarData;
}

export default function DashboardMineBiler() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?returnUrl=/dashboard/mine-biler');
    }
  }, [user, authLoading, navigate]);

  const { data: myCars, isLoading } = useQuery({
    queryKey: ['my-cars', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('car_owners')
        .select(`
          car_id,
          role,
          cars:car_id (
            id, title, slug, status, source, year, category,
            created_at, updated_at,
            car_images(id, image_url, sort_order)
          )
        `)
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as MyCar[]) || [];
    },
    enabled: !!user
  });

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center" style={{ background: '#eee7dd' }}>
          <Loader2 className="w-8 h-8 animate-spin text-[#c4962c]" />
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  const statusLabel = (s: string) => {
    switch (s) {
      case 'published': return { text: 'Publisert', color: 'bg-green-600/15 text-green-800' };
      case 'draft': return { text: 'Kladd', color: 'bg-amber-500/15 text-amber-800' };
      case 'submitted': return { text: 'Innsendt', color: 'bg-blue-500/15 text-blue-800' };
      case 'archived': return { text: 'Arkivert', color: 'bg-gray-400/15 text-gray-600' };
      default: return { text: s, color: 'bg-gray-400/15 text-gray-600' };
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)]">

        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #4a3d30 0%, #3a2e24 40%, #2a2118 100%)' }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(196,150,44,0.10) 0%, transparent 60%)' }} />

          <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-5 md:px-8">
            <div className="flex flex-col justify-center min-h-[140px] sm:min-h-[170px] md:min-h-[200px] py-6 md:py-8">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 text-white/35 hover:text-white/60 mb-3 transition-colors text-[11px] uppercase tracking-[0.15em] font-semibold"
                style={oswald}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Til Min side
              </Link>

              <p className="text-[10px] sm:text-[11px] tracking-[0.3em] uppercase mb-1"
                style={{ ...oswald, fontWeight: 500, background: 'linear-gradient(135deg, #F5A623, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                bilgarasje.no
              </p>
              <h1
                className="text-[1.4rem] sm:text-[1.8rem] md:text-[2.2rem] leading-[0.93] uppercase tracking-[0.02em] text-white font-bold italic"
                style={{ ...chakra, textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}
              >
                Mine biler
              </h1>
              <p className="text-[12px] sm:text-[13px] text-white/35 mt-1.5 max-w-md">
                Trykk på en bil for å legge til bilder og historie.
              </p>
            </div>
          </div>
        </section>

        {/* ─── CONTENT ─── */}
        <section
          className="relative pt-6 sm:pt-8 md:pt-10 pb-12 sm:pb-20 overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #eee7dd 0%, #ebe4da 40%, #e8e1d6 100%)' }}
        >
          {/* Silhouette watermark */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none flex justify-center overflow-hidden" style={{ opacity: 0.02 }}>
            <img src={carSilhouette} alt="" className="w-[80%] max-w-[1000px] translate-y-[30%]" style={{ transform: 'scaleX(-1)', filter: 'brightness(0)' }} />
          </div>

          <div className="relative z-10 max-w-[800px] mx-auto px-4 sm:px-5 md:px-8">

            {/* Create button */}
            <Link to="/dashboard/opprett-bil">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center gap-2.5 py-3.5 sm:py-4 rounded-lg border-2 border-dashed border-[#c4962c]/25 hover:border-[#c4962c]/50 bg-white/40 hover:bg-white/60 transition-all duration-200 group mb-6 sm:mb-8 cursor-pointer"
              >
                <Plus className="w-5 h-5 text-[#8b6914] group-hover:text-[#c4962c] transition-colors" />
                <span className="text-[13px] sm:text-[14px] uppercase tracking-[0.1em] font-bold text-[#3a2e24]/70 group-hover:text-[#3a2e24] transition-colors" style={chakra}>
                  Opprett ny bil
                </span>
              </motion.div>
            </Link>

            {/* Empty state */}
            {(!myCars || myCars.length === 0) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 sm:py-24 text-center"
              >
                <Car className="w-10 h-10 text-[#3a2e24]/15 mx-auto mb-4" strokeWidth={1.4} />
                <p className="text-[1.1rem] sm:text-[1.4rem] uppercase text-[#3a2e24]/30 font-bold tracking-[0.08em]" style={oswald}>
                  Du har ingen biler ennå
                </p>
                <p className="text-[13px] text-[#3a2e24]/25 mt-1.5">
                  Opprett din første bil for å komme i gang.
                </p>
              </motion.div>
            )}

            {/* Car list */}
            {myCars && myCars.length > 0 && (
              <div>
                {myCars.map(({ cars: car }, index) => {
                  if (!car) return null;
                  const sorted = [...(car.car_images || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
                  const mainImage = sorted[0];
                  const status = statusLabel(car.status);

                  return (
                    <motion.div
                      key={car.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.08 }}
                    >
                      <button
                        onClick={() => navigate(`/dashboard/bil/${car.id}`)}
                        className="w-full text-left group"
                      >
                        <div className="flex gap-4 sm:gap-5 py-5 sm:py-6">
                          {/* Image */}
                          <div className="w-24 h-20 sm:w-36 sm:h-28 flex-shrink-0 rounded-md overflow-hidden bg-[#3a2e24]/[0.06]">
                            {mainImage ? (
                              <img
                                src={mainImage.image_url}
                                alt={car.title}
                                className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Car className="w-8 h-8 text-[#3a2e24]/15" strokeWidth={1.4} />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            {car.year && (
                              <span className="text-[1.3rem] sm:text-[1.6rem] font-serif text-[#c4962c]/60 leading-none">
                                {car.year}
                              </span>
                            )}
                            <h3 className="text-[0.95rem] sm:text-[1.1rem] font-bold text-[#3a2e24] leading-tight mt-0.5 line-clamp-2 group-hover:text-[#c4962c] transition-colors" style={chakra}>
                              {car.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-[10px] sm:text-[11px] uppercase tracking-[0.08em] font-bold px-2 py-0.5 rounded-full ${status.color}`} style={oswald}>
                                {status.text}
                              </span>
                              <span className="text-[11px] text-[#3a2e24]/30 hidden sm:inline">
                                Oppdatert {new Date(car.updated_at).toLocaleDateString('nb-NO')}
                              </span>
                            </div>
                          </div>

                          {/* Arrow */}
                          <div className="flex items-center shrink-0">
                            <ChevronRight className="w-5 h-5 text-[#3a2e24]/20 group-hover:text-[#c4962c] group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      </button>

                      {index < myCars.length - 1 && (
                        <div className="h-px bg-[#3a2e24]/[0.08]" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
