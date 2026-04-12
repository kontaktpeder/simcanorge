import { useState, useEffect, useRef } from "react";
import { Mail, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
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
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const verifiedRef = useRef(false);

  // Listen for magic link sign-in (user clicks the link in email)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (verifiedRef.current) return;
      if (event === "SIGNED_IN" && session?.user) {
        verifiedRef.current = true;
        // Link car to the authenticated user
        await supabase
          .from("cars")
          .update({ created_by_user_id: session.user.id } as any)
          .eq("id", carId);
        toast({
          title: "Verifisert!",
          description: "Bilen din er nå koblet til kontoen din.",
        });
        onVerified();
      }
    });
    return () => subscription.unsubscribe();
  }, [carId, onVerified, toast]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendOtp = async () => {
    setIsSending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });
      if (error) throw error;
      setOtpSent(true);
      setCooldown(60);
      toast({
        title: "E-post sendt!",
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

  const verifyOtp = async () => {
    if (otp.length < 6) return;
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });
      if (error) throw error;

      if (data.user && !verifiedRef.current) {
        verifiedRef.current = true;
        await supabase
          .from("cars")
          .update({ created_by_user_id: data.user.id } as any)
          .eq("id", carId);
      }

      toast({
        title: "Verifisert!",
        description: "Bilen din er nå koblet til kontoen din.",
      });
      onVerified();
    } catch (err: any) {
      toast({
        title: "Ugyldig kode",
        description: err?.message || "Sjekk koden og prøv igjen.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Mail className="w-8 h-8 text-primary" />
      </div>

      <div className="space-y-2">
        <h2 className="font-display text-2xl sm:text-3xl text-foreground">
          Bilen er sendt inn!
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
          Vil du koble bilen til en konto? Da kan du redigere den selv senere.
          Vi sender en innloggingslenke til <strong className="text-foreground">{email}</strong>.
        </p>
      </div>

      {!otpSent ? (
        <div className="space-y-4 max-w-sm mx-auto">
          <Button
            onClick={sendOtp}
            disabled={isSending}
            className="w-full btn-enamel-blue h-14 text-lg"
          >
            {isSending ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sender…</>
            ) : (
              <><Mail className="w-5 h-5 mr-2" /> Send innloggingslenke</>
            )}
          </Button>
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
          >
            Hopp over – jeg gjør dette senere
          </button>
        </div>
      ) : (
        <div className="space-y-4 max-w-sm mx-auto">
          <div className="p-4 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">Sjekk innboksen din</strong> (og spam-mappen).
            </p>
            <p>
              Klikk på <strong>«Logg inn»</strong>-knappen i e-posten for å koble bilen til kontoen din.
            </p>
            <p className="text-xs">
              Alternativt kan du skrive inn den 6-sifrede koden fra e-posten nedenfor.
            </p>
          </div>

          <div className="space-y-2">
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Eventuell 6-sifret kode"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="h-14 text-center text-2xl tracking-[0.3em] font-mono border-2 border-muted"
              maxLength={6}
            />
          </div>

          <Button
            onClick={verifyOtp}
            disabled={isVerifying || otp.length < 6}
            className="w-full btn-enamel-blue h-14 text-lg"
          >
            {isVerifying ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Verifiserer…</>
            ) : (
              <><CheckCircle className="w-5 h-5 mr-2" /> Bekreft kode</>
            )}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={sendOtp}
              disabled={cooldown > 0 || isSending}
              className="text-primary hover:text-primary/80 disabled:text-muted-foreground transition-colors"
            >
              {cooldown > 0 ? `Send på nytt (${cooldown}s)` : "Send på nytt"}
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Hopp over <ArrowRight className="w-3 h-3 inline ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}