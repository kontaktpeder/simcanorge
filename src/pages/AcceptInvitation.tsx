import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { Loader2, CheckCircle, XCircle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const { token: pathToken } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [status, setStatus] = useState<'processing' | 'success' | 'error' | 'needs_auth'>('processing');
  const [message, setMessage] = useState('');
  const [carTitle, setCarTitle] = useState('');
  const [invitationEmail, setInvitationEmail] = useState('');
  const [carId, setCarId] = useState<string | null>(null);

  // Auth form state
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Support both /i/:token and /accept-invitation?token=xxx
  const token = pathToken || searchParams.get('token');

  // Validate invitation on load
  useEffect(() => {
    const validateInvitation = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Ingen invitasjonstoken funnet i lenken.');
        setIsProcessing(false);
        return;
      }

      // Fetch invitation
      const { data: invitation, error: invError } = await supabase
        .from('car_invitations')
        .select('*')
        .eq('token', token)
        .maybeSingle();

      if (invError || !invitation) {
        setStatus('error');
        setMessage('Ugyldig invitasjon. Ta kontakt med admin.');
        setIsProcessing(false);
        return;
      }

      // Check if expired
      if (new Date(invitation.expires_at) < new Date()) {
        setStatus('error');
        setMessage('Denne invitasjonen har utløpt. Ta kontakt med admin for ny invitasjon.');
        setIsProcessing(false);
        return;
      }

      // Check if already used
      if (invitation.used_at) {
        setStatus('error');
        setMessage('Denne invitasjonen er allerede brukt.');
        setIsProcessing(false);
        return;
      }

      // Fetch car title
      const { data: car } = await supabase
        .from('cars')
        .select('id, title, slug')
        .eq('id', invitation.car_id)
        .maybeSingle();

      setCarTitle(car?.title || 'bilen');
      setCarId(car?.id || null);
      setInvitationEmail(invitation.email);
      setEmail(invitation.email);

      // If user is logged in, try to accept
      if (!authLoading && user) {
        await acceptInvitation(invitation, user);
      } else if (!authLoading && !user) {
        setStatus('needs_auth');
        setIsProcessing(false);
      }
    };

    if (!authLoading) {
      validateInvitation();
    }
  }, [token, user, authLoading]);

  const acceptInvitation = async (invitation: any, currentUser: any) => {
    // Check email match
    if (currentUser.email !== invitation.email) {
      setStatus('error');
      setMessage(`E-postadressen (${currentUser.email}) matcher ikke invitasjonen (${invitation.email}).`);
      setIsProcessing(false);
      return;
    }

    try {
      // Create car_owner link
      const { error: ownerError } = await supabase
        .from('car_owners')
        .insert({
          car_id: invitation.car_id,
          user_id: currentUser.id,
          email: invitation.email,
          role: 'owner'
        });

      if (ownerError && ownerError.code !== '23505') {
        throw ownerError;
      }

      // Mark invitation as used
      await supabase
        .from('car_invitations')
        .update({ used_at: new Date().toISOString() })
        .eq('id', invitation.id);

      setStatus('success');
      setIsProcessing(false);

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/dashboard/mine-biler');
      }, 2000);

    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      setStatus('error');
      setMessage('Kunne ikke koble deg til bilen. Prøv igjen eller ta kontakt med admin.');
      setIsProcessing(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/i/${token}`
          }
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('E-postadressen er allerede registrert. Prøv å logge inn.');
            setAuthMode('login');
          } else {
            throw error;
          }
        } else if (data.user) {
          // User created and auto-logged in (if auto-confirm is enabled)
          toast.success('Konto opprettet! Kobler til bilen...');
          // The useEffect will handle the rest when user state updates
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          if (error.message.includes('Invalid login')) {
            toast.error('Feil e-post eller passord');
          } else {
            throw error;
          }
        } else {
          toast.success('Logget inn! Kobler til bilen...');
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || 'Autentiseringsfeil');
    } finally {
      setIsAuthLoading(false);
    }
  };

  if (isProcessing || status === 'processing') {
    return (
      <Layout>
        <div className="container max-w-md py-20">
          <div className="text-center bg-card border border-border rounded-xl p-8">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Behandler invitasjon...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (status === 'error') {
    return (
      <Layout>
        <div className="container max-w-md py-20">
          <div className="text-center bg-card border border-border rounded-xl p-8">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h1 className="font-display text-xl mb-2">Feil</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Link to="/">
              <Button variant="outline">Tilbake til forsiden</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (status === 'success') {
    return (
      <Layout>
        <div className="container max-w-md py-20">
          <div className="text-center bg-card border border-border rounded-xl p-8">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h1 className="font-display text-xl mb-2">Tilgang gitt!</h1>
            <p className="text-muted-foreground">
              Du har nå tilgang til {carTitle}. Du blir omdirigert...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // Needs auth - show login/signup form
  if (status === 'needs_auth') {
    return (
      <Layout>
        <div className="container max-w-md py-20">
          <div className="bg-card border border-border rounded-xl p-8">
            <div className="text-center mb-6">
              <LogIn className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h1 className="font-display text-xl mb-2">Få tilgang til {carTitle}</h1>
              <p className="text-muted-foreground text-sm">
                {authMode === 'signup' 
                  ? 'Opprett en konto for å få tilgang til bilen din'
                  : 'Logg inn for å få tilgang til bilen din'
                }
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="text-sm font-medium">E-post</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="din@epost.no"
                  required
                  disabled={email === invitationEmail}
                />
                {email !== invitationEmail && (
                  <p className="text-xs text-destructive mt-1">
                    Obs! E-postadressen må være {invitationEmail}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Passord</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={authMode === 'signup' ? 'Velg et passord (min. 6 tegn)' : 'Ditt passord'}
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isAuthLoading}>
                {isAuthLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {authMode === 'signup' ? 'Oppretter konto...' : 'Logger inn...'}
                  </>
                ) : (
                  authMode === 'signup' ? 'Opprett konto' : 'Logg inn'
                )}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              {authMode === 'signup' ? (
                <p>
                  Har du allerede konto?{' '}
                  <button 
                    onClick={() => setAuthMode('login')} 
                    className="text-primary hover:underline"
                  >
                    Logg inn
                  </button>
                </p>
              ) : (
                <p>
                  Ingen konto?{' '}
                  <button 
                    onClick={() => setAuthMode('signup')} 
                    className="text-primary hover:underline"
                  >
                    Opprett konto
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return null;
}