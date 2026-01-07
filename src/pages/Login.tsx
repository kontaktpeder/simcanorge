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

const loginSchema = z.object({
  email: z.string().email('Ugyldig e-postadresse'),
  password: z.string().min(6, 'Passord må være minst 6 tegn'),
});

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const returnUrl = searchParams.get('returnUrl') || '/dashboard';
  const prefillEmail = searchParams.get('email');

  useEffect(() => {
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
  }, [prefillEmail]);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate(returnUrl);
    }
  }, [user, authLoading, navigate, returnUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${returnUrl}`
          }
        });

        if (error) {
          if (error.message.includes('already registered')) {
            setError('E-postadressen er allerede registrert. Prøv å logge inn.');
            setAuthMode('login');
          } else {
            throw error;
          }
        } else if (data.user) {
          toast.success('Konto opprettet!');
          // User will be redirected by useEffect when user state updates
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
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
      <PageHeader 
        title={authMode === 'login' ? 'Logg inn' : 'Opprett konto'} 
        subtitle="Få tilgang til din Simca-portal"
      />
      
      <div className="container py-8">
        <div className="max-w-md mx-auto">
          <div className="bg-card border border-border rounded-xl p-8">
            <div className="text-center mb-6">
              <div className="p-3 bg-primary/10 rounded-xl inline-block mb-4">
                <Car className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-xl">
                {authMode === 'login' ? 'Velkommen tilbake' : 'Bli med i Simca-familien'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {authMode === 'login' 
                  ? 'Logg inn for å se dine biler'
                  : 'Opprett en konto for å komme i gang'
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder={authMode === 'signup' ? 'Velg et passord (min. 6 tegn)' : 'Ditt passord'}
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {authMode === 'signup' ? 'Oppretter konto...' : 'Logger inn...'}
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    {authMode === 'signup' ? 'Opprett konto' : 'Logg inn'}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              {authMode === 'login' ? (
                <p>
                  Ingen konto?{' '}
                  <button 
                    onClick={() => setAuthMode('signup')} 
                    className="text-primary hover:underline font-medium"
                  >
                    Opprett konto
                  </button>
                </p>
              ) : (
                <p>
                  Har du allerede konto?{' '}
                  <button 
                    onClick={() => setAuthMode('login')} 
                    className="text-primary hover:underline font-medium"
                  >
                    Logg inn
                  </button>
                </p>
              )}
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
