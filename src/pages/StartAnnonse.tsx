import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ShoppingBag, LogIn, ArrowRight, Loader2 } from 'lucide-react';

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

      <section className="container py-12">
        <div className="max-w-md mx-auto text-center space-y-6">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mx-auto" />

          <p className="text-muted-foreground">
            For å legge ut en annonse trenger du en konto og en Entusiastprofil.
          </p>

          <p className="text-sm text-muted-foreground/70">
            Alt som legges ut må godkjennes før publisering.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              to="/login?returnUrl=/dashboard/opprett-annonse"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              Logg inn / Lag konto
            </Link>
            <Link
              to="/markedsplass"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-muted text-muted-foreground font-medium hover:bg-muted/80 transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
              Fortsett å utforske markedsplass
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
