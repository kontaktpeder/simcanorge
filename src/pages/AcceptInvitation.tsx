import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate, Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { Loader2, CheckCircle, XCircle, AlertTriangle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Status = 'processing' | 'success' | 'error' | 'wrong_account';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const { token: pathToken } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [status, setStatus] = useState<Status>('processing');
  const [message, setMessage] = useState('');
  const [carTitle, setCarTitle] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  const [signingOut, setSigningOut] = useState(false);

  // Support both /i/:token and /accept-invitation?token=xxx
  const token = pathToken || searchParams.get('token');

  useEffect(() => {
    const validateInvitation = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Ingen invitasjonstoken funnet i lenken.');
        setIsProcessing(false);
        return;
      }

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

      if (new Date(invitation.expires_at) < new Date()) {
        setStatus('error');
        setMessage('Denne invitasjonen har utløpt. Ta kontakt med admin for ny invitasjon.');
        setIsProcessing(false);
        return;
      }

      if (invitation.used_at) {
        setStatus('error');
        setMessage('Denne invitasjonen er allerede brukt.');
        setIsProcessing(false);
        return;
      }

      const { data: car } = await supabase
        .from('cars')
        .select('id, title, slug')
        .eq('id', invitation.car_id)
        .maybeSingle();

      setCarTitle(car?.title || 'bilen');
      setInviteEmail(invitation.email);

      // Not logged in -> send to standard login flow with invite context
      if (!user) {
        toast.message('Logg inn eller opprett bruker for å akseptere invitasjonen.');
        const returnTo = `/i/${token}`;
        const params = new URLSearchParams({
          returnUrl: returnTo,
          inviteFlow: '1',
          inviteEmail: invitation.email,
          inviteCar: car?.title || 'bilen',
        });
        navigate(`/login?${params.toString()}`, { replace: true });
        return;
      }

      // Logged in -> accept
      await acceptInvitation(invitation, user);
    };

    if (!authLoading) {
      void validateInvitation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user, authLoading]);

  const acceptInvitation = async (invitation: any, currentUser: any) => {
    const userEmail = (currentUser.email || '').toLowerCase().trim();
    const inviteEmailNormalized = (invitation.email || '').toLowerCase().trim();

    if (userEmail !== inviteEmailNormalized) {
      setCurrentEmail(currentUser.email || '');
      setInviteEmail(invitation.email);
      setStatus('wrong_account');
      setIsProcessing(false);
      return;
    }

    try {
      const { error: ownerError } = await supabase
        .from('car_owners')
        .insert({
          car_id: invitation.car_id,
          user_id: currentUser.id,
          email: invitation.email,
          role: 'owner',
        });

      if (ownerError && ownerError.code !== '23505') {
        throw ownerError;
      }

      await supabase
        .from('car_invitations')
        .update({ used_at: new Date().toISOString() })
        .eq('id', invitation.id);

      setStatus('success');
      setIsProcessing(false);

      setTimeout(() => {
        navigate('/dashboard/mine-biler');
      }, 1500);
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      setStatus('error');
      setMessage('Kunne ikke koble deg til bilen. Prøv igjen eller ta kontakt med admin.');
      setIsProcessing(false);
    }
  };

  const handleSignOutAndRetry = async () => {
    if (!token) return;
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      const returnTo = `/i/${token}`;
      const params = new URLSearchParams({
        returnUrl: returnTo,
        inviteFlow: '1',
        inviteEmail: inviteEmail,
        inviteCar: carTitle || 'bilen',
      });
      navigate(`/login?${params.toString()}`, { replace: true });
    } catch (e) {
      console.error('Sign out failed:', e);
      toast.error('Kunne ikke logge ut. Prøv igjen.');
      setSigningOut(false);
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

  if (status === 'wrong_account') {
    return (
      <Layout>
        <div className="container max-w-md py-20">
          <div className="bg-card border border-border rounded-xl p-8">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
              <h1 className="font-display text-xl mb-3">
                Du er logget inn med feil e-post
              </h1>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground mb-6">
              <p>
                Invitasjonen ble sendt til{' '}
                <span className="text-foreground font-semibold break-all">
                  {inviteEmail}
                </span>
                .
              </p>
              <p>
                Du er nå logget inn som{' '}
                <span className="text-foreground font-semibold break-all">
                  {currentEmail}
                </span>
                .
              </p>
              <p>
                For å få tilgang må du logge inn med e-posten invitasjonen ble
                sendt til, eller be eier sende en ny invitasjon til denne kontoen.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleSignOutAndRetry}
                disabled={signingOut}
                className="w-full"
              >
                {signingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logger ut...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logg ut og fortsett med riktig konto
                  </>
                )}
              </Button>
              <Link to="/" className="w-full">
                <Button variant="outline" className="w-full">
                  Tilbake til forsiden
                </Button>
              </Link>
            </div>

            <p className="text-xs text-muted-foreground/70 mt-5 text-center">
              Trenger du invitasjon til en annen e-post? Be eier sende en ny
              invitasjon.
            </p>
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

  return null;
}

