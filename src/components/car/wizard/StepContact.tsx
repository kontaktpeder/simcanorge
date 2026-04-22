import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FEATURES } from "@/config/features";
import { RelationshipTypeField } from "@/components/car/RelationshipTypeField";
import type { WizardData } from "./WizardTypes";

interface StepContactProps {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
  errors: Record<string, string>;
  emailLocked?: boolean;
  nameLocked?: boolean;
}

export function StepContact({ data, onChange, errors, emailLocked, nameLocked }: StepContactProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl sm:text-3xl text-foreground">Hvem er du?</h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          {emailLocked
            ? "Du er innlogget – vi bruker e-postadressen til kontoen din."
            : "Vi bruker e-posten til å sende deg en innloggingslenke."}
        </p>
      </div>

      <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-muted">
        <div className="space-y-2">
          <Label htmlFor="w-name" className="text-base font-display">DITT NAVN *</Label>
          <Input id="w-name" value={data.owner_name}
            readOnly={nameLocked}
            onChange={e => !nameLocked && onChange({ owner_name: e.target.value })}
            placeholder="Ola Nordmann"
            className={`h-12 text-base border-2 ${nameLocked ? "opacity-70 cursor-not-allowed bg-muted/50" : ""} ${errors.owner_name ? "border-destructive" : "border-muted"}`} />
          {errors.owner_name && <p className="text-sm text-destructive">{errors.owner_name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="w-email" className="text-base font-display">E-POST *</Label>
          <Input id="w-email" type="email" value={data.email}
            readOnly={emailLocked}
            onChange={e => !emailLocked && onChange({ email: e.target.value })}
            placeholder="ola@eksempel.no"
            className={`h-12 text-base border-2 ${emailLocked ? "opacity-70 cursor-not-allowed bg-muted/50" : ""} ${errors.email ? "border-destructive" : "border-muted"}`} />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="w-phone" className="text-base font-display">TELEFON</Label>
          <Input id="w-phone" type="tel" value={data.phone} onChange={e => onChange({ phone: e.target.value })}
            placeholder="123 45 678" className="h-12 text-base border-2 border-muted" />
        </div>

        {FEATURES.relationshipModelV1 && (
          <div className="pt-2 border-t border-muted">
            <RelationshipTypeField
              value={data.relationship_type}
              note={data.relationship_note}
              onChange={({ value, note }) =>
                onChange({ relationship_type: value, relationship_note: note })
              }
              error={errors.relationship_type}
            />
          </div>
        )}
      </div>
    </div>
  );
}
