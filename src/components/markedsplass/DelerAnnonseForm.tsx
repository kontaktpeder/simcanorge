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
    location: initialValues?.location ?? '',
  });

  // Auto-select first root when categories load
  useEffect(() => {
    if (roots.length > 0 && !values.rootCategoryId) {
      setValues((v) => ({ ...v, rootCategoryId: roots[0].id }));
    }
  }, [roots.length]);

  // Resolve rootCategoryId from categoryId if initialValues provided a categoryId
  useEffect(() => {
    if (initialValues?.categoryId && categories.length > 0 && !values.rootCategoryId) {
      // Walk up to find root
      let current = categories.find((c) => c.id === initialValues.categoryId);
      while (current?.parent_id) {
        const parent = categories.find((c) => c.id === current!.parent_id);
        if (!parent) break;
        current = parent;
      }
      if (current) {
        setValues((v) => ({ ...v, rootCategoryId: current!.id }));
      }
    }
  }, [categories.length, initialValues?.categoryId]);

  const selectedRoot = roots.find((r) => r.id === values.rootCategoryId);
  const midLevel = selectedRoot ? getSubcategories(categories, selectedRoot.id) : [];

  // Build optgroup-style subcategories (parent -> children)
  const buildCategoryOptions = () => {
    if (midLevel.length === 0) return null;

    return midLevel.map((parent) => {
      const children = getSubcategories(categories, parent.id);
      if (children.length === 0) {
        return (
          <option key={parent.id} value={parent.id}>
            {parent.name}
          </option>
        );
      }
      return (
        <optgroup key={parent.id} label={parent.name}>
          <option value={parent.id}>{parent.name} (hovedkategori)</option>
          {children.map((child) => (
            <option key={child.id} value={child.id}>
              └ {child.name}
            </option>
          ))}
        </optgroup>
      );
    });
  };

  const handleRootChange = (rootId: string) => {
    setValues((v) => ({ ...v, rootCategoryId: rootId, categoryId: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.title.trim()) return;
    await onSubmit(values);
  };

  const isDeler = selectedRoot?.slug === 'deler';

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

      {/* Hovedkategori (tabs) */}
      {roots.length > 1 && (
        <div>
          <Label>Type</Label>
          <div className="flex gap-2 mt-1">
            {roots.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRootChange(r.id)}
                disabled={disabled}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  values.rootCategoryId === r.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:border-primary/30'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Underkategori */}
      {midLevel.length > 0 && (
        <div>
          <Label>Kategori</Label>
          <select
            value={values.categoryId}
            onChange={(e) => setValues((v) => ({ ...v, categoryId: e.target.value }))}
            className="w-full h-11 mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Velg kategori...</option>
            {buildCategoryOptions()}
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

      {/* Pris */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priceMin">{isDeler ? 'Pris fra (kr)' : 'Pris (kr)'}</Label>
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
        {isDeler && (
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
        )}
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

      {/* Tilstand (for Deler) */}
      {isDeler && (
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
      )}

      {/* Sted (for Samleobjekter / annonser) */}
      {!isDeler && (
        <div>
          <Label htmlFor="location">Sted</Label>
            <Input
              id="location"
              value={values.location}
              onChange={(e) => setValues((v) => ({ ...v, location: e.target.value }))}
              placeholder="f.eks. Oslo"
              className="mt-1"
              disabled={disabled}
            />
        </div>
      )}

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
