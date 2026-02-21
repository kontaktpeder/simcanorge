import { Label } from '@/components/ui/label';
import {
  Car, CheckCircle, Wrench, History, AlertTriangle,
  RotateCcw, Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { CarFormFields } from '@/components/car/CarFormFields';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from '@/components/ui/drawer';

const CATEGORIES = [
  { id: 'alle', label: 'Alle biler', icon: Car },
  { id: 'registrert', label: 'Registrerte', icon: CheckCircle },
  { id: 'restaurering', label: 'Restaurering', icon: Wrench },
  { id: 'historisk', label: 'Historiske', icon: History },
  { id: 'vrak', label: 'Vrak', icon: AlertTriangle },
];

export interface BilerFilterState {
  category: string;
  brand: string;
  model: string;
  variant: string;
  body_type: string;
  year: string;
}

export const EMPTY_BILER_FILTER: BilerFilterState = {
  category: 'alle',
  brand: '',
  model: '',
  variant: '',
  body_type: '',
  year: '',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterState: BilerFilterState;
  onFilterChange: (state: BilerFilterState) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  resultCount: number;
  categoryCounts: Record<string, number>;
}

export function BilerSidePanel({
  open, onOpenChange, filterState, onFilterChange,
  searchQuery, onSearchChange, resultCount, categoryCounts,
}: Props) {
  const isMobile = useIsMobile();

  const filterContent = (
    <BilerFilterContent
      filterState={filterState}
      onFilterChange={onFilterChange}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      resultCount={resultCount}
      categoryCounts={categoryCounts}
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
              Simca Norge
            </p>
            <h2 className="font-display text-lg uppercase tracking-wider text-white leading-none mt-0.5">
              Arkivet
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

/** The actual filter UI, shared between Drawer and Sidebar */
function BilerFilterContent({
  filterState, onFilterChange, searchQuery, onSearchChange, resultCount, categoryCounts,
}: Omit<Props, 'open' | 'onOpenChange'>) {
  const hasActiveFilters =
    filterState.category !== 'alle' || filterState.brand !== '' || filterState.model !== '' || filterState.variant !== '' || filterState.body_type !== '' || filterState.year !== '' || searchQuery !== '';

  const handleCarFieldChange = (field: string, value: string) => {
    onFilterChange({ ...filterState, [field]: value });
  };

  return (
    <>
      {/* Search + result count */}
      <div className="px-5 pt-5 pb-3 space-y-3 border-b-2 border-foreground/8">
        <div className="relative">
          <Search className="absolute left-0 bottom-2 h-4 w-4 text-foreground/40" />
          <input
            type="text"
            placeholder="Søk i arkivet…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-transparent border-0 border-b-2 border-foreground/15 focus:border-primary pl-6 pr-2 py-1.5 text-sm font-serif italic placeholder:text-muted-foreground/50 outline-none transition-colors"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="font-serif text-xs text-muted-foreground italic">
            {resultCount} {resultCount === 1 ? 'bil' : 'biler'}
          </span>
        </div>
      </div>

      {/* Filter content */}
      <div className="flex-1 px-5 py-5 space-y-5">
        {/* Categories */}
        <div>
          <Label className="font-display text-[11px] uppercase tracking-[0.15em] text-foreground/60">
            Kategori
          </Label>
          <div className="mt-2 space-y-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = filterState.category === cat.id;
              const count = categoryCounts[cat.id] ?? 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => onFilterChange({ ...filterState, category: cat.id })}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-all',
                    isActive
                      ? 'bg-foreground text-background font-medium'
                      : 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground',
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 font-display text-xs uppercase tracking-wider">{cat.label}</span>
                  <span className={cn(
                    'text-[10px] tabular-nums',
                    isActive ? 'text-background/60' : 'text-muted-foreground',
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-foreground/8" />

        {/* Car fields filter */}
        <div>
          <Label className="font-display text-[11px] uppercase tracking-[0.15em] text-foreground/60 mb-3 block">
            Bilmodell
          </Label>
          <CarFormFields
            formData={{
              brand: filterState.brand,
              model: filterState.model,
              variant: filterState.variant,
              body_type: filterState.body_type,
              year: filterState.year,
            }}
            onChange={handleCarFieldChange}
            showTooltips={false}
          />
        </div>

        {/* Reset */}
        {hasActiveFilters && (
          <>
            <div className="border-t-2 border-foreground/8" />
            <button
              type="button"
              onClick={() => {
                onFilterChange(EMPTY_BILER_FILTER);
                onSearchChange('');
              }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-display uppercase tracking-wider"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Nullstill
            </button>
          </>
        )}
      </div>
    </>
  );
}