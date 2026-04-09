import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useGlobalSearch, type SearchResult } from "@/hooks/useGlobalSearch";

const SECTION_COLORS: Record<string, string> = {
  biler: "bg-[#c4962c]/15 text-[#c4962c]",
  arrangement: "bg-[#8b6914]/15 text-[#8b6914]",
  markedsplass: "bg-[#3a2e24]/10 text-[#3a2e24]/70",
  deler: "bg-[#3a2e24]/10 text-[#3a2e24]/60",
  sider: "bg-[#8b6914]/10 text-[#8b6914]/80",
};

export function HeroSearch() {
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
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

  return (
    <div ref={containerRef} className="relative w-full" style={{ zIndex: 9999 }}>
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b6914]" />
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
          className="w-full bg-[#e8e0d4]/90 backdrop-blur-md border border-[#c4962c]/20 hover:border-[#c4962c]/40 focus:border-[#c4962c] rounded-lg pl-14 pr-12 py-3.5 sm:py-4 text-[14px] sm:text-[15px] text-[#3a2e24] placeholder:text-[#3a2e24]/35 focus:outline-none transition-all tracking-wide shadow-[0_2px_16px_rgba(58,46,36,0.15)]"
        />
        {inputValue && (
          <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3a2e24]/30 hover:text-[#3a2e24]/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#ede6db] border border-[#c4962c]/15 shadow-[0_8px_32px_rgba(58,46,36,0.18)] z-[9999] max-h-[380px] overflow-y-auto rounded-lg">
          {isSearching && (
            <div className="px-4 py-3 text-[13px] text-[#3a2e24]/40 tracking-wide" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>Søker…</div>
          )}

          {!isSearching && debouncedQuery.length >= 2 && results.length === 0 && (
            <div className="px-4 py-4 text-[13px] text-[#3a2e24]/35 tracking-wide" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
              Ingen treff for «{debouncedQuery}»
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div className="py-1">
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSelect(r)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#c4962c]/8 transition-colors text-left group"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#3a2e24]/[0.06] border border-[#3a2e24]/[0.06]">
                    {r.thumbnail ? (
                      <img src={r.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-[#3a2e24]/80 group-hover:text-[#3a2e24] truncate transition-colors font-medium">
                      {r.title}
                    </div>
                    {r.subtitle && (
                      <div className="text-[11px] text-[#3a2e24]/35 truncate">{r.subtitle}</div>
                    )}
                  </div>
                  <span className={`text-[9px] tracking-[0.12em] uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${SECTION_COLORS[r.section] || "bg-[#3a2e24]/10 text-[#3a2e24]/40"}`}>
                    {r.sectionLabel}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
