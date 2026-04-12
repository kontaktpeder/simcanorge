import { useState, useRef, useEffect, useCallback, useLayoutEffect, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useGlobalSearch, type SearchResult } from "@/hooks/useGlobalSearch";

const SECTION_COLORS: Record<string, string> = {
  biler: "bg-[#2dd4a8]/15 text-[#2dd4a8]",
  arrangement: "bg-[#2dd4a8]/12 text-[#2dd4a8]/80",
  markedsplass: "bg-white/10 text-white/60",
  deler: "bg-white/10 text-white/50",
  sider: "bg-[#2dd4a8]/10 text-[#2dd4a8]/70",
};

export function HeroSearch({ compact = false }: { compact?: boolean }) {
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(inputValue), 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const { results, isSearching } = useGlobalSearch(debouncedQuery);
  const showDropdown = open && inputValue.trim().length >= 2;

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const updateDropdownPosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    setDropdownStyle({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      maxHeight: "min(400px, calc(100vh - 120px))",
    });
  }, []);

  useLayoutEffect(() => {
    if (!showDropdown) return;

    updateDropdownPosition();

    const handlePositionUpdate = () => updateDropdownPosition();
    window.addEventListener("resize", handlePositionUpdate);
    window.addEventListener("scroll", handlePositionUpdate, true);

    return () => {
      window.removeEventListener("resize", handlePositionUpdate);
      window.removeEventListener("scroll", handlePositionUpdate, true);
    };
  }, [showDropdown, updateDropdownPosition]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      navigate(result.href);
      setInputValue("");
      setDebouncedQuery("");
      setOpen(false);
    },
    [navigate]
  );

  const handleClear = useCallback(() => {
    setInputValue("");
    setDebouncedQuery("");
    inputRef.current?.focus();
  }, []);

  const dropdown = showDropdown && typeof document !== "undefined"
    ? createPortal(
        <>
          <div className="fixed inset-0 bg-black/20 z-[9998]" onMouseDown={() => setOpen(false)} />
          <div
            className="fixed rounded-lg border border-white/10 bg-[#151c24] shadow-[0_18px_60px_rgba(0,0,0,0.5)] z-[9999] overflow-hidden"
            style={dropdownStyle}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#1a2332] via-[#1a2332]/85 to-transparent z-10" />
            <div className="overflow-y-auto" style={{ maxHeight: dropdownStyle.maxHeight }}>
              {isSearching && (
                <div
                  className="px-4 py-3 text-[13px] uppercase tracking-[0.08em] text-white/40"
                  style={{ fontFamily: "'Chakra Petch', sans-serif" }}
                >
                  Søker…
                </div>
              )}

              {!isSearching && debouncedQuery.length >= 2 && results.length === 0 && (
                <div
                  className="px-4 py-4 text-[13px] uppercase tracking-[0.05em] text-white/35"
                  style={{ fontFamily: "'Chakra Petch', sans-serif" }}
                >
                  Ingen treff for «{debouncedQuery}»
                </div>
              )}

              {!isSearching && results.length > 0 && (
                <div className="py-1">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleSelect(r)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2dd4a8]/10 transition-colors text-left group border-b border-white/[0.05] last:border-b-0"
                    >
                      <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-white/[0.06] border border-white/[0.06]">
                        {r.thumbnail ? (
                          <img src={r.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[15px] uppercase tracking-[0.03em] text-white truncate font-bold"
                          style={{ fontFamily: "'Chakra Petch', sans-serif" }}
                        >
                          {r.title}
                        </div>
                        {r.subtitle && (
                          <div
                            className="text-[11px] uppercase tracking-[0.04em] text-white/45 truncate"
                            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
                          >
                            {r.subtitle}
                          </div>
                        )}
                      </div>
                      <span
                        className={`text-[10px] uppercase tracking-[0.14em] px-2.5 py-1 rounded-full flex-shrink-0 font-bold ${SECTION_COLORS[r.section] || "bg-white/10 text-white/40"}`}
                        style={{ fontFamily: "'Chakra Petch', sans-serif" }}
                      >
                        {r.sectionLabel}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )
    : null;

  return (
    <>
      <div ref={containerRef} className="relative w-full">
        <div className="relative group">
          <Search className={`absolute ${compact ? 'left-3 w-3.5 h-3.5' : 'left-5 w-5 h-5'} top-1/2 -translate-y-1/2 text-[#2dd4a8]/70 group-focus-within:text-[#2dd4a8] transition-colors`} style={{ filter: 'drop-shadow(0 0 3px rgba(45,212,168,0.3))' }} />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Søk etter biler, deler, arrangementer…"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
            className={`w-full bg-white/[0.05] border border-white/[0.08] hover:border-[#2dd4a8]/30 focus:border-[#2dd4a8]/50 focus:bg-white/[0.07] rounded-lg ${compact ? 'pl-9 pr-8 py-1.5 text-[12px]' : 'pl-14 pr-12 py-3.5 sm:py-4 text-[14px] sm:text-[15px]'} text-white placeholder:text-white/25 focus:outline-none transition-all duration-300 tracking-wide focus:shadow-[0_0_20px_rgba(45,212,168,0.12),0_4px_20px_rgba(0,0,0,0.3)] shadow-[0_2px_16px_rgba(0,0,0,0.3)]`}
          />
          {inputValue && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      {dropdown}
    </>
  );
}
