const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

export type FeedFilter = "alle" | "biler" | "marked" | "arrangementer";

const filters: { key: FeedFilter; label: string }[] = [
  { key: "alle", label: "Alle" },
  { key: "biler", label: "Biler" },
  { key: "marked", label: "Marked" },
  { key: "arrangementer", label: "Arrangementer" },
];

export function FeedFilterTabs({
  active,
  onChange,
}: {
  active: FeedFilter;
  onChange: (f: FeedFilter) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1">
      {filters.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={`px-4 py-2 text-[12px] sm:text-[13px] tracking-[0.1em] uppercase font-semibold whitespace-nowrap transition-all duration-200 ${
            active === f.key
              ? "text-[#1a1a1a] border-b-2 border-[#c4962c]"
              : "text-[#1a1a1a]/30 hover:text-[#1a1a1a]/60 border-b-2 border-transparent"
          }`}
          style={oswald}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
