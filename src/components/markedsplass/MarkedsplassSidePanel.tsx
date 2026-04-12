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
import { RotateCcw, Search, Grid3X3, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from '@/components/ui/drawer';

const CONDITION_OPTIONS = ['Ny', 'NOS', 'Brukt', 'Original', 'Repro'];

export interface MarkedsplassFilterState {
  rootCategoryId: string;
  hovedkategoriId: string;
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
  hovedkategoriId: '',
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
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  resultCount: number;
  fixedRootCategoryId?: string;
  showExploreOtherLink?: boolean;
}

export function MarkedsplassSidePanel({
  open, onOpenChange, filterState, onFilterChange,
  searchQuery, onSearchChange, viewMode, onViewModeChange, resultCount,
  fixedRootCategoryId, showExploreOtherLink,
}: Props) {
  const isMobile = useIsMobile();

  const filterContent = (
    <MarkedsplassFilterContent
      filterState={filterState}
      onFilterChange={onFilterChange}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
      resultCount={resultCount}
      fixedRootCategoryId={fixedRootCategoryId}
      showExploreOtherLink={showExploreOtherLink}
    />
  );

  // Mobile: bottom-sheet drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]" style={{ background: 'hsl(42, 30%, 95%)' }}>
          <DrawerHeader className="pb-0">
            <DrawerTitle className="font-display text-base uppercase tracking-wider">
              Filter
            </DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-5 pb-6">
            {filterContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: static sidebar
  return (
    <aside
      className="shrink-0 z-40 border-r-2 border-foreground/10 overflow-y-auto static h-full w-[300px]"
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
              Bilgarasje.no
            </p>
            <h2 className="font-display text-lg uppercase tracking-wider text-white leading-none mt-0.5">
              Filter
            </h2>
          </div>
        </div>

        {/* Red accent line */}
        <div className="h-1 w-full" style={{ background: 'hsl(2, 85%, 40%)' }} />

        <div className="flex-1 flex flex-col">
          {filterContent}
        </div>
      </div>
    </aside>
  );
}

/** The actual filter UI shared between Drawer and Sidebar */
function MarkedsplassFilterContent({
  filterState, onFilterChange, searchQuery, onSearchChange,
  viewMode, onViewModeChange, resultCount,
  fixedRootCategoryId, showExploreOtherLink,
}: Omit<Props, 'open' | 'onOpenChange'>) {
  const { data: categories = [] } = useUnifiedCategories();
  const allRoots = getRootCategories(categories);
  const roots = LISTING_TYPES.filter((t) => !t.locked)
    .map((t) => ({
      id: allRoots.find((r) => r.slug === t.slug)?.id ?? '',
      label: t.label,
      slug: t.slug,
    }))
    .filter((r) => r.id);

  const effectiveRootId = fixedRootCategoryId || filterState.rootCategoryId;
  const hovedkategorier = effectiveRootId
    ? getSubcategories(categories, effectiveRootId)
    : [];
  const underkategorier = filterState.hovedkategoriId
    ? getSubcategories(categories, filterState.hovedkategoriId)
    : [];

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

  const hasActiveFilters = Object.entries(filterState)
    .filter(([key]) => key !== 'rootCategoryId')
    .some(([, v]) => v !== '');

  const selectClass =
    'w-full h-11 mt-1 border-2 border-foreground/20 bg-card px-3 py-2 text-sm font-sans focus:border-primary focus:outline-none transition-colors';

  return (
    <>
      {/* Search + view mode */}
      <div className="px-5 pt-5 pb-3 space-y-3 border-b-2 border-foreground/8">
        <div className="relative">
          <Search className="absolute left-0 bottom-2 h-4 w-4 text-foreground/40" />
          <input
            type="text"
            placeholder="Søk i katalogen…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-transparent border-0 border-b-2 border-foreground/15 focus:border-primary pl-6 pr-2 py-1.5 text-sm font-serif italic placeholder:text-muted-foreground/50 outline-none transition-colors"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="font-serif text-xs text-muted-foreground italic">
            {resultCount} treff
          </span>
          <div className="flex items-center border-2 border-foreground/10 divide-x-2 divide-foreground/10">
            <button
              onClick={() => onViewModeChange('list')}
              className={`px-2 py-1.5 transition-colors ${viewMode === 'list' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`px-2 py-1.5 transition-colors ${viewMode === 'grid' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter content */}
      <div className="flex-1 px-5 py-5 space-y-5">
        {showExploreOtherLink && (
          <Link
            to="/markedsplass"
            className="flex items-center gap-1.5 font-display text-[11px] uppercase tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors"
          >
            ← Utforsk andre kataloger
          </Link>
        )}

        {!fixedRootCategoryId && (
          <div>
            <Label className="font-display text-[11px] uppercase tracking-[0.15em] text-foreground/60">
              Type
            </Label>
            <select
              value={filterState.rootCategoryId}
              onChange={(e) =>
                onFilterChange({ ...filterState, rootCategoryId: e.target.value, hovedkategoriId: '', categoryId: '' })
              }
              className={selectClass}
            >
              <option value="">Alt i katalogen</option>
              {roots.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {effectiveRootId && hovedkategorier.length > 0 && (
          <div>
            <Label className="font-display text-[11px] uppercase tracking-[0.15em] text-foreground/60">
              Hovedkategori
            </Label>
            <select
              value={filterState.hovedkategoriId}
              onChange={(e) =>
                onFilterChange({ ...filterState, hovedkategoriId: e.target.value, categoryId: '' })
              }
              className={selectClass}
            >
              <option value="">Alle</option>
              {hovedkategorier.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {filterState.hovedkategoriId && underkategorier.length > 0 && (
          <div>
            <Label className="font-display text-[11px] uppercase tracking-[0.15em] text-foreground/60">
              Underkategori
            </Label>
            <select
              value={filterState.categoryId}
              onChange={(e) => onFilterChange({ ...filterState, categoryId: e.target.value })}
              className={selectClass}
            >
              <option value="">Alle underkategorier</option>
              {underkategorier.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="border-t-2 border-foreground/8" />

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

        <div className="border-t-2 border-foreground/8" />

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
    </>
  );
}

export function SidePanelToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 font-display text-xs uppercase tracking-wider px-3 py-2 border-2 border-foreground/20 hover:border-primary hover:text-primary transition-all"
      style={{ background: 'hsl(0, 0%, 100%)' }}
      aria-label="Åpne filter"
    >
      <Search className="w-4 h-4" />
      <span className="hidden sm:inline">Filter</span>
    </button>
  );
}
