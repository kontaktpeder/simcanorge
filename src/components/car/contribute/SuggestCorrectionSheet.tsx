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
import { Loader2 } from "lucide-react";
import { RELATIONSHIP_NOTE_MAX } from "@/lib/relationshipTypes";
import { useCreateCarRelationshipRequest } from "@/hooks/useCreateCarRelationshipRequest";
import { toast } from "sonner";

const CORRECTION_PREFIX = "Forslag til endring:";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carId: string;
  carSlug: string;
  stewardName?: string | null;
};

export function SuggestCorrectionSheet({ open, onOpenChange, carId, carSlug, stewardName }: Props) {
  const navigate = useNavigate();
  const mutation = useCreateCarRelationshipRequest();
  const [text, setText] = useState("");

  const handleSubmit = async () => {
    if (text.trim().length < 10) {
      toast.error("Skriv litt mer (minst 10 tegn)");
      return;
    }
    const note = `${CORRECTION_PREFIX}\n${text.trim()}`.slice(0, RELATIONSHIP_NOTE_MAX);
    try {
      await mutation.mutateAsync({
        carId,
        relationshipType: "contributor",
        note,
        source: "bil_detalj",
      });
      setText("");
      onOpenChange(false);
      const q = new URLSearchParams({ car: carSlug, type: "correction" });
      if (stewardName) q.set("steward", stewardName);
      navigate(`/bidrag-sendt?${q.toString()}`);
    } catch {
      // toast handled in hook
    }
  };

  const max = RELATIONSHIP_NOTE_MAX - CORRECTION_PREFIX.length - 1;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Foreslå endring</SheetTitle>
          <SheetDescription>
            Hva bør rettes eller legges til? Forslaget sendes til forvalter.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, max))}
            rows={6}
            placeholder="F.eks. årsmodell, variant, eierhistorikk…"
            autoFocus
          />
          <p className="text-[11px] text-muted-foreground text-right">
            {text.length}/{max}
          </p>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="w-full min-h-[48px]"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send inn"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
