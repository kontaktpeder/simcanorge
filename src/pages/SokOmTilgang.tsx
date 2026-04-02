import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SokOmTilgang() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailConfirm, setEmailConfirm] = useState('');
  const [emailError, setEmailError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    if (email.trim().toLowerCase() !== emailConfirm.trim().toLowerCase()) {
      setEmailError('E-postadressene stemmer ikke overens');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('access_requests' as any)
        .insert({ name: name.trim(), email: email.trim(), message: message.trim() || null } as any);
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || 'Noe gikk galt. Prøv igjen.');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <Layout>
        <div className="container py-20 flex flex-col items-center text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mb-6" />
          <h2 className="font-display text-2xl mb-3">Søknad mottatt!</h2>
          <p className="text-muted-foreground max-w-md">
            Vi behandler søknaden din og sender deg en invitasjon på e-post når du er godkjent.
          </p>
          <Link to="/" className="mt-8 text-primary hover:underline text-sm">
            Tilbake til forsiden
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader title="Søk om tilgang" subtitle="Bli en del av Simca Norge" />

      <div className="container py-8">
        <div className="max-w-md mx-auto">
          <div className="bg-card border border-border rounded-xl p-8">
            <div className="text-center mb-6">
              <div className="p-3 bg-primary/10 rounded-xl inline-block mb-4">
                <UserPlus className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-xl">Bli en del av Simca Norge</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Vi åpner opp gradvis — fyll ut skjemaet så hører du fra oss.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Navn *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ola Nordmann"
                  required
                  minLength={2}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">E-post *</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ola@eksempel.no"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Fortell oss litt om deg <span className="text-muted-foreground">(valgfritt)</span>
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hvilken Simca eier du, hva interesserer deg..."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sender...' : 'Send søknad'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p>
                Har du allerede konto?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Logg inn
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
