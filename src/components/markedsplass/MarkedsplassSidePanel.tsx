import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CarFormFields } from '@/components/car/CarFormFields';
import {
  useUnifiedCategories,
  getRootCategories,
  getSubcategories,
} from '@/hooks/useUnifiedCategories';
import { Plus, RotateCcw, ChevronRight } from 'lucide-react';

const CONDITION_OPTIONS = ['Ny', 'NOS', 'Brukt', 'Original', 'Repro'];

export interface MarkedsplassFilterState {
  rootCategoryId: string;
  categoryId: string;
  priceMin: string;
  priceMax: string;
  condition: string;
  carBrand: string;
  carModel: string;
  carVariant: string;
  carYear: string;
}

export const EMPTY_FILTER: MarkedsplassFilterState = {
  rootCategoryId: '',
  categoryId: '',
  priceMin: '',
  priceMax: '',
  condition: '',
  carBrand: '',
  carModel: '',
  carVariant: '',
  carYear: '',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterState: MarkedsplassFilterState;
  onFilterChange: (state: MarkedsplassFilterState) => void;
}

export function MarkedsplassSidePanel({ open, onOpenChange, filterState, onFilterChange }: Props) {
  const { data: categories = [] } = useUnifiedCategories();
  const roots = getRootCategories(categories).filter(
    (r) => r.slug === 'deler' || r.slug === 'samleobjekter'
  );

  const subcategories = filterState.rootCategoryId
    ? getSubcategories(categories, filterState.rootCategoryId)
    : [];

  // Build optgroup-style options for subcategory
  const buildSubcategoryOptions = () =>
    subcategories.map((parent) => {
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
          <option value={parent.id}>{parent.name}</option>
          {children.map((child) => (
            <option key={child.id} value={child.id}>
              └ {child.name}
            </option>
          ))}
        </optgroup>
      );
    });

  const carFields = {
    brand: filterState.carBrand,
    model: filterState.carModel,
    variant: filterState.carVariant,
    body_type: '',
    year: filterState.carYear,
  };

  const handleCarChange = (field: string, value: string) => {
    const map: Record<string, keyof MarkedsplassFilterState> = {
      brand: 'carBrand',
      model: 'carModel',
      variant: 'carVariant',
      year: 'carYear',
    };
    const key = map[field];
    if (key) onFilterChange({ ...filterState, [key]: value });
  };

  const hasActiveFilters = Object.values(filterState).some((v) => v !== '');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display uppercase tracking-wider">Filter & Annonse</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          {/* Hovedkategori */}
          <div>
            <Label>Hovedkategori</Label>
            <select
              value={filterState.rootCategoryId}
              onChange={(e) =>
                onFilterChange({ ...filterState, rootCategoryId: e.target.value, categoryId: '' })
              }
              className="w-full h-11 mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Alle</option>
              {roots.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Underkategori */}
          {filterState.rootCategoryId && subcategories.length > 0 && (
            <div>
              <Label>Underkategori</Label>
              <select
                value={filterState.categoryId}
                onChange={(e) => onFilterChange({ ...filterState, categoryId: e.target.value })}
                className="w-full h-11 mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Alle</option>
                {buildSubcategoryOptions()}
              </select>
            </div>
          )}

          {/* Pris */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Pris fra</Label>
              <Input
                type="number"
                min={0}
                value={filterState.priceMin}
                onChange={(e) => onFilterChange({ ...filterState, priceMin: e.target.value })}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Pris til</Label>
              <Input
                type="number"
                min={0}
                value={filterState.priceMax}
                onChange={(e) => onFilterChange({ ...filterState, priceMax: e.target.value })}
                placeholder="∞"
                className="mt-1"
              />
            </div>
          </div>

          {/* Tilstand */}
          <div>
            <Label>Tilstand</Label>
            <select
              value={filterState.condition}
              onChange={(e) => onFilterChange({ ...filterState, condition: e.target.value })}
              className="w-full h-11 mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Alle</option>
              {CONDITION_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          {/* Passer til bil */}
          <div>
            <Label>Passer til bil</Label>
            <div className="mt-1">
              <CarFormFields
                formData={carFields}
                onChange={handleCarChange}
                showTooltips={false}
              />
            </div>
          </div>

          {/* Nullstill */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => onFilterChange(EMPTY_FILTER)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Nullstill alle filter
            </button>
          )}

          {/* Separator */}
          <div className="border-t border-border pt-5">
            <Link
              to="/start-annonse"
              onClick={() => onOpenChange(false)}
              className="group w-full flex items-center justify-center gap-3 px-6 py-4 font-display text-sm uppercase tracking-[0.15em] text-primary-foreground rounded-md transition-all"
              style={{ background: 'hsl(2, 85%, 40%)' }}
            >
              <Plus className="h-5 w-5" />
              Opprett annonse
              <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
