import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { FormFieldWithTooltip } from "@/components/ui/form-field-with-tooltip";
import { getYearsForModel, getVariantsForModel } from "@/data/carBrands";
import { CAR_BODY_TYPES } from "@/data/carBodyTypes";
import type { WizardData } from "./WizardTypes";

const CATEGORIES = [
  { id: "registrert", label: "Registrerte biler" },
  { id: "restaurering", label: "Restaureringsprosjekter" },
  { id: "historisk", label: "Historiske biler" },
  { id: "vrak", label: "Vrak" },
];

interface StepDetailsProps {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepDetails({ data, onChange, onNext, onBack }: StepDetailsProps) {
  const years = useMemo(() => getYearsForModel(data.brand, data.car_model), [data.brand, data.car_model]);
  const variants = useMemo(() => getVariantsForModel(data.brand, data.car_model), [data.brand, data.car_model]);

  const set = (field: keyof WizardData, value: string) => onChange({ [field]: value });

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl sm:text-3xl text-foreground">Detaljer om bilen</h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          Alt her er valgfritt – legg til det du vet.
        </p>
      </div>

      <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-muted">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormFieldWithTooltip label="VARIANT" tooltip="F.eks. VF1, Rallye 2" htmlFor="w-variant">
            {variants.length > 0 ? (
              <select id="w-variant" value={data.variant} onChange={e => set("variant", e.target.value)}
                className="w-full h-12 px-3 text-base rounded-md border-2 border-muted bg-background">
                <option value="">Velg variant…</option>
                {variants.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            ) : (
              <Input id="w-variant" value={data.variant} onChange={e => onChange({ variant: e.target.value })}
                placeholder="F.eks. VF1, Rallye 2" className="h-12 text-base border-2 border-muted" />
            )}
          </FormFieldWithTooltip>

          <FormFieldWithTooltip label="KAROSSERI" tooltip="Sedan, Stasjonsvogn osv." htmlFor="w-body">
            <select id="w-body" value={data.body_type} onChange={e => set("body_type", e.target.value)}
              className="w-full h-12 px-3 text-base rounded-md border-2 border-muted bg-background">
              <option value="">Velg karosseri…</option>
              {CAR_BODY_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </FormFieldWithTooltip>

          <FormFieldWithTooltip label="ÅRSTALL" tooltip="Produksjonsår" htmlFor="w-year">
            <select id="w-year" value={data.car_year} onChange={e => set("car_year", e.target.value)}
              className="w-full h-12 px-3 text-base rounded-md border-2 border-muted bg-background">
              <option value="">Velg år…</option>
              {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
            </select>
          </FormFieldWithTooltip>

          <FormFieldWithTooltip label="REGISTRERINGSNUMMER" tooltip="Valgfritt norsk skiltnummer" htmlFor="w-regnr">
            <Input id="w-regnr" value={data.registration_number} onChange={e => onChange({ registration_number: e.target.value })}
              placeholder="F.eks. AB 12345" maxLength={10} className="h-12 text-base border-2 border-muted uppercase" />
          </FormFieldWithTooltip>
        </div>

        <FormFieldWithTooltip label="KATEGORI" tooltip="Hva slags tilstand er bilen i?" required htmlFor="w-cat">
          <select id="w-cat" value={data.category} onChange={e => set("category", e.target.value)}
            className="w-full h-12 px-3 text-base rounded-md border-2 border-muted bg-background">
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </FormFieldWithTooltip>
      </div>

      <div className="flex justify-between pt-4">
        <button type="button" onClick={onBack}
          className="px-6 py-3 rounded-lg font-display text-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
          ← Tilbake
        </button>
        <button type="button" onClick={onNext}
          className="px-8 py-3 rounded-lg font-display text-base uppercase tracking-wider transition-all hover:brightness-110"
          style={{ background: "linear-gradient(135deg, #1F66B5, #2B7BD4)", color: "#fff" }}>
          Neste →
        </button>
      </div>
    </div>
  );
}
