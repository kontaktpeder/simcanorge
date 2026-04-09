import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';

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
}

export function GarageLayout({
  title,
  subtitle,
  description,
  children,
  showBackButton = false,
  backTo = '/dashboard',
  backLabel = 'Tilbake',
}: GarageLayoutProps) {
  return (
    <Layout>
      <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #eee7dd 0%, #ebe4da 40%, #e8e1d6 100%)' }}>

        {/* ─── HERO ─── */}
        <section
          className="relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #3a2e24 0%, #2a2118 100%)' }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(196,150,44,0.1) 0%, transparent 60%)' }} />

          <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-5 md:px-8">
            <div className="flex flex-col justify-center min-h-[140px] sm:min-h-[160px] md:min-h-[200px] py-8 md:py-10">
              {showBackButton && (
                <Link
                  to={backTo}
                  className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 mb-4 transition-colors text-[12px] uppercase tracking-[0.15em] font-semibold"
                  style={oswald}
                >
                  <ArrowLeft className="w-4 h-4" />
                  {backLabel}
                </Link>
              )}

              <p
                className="text-[10px] sm:text-[11px] tracking-[0.3em] uppercase mb-1.5"
                style={{ ...oswald, fontWeight: 500, background: 'linear-gradient(135deg, #F5A623, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                bilgarasje.no
              </p>
              <h1
                className="text-[1.5rem] sm:text-[1.9rem] md:text-[2.4rem] leading-[0.93] uppercase tracking-[0.02em] text-white font-bold italic"
                style={{ ...chakra, textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}
              >
                {subtitle || title}
              </h1>
              {description && (
                <p
                  className="text-[0.7rem] sm:text-[0.85rem] md:text-[1rem] uppercase tracking-[0.15em] text-white/50 font-bold italic mt-0.5"
                  style={chakra}
                >
                  — {description}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ─── CONTENT ─── */}
        <main className="max-w-[1200px] mx-auto px-4 sm:px-5 md:px-8 py-8 sm:py-12">
          {children}
        </main>
      </div>
    </Layout>
  );
}
