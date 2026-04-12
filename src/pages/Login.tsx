import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { z } from 'zod';
import { getBrowserAuthSupport } from '@/lib/browserSupport';

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

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
    if (prefillEmail) setEmail(prefillEmail);
  }, [prefillEmail]);

  useEffect(() => {
    if (!authLoading && user) navigate(returnUrl);
  }, [user, authLoading, navigate, returnUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) { setError(result.error.errors[0].message); return; }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes('Invalid login')) setError('Feil e-post eller passord');
        else throw error;
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
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </Layout>
    );
  }
  if (user) return null;

  return (
    <Layout>
      {/* Hero banner */}
      <section className="relative overflow-hidden py-10 md:py-16" style={{ background: 'linear-gradient(135deg, #4a3d30 0%, #3a2e24 40%, #2a2118 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 70% 50%, rgba(255,190,100,0.10) 0%, transparent 50%)' }} />
        <div className="relative z-10 max-w-[1200px] mx-auto px-5 md:px-8">
          <p className="text-[10px] tracking-[0.3em] uppercase mb-1" style={{ ...oswald, fontWeight: 500, background: 'linear-gradient(135deg, #F5A623, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            bilgarasje.no
          </p>
          <h1 className="text-xl sm:text-2xl md:text-3xl uppercase tracking-wide text-white font-bold italic leading-tight" style={chakra}>
            Logg inn
          </h1>
          <p className="mt-1.5 text-[13px] text-white/40" style={oswald}>Få tilgang til din garasje</p>
        </div>
      </section>

      <div className="bg-background">
        <div className="max-w-md mx-auto px-4 py-10 md:py-14">
          <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-bold uppercase tracking-wide mb-1" style={oswald}>Velkommen tilbake</h2>
            <p className="text-sm text-muted-foreground mb-6">Logg inn for å se dine biler</p>

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
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block" style={oswald}>E-post</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="din@epost.no" required />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block" style={oswald}>Passord</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ditt passord" required minLength={6} />
              </div>

              <div className="text-right">
                <Link to="/glemt-passord" className="text-xs text-muted-foreground hover:text-primary hover:underline">Glemt passord?</Link>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Logger inn...</>
                ) : (
                  <><LogIn className="w-4 h-4 mr-2" />Logg inn</>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-border text-center text-sm">
              <p>
                Ikke medlem ennå?{' '}
                <Link to="/sok-om-tilgang" className="text-primary hover:underline font-medium">Søk om tilgang</Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Ved å logge inn godtar du våre{' '}
            <Link to="/personvern" className="underline hover:text-foreground">personvernregler</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
