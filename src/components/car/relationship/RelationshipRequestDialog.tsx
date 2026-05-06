import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import {
  RELATIONSHIP_OPTIONS,
  RELATIONSHIP_NOTE_MAX,
  type RelationshipType,
} from "@/lib/relationshipTypes";
import { useCreateCarRelationshipRequest, type RelationshipRequestSource } from "@/hooks/useCreateCarRelationshipRequest";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface RelationshipRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carId: string;
  carTitle?: string;
  defaultRelationship?: RelationshipType;
  source?: RelationshipRequestSource;
  sourceEventId?: string | null;
  onSubmitted?: () => void;
}

export function RelationshipRequestDialog({
  open,
  onOpenChange,
  carId,
  carTitle,
  defaultRelationship = "current_owner",
  source = "manual",
  sourceEventId = null,
  onSubmitted,
}: RelationshipRequestDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const mutation = useCreateCarRelationshipRequest();

  const [relType, setRelType] = useState<RelationshipType>(defaultRelationship);
  const [note, setNote] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [wantsStewardship, setWantsStewardship] = useState(false);

  const reset = () => {
    setRelType(defaultRelationship);
    setNote("");
    setStartYear("");
    setEndYear("");
    setWantsStewardship(false);
  };

  const handleSubmit = async () => {
    if (!user) {
      onOpenChange(false);
      navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    const result = await mutation.mutateAsync({
      carId,
      relationshipType: relType,
      note,
      startYear: startYear ? parseInt(startYear, 10) : null,
      endYear: endYear ? parseInt(endYear, 10) : null,
      wantsStewardship: relType === "current_owner" ? wantsStewardship : false,
      source,
      sourceEventId,
    });

    reset();
    onOpenChange(false);
    onSubmitted?.();

    // Naviger kun når en NY forespørsel ble opprettet — eller en eksisterende ventende ble funnet.
    if ((result.code === "created" || result.code === "already_pending") && result.id) {
      navigate(`/relasjon-sendt/${result.id}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Knytt deg til {carTitle ? `«${carTitle}»` : "denne bilen"}
          </DialogTitle>
          <DialogDescription>
            Velg hva som beskriver deg best. En ansvarlig vurderer forespørselen.
            Godkjenning knytter deg til bilens historikk, men gir ikke redigeringsrett.
            For redigering må en eier sende deg en invitasjonslenke.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Din relasjon</Label>
            <RadioGroup
              value={relType}
              onValueChange={(v) => setRelType(v as RelationshipType)}
              className="space-y-1.5"
            >
              {RELATIONSHIP_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  htmlFor={`rel-${opt.value}`}
                  className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/40 transition-colors"
                >
                  <RadioGroupItem value={opt.value} id={`rel-${opt.value}`} className="mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-foreground">{opt.label}</div>
                    {opt.helper && (
                      <div className="text-xs text-muted-foreground mt-0.5">{opt.helper}</div>
                    )}
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          {(relType === "former_owner" || relType === "current_owner" || relType === "restorer") && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="rel-start" className="text-xs uppercase tracking-wider text-muted-foreground">Fra år</Label>
                <Input
                  id="rel-start"
                  type="number"
                  inputMode="numeric"
                  placeholder="f.eks. 1998"
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="rel-end" className="text-xs uppercase tracking-wider text-muted-foreground">Til år</Label>
                <Input
                  id="rel-end"
                  type="number"
                  inputMode="numeric"
                  placeholder={relType === "current_owner" ? "(åpen)" : "f.eks. 2010"}
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="rel-note" className="text-sm font-medium">
              Kort beskjed <span className="text-muted-foreground font-normal">(valgfritt)</span>
            </Label>
            <Textarea
              id="rel-note"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, RELATIONSHIP_NOTE_MAX))}
              placeholder="Hvorfor kjenner du denne bilen? Hva vil du bidra med?"
              rows={3}
            />
            <p className="text-[11px] text-muted-foreground text-right">
              {note.length}/{RELATIONSHIP_NOTE_MAX}
            </p>
          </div>

          {relType === "current_owner" && (
            <label className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 cursor-pointer">
              <Checkbox
                checked={wantsStewardship}
                onCheckedChange={(c) => setWantsStewardship(c === true)}
                className="mt-0.5"
              />
              <div className="text-sm">
                <div className="font-medium text-foreground">Jeg ønsker å forvalte profilen</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Dette krever ekstra verifisering og behandles manuelt. Du får ikke
                  redigeringsrett automatisk.
                </div>
              </div>
            </label>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Avbryt
          </Button>
          <Button
            className="btn-enamel-blue"
            onClick={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sender…</>
            ) : user ? (
              "Send forespørsel"
            ) : (
              "Logg inn for å sende"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
