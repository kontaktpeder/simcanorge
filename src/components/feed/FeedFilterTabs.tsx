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
                isActive ? "text-white" : "text-white/25 group-hover:text-white/50"
              }`}
              style={chakra}
            >
              <span className="sm:hidden">{f.shortLabel}</span>
              <span className="hidden sm:inline">{f.label}</span>
            </span>
            <span
              className={`hidden sm:block text-[11px] tracking-[0.08em] uppercase transition-colors duration-200 mt-0.5 ${
                isActive ? "text-[#2dd4a8]" : "text-white/15 group-hover:text-white/30"
              }`}
              style={chakra}
            >
              {f.subtitle}
            </span>
            {isActive && (
              <span className="w-6 sm:w-8 h-[2px] bg-[#2dd4a8] mt-1.5 sm:mt-2 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
