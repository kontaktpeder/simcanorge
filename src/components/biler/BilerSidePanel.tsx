import React from 'react';
import { Label } from '@/components/ui/label';
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

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

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
      lightMode={isMobile}
    />
  );

  // Mobile: bottom-sheet drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh] border-t border-[#34eab8]/20" style={{ background: 'linear-gradient(180deg, #0a1218 0%, #070b10 100%)' }}>
          <DrawerHeader className="pb-0">
            <DrawerTitle
              className="text-[13px] uppercase tracking-[0.15em] font-bold text-white"
              style={oswald}
            >
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

  // Desktop: collapsible sidebar (Premium Dark — popping)
  return (
    <aside
      className={cn(
        'shrink-0 z-40 overflow-y-auto static h-full transition-all duration-300 ease-in-out border-r border-[#34eab8]/25 relative',
        expanded ? 'w-[300px]' : 'w-[56px]',
      )}
      style={{
        background: 'linear-gradient(180deg, #0a1422 0%, #070b10 100%)',
        boxShadow: expanded
          ? 'inset -1px 0 0 rgba(52,234,184,0.15), 4px 0 24px -8px rgba(52,234,184,0.12)'
          : 'inset -1px 0 0 rgba(52,234,184,0.2), 2px 0 16px -4px rgba(52,234,184,0.18)',
      }}
    >
      {/* Ambient teal glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 50% at 0% 25%, rgba(52,234,184,0.14) 0%, transparent 65%)' }} />
      {/* Right-edge accent line */}
      <div className="absolute top-0 bottom-0 right-0 w-[1px] pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(52,234,184,0.5) 35%, rgba(52,234,184,0.5) 65%, transparent 100%)' }} />

      <div className="relative min-h-full flex flex-col">
        {/* Header with toggle */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-3 border-b border-[#34eab8]/15" style={{ background: 'rgba(7,11,16,0.92)', backdropFilter: 'blur(10px)' }}>
          {expanded && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1 h-1 rounded-full bg-[#34eab8] animate-pulse" style={{ boxShadow: '0 0 6px rgba(52,234,184,0.9)' }} />
                <p
                  className="text-[9px] tracking-[0.32em] uppercase"
                  style={{ ...oswald, fontWeight: 600, color: '#34eab8' }}
                >
                  Filter
                </p>
              </div>
              <h2
                className="text-[1.05rem] leading-[0.95] uppercase tracking-[0.02em] text-white font-bold italic"
                style={chakra}
              >
                Arkivet
              </h2>
            </div>
          )}
          <button
            onClick={() => onExpandedChange(!expanded)}
            className={cn(
              'p-1.5 rounded transition-all shrink-0',
              expanded
                ? 'text-white/50 hover:text-[#34eab8] hover:bg-[#34eab8]/10'
                : 'text-[#34eab8] hover:text-white bg-[#34eab8]/15 hover:bg-[#34eab8]/25 ring-1 ring-[#34eab8]/40',
            )}
            style={!expanded ? { boxShadow: '0 0 12px rgba(52,234,184,0.35)' } : undefined}
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
                      ? 'bg-[#34eab8]/20 text-[#34eab8] ring-1 ring-[#34eab8]/40'
                      : 'text-white/40 hover:text-[#34eab8] hover:bg-[#34eab8]/10',
                  )}
                  style={isActive ? { boxShadow: '0 0 10px rgba(52,234,184,0.3)' } : undefined}
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
  filterState, onFilterChange, searchQuery, onSearchChange, resultCount, categoryCounts, lightMode = false,
}: Omit<Props, 'open' | 'onOpenChange' | 'expanded' | 'onExpandedChange'> & { lightMode?: boolean }) {
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

  // Color tokens — both light/dark mode now use Premium Dark palette (teal accent)
  const c = lightMode
    ? {
        searchIcon: 'text-white/40',
        searchInput: 'border-white/15 focus:border-[#34eab8]/70 text-white placeholder:text-white/30',
        searchBg: 'bg-transparent',
        countText: 'text-white/40',
        divider: 'border-white/10',
        labelText: 'text-white/45',
        catActive: 'bg-[#34eab8]/15 text-[#34eab8]',
        catInactive: 'text-white/55 hover:bg-white/[0.05] hover:text-white/85',
        catCountActive: 'text-[#34eab8]/70',
        catCountInactive: 'text-white/25',
        catIcon: '',
        catLabel: '',
        fieldOverrides: '[&_label]:text-white/45 [&_select]:bg-white/[0.06] [&_select]:border-white/[0.1] [&_select]:text-white/85 [&_input]:bg-white/[0.06] [&_input]:border-white/[0.1] [&_input]:text-white/85',
        resetText: 'text-white/40 hover:text-[#34eab8]',
      }
    : {
        searchIcon: 'text-white/35',
        searchInput: 'border-white/10 focus:border-[#34eab8]/60 text-white placeholder:text-white/25',
        searchBg: 'bg-transparent',
        countText: 'text-white/35',
        divider: 'border-white/[0.08]',
        labelText: 'text-white/35',
        catActive: 'bg-[#34eab8]/15 text-[#34eab8]',
        catInactive: 'text-white/50 hover:bg-white/[0.04] hover:text-white/80',
        catCountActive: 'text-[#34eab8]/70',
        catCountInactive: 'text-white/20',
        catIcon: '',
        catLabel: '',
        fieldOverrides: '[&_label]:text-white/40 [&_select]:bg-white/[0.05] [&_select]:border-white/[0.1] [&_select]:text-white/80 [&_input]:bg-white/[0.05] [&_input]:border-white/[0.1] [&_input]:text-white/80',
        resetText: 'text-white/35 hover:text-[#34eab8]',
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
            className={`w-full bg-transparent border-0 border-b ${c.searchInput} pl-6 pr-2 py-1.5 text-sm outline-none transition-colors`}
            style={{ ...chakra, fontStyle: 'italic' }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] ${c.countText}`}
            style={{ ...oswald, letterSpacing: '0.05em' }}
          >
            {resultCount} {resultCount === 1 ? 'bil' : 'biler'}
          </span>
        </div>
      </div>

      {/* Filter content */}
      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Categories */}
        <div>
          <label
            className={`text-[10px] uppercase tracking-[0.2em] ${c.labelText} block mb-2`}
            style={oswald}
          >
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
                  <span
                    className="flex-1 text-[11px] uppercase tracking-[0.1em]"
                    style={oswald}
                  >
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
          <label
            className={`text-[10px] uppercase tracking-[0.2em] ${c.labelText} block mb-3`}
            style={oswald}
          >
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
              className={`flex items-center gap-2 text-[11px] ${c.resetText} transition-colors uppercase tracking-[0.15em]`}
              style={oswald}
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
