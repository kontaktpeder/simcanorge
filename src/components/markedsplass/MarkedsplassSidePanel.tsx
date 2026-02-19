import { Link } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CarFormFields } from '@/components/car/CarFormFields';
import {
  useUnifiedCategories,
  getRootCategories,
  getSubcategories,
} from '@/hooks/useUnifiedCategories';
import { LISTING_TYPES } from '@/config/listingTypes';
import { Plus, RotateCcw, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const allRoots = getRootCategories(categories);
  const roots = LISTING_TYPES.filter((t) => !t.locked)
    .map((t) => ({
      id: allRoots.find((r) => r.slug === t.slug)?.id ?? '',
      label: t.label,
      slug: t.slug,
    }))
    .filter((r) => r.id);

  const subcategories = filterState.rootCategoryId
    ? getSubcategories(categories, filterState.rootCategoryId)
    : [];

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

  const selectClass =
    'w-full h-11 mt-1 border-2 border-foreground/20 bg-card px-3 py-2 text-sm font-sans focus:border-primary focus:outline-none transition-colors';

  return (
    <>
      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 lg:hidden"
          onClick={() => onOpenChange(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'shrink-0 z-40 border-r-2 border-foreground/10 overflow-y-auto transition-all duration-300',
          // Mobile: fixed overlay from left
          'fixed top-0 left-0 h-full',
          // Desktop: sticky, fills viewport height and scrolls with page
          'lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:z-auto',
          open
            ? 'w-[300px] translate-x-0'
            : 'w-0 -translate-x-full lg:w-0 lg:-translate-x-full',
        )}
        style={{ background: 'hsl(42, 30%, 95%)' }}
      >
        <div className="w-[300px] min-h-full flex flex-col">
          {/* Header */}
          <div
            className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b-2 border-foreground/10"
            style={{ background: 'hsl(212, 80%, 15%)' }}
          >
            <div>
              <p className="font-display text-[10px] uppercase tracking-[0.4em] text-white/40">
                Simca Norge
              </p>
              <h2 className="font-display text-lg uppercase tracking-wider text-white leading-none mt-0.5">
                Filter
              </h2>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 text-white/60 hover:text-white transition-colors"
              aria-label="Lukk filter"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>

          {/* Red accent line */}
          <div className="h-1 w-full" style={{ background: 'hsl(2, 85%, 40%)' }} />

          {/* Filter content */}
          <div className="flex-1 px-5 py-5 space-y-5">
            {/* Hovedkategori */}
            <div>
              <Label className="font-display text-[11px] uppercase tracking-[0.15em] text-foreground/60">
                Hovedkategori
              </Label>
              <select
                value={filterState.rootCategoryId}
                onChange={(e) =>
                  onFilterChange({ ...filterState, rootCategoryId: e.target.value, categoryId: '' })
                }
                className={selectClass}
              >
                <option value="">Alle</option>
                {roots.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Underkategori */}
            {filterState.rootCategoryId && subcategories.length > 0 && (
              <div>
                <Label className="font-display text-[11px] uppercase tracking-[0.15em] text-foreground/60">
                  Underkategori
                </Label>
                <select
                  value={filterState.categoryId}
                  onChange={(e) => onFilterChange({ ...filterState, categoryId: e.target.value })}
                  className={selectClass}
                >
                  <option value="">Alle</option>
                  {buildSubcategoryOptions()}
                </select>
              </div>
            )}

            {/* Divider */}
            <div className="border-t-2 border-foreground/8" />

            {/* Pris */}
            <div>
              <Label className="font-display text-[11px] uppercase tracking-[0.15em] text-foreground/60">
                Pris
              </Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Input
                  type="number"
                  min={0}
                  value={filterState.priceMin}
                  onChange={(e) => onFilterChange({ ...filterState, priceMin: e.target.value })}
                  placeholder="Fra"
                  className="border-2 border-foreground/20 bg-card text-sm"
                />
                <Input
                  type="number"
                  min={0}
                  value={filterState.priceMax}
                  onChange={(e) => onFilterChange({ ...filterState, priceMax: e.target.value })}
                  placeholder="Til"
                  className="border-2 border-foreground/20 bg-card text-sm"
                />
              </div>
            </div>

            {/* Tilstand */}
            <div>
              <Label className="font-display text-[11px] uppercase tracking-[0.15em] text-foreground/60">
                Tilstand
              </Label>
              <select
                value={filterState.condition}
                onChange={(e) => onFilterChange({ ...filterState, condition: e.target.value })}
                className={selectClass}
              >
                <option value="">Alle</option>
                {CONDITION_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-foreground/8" />

            {/* Passer til bil */}
            <div>
              <Label className="font-display text-[11px] uppercase tracking-[0.15em] text-foreground/60">
                Passer til bil
              </Label>
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
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-display uppercase tracking-wider"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Nullstill
              </button>
            )}
          </div>

          {/* CTA at bottom */}
          <div className="mt-auto px-5 pb-5">
            <div className="border-t-2 border-foreground/10 pt-5">
              <Link
                to="/start-annonse"
                className="group w-full flex items-center justify-center gap-3 px-6 py-4 font-display text-sm uppercase tracking-[0.15em] text-white transition-all border-2 border-transparent hover:border-white/20"
                style={{ background: 'hsl(2, 85%, 40%)' }}
              >
                <Plus className="h-5 w-5" />
                Opprett annonse
                <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

/** Small toggle button shown when sidebar is collapsed */
export function SidePanelToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 font-display text-xs uppercase tracking-wider px-3 py-2 border-2 border-foreground/20 hover:border-primary hover:text-primary transition-all"
      style={{ background: 'hsl(0, 0%, 100%)' }}
      aria-label="Åpne filter"
    >
      <PanelLeftOpen className="w-4 h-4" />
      <span className="hidden sm:inline">Filter</span>
    </button>
  );
}
