import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy, Clock, Trash2, Users, Mail, MessageCircle, Info } from "lucide-react";

type Invitation = {
  id: string;
  email: string;
  token: string;
  expires_at: string;
  created_at: string;
};

type Props = { carId: string };

export function CarAccessInviteSection({ carId }: Props) {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchInvitations = async () => {
    const { data, error } = await supabase
      .from("car_invitations")
      .select("id, email, token, expires_at, created_at")
      .eq("car_id", carId)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Kunne ikke hente invitasjoner");
      return;
    }
    setInvitations((data as Invitation[]) || []);
  };

  useEffect(() => {
    void fetchInvitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carId]);

  const copyInviteLink = async (token: string) => {
    const link = `${window.location.origin}/i/${token}`;
    await navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
    toast.success("Invitasjonslenke kopiert");
  };

  const createInvite = async () => {
    if (!user) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return toast.error("Skriv inn e-post");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return toast.error("Ugyldig e-postadresse");
    }

    setIsCreating(true);
    try {
      const { data: existing } = await supabase
        .from("car_invitations")
        .select("id, email, token, expires_at, created_at")
        .eq("car_id", carId)
        .eq("email", normalizedEmail)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (existing) {
        await copyInviteLink((existing as Invitation).token);
        setEmail("");
        if (!invitations.find((i) => i.id === (existing as Invitation).id)) {
          setInvitations((prev) => [existing as Invitation, ...prev]);
        }
        return;
      }

      const token = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
      const expires = new Date();
      expires.setDate(expires.getDate() + 7);

      const { data, error } = await supabase
        .from("car_invitations")
        .insert({
          car_id: carId,
          email: normalizedEmail,
          token,
          expires_at: expires.toISOString(),
          created_by: user.id,
        })
        .select("id, email, token, expires_at, created_at")
        .single();

      if (error) throw error;

      setInvitations((prev) => [data as Invitation, ...prev]);
      setEmail("");
      await copyInviteLink(token);
      toast.success("Invitasjon opprettet – gir redigeringstilgang");
    } catch (e) {
      console.error(e);
      toast.error("Kunne ikke opprette invitasjon");
    } finally {
      setIsCreating(false);
    }
  };

  const removeInvite = async (id: string) => {
    const { error } = await supabase.from("car_invitations").delete().eq("id", id);
    if (error) {
      toast.error("Kunne ikke slette invitasjon");
      return;
    }
    setInvitations((prev) => prev.filter((i) => i.id !== id));
    toast.success("Invitasjon slettet");
  };

  const daysLeft = (expiresAt: string) =>
    Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000));

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-4 h-4 text-[#34eab8]" />
        <h3
          className="text-[15px] uppercase tracking-[0.12em] text-white font-bold"
          style={{ fontFamily: "'Chakra Petch', sans-serif" }}
        >
          Del tilgang til bilen
        </h3>
      </div>
      <p className="text-[13px] text-white/55 mb-1">
        Inviter noen som hjelper med bilder, historikk eller prosjektet.
      </p>
      <p className="text-[12px] text-white/40 mb-4">
        Invitasjonen gir full redigeringstilgang (eier).
      </p>

      <div className="rounded-lg border border-white/10 bg-black/20 p-3 mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Info className="w-3.5 h-3.5 text-[#34eab8]" />
          <p
            className="text-[11px] uppercase tracking-[0.12em] text-white/70 font-bold"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            Slik fungerer det
          </p>
        </div>
        <ol className="space-y-1.5 text-[12px] text-white/60 leading-relaxed">
          <li>
            <span className="text-[#34eab8] font-bold">1.</span> Skriv inn e-posten
            til personen og trykk «Lag invitasjonslenke». Lenken kopieres automatisk.
          </li>
          <li className="flex gap-1.5">
            <span className="text-[#34eab8] font-bold">2.</span>
            <span>
              Send lenken til bidragsyteren selv – på{" "}
              <span className="inline-flex items-center gap-0.5 text-white/80">
                <Mail className="w-3 h-3" /> e-post
              </span>
              ,{" "}
              <span className="inline-flex items-center gap-0.5 text-white/80">
                <MessageCircle className="w-3 h-3" /> SMS, Messenger
              </span>{" "}
              eller annen melding. Vi sender ikke noe automatisk.
            </span>
          </li>
          <li>
            <span className="text-[#34eab8] font-bold">3.</span> Personen åpner
            lenken og må logge inn eller registrere seg med <em>samme e-post</em>{" "}
            som invitasjonen er sendt til.
          </li>
          <li>
            <span className="text-[#34eab8] font-bold">4.</span> Bilen dukker opp i
            deres garasje, og de får full redigeringstilgang som eier.
          </li>
          <li>
            <span className="text-[#34eab8] font-bold">5.</span> Lenken utløper
            etter 7 dager og kan kun brukes én gang. Du kan slette den når som helst.
          </li>
        </ol>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="email"
          placeholder="navn@eksempel.no"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isCreating) {
              e.preventDefault();
              void createInvite();
            }
          }}
          className="bg-white/5 border-white/10 text-white"
        />
        <Button
          onClick={() => void createInvite()}
          disabled={isCreating || !email.trim()}
          className="bg-[#34eab8] text-[#070b10] hover:bg-[#2dd4a8] font-bold whitespace-nowrap"
        >
          Lag invitasjonslenke
        </Button>
      </div>

      {invitations.length > 0 && (
        <ul className="mt-5 space-y-3">
          {invitations.map((inv) => {
            const link = `${window.location.origin}/i/${inv.token}`;
            const copied = copiedToken === inv.token;
            return (
              <li
                key={inv.id}
                className="rounded-lg border border-white/10 bg-black/20 p-3"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-[13px] text-white/85 font-medium truncate">
                    {inv.email}
                  </p>
                  <button
                    type="button"
                    onClick={() => void removeInvite(inv.id)}
                    className="text-destructive hover:text-red-400 p-1"
                    aria-label="Slett invitasjon"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-[11px] text-white/45 truncate flex-1 font-mono">
                    {link}
                  </p>
                  <button
                    type="button"
                    onClick={() => void copyInviteLink(inv.token)}
                    className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider px-2 py-1 rounded border border-white/10 text-white/70 hover:bg-white/5"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Kopiert" : "Kopier"}
                  </button>
                </div>
                <p className="text-[11px] text-white/40 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Utløper om {daysLeft(inv.expires_at)} dager
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
