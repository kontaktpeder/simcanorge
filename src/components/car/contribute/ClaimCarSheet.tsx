import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carId: string;
  carSlug: string;
  onClaimSuccess?: () => void;
};

const NOTE_MAX = 600;

export function ClaimCarSheet({ open, onOpenChange, carId, carSlug, onClaimSuccess }: Props) {
  const navigate = useNavigate();
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);

  const reset = () => {
    setNote("");
    setConfirmed(false);
  };

  const handleSubmit = async () => {
    if (!confirmed) {
      toast.error("Du må bekrefte tilknytningen først.");
      return;
    }
    setPending(true);
    try {
      const { data, error } = await supabase.rpc("claim_car_as_steward", {
        p_car_id: carId,
        p_note: note.trim() || null,
      });
      if (error) throw error;
      const res = data as { ok: boolean; error?: string; slug?: string } | null;
      if (!res?.ok) {
        if (res?.error === "already_stewarded") {
          toast.error("Denne bilen forvaltes allerede. Send heller inn historie eller forslag til endring.");
        } else if (res?.error === "not_authenticated") {
          toast.error("Du må være logget inn.");
        } else if (res?.error === "car_not_found") {
          toast.error("Fant ikke bilen.");
        } else {
          toast.error("Kunne ikke fullføre overtakelse.");
        }
        return;
      }
      reset();
      onOpenChange(false);
      const q = new URLSearchParams({ car: carSlug, type: "claim", steward: "1" });
      navigate(`/bidrag-sendt?${q.toString()}`);
    } catch (err) {
      console.error("claim_car_as_steward failed", err);
      toast.error("Noe gikk galt. Prøv igjen.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Er dette din bil?</SheetTitle>
          <SheetDescription>
            Når du overtar bilen, blir du forvalter av siden. Du kan redigere informasjon,
            legge til bilder og bygge historien videre.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Melding (valgfritt)</label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
              rows={4}
              placeholder="Kort om din tilknytning til bilen…"
            />
            <p className="text-[11px] text-muted-foreground text-right mt-1">
              {note.length}/{NOTE_MAX}
            </p>
          </div>

          <label className="flex items-start gap-2.5 text-sm cursor-pointer">
            <Checkbox
              checked={confirmed}
              onCheckedChange={(v) => setConfirmed(v === true)}
              className="mt-0.5"
            />
            <span className="text-foreground/90 leading-snug">
              Jeg har tilknytning til bilen og vil forvalte siden.
            </span>
          </label>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={pending || !confirmed}
            className="w-full min-h-[48px]"
          >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Overta som forvalter"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
