import React from 'react';
import {
  Car, CheckCircle, Wrench, History, AlertTriangle,
  RotateCcw, Search, PanelLeftClose, PanelLeft,
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
  decade: string;
}

export const EMPTY_BILER_FILTER: BilerFilterState = {
  category: 'alle',
  brand: '',
  model: '',
  variant: '',
  body_type: '',
  year: '',
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
  /** Whether the desktop panel is expanded */
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

export function BilerSidePanel({
  open, onOpenChange, filterState, onFilterChange,
  searchQuery, onSearchChange, resultCount, categoryCounts,
  expanded, onExpandedChange,
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
        <DrawerContent className="max-h-[85vh] border-t border-black/10 bg-[#f6f3ee] text-[#1c1917]">
          <DrawerHeader className="pb-0">
            <DrawerTitle className="font-display text-2xl uppercase tracking-wide text-[#071628]">
              Filter
            </DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-5 pb-6 biler-filter-mobile">
            {filterContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <aside
      className={cn(
        'shrink-0 z-40 overflow-y-auto static h-full transition-all duration-300 ease-in-out bg-white text-[#1c1917]',
        expanded ? 'w-[300px]' : 'w-[56px]',
      )}
    >
      <div className="relative min-h-full flex flex-col">
        <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-3 border-b border-black/10 bg-white">
          {expanded && (
            <h2 className="font-display text-2xl uppercase tracking-wide text-[#071628]">
              Filter
            </h2>
          )}
          <button
            onClick={() => onExpandedChange(!expanded)}
            className="p-1.5 rounded text-[#071628]/70 hover:text-[#071628] hover:bg-black/5 transition-colors shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#071628]"
            title={expanded ? 'Skjul filter' : 'Vis filter'}
          >
            {expanded ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Collapsed: show icon-only category buttons */}
        {!expanded && (
          <div className="flex flex-col items-center gap-1.5 py-4">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = filterState.category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onFilterChange({ ...filterState, category: cat.id })}
                  className={cn(
                    'w-9 h-9 flex items-center justify-center rounded-md transition-all',
                    isActive
                      ? 'bg-[#C10D0D]/10 text-[#C10D0D]'
                      : 'text-[#071628]/45 hover:text-[#071628] hover:bg-black/5',
                  )}
                  title={cat.label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        )}

        {/* Expanded: full filter content */}
        {expanded && (
          <div className="flex-1 flex flex-col">
            {filterContent}
          </div>
        )}
      </div>
    </aside>
  );
}

/** The actual filter UI, shared between Drawer and Sidebar */
function BilerFilterContent({
  filterState, onFilterChange, searchQuery, onSearchChange, resultCount, categoryCounts,
}: Omit<Props, 'open' | 'onOpenChange' | 'expanded' | 'onExpandedChange'>) {
  const hasActiveFilters =
    filterState.category !== 'alle' || filterState.brand !== '' || filterState.model !== '' || filterState.variant !== '' || filterState.body_type !== '' || filterState.year !== '' || filterState.decade !== '' || searchQuery !== '';

  const pendingRef = React.useRef<Partial<BilerFilterState> | null>(null);
  const handleCarFieldChange = (field: string, value: string) => {
    if (!pendingRef.current) {
      pendingRef.current = {};
      queueMicrotask(() => {
        if (pendingRef.current) {
          onFilterChange({ ...filterState, ...pendingRef.current });
          pendingRef.current = null;
        }
      });
    }
    pendingRef.current[field as keyof BilerFilterState] = value;
  };

  const c = {
    searchIcon: 'text-[#1c1917]/40',
    searchInput: 'border-black/15 focus:border-[#C10D0D] text-[#1c1917] placeholder:text-[#1c1917]/40',
    searchBg: 'bg-transparent',
    countText: 'text-[#1c1917]/55',
    divider: 'border-black/10',
    labelText: 'text-[#1c1917]/55',
    catActive: 'bg-[#C10D0D]/10 text-[#C10D0D]',
    catInactive: 'text-[#1c1917]/70 hover:bg-black/[0.04] hover:text-[#1c1917]',
    catCountActive: 'text-[#C10D0D]/80',
    catCountInactive: 'text-[#1c1917]/35',
    catIcon: '',
    catLabel: '',
    fieldOverrides: '[&_label]:text-[#1c1917]/70 [&_select]:!bg-white [&_select]:!text-[#1c1917] [&_select]:!border-black/20 [&_input]:!bg-white [&_input]:!text-[#1c1917] [&_input]:!border-black/20 [&_button[role=combobox]]:!bg-white [&_button[role=combobox]]:!text-[#1c1917]',
    resetText: 'text-[#1c1917]/55 hover:text-[#C10D0D]',
  };
  return (
    <>
      {/* Search + result count */}
      <div className={`px-4 pt-4 pb-3 space-y-3 border-b ${c.divider}`}>
        <div className="relative">
          <Search className={`absolute left-0 bottom-2 h-4 w-4 ${c.searchIcon}`} />
          <input
            type="text"
            placeholder="Søk i arkivet…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full bg-transparent border-0 border-b ${c.searchInput} pl-6 pr-2 py-2 font-sans text-base outline-none transition-colors`}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className={`font-sans text-sm ${c.countText}`}>
            {resultCount} {resultCount === 1 ? 'bil' : 'biler'}
          </span>
        </div>
      </div>

      {/* Filter content */}
      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Categories */}
        <div>
          <label className={`font-display text-lg uppercase tracking-wide ${c.labelText} block mb-2`}>
            Kategori
          </label>
          <div className="space-y-0.5">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = filterState.category === cat.id;
              const count = categoryCounts[cat.id] ?? 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => onFilterChange({ ...filterState, category: cat.id })}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm rounded transition-all',
                    isActive ? c.catActive : c.catInactive,
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1 font-sans text-base">
                    {cat.label}
                  </span>
                  <span className={cn(
                    'text-[10px] tabular-nums',
                    isActive ? c.catCountActive : c.catCountInactive,
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className={`border-t ${c.divider}`} />

        {/* Car fields filter */}
        <div>
          <label className={`font-display text-lg uppercase tracking-wide ${c.labelText} block mb-3`}>
            Bilmodell
          </label>
          <div className={c.fieldOverrides}>
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
        </div>

        {/* Reset */}
        {hasActiveFilters && (
          <>
            <div className={`border-t ${c.divider}`} />
            <button
              type="button"
              onClick={() => {
                onFilterChange(EMPTY_BILER_FILTER);
                onSearchChange('');
              }}
              className={`flex items-center gap-2 font-sans text-base ${c.resetText} transition-colors`}
            >
              <RotateCcw className="w-3 h-3" />
              Nullstill
            </button>
          </>
        )}
      </div>
    </>
  );
}
