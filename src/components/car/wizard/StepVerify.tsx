import { useState, useEffect, useRef } from "react";
import { Mail, ArrowRight, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StepVerifyProps {
  email: string;
  carId: string;
  onSkip: () => void;
  onVerified: () => void;
}

export function StepVerify({ email, carId, onSkip, onVerified }: StepVerifyProps) {
  const { toast } = useToast();
  const [linkSent, setLinkSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [activeEmail, setActiveEmail] = useState(email);
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown(current => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    const claimCar = async () => {
      if (verifiedRef.current) return;
      verifiedRef.current = true;

      const { data, error } = await supabase.rpc("claim_car_after_email_verify", {
        p_car_id: carId,
      });

      if (error || !(data as any)?.ok) {
        verifiedRef.current = false;
        const reason = (data as any)?.error || error?.message || "";
        const isMismatch = reason === "car_not_claimable";
        toast({
          title: isMismatch ? "Bilen ble ikke koblet til kontoen" : "Innlogging registrert, men bilen ble ikke koblet",
          description: isMismatch
            ? "Du logget inn med en annen e-post enn den du brukte ved innsending. Bruk samme e-post for å koble bilen."
            : reason || "Prøv igjen senere.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Verifisert!",
        description: "Bilen din er nå koblet til kontoen din.",
      });
      onVerified();
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (verifiedRef.current) return;
      if (event !== "SIGNED_IN" || !session?.user) return;
      void claimCar();
    });

    return () => subscription.unsubscribe();
  }, [carId, onVerified, toast]);

  const sendMagicLink = async (targetEmail?: string) => {
    const emailToSend = targetEmail || activeEmail;
    setIsSending(true);

    try {
      localStorage.setItem("pendingClaimCarId", carId);
      const redirectUrl = new URL("/send-inn", window.location.origin);
      redirectUrl.searchParams.set("claimCarId", carId);

      const { error } = await supabase.auth.signInWithOtp({
        email: emailToSend,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: redirectUrl.toString(),
        },
      });

      if (error) throw error;

      setActiveEmail(emailToSend);
      setLinkSent(true);
      setCooldown(60);
      setShowChangeEmail(false);
      toast({
        title: "Lenke sendt!",
        description: `Vi har sendt en innloggingslenke til ${emailToSend}.`,
      });
    } catch (err: any) {
      toast({
        title: "Kunne ikke sende e-post",
        description: err?.message || "Prøv igjen senere.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleChangeEmail = () => {
    if (!newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast({ title: "Ugyldig e-postadresse", variant: "destructive" });
      return;
    }
    void sendMagicLink(newEmail.trim().toLowerCase());
  };

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Mail className="h-8 w-8 text-primary" />
      </div>

      <div className="space-y-2">
        <h2 className="font-display text-2xl text-foreground sm:text-3xl">
          Bilen er sendt inn!
        </h2>
        <p className="mx-auto max-w-md text-sm text-muted-foreground sm:text-base">
          Vil du koble bilen til en konto? Da kan du redigere den selv senere.
          Vi sender en innloggingslenke til <strong className="text-foreground">{activeEmail}</strong>.
        </p>
        <p className="mx-auto max-w-md rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Viktig: bruk samme e-post som du vil logge inn med. E-posten brukes som nøkkel for å koble bilen til kontoen din.
        </p>
      </div>

      {!linkSent ? (
        <div className="mx-auto max-w-sm space-y-4">
          <Button
            onClick={() => sendMagicLink()}
            disabled={isSending}
            className="btn-enamel-blue h-14 w-full text-lg"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sender…
              </>
            ) : (
              <>
                <Mail className="mr-2 h-5 w-5" /> Send innloggingslenke
              </>
            )}
          </Button>
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-muted-foreground underline transition-colors hover:text-foreground"
          >
            Hopp over – jeg gjør dette senere
          </button>
        </div>
      ) : (
        <div className="mx-auto max-w-sm space-y-4">
          <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-4 text-left text-sm text-muted-foreground">
            <p>
              Klikk på <strong className="text-foreground">«Logg inn»</strong> i e-posten du mottar. Bilen kobles automatisk til kontoen din.
            </p>
            <p className="text-xs">Sjekk også spam-mappen hvis du ikke ser e-posten.</p>
          </div>

          <div className="flex flex-col gap-3">
            {/* Resend */}
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => sendMagicLink()}
                disabled={cooldown > 0 || isSending}
                className="flex items-center gap-1 text-primary transition-colors hover:text-primary/80 disabled:text-muted-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                {cooldown > 0 ? `Send på nytt (${cooldown}s)` : "Send på nytt"}
              </button>
              <button
                type="button"
                onClick={onSkip}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Hopp over <ArrowRight className="ml-1 inline h-3 w-3" />
              </button>
            </div>

            {/* Change email */}
            {!showChangeEmail ? (
              <button
                type="button"
                onClick={() => setShowChangeEmail(true)}
                className="text-xs text-muted-foreground underline transition-colors hover:text-foreground"
              >
                Bruk en annen e-postadresse
              </button>
            ) : (
              <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground text-left">Skriv inn ny e-postadresse:</p>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="ny@epost.no"
                  className="h-10 text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setShowChangeEmail(false); setNewEmail(""); }}
                    className="flex-1"
                  >
                    Avbryt
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleChangeEmail}
                    disabled={isSending || !newEmail.trim()}
                    className="flex-1"
                  >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send lenke"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
