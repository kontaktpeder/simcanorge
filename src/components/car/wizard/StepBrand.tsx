import { useMemo } from "react";
import { FormFieldWithTooltip } from "@/components/ui/form-field-with-tooltip";
import { CAR_BRANDS, getModelsForBrand } from "@/data/carBrands";
import type { WizardData } from "./WizardTypes";

interface StepBrandProps {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
  errors: Record<string, string>;
}

export function StepBrand({ data, onChange, onNext, onBack, errors }: StepBrandProps) {
  const models = useMemo(() => getModelsForBrand(data.brand), [data.brand]);

  const set = (field: keyof WizardData, value: string) => {
    const patch: Partial<WizardData> = { [field]: value };
    if (field === "brand") { patch.car_model = ""; patch.car_year = ""; patch.variant = ""; }
    if (field === "car_model") { patch.car_year = ""; patch.variant = ""; }
    onChange(patch);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl sm:text-3xl text-foreground">Hva slags bil er det?</h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          Velg merke og modell – resten kommer i neste steg.
        </p>
      </div>

      <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-muted">
        <FormFieldWithTooltip label="MERKE" tooltip="Bilprodusent" required htmlFor="w-brand" error={errors.brand}>
          <select id="w-brand" value={data.brand} onChange={e => set("brand", e.target.value)}
            className={`w-full h-12 px-3 text-base rounded-md border-2 bg-background ${errors.brand ? "border-destructive" : "border-muted"}`}>
            <option value="">Velg merke…</option>
            {CAR_BRANDS.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
          </select>
        </FormFieldWithTooltip>

        <FormFieldWithTooltip label="MODELL" tooltip="Modellserie" required htmlFor="w-model" error={errors.car_model}>
          <select id="w-model" value={data.car_model} onChange={e => set("car_model", e.target.value)}
            disabled={!data.brand}
            className={`w-full h-12 px-3 text-base rounded-md border-2 bg-background ${errors.car_model ? "border-destructive" : "border-muted"}`}>
            <option value="">Velg modell…</option>
            {models.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
          </select>
        </FormFieldWithTooltip>
      </div>

      <div className="flex justify-between pt-4">
        <button type="button" onClick={onBack}
          className="px-6 py-3 rounded-lg font-display text-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
          ← Tilbake
        </button>
        <button type="button" onClick={() => { if (data.brand && data.car_model) onNext(); }}
          disabled={!data.brand || !data.car_model}
          className="px-8 py-3 rounded-lg font-display text-base uppercase tracking-wider transition-all hover:brightness-110 disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #1F66B5, #2B7BD4)", color: "#fff" }}>
          Neste →
        </button>
      </div>
    </div>
  );
}
