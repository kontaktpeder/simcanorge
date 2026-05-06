import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { Loader2, Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { z } from 'zod';
import { safeInternalPath } from '@/lib/navigation';
import { SITE_NAME } from '@/config/site';

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

const schema = z.object({
  email: z.string().trim().email('Ugyldig e-postadresse').max(255),
});

export default function RegistrerBruker() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const returnUrl = safeInternalPath(searchParams.get('returnUrl'), '/app');
  const inviteFlow = searchParams.get('inviteFlow') === '1';
  const inviteEmail = searchParams.get('inviteEmail') || '';
  const inviteCar = searchParams.get('inviteCar') || '';
  const publicBaseUrl = (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) || window.location.origin;

  const [email, setEmail] = useState(inviteEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [linkSent, setLinkSent] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate(returnUrl, { replace: true });
  }, [user, authLoading, navigate, returnUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    const emailTrim = email.trim().toLowerCase();
    const result = schema.safeParse({ email: emailTrim });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: emailTrim,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${publicBaseUrl}${returnUrl}`,
        },
      });
      if (error) throw error;
      setEmail(emailTrim);
      setLinkSent(true);
      setInfo('Innloggingslenke sendt. Åpne e-posten på denne enheten for å fortsette.');
      toast.success('Innloggingslenke sendt');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt');
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
      <Helmet>
        <title>Opprett konto – {SITE_NAME}</title>
        <meta name="description" content="Opprett gratis konto på Bilgarasje.no — vi sender deg en innloggingslenke på e-post." />
        <meta name="robots" content="noindex" />
      </Helmet>
      <div
        className="min-h-[calc(100vh-4rem)] relative overflow-hidden flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #070b10 0%, #0c1219 40%, #060a0f 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 700px 400px at 30% 30%, rgba(45,212,168,0.07) 0%, transparent 65%)' }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 500px 300px at 70% 80%, rgba(52,234,184,0.04) 0%, transparent 70%)' }} />

        <div className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none overflow-hidden">
          <div className="h-full w-full" style={{
            background: 'linear-gradient(90deg, transparent 0%, #34eab8 30%, #2dd4a8 50%, #34eab8 70%, transparent 100%)',
            opacity: 0.5,
          }} />
        </div>

        <div className="relative z-10 w-full max-w-md mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <p className="text-[10px] tracking-[0.3em] uppercase mb-2"
              style={{ ...oswald, fontWeight: 500, background: 'linear-gradient(135deg, #34eab8, #2dd4a8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              bilgarasje.no
            </p>
            <h1 className="text-3xl sm:text-4xl uppercase tracking-wide text-foreground font-bold italic" style={chakra}>
              Opprett konto
            </h1>
            <p className="mt-2 text-sm text-muted-foreground" style={oswald}>
              Skriv inn e-post. Vi sender deg en innloggingslenke. Hvis du ikke har konto, opprettes den automatisk.
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 p-6 sm:p-8 shadow-2xl"
            style={{ background: 'linear-gradient(180deg, hsl(215 25% 11%) 0%, hsl(215 25% 9%) 100%)' }}>
            {linkSent ? (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-5 text-center">
                <CheckCircle className="w-10 h-10 mx-auto mb-3 text-[#34eab8]" />
                <p className="text-base font-semibold text-foreground" style={oswald}>
                  Innloggingslenke sendt
                </p>
                <p className="text-sm text-muted-foreground mt-1" style={oswald}>
                  Åpne e-posten på denne enheten for å fortsette.
                </p>
                <p className="text-xs text-muted-foreground/70 mt-2" style={oswald}>
                  Sjekk spam-mappen eller søk etter Bilgarasje.
                </p>
                <button
                  type="button"
                  onClick={handleSubmit as any}
                  disabled={isLoading}
                  className="text-xs text-muted-foreground hover:text-primary underline mt-3"
                  style={oswald}
                >
                  Send på nytt
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {inviteFlow && inviteEmail && (
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                    <p className="text-sm font-semibold text-foreground" style={oswald}>
                      Invitasjonen din venter fortsatt
                    </p>
                    <p className="text-xs text-muted-foreground mt-1" style={oswald}>
                      Bruk <span className="text-foreground font-semibold">{inviteEmail}</span> for å få tilgang til {inviteCar || 'bilen'}.
                    </p>
                  </div>
                )}
                {error && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
                {info && !linkSent && (
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                    <p className="text-sm text-foreground">{info}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block" style={oswald}>
                    E-post
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="din@epost.no"
                    required
                    readOnly={inviteFlow && !!inviteEmail}
                    autoComplete="email"
                    className="h-12 text-base bg-background/50 border-border/60 focus:border-primary/60"
                    style={oswald}
                  />
                  {inviteFlow && inviteEmail && (
                    <p className="text-[11px] text-muted-foreground/80 mt-1" style={oswald}>
                      Bruk denne e-posten for at invitasjonen skal fungere.
                    </p>
                  )}
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
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sender lenke…</>
                  ) : (
                    <><Mail className="w-4 h-4 mr-2" />Send innloggingslenke</>
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 pt-5 border-t border-border/40 text-center">
              <p className="text-sm text-muted-foreground" style={oswald}>
                Har du allerede konto?{' '}
                <Link to={`/login?${searchParams.toString()}`} className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                  Logg inn <ArrowRight className="w-3 h-3" />
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground/60 mt-6" style={oswald}>
            Ved å opprette konto godtar du{' '}
            <Link to="/vilkar" className="underline hover:text-muted-foreground transition-colors">brukervilkårene</Link>
            {' '}og{' '}
            <Link to="/personvern" className="underline hover:text-muted-foreground transition-colors">personvernerklæringen</Link>.
          </p>
        </div>
      </div>
    </Layout>
  );
}
