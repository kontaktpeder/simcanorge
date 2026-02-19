import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  useUnifiedCategories,
  getRootCategories,
  getSubcategories,
  getAllDescendants,
} from '@/hooks/useUnifiedCategories';
import { CarFormFields } from '@/components/car/CarFormFields';
import type { ItemFormValues } from '@/lib/itemSubmit';

const CONDITION_OPTIONS = ['Ny', 'NOS', 'Brukt', 'Original', 'Repro'];

interface DelerAnnonseFormProps {
  initialValues?: Partial<ItemFormValues>;
  onSubmit: (values: ItemFormValues) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  canPublishDirectly?: boolean;
  published?: boolean;
  onPublishedChange?: (v: boolean) => void;
  children?: React.ReactNode;
  disabled?: boolean;
  profileLocation?: string | null;
  forceRootId?: string;
  carModelRequired?: boolean;
}

export function DelerAnnonseForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Lagre',
  isSubmitting = false,
  canPublishDirectly = false,
  published = false,
  onPublishedChange,
  children,
  disabled = false,
  profileLocation,
  forceRootId,
  carModelRequired = false,
}: DelerAnnonseFormProps) {
  const { data: categories = [] } = useUnifiedCategories();
  const roots = getRootCategories(categories);

  const [values, setValues] = useState<ItemFormValues>({
    title: initialValues?.title ?? '',
    description: initialValues?.description ?? '',
    rootCategoryId: initialValues?.rootCategoryId ?? '',
    categoryId: initialValues?.categoryId ?? '',
    priceMin: initialValues?.priceMin ?? '',
    priceMax: initialValues?.priceMax ?? '',
    priceNote: initialValues?.priceNote ?? '',
    condition: initialValues?.condition ?? '',
    showLocation: initialValues?.showLocation ?? false,
    carBrand: initialValues?.carBrand ?? '',
    carModel: initialValues?.carModel ?? '',
    carVariant: initialValues?.carVariant ?? '',
    carYear: initialValues?.carYear ?? '',
  });

  // Local state for the mid-level "hovedkategori" selection
  const [hovedkategoriId, setHovedkategoriId] = useState('');

  const carFields = {
    brand: values.carBrand || '',
    model: values.carModel || '',
    variant: values.carVariant || '',
    body_type: '',
    year: values.carYear || '',
  };

  const handleCarChange = (field: string, value: string) => {
    const fieldMap: Record<string, keyof ItemFormValues> = {
      brand: 'carBrand',
      model: 'carModel',
      variant: 'carVariant',
      year: 'carYear',
    };
    const key = fieldMap[field];
    if (key) {
      setValues((v) => ({ ...v, [key]: value }));
    }
  };

  // Auto-select root: forceRootId takes priority, else first root
  useEffect(() => {
    if (forceRootId) {
      if (values.rootCategoryId !== forceRootId) {
        setValues((v) => ({ ...v, rootCategoryId: forceRootId }));
      }
    } else if (roots.length > 0 && !values.rootCategoryId) {
      setValues((v) => ({ ...v, rootCategoryId: roots[0].id }));
    }
  }, [roots.length, forceRootId]);

  // Resolve hovedkategoriId from categoryId if initialValues provided a categoryId
  useEffect(() => {
    if (initialValues?.categoryId && categories.length > 0 && !hovedkategoriId) {
      // Walk up to find the mid-level parent (child of root)
      let current = categories.find((c) => c.id === initialValues.categoryId);
      // If current is a leaf, its parent is the hovedkategori
      if (current?.parent_id) {
        const parent = categories.find((c) => c.id === current!.parent_id);
        if (parent) {
          // Check if parent is a root or mid-level
          if (parent.parent_id) {
            // parent is mid-level (hovedkategori), grandparent is root
            setHovedkategoriId(parent.id);
          } else {
            // parent is root, current is hovedkategori level
            setHovedkategoriId(current.id);
          }
        }
      }
    }
  }, [categories.length, initialValues?.categoryId]);

  const selectedRoot = roots.find((r) => r.id === values.rootCategoryId);
  const midLevel = selectedRoot ? getSubcategories(categories, selectedRoot.id) : [];
  const underkategorier = hovedkategoriId ? getSubcategories(categories, hovedkategoriId) : [];

  const handleRootChange = (rootId: string) => {
    setValues((v) => ({ ...v, rootCategoryId: rootId, categoryId: '' }));
    setHovedkategoriId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.title.trim()) return;
    if (carModelRequired && !values.carBrand?.trim()) {
      return; // require at least brand
    }
    // If no underkategori selected but hovedkategori is, use hovedkategori as categoryId
    const submitValues = {
      ...values,
      categoryId: values.categoryId || hovedkategoriId || '',
    };
    await onSubmit(submitValues);
  };

  

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tittel */}
      <div>
        <Label htmlFor="item-title">Tittel *</Label>
        <Input
          id="item-title"
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          placeholder="f.eks. Bremsekloss fremre"
          required
          className="mt-1"
          disabled={disabled}
        />
      </div>


      {/* Hovedkategori */}
      {midLevel.length > 0 && (
        <div>
          <Label>Hovedkategori</Label>
          <select
            value={hovedkategoriId}
            onChange={(e) => {
              setHovedkategoriId(e.target.value);
              setValues((v) => ({ ...v, categoryId: '' }));
            }}
            className="w-full h-11 mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={disabled}
          >
            <option value="">Velg hovedkategori...</option>
            {midLevel.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Underkategori */}
      {hovedkategoriId && underkategorier.length > 0 && (
        <div>
          <Label>Underkategori</Label>
          <select
            value={values.categoryId}
            onChange={(e) => setValues((v) => ({ ...v, categoryId: e.target.value }))}
            className="w-full h-11 mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={disabled}
          >
            <option value="">Velg underkategori...</option>
            {underkategorier.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Beskrivelse */}
      <div>
        <Label htmlFor="item-desc">Beskrivelse</Label>
        <Textarea
          id="item-desc"
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          placeholder="Beskriv varen..."
          className="mt-1 min-h-[100px]"
          disabled={disabled}
        />
      </div>

      <div>
        <Label>Passer til bil {carModelRequired ? '*' : '(valgfritt)'}</Label>
        <p className="text-xs text-muted-foreground mb-2">Angi hvilken bil delen passer til</p>
        <CarFormFields
          formData={carFields}
          onChange={handleCarChange}
          showTooltips={false}
          disabled={disabled}
        />
      </div>

      {/* Pris */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priceMin">Pris fra (kr)</Label>
            <Input
              id="priceMin"
              type="number"
              min={0}
              value={values.priceMin}
              onChange={(e) => setValues((v) => ({ ...v, priceMin: e.target.value }))}
              className="mt-1"
              placeholder="f.eks. 500"
              disabled={disabled}
            />
        </div>
        <div>
          <Label htmlFor="priceMax">Pris til (kr)</Label>
          <Input
            id="priceMax"
            type="number"
            min={0}
            value={values.priceMax}
            onChange={(e) => setValues((v) => ({ ...v, priceMax: e.target.value }))}
            className="mt-1"
            placeholder="f.eks. 1000"
            disabled={disabled}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="priceNote">Prisnotat</Label>
        <Input
          id="priceNote"
          value={values.priceNote}
          onChange={(e) => setValues((v) => ({ ...v, priceNote: e.target.value }))}
          placeholder="f.eks. Kan diskuteres"
          className="mt-1"
          disabled={disabled}
        />
      </div>

      {/* Tilstand – alltid synlig */}
      <div>
        <Label>Tilstand</Label>
        <select
          value={values.condition}
          onChange={(e) => setValues((v) => ({ ...v, condition: e.target.value }))}
          disabled={disabled}
          className="w-full h-11 mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Velg...</option>
          {CONDITION_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      {/* Vis adresse og kontaktinfo fra profil */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="show-location"
            checked={values.showLocation}
            onChange={(e) => setValues((v) => ({ ...v, showLocation: e.target.checked }))}
            disabled={disabled}
            className="w-5 h-5"
          />
          <Label htmlFor="show-location">Vis sted og kontaktinfo fra profilen min</Label>
        </div>
        {values.showLocation && profileLocation && (
          <p className="text-sm text-muted-foreground pl-8">
            Sted: <strong>{profileLocation}</strong>
          </p>
        )}
        {values.showLocation && !profileLocation && (
          <p className="text-sm text-amber-600 pl-8">
            Legg inn bosted i din Entusiastprofil for å vise sted.
          </p>
        )}
        {values.showLocation && (
          <p className="text-xs text-muted-foreground pl-8">
            E-post og eventuelt telefonnummer fra profilen din vises på annonsen slik at kjøpere kan ta kontakt.
          </p>
        )}
      </div>

      {/* Ekstra innhold (bilder osv.) */}
      {children}

      {/* Publiser nå (admin) */}
      {canPublishDirectly && onPublishedChange && (
        <div className="flex items-center gap-3 p-2 bg-muted/30 rounded">
          <input
            type="checkbox"
            id="publish-now"
            checked={published}
            onChange={(e) => onPublishedChange(e.target.checked)}
            className="w-5 h-5"
          />
          <Label htmlFor="publish-now" className="font-display text-sm">
            PUBLISER NÅ
          </Label>
        </div>
      )}

      {!disabled && (
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-retro flex-1 h-12 disabled:opacity-50 text-base"
          >
            {isSubmitting ? 'Lagrer...' : submitLabel}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-retro bg-muted text-foreground h-12"
            >
              Avbryt
            </button>
          )}
        </div>
      )}
    </form>
  );
}
