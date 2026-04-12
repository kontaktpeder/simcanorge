import { useState, useEffect, useRef } from "react";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown(current => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (verifiedRef.current) return;
      if (event !== "SIGNED_IN" || !session?.user) return;

      verifiedRef.current = true;

      const { error } = await supabase
        .from("cars")
        .update({ created_by_user_id: session.user.id } as any)
        .eq("id", carId);

      if (error) {
        verifiedRef.current = false;
        toast({
          title: "Innlogging registrert, men bilen ble ikke koblet",
          description: error.message || "Prøv igjen senere.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Verifisert!",
        description: "Bilen din er nå koblet til kontoen din.",
      });
      onVerified();
    });

    return () => subscription.unsubscribe();
  }, [carId, onVerified, toast]);

  const sendMagicLink = async () => {
    setIsSending(true);

    try {
      const redirectTo = `${window.location.origin}/send-inn?claimCarId=${encodeURIComponent(carId)}`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: redirectTo,
        },
      });

      if (error) throw error;

      setLinkSent(true);
      setCooldown(60);
      toast({
        title: "Lenke sendt!",
        description: `Vi har sendt en innloggingslenke til ${email}.`,
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
          Vi sender en innloggingslenke til <strong className="text-foreground">{email}</strong>.
        </p>
      </div>

      {!linkSent ? (
        <div className="mx-auto max-w-sm space-y-4">
          <Button
            onClick={sendMagicLink}
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
              <strong className="text-foreground">Du får ikke en 6-sifret kode</strong> i denne e-posten.
            </p>
            <p>
              Klikk på <strong className="text-foreground">«Logg inn»</strong> i e-posten. Når innloggingen er fullført,
              kobles bilen automatisk til kontoen din.
            </p>
            <p className="text-xs">Sjekk også spam-mappen hvis du ikke ser e-posten med en gang.</p>
          </div>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={sendMagicLink}
              disabled={cooldown > 0 || isSending}
              className="text-primary transition-colors hover:text-primary/80 disabled:text-muted-foreground"
            >
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
        </div>
      )}
    </div>
  );
}