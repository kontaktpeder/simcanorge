import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useGlobalSearch, type SearchResult } from "@/hooks/useGlobalSearch";

const SECTION_COLORS: Record<string, string> = {
  biler: "bg-blue-500/15 text-blue-300",
  arrangement: "bg-amber-500/15 text-amber-300",
  markedsplass: "bg-emerald-500/15 text-emerald-300",
  deler: "bg-rose-500/15 text-rose-300",
  sider: "bg-purple-500/15 text-purple-300",
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
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
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
          className="w-full bg-white/20 backdrop-blur-lg border-2 border-white/30 hover:border-white/50 focus:border-[#c4962c] rounded-xl pl-14 pr-12 py-3.5 sm:py-4 text-[14px] sm:text-[15px] text-white placeholder:text-white/50 focus:outline-none transition-all tracking-wide shadow-[0_4px_30px_rgba(0,0,0,0.25)]"
        />
        {inputValue && (
          <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#111315]/95 backdrop-blur-md border border-white/[0.1] shadow-2xl z-[100] max-h-[380px] overflow-y-auto">
          {isSearching && (
            <div className="px-4 py-3 text-[13px] text-white/30 tracking-wide">Søker…</div>
          )}

          {!isSearching && debouncedQuery.length >= 2 && results.length === 0 && (
            <div className="px-4 py-4 text-[13px] text-white/25 tracking-wide">
              Ingen treff for «{debouncedQuery}»
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div>
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSelect(r)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.06] transition-colors text-left group"
                >
                  <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-white/[0.04]">
                    {r.thumbnail ? (
                      <img src={r.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-white/70 group-hover:text-white/90 truncate transition-colors">
                      {r.title}
                    </div>
                    {r.subtitle && (
                      <div className="text-[11px] text-white/25 truncate">{r.subtitle}</div>
                    )}
                  </div>
                  <span className={`text-[9px] tracking-[0.12em] uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${SECTION_COLORS[r.section] || "bg-white/10 text-white/30"}`}>
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
