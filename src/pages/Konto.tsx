import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { User, LogOut, Shield, Trash2, Mail, Calendar, Loader2, AlertTriangle, Bookmark, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useMySavedQuestions } from "@/hooks/useQuestionSave";
import { Layout } from "@/components/layout/Layout";
import { EnamelCard, SectionHeader, BigActionButton } from "@/components/ui/garage";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAccountRequests, useCreateAccountRequest } from "@/hooks/useAccountRequests";
import { toast } from "sonner";
import { getBrowserAuthSupport } from "@/lib/browserSupport";
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

  const { data: accountRequests, isLoading: requestsLoading } = useAccountRequests(user?.id);
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
      // Small delay so the toast is visible
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

  const hasPendingRequest = (type: 'anonymize' | 'delete_account') => {
    return accountRequests?.some(r => r.type === type && r.status !== 'done');
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>Konto | Bilgarasje.no</title>
        <meta name="description" content="Administrer kontoen din på Bilgarasje.no" />
      </Helmet>

      <div className="container max-w-2xl mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="font-display text-3xl font-bold text-foreground mb-6">Konto</h1>
        </motion.div>

        <div className="space-y-6">
          {/* Innlogging / Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <EnamelCard>
              <SectionHeader 
                title={user ? "Innlogget" : "Logg inn"} 
                icon={<User className="h-5 w-5" />} 
              />

              {compatWarning && (
                <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-sm text-foreground">{compatWarning}</p>
                </div>
              )}

              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">E-post</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>

                  {user.created_at && (
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Konto opprettet</p>
                        <p className="font-medium">
                          {new Date(user.created_at).toLocaleDateString("nb-NO", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {(user.user_metadata?.full_name || user.user_metadata?.name) && (
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Navn</p>
                        <p className="font-medium">
                          {user.user_metadata?.full_name || user.user_metadata?.name}
                        </p>
                      </div>
                    </div>
                  )}

                  <BigActionButton
                    onClick={handleSignOut}
                    icon={<LogOut className="h-5 w-5" />}
                    variant="secondary"
                  >
                    Logg ut
                  </BigActionButton>
                </div>
              ) : magicLinkSent ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 mx-auto text-primary mb-4" />
                  <h3 className="font-display text-lg font-semibold mb-2">
                    Sjekk e-posten din
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Vi har sendt en innloggingslenke til <strong>{email}</strong>
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setMagicLinkSent(false);
                      setEmail("");
                    }}
                  >
                    Bruk en annen e-post
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Logg inn med e-posten din. Vi sender deg en sikker innloggingslenke.
                  </p>
                  <div className="space-y-3">
                    <Input
                      type="email"
                      placeholder="din@epost.no"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMagicLink()}
                    />
                    <BigActionButton
                      onClick={handleSendMagicLink}
                      disabled={isSendingMagicLink || !email}
                      icon={isSendingMagicLink ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
                    >
                      {isSendingMagicLink ? "Sender..." : "Send innloggingslenke"}
                    </BigActionButton>
                  </div>
                </div>
              )}
            </EnamelCard>
          </motion.div>


          {/* Mine lagrede spørsmål */}
          {user && <SavedQuestionsCard />}

          {/* Personvern og kontroll - kun synlig når innlogget */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <EnamelCard>
                <SectionHeader 
                  title="Personvern og kontroll" 
                  icon={<Shield className="h-5 w-5" />} 
                />

                <div className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate("/personvern")}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Les personvernerklæringen
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate("/vilkar")}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Les brukervilkår
                  </Button>

                  {/* Anonymisering */}
                  {hasPendingRequest('anonymize') ? (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        ✓ Du har allerede sendt en forespørsel om anonymisering. Vi behandler den så snart som mulig.
                      </p>
                    </div>
                  ) : showAnonymizeForm ? (
                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Beskriv hva du ønsker anonymisert (valgfritt):
                      </p>
                      <Textarea
                        placeholder="F.eks. fjern navnet mitt fra bilprofiler..."
                        value={anonymizeMessage}
                        onChange={(e) => setAnonymizeMessage(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleAnonymizeRequest}
                          disabled={createRequest.isPending}
                        >
                          {createRequest.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : null}
                          Send forespørsel
                        </Button>
                        <Button
                          variant="ghost"
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
                      className="w-full justify-start"
                      onClick={() => setShowAnonymizeForm(true)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Be om anonymisering
                    </Button>
                  )}

                  {/* Slett konto */}
                  {isDeleting ? (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
                      <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                      <p className="text-sm text-destructive">
                        Sletter kontoen din...
                      </p>
                    </div>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50 hover:bg-destructive/5"
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
                            <p>
                              Er du sikker på at du vil slette kontoen din? Dette kan ikke angres.
                            </p>
                            <p>
                              All din data, inkludert biler du er eneste eier av, vil bli permanent slettet.
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
              </EnamelCard>
            </motion.div>
          )}

          {/* Tidligere forespørsler */}
          {user && accountRequests && accountRequests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <EnamelCard>
                <SectionHeader 
                  title="Dine forespørsler" 
                  icon={<Mail className="h-5 w-5" />} 
                />

                <div className="space-y-3">
                  {accountRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          {request.type === 'anonymize' ? 'Anonymisering' : 'Sletting av konto'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          request.status === 'done' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : request.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                        }`}>
                          {request.status === 'done' ? 'Fullført' : request.status === 'in_progress' ? 'Under behandling' : 'Mottatt'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Sendt {new Date(request.created_at).toLocaleDateString("nb-NO")}
                      </p>
                      {request.message && (
                        <p className="text-sm mt-2 italic">"{request.message}"</p>
                      )}
                      {request.admin_note && (
                        <p className="text-sm mt-2 text-primary">
                          Svar: {request.admin_note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </EnamelCard>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}
