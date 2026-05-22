import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { RELATIONSHIP_OPTIONS, RELATIONSHIP_NOTE_MAX, type RelationshipType } from "@/lib/relationshipTypes";
import { useCreateCarRelationshipRequest, type RelationshipRequestSource } from "@/hooks/useCreateCarRelationshipRequest";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  carId: string;
  source?: RelationshipRequestSource;
  sourceEventId?: string | null;
  onDone: () => void;
}

const OTHER_OPTIONS = RELATIONSHIP_OPTIONS.filter((o) => o.value !== "current_owner");

export function OwnerKnowledgeFlow({ carId, source = "bil_detalj", sourceEventId = null, onDone }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const mutation = useCreateCarRelationshipRequest();

  const [mode, setMode] = useState<"owner" | "other">("owner");
  const [relType, setRelType] = useState<RelationshipType>("former_owner");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [note, setNote] = useState("");
  const [helpBuild, setHelpBuild] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      onDone();
      navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    const effectiveType: RelationshipType = mode === "owner" ? "current_owner" : relType;
    const result = await mutation.mutateAsync({
      carId,
      relationshipType: effectiveType,
      note,
      startYear: startYear ? parseInt(startYear, 10) : null,
      endYear: endYear ? parseInt(endYear, 10) : null,
      wantsStewardship: mode === "owner" ? helpBuild : false,
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
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="own-from" className="text-xs uppercase tracking-wider text-muted-foreground">Fra år</Label>
          <Input
            id="own-from"
            type="number"
            inputMode="numeric"
            placeholder="f.eks. 2010"
            value={startYear}
            onChange={(e) => setStartYear(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="own-to" className="text-xs uppercase tracking-wider text-muted-foreground">Til år</Label>
          <Input
            id="own-to"
            type="number"
            inputMode="numeric"
            placeholder={mode === "owner" ? "(åpen)" : "f.eks. 2020"}
            value={endYear}
            onChange={(e) => setEndYear(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="own-note" className="text-sm font-medium">
          Kort beskjed <span className="text-muted-foreground font-normal">(valgfritt)</span>
        </Label>
        <Textarea
          id="own-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, RELATIONSHIP_NOTE_MAX))}
          placeholder="Hva vil du dele om bilen?"
        />
      </div>

      {mode === "owner" && (
        <label className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 cursor-pointer">
          <Checkbox
            checked={helpBuild}
            onCheckedChange={(c) => setHelpBuild(c === true)}
            className="mt-0.5"
          />
          <div className="text-sm">
            <div className="font-medium text-foreground">Jeg vil hjelpe med å bygge historien</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Krever godkjenning før du kan gjøre mer.
            </div>
          </div>
        </label>
      )}

      {mode === "other" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Din relasjon</Label>
          <RadioGroup
            value={relType}
            onValueChange={(v) => setRelType(v as RelationshipType)}
            className="space-y-1.5"
          >
            {OTHER_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                htmlFor={`own-rel-${opt.value}`}
                className="flex items-start gap-3 rounded-lg border border-border p-2.5 cursor-pointer hover:bg-muted/40"
              >
                <RadioGroupItem value={opt.value} id={`own-rel-${opt.value}`} className="mt-0.5" />
                <div className="text-sm font-medium text-foreground">{opt.label}</div>
              </label>
            ))}
          </RadioGroup>
        </div>
      )}

      <div className="flex flex-col gap-2 pt-1">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="min-h-[48px]"
        >
          {mutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Send inn"
          )}
        </Button>
        <button
          type="button"
          onClick={() => setMode((m) => (m === "owner" ? "other" : "owner"))}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline self-center"
        >
          {mode === "owner" ? "Annen relasjon" : "Jeg eier den"}
        </button>
      </div>
    </div>
  );
}
