import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Loader2, KeyRound, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { z } from 'zod';

const schema = z
  .object({
    password: z.string().min(8, 'Passord må være minst 8 tegn'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passordene er ikke like',
    path: ['confirm'],
  });

export default function NyttPassord() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = schema.safeParse({ password, confirm });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      toast.success('Passord oppdatert!');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.message || 'Noe gikk galt');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <PageHeader title="Nytt passord" subtitle="Velg et nytt passord" />

      <div className="container py-8">
        <div className="max-w-md mx-auto">
          <div className="bg-card border border-border rounded-xl p-8">
            {done ? (
              <div className="text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                <h2 className="font-display text-xl">Passord oppdatert!</h2>
                <p className="text-sm text-muted-foreground">Du sendes videre til dashboardet…</p>
              </div>
            ) : !ready ? (
              <div className="text-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                <h2 className="font-display text-xl">Verifiserer lenken…</h2>
                <p className="text-sm text-muted-foreground">
                  Kom du hit uten e-postlenke?{' '}
                  <Link to="/glemt-passord" className="text-primary hover:underline">
                    Gå hit i stedet
                  </Link>
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="p-3 bg-primary/10 rounded-xl inline-block mb-4">
                    <KeyRound className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="font-display text-xl">Velg nytt passord</h2>
                  <p className="text-sm text-muted-foreground mt-1">Minst 8 tegn</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Nytt passord</label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minst 8 tegn"
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Bekreft passord</label>
                    <Input
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Gjenta passordet"
                      required
                      autoComplete="new-password"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Lagrer…
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4 mr-2" />
                        Lagre nytt passord
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
