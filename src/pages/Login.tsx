import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { Loader2, LogIn, ArrowRight, Mail, KeyRound, CheckCircle } from 'lucide-react';
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
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPasswordMode, setShowPasswordMode] = useState(false);

  const returnUrl = safeInternalPath(searchParams.get('returnUrl'), '/app');
  const prefillEmail = searchParams.get('email');
  const fromApp = searchParams.get('reason') === 'app' || returnUrl === '/app';
  const inviteFlow = searchParams.get('inviteFlow') === '1';
  const inviteEmail = searchParams.get('inviteEmail') || '';
  const inviteCar = searchParams.get('inviteCar') || '';
  const useMagicLink = !showPasswordMode;
  const publicBaseUrl = (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) || window.location.origin;

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
    if (inviteEmail) setEmail(inviteEmail);
    else if (prefillEmail) setEmail(prefillEmail);
  }, [prefillEmail, inviteEmail]);

  useEffect(() => {
    if (!authLoading && user) navigate(returnUrl);
  }, [user, authLoading, navigate, returnUrl]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

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

  const handleSendMagicLink = async () => {
    setError('');
    if (resendCooldown > 0) return;
    const targetEmail = ((inviteFlow && inviteEmail) ? inviteEmail : email).trim().toLowerCase();
    if (!targetEmail) {
      setError('Skriv inn e-postadressen din');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: targetEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${publicBaseUrl}${returnUrl}`,
        },
      });
      if (error) throw error;
      setEmail(targetEmail);
      setSentToEmail(targetEmail);
      setMagicLinkSent(true);
      setResendCooldown(20);
      toast.success('Innloggingslenke sendt!');
    } catch (err: any) {
      console.error('Magic link error:', err);
      setError(err.message || 'Kunne ikke sende innloggingslenke. Prøv igjen.');
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
              Logg inn / Opprett konto
            </h1>
            <p className="mt-2 text-sm text-muted-foreground" style={oswald}>
              Skriv inn e-post — vi sender deg en innloggingslenke.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-border/60 p-6 sm:p-8 shadow-2xl"
            style={{ background: 'linear-gradient(180deg, hsl(215 25% 11%) 0%, hsl(215 25% 9%) 100%)' }}>

            {useMagicLink ? (
              <div className="space-y-5">
                {inviteFlow && inviteEmail ? (
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                    <p className="text-sm font-semibold text-foreground" style={oswald}>
                      Invitasjonen din venter fortsatt
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed" style={oswald}>
                      Vi sender en sikker innloggingslenke til{' '}
                      <span className="text-foreground font-semibold break-all">{inviteEmail}</span>.
                      Når du åpner lenken fortsetter invitasjonen automatisk
                      {inviteCar ? ` for ${inviteCar}` : ''}.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm text-foreground" style={oswald}>
                      Du har sannsynligvis allerede konto.
                    </p>
                    <p className="text-xs text-muted-foreground" style={oswald}>
                      Vi sender deg en sikker innloggingslenke på e-post.
                    </p>
                  </div>
                )}

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

                {magicLinkSent ? (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-5 text-center">
                    <CheckCircle className="w-10 h-10 mx-auto mb-3 text-[#34eab8]" />
                    <p className="text-base font-semibold text-foreground" style={oswald}>
                      Innloggingslenke sendt
                    </p>
                    <p className="text-sm text-muted-foreground mt-2" style={oswald}>
                      Lenken ble sendt til:
                    </p>
                    <p className="text-sm font-semibold text-foreground break-all mt-0.5" style={oswald}>
                      {sentToEmail || email}
                    </p>
                    <div className="mt-3 pt-3 border-t border-border/30 space-y-1">
                      <p className="text-xs text-muted-foreground" style={oswald}>
                        Åpne Mail- eller Gmail-appen <span className="text-foreground font-semibold">på denne enheten</span> og klikk på lenken.
                      </p>
                      <p className="text-[11px] text-muted-foreground/70" style={oswald}>
                        Ser du den ikke? Sjekk spam-mappen eller søk etter «Bilgarasje».
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSendMagicLink}
                      disabled={isLoading || resendCooldown > 0}
                      className="text-xs text-muted-foreground hover:text-primary underline mt-4 disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                      style={oswald}
                    >
                      {resendCooldown > 0
                        ? `Du kan sende ny lenke om ${resendCooldown} sek`
                        : 'Send på nytt'}
                    </button>
                  </div>
                ) : (
                  <>
                    {!(inviteFlow && inviteEmail) && (
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
                          autoComplete="email"
                          className="h-12 text-base bg-background/50 border-border/60 focus:border-primary/60"
                          style={oswald}
                        />
                      </div>
                    )}
                    <Button
                      type="button"
                      onClick={handleSendMagicLink}
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
                        <><Mail className="w-4 h-4 mr-2" />Send innloggingslenke{inviteFlow && inviteEmail ? ` til ${inviteEmail}` : ''}</>
                      )}
                    </Button>
                  </>
                )}

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setShowPasswordMode(true); setError(''); }}
                    className="text-xs text-muted-foreground hover:text-primary underline inline-flex items-center gap-1"
                    style={oswald}
                  >
                    <KeyRound className="w-3 h-3" />
                    Bruk passord i stedet
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {inviteFlow && inviteEmail && (
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                    <p className="text-sm font-semibold text-foreground" style={oswald}>
                      Invitasjonen din venter fortsatt
                    </p>
                    <p className="text-xs text-muted-foreground mt-1" style={oswald}>
                      Logg inn med <span className="text-foreground font-semibold">{inviteEmail}</span> for å få tilgang til {inviteCar || 'bilen'}.
                    </p>
                  </div>
                )}
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
                    className="h-12 text-base bg-background/50 border-border/60 focus:border-primary/60"
                    style={oswald}
                  />
                  {inviteFlow && inviteEmail && (
                    <p className="text-[11px] text-muted-foreground/80 mt-1" style={oswald}>
                      Bruk denne e-posten for at invitasjonen skal fungere.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block" style={oswald}>
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

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setShowPasswordMode(false); setError(''); }}
                    className="text-xs text-muted-foreground hover:text-primary underline inline-flex items-center gap-1"
                    style={oswald}
                  >
                    <Mail className="w-3 h-3" />
                    Få innloggingslenke på e-post i stedet
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-5 border-t border-border/40 text-center">
              <p className="text-sm text-muted-foreground" style={oswald}>
                Ikke medlem ennå?{' '}
                <Link to={`/registrer?${searchParams.toString()}`} className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                  Opprett gratis konto <ArrowRight className="w-3 h-3" />
                </Link>
              </p>
              <p className="text-xs text-muted-foreground/70 mt-2" style={oswald}>
                Eller{' '}
                <Link to="/sok-om-tilgang" className="underline hover:text-muted-foreground transition-colors">
                  søk om tilgang (beta)
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground/60 mt-6" style={oswald}>
            Ved å logge inn godtar du{' '}
            <Link to="/vilkar" className="underline hover:text-muted-foreground transition-colors">brukervilkårene</Link>
            {' '}og{' '}
            <Link to="/personvern" className="underline hover:text-muted-foreground transition-colors">personvernerklæringen</Link>.
          </p>
        </div>
      </div>
    </Layout>
  );
}
