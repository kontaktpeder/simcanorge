import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { FormFieldWithTooltip } from "@/components/ui/form-field-with-tooltip";
import { CAR_BODY_TYPES } from "@/data/carBodyTypes";
import { useCarModels, formatYearRange } from "@/hooks/useCarCatalog";
import type { WizardData } from "./WizardTypes";

import { CAR_CATEGORIES } from "@/data/carCategories";
const CATEGORIES = CAR_CATEGORIES;

interface StepDetailsProps {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
}

export function StepDetails({ data, onChange }: StepDetailsProps) {
  const { data: models = [] } = useCarModels(data.brand_id ?? null);
  const selectedModel = useMemo(
    () => models.find(m => m.id === data.model_id) ?? null,
    [models, data.model_id]
  );
  const yearHint = formatYearRange(selectedModel);
  const currentYear = new Date().getFullYear();

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
          <FormFieldWithTooltip label="VARIANT" tooltip="F.eks. VF1, Rallye 2, GTI" htmlFor="w-variant">
            <Input
              id="w-variant"
              value={data.variant}
              onChange={e => onChange({ variant: e.target.value })}
              placeholder="F.eks. VF1, Rallye 2"
              className="h-12 text-base border-2 border-muted"
            />
          </FormFieldWithTooltip>

          <FormFieldWithTooltip label="KAROSSERI" tooltip="Sedan, Stasjonsvogn osv." htmlFor="w-body">
            <select
              id="w-body"
              value={data.body_type}
              onChange={e => onChange({ body_type: e.target.value })}
              className="w-full h-12 px-3 text-base rounded-md border-2 border-muted bg-background"
            >
              <option value="">Velg karosseri…</option>
              {CAR_BODY_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </FormFieldWithTooltip>

          <FormFieldWithTooltip
            label="ÅRSMODELL"
            tooltip={yearHint ? `Modellen ble bygget ${yearHint}` : "Produksjonsår"}
            htmlFor="w-year"
          >
            <Input
              id="w-year"
              type="number"
              inputMode="numeric"
              min={1900}
              max={currentYear + 1}
              value={data.car_year}
              onChange={e => onChange({ car_year: e.target.value })}
              placeholder={yearHint ? `f.eks. ${selectedModel?.year_from ?? 1970}` : "f.eks. 1972"}
              className="h-12 text-base border-2 border-muted"
            />
            {yearHint && (
              <p className="text-xs text-muted-foreground mt-1">Hint: {selectedModel?.name} ble bygget {yearHint}</p>
            )}
          </FormFieldWithTooltip>

          <FormFieldWithTooltip label="KATEGORI" tooltip="Hva slags tilstand er bilen i?" required htmlFor="w-cat">
            <select id="w-cat" value={data.category} onChange={e => onChange({ category: e.target.value })}
              className="w-full h-12 px-3 text-base rounded-md border-2 border-muted bg-background">
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </FormFieldWithTooltip>
        </div>

      </div>

      {data.registration_number && (
        <p className="text-xs text-muted-foreground text-center">
          Reg.nr: <span className="font-mono font-semibold text-foreground">{data.registration_number}</span>
          {" "}— hentet fra forrige steg.
        </p>
      )}
    </div>
  );
}
