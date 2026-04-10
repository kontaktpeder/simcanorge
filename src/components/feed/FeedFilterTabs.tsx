const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

export type FeedFilter = "alle" | "biler" | "marked" | "arrangementer";

const filters: { key: FeedFilter; label: string; shortLabel: string; subtitle: string; shortSub: string }[] = [
  { key: "alle", label: "Aktivitet", shortLabel: "Aktivitet", subtitle: "Alt som skjer", shortSub: "Alt" },
  { key: "biler", label: "Biler", shortLabel: "Biler", subtitle: "Nye profiler", shortSub: "Historier" },
  { key: "marked", label: "Marked", shortLabel: "Marked", subtitle: "Kjøp & salg", shortSub: "Kjøp" },
  { key: "arrangementer", label: "Arrangementer", shortLabel: "Arr.", subtitle: "Treff & samlinger", shortSub: "Treff" },
];

export function FeedFilterTabs({
  active,
  onChange,
}: {
  active: FeedFilter;
  onChange: (f: FeedFilter) => void;
}) {
  return (
    <div className="flex gap-4 sm:gap-8 overflow-x-auto scrollbar-hide -mx-1 px-1">
      {filters.map((f) => {
        const isActive = active === f.key;
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className="group flex flex-col items-start py-1 transition-all duration-200 flex-shrink-0"
          >
            <span
              className={`text-[0.95rem] sm:text-[1.3rem] tracking-[0.06em] uppercase font-bold leading-tight transition-colors duration-200 ${
                isActive ? "text-[#3a2e24]" : "text-[#3a2e24]/25 group-hover:text-[#3a2e24]/50"
              }`}
              style={chakra}
            >
              <span className="sm:hidden">{f.shortLabel}</span>
              <span className="hidden sm:inline">{f.label}</span>
            </span>
            <span
              className={`text-[9px] sm:text-[11px] tracking-[0.08em] uppercase transition-colors duration-200 mt-0.5 ${
                isActive ? "text-[#8b6914]" : "text-[#3a2e24]/15 group-hover:text-[#3a2e24]/30"
              }`}
              style={chakra}
            >
              <span className="sm:hidden">{f.shortSub}</span>
              <span className="hidden sm:inline">{f.subtitle}</span>
            </span>
            {isActive && (
              <span className="w-6 sm:w-8 h-[2px] bg-[#c4962c] mt-1.5 sm:mt-2 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
