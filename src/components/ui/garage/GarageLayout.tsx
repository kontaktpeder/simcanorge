import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Settings } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import garageBackground from '@/assets/garage-background.jpg';

const preloadLink = document.createElement('link');
preloadLink.rel = 'preload';
preloadLink.as = 'image';
preloadLink.href = garageBackground;
document.head.appendChild(preloadLink);

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;
const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

interface GarageLayoutProps {
  title: string;
  subtitle?: string;
  description?: string;
  children: ReactNode;
  showBackButton?: boolean;
  backTo?: string;
  backLabel?: string;
  headerAction?: ReactNode;
}

export function GarageLayout({
  title,
  subtitle,
  description,
  children,
  showBackButton = false,
  backTo = '/dashboard',
  backLabel = 'Tilbake',
  headerAction,
}: GarageLayoutProps) {
  return (
    <Layout>
      <div className="min-h-screen relative">
        {/* Garage background */}
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
          style={{ backgroundImage: `url(${garageBackground})` }}
        />
        <div className="fixed inset-0 -z-10" style={{ background: 'linear-gradient(180deg, rgba(15,13,11,0.95) 0%, rgba(15,13,11,0.97) 50%, rgba(15,13,11,0.98) 100%)' }} />

        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden border-b border-white/[0.06]" style={{ background: '#141210' }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(196,150,44,0.08) 0%, transparent 60%)' }} />

          <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-5 md:px-8">
            <div className="flex items-end justify-between min-h-[120px] sm:min-h-[140px] md:min-h-[170px] py-6 md:py-8">
              <div className="flex flex-col justify-center">
                {showBackButton && (
                  <Link
                    to={backTo}
                    className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 mb-3 transition-colors text-[11px] uppercase tracking-[0.15em] font-semibold"
                    style={oswald}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    {backLabel}
                  </Link>
                )}

                <p
                  className="text-[10px] sm:text-[11px] tracking-[0.3em] uppercase mb-1"
                  style={{ ...oswald, fontWeight: 500, background: 'linear-gradient(135deg, #F5A623, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  bilgarasje.no
                </p>
                <h1
                  className="text-[1.4rem] sm:text-[1.8rem] md:text-[2.2rem] leading-[0.93] uppercase tracking-[0.02em] text-white font-bold italic"
                  style={{ ...chakra, textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}
                >
                  {subtitle || title}
                </h1>
                {description && (
                  <p className="text-[12px] sm:text-[13px] text-white/35 mt-1.5 max-w-md">
                    {description}
                  </p>
                )}
              </div>

              {headerAction && (
                <div className="flex-shrink-0 ml-4">
                  {headerAction}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ─── CONTENT ─── */}
        <main className="max-w-[1200px] mx-auto px-4 sm:px-5 md:px-8 py-6 sm:py-10">
          {children}
        </main>
      </div>
    </Layout>
  );
}
