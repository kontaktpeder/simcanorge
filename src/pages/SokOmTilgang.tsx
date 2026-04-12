import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

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
        <section className="relative overflow-hidden py-10 md:py-16" style={{ background: 'linear-gradient(135deg, #4a3d30 0%, #3a2e24 40%, #2a2118 100%)' }}>
          <div className="relative z-10 max-w-[1200px] mx-auto px-5 md:px-8 text-center">
            <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-4" />
            <h1 className="text-xl sm:text-2xl md:text-3xl uppercase tracking-wide text-white font-bold italic" style={chakra}>
              Søknad mottatt!
            </h1>
            <p className="mt-2 text-sm text-white/40 max-w-md mx-auto">
              Vi behandler søknaden din og sender deg en invitasjon på e-post når du er godkjent.
            </p>
            <Link to="/" className="inline-block mt-6 text-sm text-white/60 hover:text-white underline">
              Tilbake til forsiden
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

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
            Søk om tilgang
          </h1>
          <p className="mt-1.5 text-[13px] text-white/40" style={oswald}>Bli en del av fellesskapet</p>
        </div>
      </section>

      <div className="bg-background">
        <div className="max-w-md mx-auto px-4 py-10 md:py-14">
          <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-bold uppercase tracking-wide mb-1" style={oswald}>Bli med</h2>
            <p className="text-sm text-muted-foreground mb-6">Vi åpner opp gradvis — fyll ut skjemaet så hører du fra oss.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block" style={oswald}>Navn *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ola Nordmann" required minLength={2} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block" style={oswald}>E-post *</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ola@eksempel.no" required />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block" style={oswald}>Bekreft e-post *</label>
                <Input type="email" value={emailConfirm} onChange={(e) => setEmailConfirm(e.target.value)} placeholder="ola@eksempel.no" required autoComplete="off" />
                {emailError && <p className="text-sm text-destructive mt-1">{emailError}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block" style={oswald}>
                  Fortell oss litt om deg <span className="text-muted-foreground font-normal normal-case tracking-normal">(valgfritt)</span>
                </label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hvilken bil eier du, hva interesserer deg..." rows={3} />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sender...' : 'Send søknad'}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-border text-center text-sm">
              <p>
                Har du allerede konto?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">Logg inn</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
