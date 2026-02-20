import { Link } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import {
  Car, CheckCircle, Wrench, History, AlertTriangle,
  RotateCcw, PanelLeftClose, PanelLeftOpen, Search, Grid3X3, List,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CAR_BRANDS } from '@/data/carBrands';

const CATEGORIES = [
  { id: 'alle', label: 'Alle biler', icon: Car },
  { id: 'registrert', label: 'Registrerte', icon: CheckCircle },
  { id: 'restaurering', label: 'Restaurering', icon: Wrench },
  { id: 'historisk', label: 'Historiske', icon: History },
  { id: 'vrak', label: 'Vrak', icon: AlertTriangle },
];

const DECADES = ['1950', '1960', '1970', '1980'];
const BRANDS = CAR_BRANDS.map((b) => b.name);

export interface BilerFilterState {
  category: string;
  brand: string;
  decade: string;
}

export const EMPTY_BILER_FILTER: BilerFilterState = {
  category: 'alle',
  brand: '',
  decade: '',
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
  const hasActiveFilters =
    filterState.category !== 'alle' || filterState.brand !== '' || filterState.decade !== '' || searchQuery !== '';

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
          'fixed top-16 left-0 h-[calc(100%-4rem)]',
          'lg:static lg:h-full lg:translate-x-0 lg:w-[300px]',
          open ? 'w-[300px] translate-x-0' : 'w-0 -translate-x-full',
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
                Arkivet
              </h2>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 text-white/60 hover:text-white transition-colors lg:hidden"
              aria-label="Lukk filter"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>

          {/* Red accent line */}
          <div className="h-1 w-full" style={{ background: 'hsl(2, 85%, 40%)' }} />

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

            {/* Brand */}
            <div>
              <Label className="font-display text-[11px] uppercase tracking-[0.15em] text-foreground/60">
                Merke
              </Label>
              <select
                value={filterState.brand}
                onChange={(e) => onFilterChange({ ...filterState, brand: e.target.value })}
                className={selectClass}
              >
                <option value="">Alle merker</option>
                {BRANDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Decade */}
            <div>
              <Label className="font-display text-[11px] uppercase tracking-[0.15em] text-foreground/60">
                Tiår
              </Label>
              <select
                value={filterState.decade}
                onChange={(e) => onFilterChange({ ...filterState, decade: e.target.value })}
                className={selectClass}
              >
                <option value="">Alle tiår</option>
                {DECADES.map((d) => (
                  <option key={d} value={d}>{d}-tallet</option>
                ))}
              </select>
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

          {/* CTA at bottom */}
          <div className="mt-auto px-5 pb-5">
            <div className="border-t-2 border-foreground/10 pt-5">
              <Link
                to="/send-inn"
                className="group w-full flex items-center justify-center gap-3 px-6 py-4 font-display text-sm uppercase tracking-[0.15em] text-white transition-all border-2 border-transparent hover:border-white/20"
                style={{ background: 'hsl(2, 85%, 40%)' }}
              >
                Send inn din bil
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

/** Small toggle button shown when sidebar is collapsed on mobile */
export function BilerSidePanelToggle({ onClick, filterCount }: { onClick: () => void; filterCount?: number }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 font-display text-xs uppercase tracking-wider px-3 py-2 border-2 border-foreground/20 hover:border-primary hover:text-primary transition-all bg-white"
      aria-label="Åpne filter"
    >
      <PanelLeftOpen className="w-4 h-4" />
      <span className="hidden sm:inline">Filter</span>
      {(filterCount ?? 0) > 0 && (
        <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-primary text-primary-foreground rounded-full">{filterCount}</span>
      )}
    </button>
  );
}
