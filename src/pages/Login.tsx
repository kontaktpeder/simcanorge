import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Loader2, LogIn, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { z } from 'zod';
import { getBrowserAuthSupport } from '@/lib/browserSupport';

const loginSchema = z.object({
  email: z.string().email('Ugyldig e-postadresse'),
  password: z.string().min(6, 'Passord må være minst 6 tegn'),
});

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [compatWarning, setCompatWarning] = useState<string | null>(null);

  const returnUrl = searchParams.get('returnUrl') || '/dashboard';
  const prefillEmail = searchParams.get('email');

  useEffect(() => {
    const support = getBrowserAuthSupport();
    if (!support.ok) {
      setCompatWarning(
        "Denne PC-en/nettleseren ser ut til å mangle støtte som trengs for innlogging: " +
          support.reasons.join(" ") +
          " Prøv å oppdatere nettleseren (Chrome/Edge/Firefox) eller slå på cookies/lagring."
      );
    } else {
      setCompatWarning(null);
    }
  }, []);

  useEffect(() => {
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
  }, [prefillEmail]);

  useEffect(() => {
    if (!authLoading && user) {
      navigate(returnUrl);
    }
  }, [user, authLoading, navigate, returnUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login')) {
          setError('Feil e-post eller passord');
        } else {
          throw error;
        }
      } else {
        toast.success('Logget inn!');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || 'Noe gikk galt');
    } finally {
      setIsLoading(false);
    }
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

  if (user) {
    return null;
  }

  return (
    <Layout>
      <PageHeader title="Logg inn" subtitle="Få tilgang til din garasje" />

      <div className="container py-8">
        <div className="max-w-md mx-auto">
          <div className="bg-card border border-border rounded-xl p-8">
            <div className="text-center mb-6">
              <div className="p-3 bg-primary/10 rounded-xl inline-block mb-4">
                <Car className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-xl">Velkommen tilbake</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Logg inn for å se dine biler
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {compatWarning && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-sm text-foreground">{compatWarning}</p>
                </div>
              )}

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-1.5 block">E-post</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="din@epost.no"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Passord</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ditt passord"
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logger inn...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Logg inn
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p>
                Ikke medlem ennå?{' '}
                <Link to="/sok-om-tilgang" className="text-primary hover:underline font-medium">
                  Søk om tilgang
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Ved å logge inn godtar du våre{' '}
            <Link to="/personvern" className="underline hover:text-foreground">
              personvernregler
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
