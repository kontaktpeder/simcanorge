import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Ugyldig e-postadresse'),
});

export default function GlemtPassord() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = schema.safeParse({ email });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/nytt-passord`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Noe gikk galt');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <PageHeader title="Glemt passord" subtitle="Tilbakestill passordet ditt" />

      <div className="container py-8">
        <div className="max-w-md mx-auto">
          <div className="bg-card border border-border rounded-xl p-8">
            {sent ? (
              <div className="text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                <h2 className="font-display text-xl">Sjekk innboksen din</h2>
                <p className="text-sm text-muted-foreground">
                  Vi har sendt en lenke til <strong>{email}</strong>. Lenken er gyldig i 60 minutter.
                </p>
                <Button variant="outline" asChild className="mt-4">
                  <Link to="/login">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Tilbake til innlogging
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="p-3 bg-primary/10 rounded-xl inline-block mb-4">
                    <Mail className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="font-display text-xl">Tilbakestill passord</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Skriv inn e-posten du er registrert med
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

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sender…
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Send tilbakestillingslenke
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center text-sm">
                  <Link to="/login" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3" />
                    Tilbake til innlogging
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
