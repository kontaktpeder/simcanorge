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

  

  const labelClass = "font-display text-xs md:text-sm uppercase tracking-[0.15em] text-foreground/70";
  const selectClass = "w-full h-12 mt-1.5 border-2 border-foreground/15 bg-card px-4 py-2 text-base font-serif focus:border-primary focus:outline-none transition-colors";
  const inputClass = "mt-1.5 h-12 border-2 border-foreground/15 bg-card text-base font-serif focus:border-primary";
  const dividerClass = "border-t-2 border-foreground/8 my-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Tittel ── */}
      <div>
        <Label htmlFor="item-title" className={labelClass}>Tittel *</Label>
        <Input
          id="item-title"
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          placeholder="f.eks. Bremsekloss fremre"
          required
          className={inputClass}
          disabled={disabled}
        />
      </div>

      {/* ── Hovedkategori ── */}
      {midLevel.length > 0 && (
        <div>
          <Label className={labelClass}>Hovedkategori</Label>
          <select
            value={hovedkategoriId}
            onChange={(e) => {
              setHovedkategoriId(e.target.value);
              setValues((v) => ({ ...v, categoryId: '' }));
            }}
            className={selectClass}
            disabled={disabled}
          >
            <option value="">Velg hovedkategori...</option>
            {midLevel.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* ── Underkategori ── */}
      {hovedkategoriId && underkategorier.length > 0 && (
        <div>
          <Label className={labelClass}>Underkategori</Label>
          <select
            value={values.categoryId}
            onChange={(e) => setValues((v) => ({ ...v, categoryId: e.target.value }))}
            className={selectClass}
            disabled={disabled}
          >
            <option value="">Velg underkategori...</option>
            {underkategorier.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className={dividerClass} />

      {/* ── Beskrivelse ── */}
      <div>
        <Label htmlFor="item-desc" className={labelClass}>Beskrivelse</Label>
        <Textarea
          id="item-desc"
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          placeholder="Beskriv varen..."
          className="mt-1.5 min-h-[120px] border-2 border-foreground/15 bg-card text-base font-serif focus:border-primary"
          disabled={disabled}
        />
      </div>

      <div className={dividerClass} />

      {/* ── Passer til bil ── */}
      <div>
        <Label className={labelClass}>Passer til bil {carModelRequired ? '*' : '(valgfritt)'}</Label>
        <p className="text-sm text-muted-foreground mt-1 mb-3 font-serif italic">Angi hvilken bil delen passer til</p>
        <CarFormFields
          formData={carFields}
          onChange={handleCarChange}
          showTooltips={false}
          disabled={disabled}
        />
      </div>

      <div className={dividerClass} />

      {/* ── Pris ── */}
      <div>
        <Label className={labelClass}>Pris</Label>
        <div className="grid grid-cols-2 gap-4 mt-1.5">
          <div>
            <label className="text-sm font-serif italic text-foreground/50">Fra (kr)</label>
            <Input
              id="priceMin"
              type="number"
              min={0}
              value={values.priceMin}
              onChange={(e) => setValues((v) => ({ ...v, priceMin: e.target.value }))}
              className={inputClass}
              placeholder="f.eks. 500"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="text-sm font-serif italic text-foreground/50">Til (kr)</label>
            <Input
              id="priceMax"
              type="number"
              min={0}
              value={values.priceMax}
              onChange={(e) => setValues((v) => ({ ...v, priceMax: e.target.value }))}
              className={inputClass}
              placeholder="f.eks. 1000"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="priceNote" className={labelClass}>Prisnotat</Label>
        <Input
          id="priceNote"
          value={values.priceNote}
          onChange={(e) => setValues((v) => ({ ...v, priceNote: e.target.value }))}
          placeholder="f.eks. Kan diskuteres"
          className={inputClass}
          disabled={disabled}
        />
      </div>

      <div className={dividerClass} />

      {/* ── Tilstand ── */}
      <div>
        <Label className={labelClass}>Tilstand</Label>
        <select
          value={values.condition}
          onChange={(e) => setValues((v) => ({ ...v, condition: e.target.value }))}
          disabled={disabled}
          className={selectClass}
        >
          <option value="">Velg...</option>
          {CONDITION_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      <div className={dividerClass} />

      {/* ── Vis adresse og kontaktinfo fra profil ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="show-location"
            checked={values.showLocation}
            onChange={(e) => setValues((v) => ({ ...v, showLocation: e.target.checked }))}
            disabled={disabled}
            className="w-5 h-5 accent-primary"
          />
          <Label htmlFor="show-location" className="text-base font-serif">Vis sted og kontaktinfo fra profilen min</Label>
        </div>
        {values.showLocation && profileLocation && (
          <p className="text-base text-muted-foreground pl-8 font-serif">
            Sted: <strong>{profileLocation}</strong>
          </p>
        )}
        {values.showLocation && !profileLocation && (
          <p className="text-base pl-8 font-serif" style={{ color: 'hsl(30, 80%, 45%)' }}>
            Legg inn bosted i din Entusiastprofil for å vise sted.
          </p>
        )}
        {values.showLocation && (
          <p className="text-sm text-muted-foreground pl-8 font-serif italic">
            E-post og eventuelt telefonnummer fra profilen din vises på annonsen slik at kjøpere kan ta kontakt.
          </p>
        )}
      </div>

      {/* Ekstra innhold (bilder osv.) */}
      {children}

      {/* Publiser nå (admin) */}
      {canPublishDirectly && onPublishedChange && (
        <div className="flex items-center gap-3 p-4 border-2 border-foreground/10 bg-foreground/[0.02]">
          <input
            type="checkbox"
            id="publish-now"
            checked={published}
            onChange={(e) => onPublishedChange(e.target.checked)}
            className="w-5 h-5 accent-primary"
          />
          <Label htmlFor="publish-now" className={labelClass}>
            Publiser nå
          </Label>
        </div>
      )}

      {!disabled && (
        <div className="flex flex-col sm:flex-row gap-3 pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 h-14 font-display text-base md:text-lg uppercase tracking-[0.15em] text-white border-2 border-transparent hover:border-white/20 transition-all disabled:opacity-50"
            style={{ background: 'hsl(2, 85%, 40%)' }}
          >
            {isSubmitting ? 'Lagrer...' : submitLabel}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="h-14 px-8 font-display text-base uppercase tracking-[0.15em] border-2 border-foreground/20 text-foreground hover:border-foreground/40 transition-all"
            >
              Avbryt
            </button>
          )}
        </div>
      )}
    </form>
  );
}
