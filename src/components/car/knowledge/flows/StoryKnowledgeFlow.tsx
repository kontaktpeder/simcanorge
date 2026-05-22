import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { RELATIONSHIP_NOTE_MAX } from "@/lib/relationshipTypes";
import { useCreateCarRelationshipRequest, type RelationshipRequestSource } from "@/hooks/useCreateCarRelationshipRequest";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  carId: string;
  source?: RelationshipRequestSource;
  sourceEventId?: string | null;
  onDone: () => void;
}

export function StoryKnowledgeFlow({ carId, source = "bil_detalj", sourceEventId = null, onDone }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const mutation = useCreateCarRelationshipRequest();
  const [text, setText] = useState("");

  const handleSubmit = async () => {
    if (!user) {
      onDone();
      navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    if (text.trim().length < 20) {
      toast.error("Skriv litt mer (minst 20 tegn)");
      return;
    }
    const result = await mutation.mutateAsync({
      carId,
      relationshipType: "storyteller",
      note: text,
      source,
      sourceEventId,
    });
    onDone();
    if ((result.code === "created" || result.code === "already_pending") && result.id) {
      navigate(`/relasjon-sendt/${result.id}`);
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, RELATIONSHIP_NOTE_MAX))}
        rows={6}
        placeholder="Historien slik du kjenner den — hvem eide den, hva skjedde, hva er spesielt?"
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
  );
}
