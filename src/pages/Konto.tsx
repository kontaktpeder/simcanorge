import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SeoHead } from "@/components/seo";
import { User, LogOut, Shield, Trash2, Mail, Calendar, Loader2, AlertTriangle } from "lucide-react";

import { Layout } from "@/components/layout/Layout";
import { GaragePageShell, GaragePanel, GARAGE_BG, garageBtn } from "@/components/layout/GaragePageShell";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAccountRequests, useCreateAccountRequest } from "@/hooks/useAccountRequests";
import { toast } from "sonner";
import { getBrowserAuthSupport } from "@/lib/browserSupport";
import { SITE_NAME } from "@/config/site";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Konto() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [anonymizeMessage, setAnonymizeMessage] = useState("");
  const [showAnonymizeForm, setShowAnonymizeForm] = useState(false);
  const [compatWarning, setCompatWarning] = useState<string | null>(null);

  useEffect(() => {
    const support = getBrowserAuthSupport();
    if (!support.ok) {
      setCompatWarning(
        "Denne PC-en/nettleseren ser ut til å mangle støtte som trengs for innlogging: " +
          support.reasons.join(" ") +
          " Prøv å oppdatere nettleseren (Chrome/Edge/Firefox) eller slå på cookies/lagring."
      );
    } else {
      setCompatWarning(null);
    }
  }, []);

  const { data: accountRequests } = useAccountRequests(user?.id);
  const createRequest = useCreateAccountRequest();

  const handleSendMagicLink = async () => {
    if (!email) {
      toast.error("Skriv inn e-postadressen din");
      return;
    }

    setIsSendingMagicLink(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/konto`,
        },
      });

      if (error) throw error;
      setMagicLinkSent(true);
      toast.success("Innloggingslenke sendt til e-posten din!");
    } catch (error) {
      console.error("Magic link error:", error);
      toast.error("Kunne ikke sende innloggingslenke. Prøv igjen.");
    } finally {
      setIsSendingMagicLink(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
    toast.success("Du er nå logget ut");
  };

  const handleAnonymizeRequest = () => {
    if (!user) return;
    createRequest.mutate({
      userId: user.id,
      type: "anonymize",
      message: anonymizeMessage || undefined,
    });
    setShowAnonymizeForm(false);
    setAnonymizeMessage("");
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { user_id: user.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Kontoen din er slettet. Du blir nå logget ut.");
      setTimeout(() => {
        signOut();
        navigate("/login");
      }, 1500);
    } catch (err: unknown) {
      console.error("Delete account error:", err);
      toast.error(
        err instanceof Error ? err.message : "Kunne ikke slette kontoen. Prøv igjen."
      );
      setIsDeleting(false);
    }
  };

  const hasPendingRequest = (type: "anonymize" | "delete_account") => {
    return accountRequests?.some((r) => r.type === type && r.status !== "done");
  };

  if (authLoading) {
    return (
      <Layout>
        <div
          className="min-h-[60vh] flex items-center justify-center"
          style={{ backgroundColor: GARAGE_BG }}
        >
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SeoHead
        title={`Konto | ${SITE_NAME}`}
        description={`Administrer kontoen din på ${SITE_NAME}`}
        canonicalPath="/konto"
        noindex
      />

      <GaragePageShell title="Konto">
        <div className="mb-5">
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-neutral-500">
            Konto
          </p>
          <h2 className="text-[26px] sm:text-[30px] font-bold leading-tight mt-1">
            {user ? "Innlogget" : "Logg inn"}
          </h2>
        </div>

        <div className="space-y-4">
          <GaragePanel>
            <h3 className="text-[15px] font-semibold mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-neutral-500" />
              {user ? "Innlogging" : "Logg inn"}
            </h3>

            {compatWarning && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-neutral-800">{compatWarning}</p>
              </div>
            )}

            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-black/[0.04]">
                  <Mail className="h-5 w-5 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-500">E-post</p>
                    <p className="text-sm font-medium">{user.email}</p>
                  </div>
                </div>

                {user.created_at && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-black/[0.04]">
                    <Calendar className="h-5 w-5 text-neutral-400" />
                    <div>
                      <p className="text-xs text-neutral-500">Konto opprettet</p>
                      <p className="text-sm font-medium">
                        {new Date(user.created_at).toLocaleDateString("nb-NO", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  className={cn("w-full justify-start h-11 rounded-xl", garageBtn.outline)}
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logg ut
                </Button>
              </div>
            ) : magicLinkSent ? (
              <div className="text-center py-6">
                <Mail className="h-10 w-10 mx-auto text-neutral-400 mb-3" />
                <h3 className="text-[15px] font-semibold mb-1">Sjekk e-posten din</h3>
                <p className="text-sm text-neutral-600 mb-4">
                  Vi har sendt en innloggingslenke til <strong>{email}</strong>
                </p>
                <Button
                  variant="ghost"
                  className={garageBtn.ghost}
                  onClick={() => {
                    setMagicLinkSent(false);
                    setEmail("");
                  }}
                >
                  Bruk en annen e-post
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-neutral-600">
                  Logg inn med e-posten din. Vi sender deg en sikker innloggingslenke.
                </p>
                <Input
                  type="email"
                  placeholder="din@epost.no"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMagicLink()}
                  className="h-11 rounded-xl"
                />
                <Button
                  className={cn("w-full h-11 rounded-xl", garageBtn.primary)}
                  onClick={handleSendMagicLink}
                  disabled={isSendingMagicLink || !email}
                >
                  {isSendingMagicLink ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  {isSendingMagicLink ? "Sender..." : "Send innloggingslenke"}
                </Button>
              </div>
            )}
          </GaragePanel>

          {user && (
            <GaragePanel>
              <h3 className="text-[15px] font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4 text-neutral-500" />
                Personvern og kontroll
              </h3>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className={cn("w-full justify-start h-11 rounded-xl", garageBtn.outline)}
                  onClick={() => navigate("/personvern")}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Les personvernerklæringen
                </Button>

                <Button
                  variant="outline"
                  className={cn("w-full justify-start h-11 rounded-xl", garageBtn.outline)}
                  onClick={() => navigate("/vilkar")}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Les brukervilkår
                </Button>

                {hasPendingRequest("anonymize") ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm text-amber-900">
                      Du har allerede sendt en forespørsel om anonymisering. Vi behandler den så snart som mulig.
                    </p>
                  </div>
                ) : showAnonymizeForm ? (
                  <div className="space-y-3 p-4 bg-neutral-50 rounded-xl border border-black/[0.04]">
                    <p className="text-sm text-neutral-600">
                      Beskriv hva du ønsker anonymisert (valgfritt):
                    </p>
                    <Textarea
                      placeholder="F.eks. fjern navnet mitt fra bilprofiler..."
                      value={anonymizeMessage}
                      onChange={(e) => setAnonymizeMessage(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button className={cn("rounded-xl", garageBtn.primary)} onClick={handleAnonymizeRequest} disabled={createRequest.isPending}>
                        {createRequest.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Send forespørsel
                      </Button>
                      <Button
                        variant="ghost"
                        className={garageBtn.ghost}
                        onClick={() => {
                          setShowAnonymizeForm(false);
                          setAnonymizeMessage("");
                        }}
                      >
                        Avbryt
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start h-11 rounded-xl", garageBtn.outline)}
                    onClick={() => setShowAnonymizeForm(true)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Be om anonymisering
                  </Button>
                )}

                {isDeleting ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                    <p className="text-sm text-red-700">Sletter kontoen din...</p>
                  </div>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start h-11 rounded-xl", garageBtn.danger)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Slett konto
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          Slett konto
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <p>Er du sikker på at du vil slette kontoen din? Dette kan ikke angres.</p>
                          <p>
                            All din data, inkludert biler du er eneste eier av, vil bli permanent
                            slettet.
                          </p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Ja, slett kontoen min
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </GaragePanel>
          )}

          {user && accountRequests && accountRequests.length > 0 && (
            <GaragePanel>
              <h3 className="text-[15px] font-semibold mb-4 flex items-center gap-2">
                <Mail className="h-4 w-4 text-neutral-500" />
                Dine forespørsler
              </h3>
              <div className="space-y-3">
                {accountRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 rounded-xl bg-neutral-50 border border-black/[0.04]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {request.type === "anonymize" ? "Anonymisering" : "Sletting av konto"}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          request.status === "done"
                            ? "bg-green-100 text-green-800"
                            : request.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {request.status === "done"
                          ? "Fullført"
                          : request.status === "in_progress"
                            ? "Under behandling"
                            : "Mottatt"}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500">
                      Sendt {new Date(request.created_at).toLocaleDateString("nb-NO")}
                    </p>
                    {request.message && (
                      <p className="text-sm mt-2 italic text-neutral-600">
                        &quot;{request.message}&quot;
                      </p>
                    )}
                    {request.admin_note && (
                      <p className="text-sm mt-2 text-neutral-800">Svar: {request.admin_note}</p>
                    )}
                  </div>
                ))}
              </div>
            </GaragePanel>
          )}
        </div>
      </GaragePageShell>
    </Layout>
  );
}
