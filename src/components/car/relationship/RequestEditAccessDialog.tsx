import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ShieldCheck, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCreateCarRelationshipRequest } from "@/hooks/useCreateCarRelationshipRequest";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carId: string;
  carTitle?: string;
}

type PriorRequest = {
  id: string;
  status: string;
  created_at: string;
  reviewer_note: string | null;
  note: string | null;
};

export function RequestEditAccessDialog({ open, onOpenChange, carId, carTitle }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const mutation = useCreateCarRelationshipRequest();
  const qc = useQueryClient();
  const [note, setNote] = useState("");

  const { data: priorRequests, isLoading: loadingPrior } = useQuery({
    queryKey: ["my-car-edit-requests", carId, user?.id],
    queryFn: async (): Promise<PriorRequest[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("car_relationship_requests")
        .select("id, status, created_at, reviewer_note, note")
        .eq("car_id", carId)
        .eq("requester_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as PriorRequest[];
    },
    enabled: open && !!user,
  });

  useEffect(() => {
    if (!open) setNote("");
  }, [open]);

  const hasPending = priorRequests?.some((r) => r.status === "pending");

  const handleSubmit = async () => {
    if (!user) {
      onOpenChange(false);
      navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    const result = await mutation.mutateAsync({
      carId,
      relationshipType: "current_owner",
      note,
      wantsStewardship: true,
      source: "bil_detalj",
    });
    qc.invalidateQueries({ queryKey: ["my-car-edit-requests", carId, user.id] });
    onOpenChange(false);
    if ((result.code === "created" || result.code === "already_pending") && result.id) {
      navigate(`/relasjon-sendt/${result.id}`);
    }
  };

  const statusLabel = (s: string) =>
    s === "pending" ? "Venter på svar" : s === "approved" ? "Godkjent" : s === "rejected" ? "Avslått" : s;

  const StatusIcon = ({ s }: { s: string }) =>
    s === "pending" ? <Clock className="w-3.5 h-3.5" /> :
    s === "approved" ? <CheckCircle2 className="w-3.5 h-3.5" /> :
    <XCircle className="w-3.5 h-3.5" />;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Be om redigeringstilgang {carTitle ? `til «${carTitle}»` : ""}
          </DialogTitle>
          <DialogDescription>
            Du er i ferd med å sende en forespørsel om å forvalte denne bilen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm flex gap-3">
            <ShieldCheck className="w-5 h-5 mt-0.5 shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">Hva skjer når du sender?</p>
              <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                <li>Eieren av bilen får varsel</li>
                <li>Administrator i Bilgarasje får også varsel</li>
                <li>Du får svar når forespørselen er vurdert</li>
              </ul>
            </div>
          </div>

          {priorRequests && priorRequests.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Tidligere forespørsler
              </p>
              <ul className="space-y-1.5">
                {priorRequests.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-xs"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <StatusIcon s={r.status} />
                      {statusLabel(r.status)}
                    </span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: nb })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!hasPending && (
            <div className="space-y-1">
              <label htmlFor="edit-access-note" className="text-sm font-medium">
                Kort beskjed til eier <span className="text-muted-foreground font-normal">(valgfritt)</span>
              </label>
              <Textarea
                id="edit-access-note"
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 500))}
                placeholder="Hvorfor ønsker du å forvalte denne bilen?"
                rows={3}
              />
            </div>
          )}

          {hasPending && (
            <p className="text-xs text-muted-foreground">
              Du har allerede en ventende forespørsel. Vent på svar før du sender en ny.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Avbryt
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending || hasPending || loadingPrior}
          >
            {mutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sender…</>
            ) : !user ? (
              "Logg inn for å sende"
            ) : (
              "Send forespørsel"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
