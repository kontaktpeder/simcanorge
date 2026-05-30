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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carId: string;
  carSlug: string;
  stewardName?: string | null;
};

export function ShareStorySheet({ open, onOpenChange, carId, carSlug, stewardName }: Props) {
  const navigate = useNavigate();
  const mutation = useCreateCarRelationshipRequest();
  const [text, setText] = useState("");

  const reset = () => setText("");

  const handleSubmit = async () => {
    if (text.trim().length < 20) {
      toast.error("Skriv litt mer (minst 20 tegn)");
      return;
    }
    try {
      await mutation.mutateAsync({
        carId,
        relationshipType: "storyteller",
        note: text,
        source: "bil_detalj",
      });
      reset();
      onOpenChange(false);
      const q = new URLSearchParams({ car: carSlug, type: "story" });
      if (stewardName) q.set("steward", stewardName);
      navigate(`/bidrag-sendt?${q.toString()}`);
    } catch {
      // toast handled in hook
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Del historie</SheetTitle>
          <SheetDescription>
            Hva vet du om bilen? Hvem eide den, hva skjedde, hva er spesielt?
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, RELATIONSHIP_NOTE_MAX))}
            rows={6}
            placeholder="Skriv her…"
            autoFocus
          />
          <p className="text-[11px] text-muted-foreground text-right">
            {text.length}/{RELATIONSHIP_NOTE_MAX}
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
