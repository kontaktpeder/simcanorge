import { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { FormFieldWithTooltip } from "@/components/ui/form-field-with-tooltip";
import { useCarBrands, useCarModels } from "@/hooks/useCarCatalog";
import type { WizardData } from "./WizardTypes";

interface StepBrandProps {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
  errors: Record<string, string>;
}

const OTHER = "__other__";

export function StepBrand({ data, onChange, errors }: StepBrandProps) {
  const { data: brands = [], isLoading: brandsLoading } = useCarBrands();
  const { data: models = [], isLoading: modelsLoading } = useCarModels(data.brand_id ?? null);

  // Local "other" toggles — kept simple: if brand/car_model has a value but doesn't match catalog, show free text.
  const brandInCatalog = useMemo(
    () => brands.some(b => b.name.toLowerCase() === data.brand.trim().toLowerCase()),
    [brands, data.brand]
  );
  const modelInCatalog = useMemo(
    () => models.some(m => m.name.toLowerCase() === data.car_model.trim().toLowerCase()),
    [models, data.car_model]
  );

  const [brandMode, setBrandMode] = useState<"select" | "other">(
    data.brand && !brandInCatalog ? "other" : "select"
  );
  const [modelMode, setModelMode] = useState<"select" | "other">(
    data.car_model && !modelInCatalog ? "other" : "select"
  );

  useEffect(() => {
    if (brandMode === "select" && data.brand && !brandInCatalog && brands.length > 0) {
      setBrandMode("other");
    }
  }, [brands, brandInCatalog, brandMode, data.brand]);

  const handleBrandSelect = (value: string) => {
    if (value === OTHER) {
      setBrandMode("other");
      onChange({ brand: "", brand_id: null, car_model: "", model_id: null, car_year: "", variant: "" });
      return;
    }
    const b = brands.find(x => x.name === value);
    onChange({
      brand: b?.name ?? value,
      brand_id: b?.id ?? null,
      car_model: "",
      model_id: null,
      car_year: "",
      variant: "",
    });
    setModelMode("select");
  };

  const handleModelSelect = (value: string) => {
    if (value === OTHER) {
      setModelMode("other");
      onChange({ car_model: "", model_id: null, car_year: "", variant: "" });
      return;
    }
    const m = models.find(x => x.name === value);
    onChange({
      car_model: m?.name ?? value,
      model_id: m?.id ?? null,
      car_year: "",
      variant: "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl sm:text-3xl text-foreground">Hva slags bil er det?</h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          Velg merke og modell – finner du den ikke kan du skrive den inn selv.
        </p>
      </div>

      <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-muted">
        <FormFieldWithTooltip label="MERKE" tooltip="Bilprodusent" required htmlFor="w-brand" error={errors.brand}>
          {brandMode === "select" ? (
            <select
              id="w-brand"
              value={brands.find(b => b.name === data.brand)?.name ?? ""}
              onChange={e => handleBrandSelect(e.target.value)}
              disabled={brandsLoading}
              className={`w-full h-12 px-3 text-base rounded-md border-2 bg-background ${errors.brand ? "border-destructive" : "border-muted"}`}
            >
              <option value="">{brandsLoading ? "Laster…" : "Velg merke…"}</option>
              {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              <option value={OTHER}>Annet (skriv inn)</option>
            </select>
          ) : (
            <div className="flex gap-2">
              <Input
                id="w-brand"
                value={data.brand}
                onChange={e => onChange({ brand: e.target.value, brand_id: null })}
                placeholder="Skriv inn merke…"
                className={`h-12 text-base border-2 ${errors.brand ? "border-destructive" : "border-muted"}`}
              />
              <button
                type="button"
                onClick={() => { setBrandMode("select"); onChange({ brand: "", brand_id: null }); }}
                className="px-3 text-sm text-muted-foreground hover:text-foreground underline"
              >
                Velg fra liste
              </button>
            </div>
          )}
        </FormFieldWithTooltip>

        <FormFieldWithTooltip label="MODELL" tooltip="Modellserie" required htmlFor="w-model" error={errors.car_model}>
          {modelMode === "select" && data.brand_id ? (
            <select
              id="w-model"
              value={models.find(m => m.name === data.car_model)?.name ?? ""}
              onChange={e => handleModelSelect(e.target.value)}
              disabled={!data.brand_id || modelsLoading}
              className={`w-full h-12 px-3 text-base rounded-md border-2 bg-background ${errors.car_model ? "border-destructive" : "border-muted"}`}
            >
              <option value="">
                {!data.brand_id ? "Velg merke først…" : modelsLoading ? "Laster…" : models.length === 0 ? "Ingen modeller – skriv inn" : "Velg modell…"}
              </option>
              {models.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
              <option value={OTHER}>Annet (skriv inn)</option>
            </select>
          ) : (
            <div className="flex gap-2">
              <Input
                id="w-model"
                value={data.car_model}
                onChange={e => onChange({ car_model: e.target.value, model_id: null })}
                placeholder="Skriv inn modell…"
                disabled={!data.brand}
                className={`h-12 text-base border-2 ${errors.car_model ? "border-destructive" : "border-muted"}`}
              />
              {data.brand_id && (
                <button
                  type="button"
                  onClick={() => { setModelMode("select"); onChange({ car_model: "", model_id: null }); }}
                  className="px-3 text-sm text-muted-foreground hover:text-foreground underline whitespace-nowrap"
                >
                  Velg fra liste
                </button>
              )}
            </div>
          )}
        </FormFieldWithTooltip>
      </div>
    </div>
  );
}
