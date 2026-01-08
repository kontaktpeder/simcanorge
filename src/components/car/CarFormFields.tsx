import { useMemo } from 'react';
import { FormFieldWithTooltip } from '@/components/ui/form-field-with-tooltip';
import { Input } from '@/components/ui/input';
import { CAR_BRANDS, getModelsForBrand, getVariantsForModel, getYearsForModel } from '@/data/carBrands';
import { CAR_BODY_TYPES } from '@/data/carBodyTypes';

interface CarFormFieldsProps {
  formData: {
    brand: string;
    model: string;
    variant: string;
    body_type: string;
    year: string;
  };
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  showTooltips?: boolean;
}

export function CarFormFields({ 
  formData, 
  onChange, 
  errors = {}, 
  disabled = false,
  showTooltips = true 
}: CarFormFieldsProps) {
  const availableModels = useMemo(() => {
    return getModelsForBrand(formData.brand);
  }, [formData.brand]);

  const availableYears = useMemo(() => {
    return getYearsForModel(formData.brand, formData.model);
  }, [formData.brand, formData.model]);

  const availableVariants = useMemo(() => {
    return getVariantsForModel(formData.brand, formData.model);
  }, [formData.brand, formData.model]);

  const handleBrandChange = (value: string) => {
    onChange('brand', value);
    onChange('model', '');
    onChange('year', '');
    onChange('variant', '');
  };

  const handleModelChange = (value: string) => {
    onChange('model', value);
    onChange('year', '');
    onChange('variant', '');
  };

  const FieldWrapper = showTooltips ? FormFieldWithTooltip : 
    ({ children, label }: { children: React.ReactNode; label: string; tooltip?: string; required?: boolean }) => (
      <div>
        <label className="text-sm font-medium mb-1 block">{label}</label>
        {children}
      </div>
    );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Brand */}
      <FieldWrapper label="MERKE" tooltip="Bilprodusent. Eks: Simca" required>
        <select
          value={formData.brand}
          onChange={(e) => handleBrandChange(e.target.value)}
          className={`w-full h-12 px-3 text-base border-2 border-foreground bg-card rounded ${errors.brand ? 'border-destructive' : ''}`}
          required
          disabled={disabled}
        >
          <option value="">Velg merke...</option>
          {CAR_BRANDS.map((brand) => (
            <option key={brand.name} value={brand.name}>{brand.name}</option>
          ))}
        </select>
      </FieldWrapper>

      {/* Model */}
      <FieldWrapper label="MODELL" tooltip="Modellserie / plattform. Eks: 1100" required>
        <select
          value={formData.model}
          onChange={(e) => handleModelChange(e.target.value)}
          className={`w-full h-12 px-3 text-base border-2 border-foreground bg-card rounded ${errors.model ? 'border-destructive' : ''}`}
          required
          disabled={disabled || !formData.brand}
        >
          <option value="">Velg modell...</option>
          {availableModels.map((model) => (
            <option key={model.name} value={model.name}>{model.name}</option>
          ))}
        </select>
      </FieldWrapper>

      {/* Variant */}
      <FieldWrapper label="VARIANT" tooltip="Fabrikkens navn på en spesifikk utgave. Eks: VF1, Rallye 2">
        {availableVariants.length > 0 ? (
          <select
            value={formData.variant}
            onChange={(e) => onChange('variant', e.target.value)}
            className={`w-full h-12 px-3 text-base border-2 border-foreground bg-card rounded ${errors.variant ? 'border-destructive' : ''}`}
            disabled={disabled || !formData.model}
          >
            <option value="">Velg variant...</option>
            {availableVariants.map((variant) => (
              <option key={variant} value={variant}>{variant}</option>
            ))}
            <option value="__other__">Annet (skriv inn)</option>
          </select>
        ) : (
          <Input
            value={formData.variant}
            onChange={(e) => onChange('variant', e.target.value)}
            placeholder="F.eks. VF1, Rallye 2, TI..."
            className={`h-12 text-base border-2 ${errors.variant ? 'border-destructive' : 'border-foreground'}`}
            disabled={disabled}
          />
        )}
      </FieldWrapper>

      {/* Body Type */}
      <FieldWrapper label="KAROSSERI" tooltip="Bilens karosseriform">
        <select
          value={formData.body_type}
          onChange={(e) => onChange('body_type', e.target.value)}
          className={`w-full h-12 px-3 text-base border-2 border-foreground bg-card rounded ${errors.body_type ? 'border-destructive' : ''}`}
          disabled={disabled}
        >
          <option value="">Velg karosseriform...</option>
          {CAR_BODY_TYPES.map((type) => (
            <option key={type.id} value={type.id}>{type.label}</option>
          ))}
        </select>
      </FieldWrapper>

      {/* Year */}
      <FieldWrapper label="ÅR" tooltip="Produksjonsår">
        <select
          value={formData.year}
          onChange={(e) => onChange('year', e.target.value)}
          className={`w-full h-12 px-3 text-base border-2 border-foreground bg-card rounded ${errors.year ? 'border-destructive' : ''}`}
          disabled={disabled || !formData.model}
        >
          <option value="">Velg år...</option>
          {availableYears.map((year) => (
            <option key={year} value={year.toString()}>{year}</option>
          ))}
        </select>
      </FieldWrapper>
    </div>
  );
}
