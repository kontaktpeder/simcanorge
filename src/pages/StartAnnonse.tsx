import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Plus, LogIn, ChevronRight, Loader2 } from 'lucide-react';

export default function StartAnnonse() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard/opprett-annonse', { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (user) return null;

  return (
    <Layout>
      <PageHeader title="Opprett annonse" subtitle="Selg deler, tilbehør eller biler til andre entusiaster" />

      {/* Editorial gate section */}
      <section className="relative overflow-hidden" style={{ background: "hsl(212, 80%, 15%)" }}>
        {/* Decorative accent rule */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "hsl(2, 85%, 40%)" }} />

        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-lg mx-auto text-center">
            <p className="font-display text-[10px] md:text-xs uppercase tracking-[0.4em] text-white/40 mb-4">
              Simca · Talbot · Matra
            </p>

            <h2 className="font-display text-3xl md:text-5xl text-white uppercase tracking-wider leading-none mb-4">
              Opprett annonse
            </h2>

            <div className="w-16 h-[2px] mx-auto mb-6" style={{ background: "hsl(2, 85%, 40%)" }} />

            <p className="font-serif text-sm md:text-base italic text-white/60 mb-2">
              For å legge ut en annonse trenger du en konto og en Entusiastprofil.
            </p>
            <p className="font-serif text-xs md:text-sm italic text-white/40 mb-10">
              Alt som legges ut må godkjennes av redaksjonen før publisering.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login?returnUrl=/dashboard/opprett-annonse"
                className="group inline-flex items-center gap-3 px-10 py-4 md:px-12 md:py-5 font-display text-sm md:text-base uppercase tracking-[0.2em] text-white border-2 border-white/30 hover:border-white transition-all"
                style={{ background: "hsl(2, 85%, 40%)" }}
              >
                <LogIn className="h-5 w-5" />
                Logg inn / Lag konto
                <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/markedsplass"
                className="group inline-flex items-center gap-2 font-display text-xs uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors py-2"
              >
                Utforsk markedsplass
                <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
