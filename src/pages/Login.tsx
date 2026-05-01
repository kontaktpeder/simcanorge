import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { Loader2, LogIn, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { z } from 'zod';
import { getBrowserAuthSupport } from '@/lib/browserSupport';
import { safeInternalPath } from '@/lib/navigation';

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

  const returnUrl = safeInternalPath(searchParams.get('returnUrl'), '/min-garasje');
  const prefillEmail = searchParams.get('email');

  useEffect(() => {
    const support = getBrowserAuthSupport();
    if (!support.ok) {
      setCompatWarning(
        "Denne nettleseren mangler støtte for innlogging: " +
          support.reasons.join(" ") +
          " Prøv Chrome, Edge eller Firefox med cookies aktivert."
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
      <div className="min-h-[calc(100vh-4rem)] relative overflow-hidden flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #070b10 0%, #0c1219 40%, #060a0f 100%)' }}>

        {/* Ambient glows matching homepage */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 700px 400px at 30% 30%, rgba(45,212,168,0.07) 0%, transparent 65%)' }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 500px 300px at 70% 80%, rgba(52,234,184,0.04) 0%, transparent 70%)' }} />

        {/* Accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none overflow-hidden">
          <div className="h-full w-full" style={{
            background: 'linear-gradient(90deg, transparent 0%, #34eab8 30%, #2dd4a8 50%, #34eab8 70%, transparent 100%)',
            opacity: 0.5,
          }} />
        </div>

        <div className="relative z-10 w-full max-w-md mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <p className="text-[10px] tracking-[0.3em] uppercase mb-2"
              style={{ ...oswald, fontWeight: 500, background: 'linear-gradient(135deg, #34eab8, #2dd4a8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              bilgarasje.no
            </p>
            <h1 className="text-3xl sm:text-4xl uppercase tracking-wide text-foreground font-bold italic"
              style={chakra}>
              Logg inn
            </h1>
            <p className="mt-2 text-sm text-muted-foreground" style={oswald}>
              Få tilgang til din garasje
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-border/60 p-6 sm:p-8 shadow-2xl"
            style={{ background: 'linear-gradient(180deg, hsl(215 25% 11%) 0%, hsl(215 25% 9%) 100%)' }}>

            <form onSubmit={handleSubmit} className="space-y-5">
              {compatWarning && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-sm text-foreground">{compatWarning}</p>
                </div>
              )}
              {error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block"
                style={oswald}>
                E-post
              </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="din@epost.no"
                  required
                  className="h-12 text-base bg-background/50 border-border/60 focus:border-primary/60"
                  style={oswald}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block"
                  style={oswald}>
                  Passord
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ditt passord"
                  required
                  minLength={6}
                  className="h-12 text-base bg-background/50 border-border/60 focus:border-primary/60"
                  style={oswald}
                />
              </div>

              <div className="text-right">
                <Link to="/glemt-passord" className="text-xs text-muted-foreground hover:text-primary transition-colors" style={oswald}>
                  Glemt passord?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base uppercase tracking-wider"
                style={{
                  ...chakra,
                  background: 'linear-gradient(135deg, #34eab8 0%, #2ab89a 100%)',
                  color: '#070b10',
                  boxShadow: '0 0 24px rgba(52,234,184,0.2)',
                }}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Logger inn…</>
                ) : (
                  <><LogIn className="w-4 h-4 mr-2" />Logg inn</>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-border/40 text-center">
              <p className="text-sm text-muted-foreground" style={oswald}>
                Ikke medlem ennå?{' '}
                <Link to="/sok-om-tilgang" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                  Søk om tilgang <ArrowRight className="w-3 h-3" />
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground/60 mt-6" style={oswald}>
            Ved å logge inn godtar du våre{' '}
            <Link to="/personvern" className="underline hover:text-muted-foreground transition-colors">personvernregler</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
