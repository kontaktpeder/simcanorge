import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  RELATIONSHIP_OPTIONS,
  RELATIONSHIP_NOTE_MAX,
  type RelationshipType,
} from "@/lib/relationshipTypes";

type Props = {
  value: RelationshipType | "";
  note: string;
  onChange: (next: { value: RelationshipType | ""; note: string }) => void;
  error?: string;
  label?: string;
  required?: boolean;
};

export function RelationshipTypeField({
  value,
  note,
  onChange,
  error,
  label = "Hvordan kjenner du bilen?",
  required = true,
}: Props) {
  return (
    <div className="space-y-3">
      <Label htmlFor="relationship-type" className="text-sm font-semibold uppercase tracking-wide">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>

      <select
        id="relationship-type"
        value={value}
        onChange={(e) =>
          onChange({ value: e.target.value as RelationshipType | "", note })
        }
        className={`w-full h-12 px-3 text-base rounded-md border-2 bg-background ${
          error ? "border-destructive" : "border-muted"
        }`}
      >
        <option value="">Velg relasjon...</option>
        {RELATIONSHIP_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {value === "other" && (
        <div className="space-y-1.5">
          <Textarea
            value={note}
            onChange={(e) => onChange({ value, note: e.target.value })}
            maxLength={RELATIONSHIP_NOTE_MAX}
            rows={3}
            placeholder="Valgfritt: Beskriv relasjonen kort"
          />
          <p className="text-xs text-muted-foreground">
            Ikke skriv telefon, e-post eller annen sensitiv info. Maks {RELATIONSHIP_NOTE_MAX} tegn.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
