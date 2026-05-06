import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const { token: pathToken } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('');
  const [carTitle, setCarTitle] = useState('');

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

      // Not logged in -> send to standard login flow with returnUrl back here
      if (!user) {
        toast.message('Logg inn eller opprett bruker for å akseptere invitasjonen.');
        const returnTo = `/i/${token}`;
        navigate(`/login?returnUrl=${encodeURIComponent(returnTo)}`, { replace: true });
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
    if ((currentUser.email || '').toLowerCase().trim() !== (invitation.email || '').toLowerCase().trim()) {
      setStatus('error');
      setMessage(`Du må logge inn med samme e-post som invitasjonen ble sendt til (${invitation.email}).`);
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

  return null;
}
