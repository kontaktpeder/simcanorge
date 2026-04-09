const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

export type FeedFilter = "alle" | "biler" | "marked" | "arrangementer";

const filters: { key: FeedFilter; label: string; subtitle: string }[] = [
  { key: "alle", label: "Aktivitet", subtitle: "Alt som skjer" },
  { key: "biler", label: "Biler", subtitle: "Nye profiler" },
  { key: "marked", label: "Marked", subtitle: "Kjøp & salg" },
  { key: "arrangementer", label: "Arrangementer", subtitle: "Treff & samlinger" },
];

export function FeedFilterTabs({
  active,
  onChange,
}: {
  active: FeedFilter;
  onChange: (f: FeedFilter) => void;
}) {
  return (
    <div className="flex gap-6 sm:gap-8 overflow-x-auto scrollbar-hide -mx-1 px-1">
      {filters.map((f) => {
        const isActive = active === f.key;
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className="group flex flex-col items-start py-1 transition-all duration-200 flex-shrink-0"
          >
            <span
              className={`text-[1.1rem] sm:text-[1.3rem] tracking-[0.06em] uppercase font-bold leading-tight transition-colors duration-200 ${
                isActive ? "text-[#3a2e24]" : "text-[#3a2e24]/25 group-hover:text-[#3a2e24]/50"
              }`}
              style={chakra}
            >
              {f.label}
            </span>
            <span
              className={`text-[10px] sm:text-[11px] tracking-[0.08em] uppercase transition-colors duration-200 mt-0.5 ${
                isActive ? "text-[#8b6914]" : "text-[#3a2e24]/15 group-hover:text-[#3a2e24]/30"
              }`}
              style={chakra}
            >
              {f.subtitle}
            </span>
            {isActive && (
              <span className="w-8 h-[2px] bg-[#c4962c] mt-2 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
