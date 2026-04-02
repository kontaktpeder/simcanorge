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

const SECTION_LABELS: Record<string, string> = {
  biler: "Biler",
  arrangement: "Arrangement",
  markedsplass: "Markedsplass",
  deler: "Deler",
  sider: "Sider",
};

function routeToSection(pathname: string): string | null {
  if (pathname.startsWith("/biler")) return "biler";
  if (pathname.startsWith("/markedsplass")) return "markedsplass";
  if (pathname.startsWith("/e/")) return "arrangement";
  if (pathname.startsWith("/s/")) return "sider";
  return null;
}

export function GlobalSearch() {
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(inputValue), 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const { results, isSearching } = useGlobalSearch(debouncedQuery);

  const currentSection = routeToSection(location.pathname);
  const contextResults = currentSection
    ? results.filter((r) => r.section === currentSection)
    : [];
  const otherResults = currentSection
    ? results.filter((r) => r.section !== currentSection)
    : results;

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
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/15" />
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Søk etter biler, deler, arrangement..."
        className="w-full bg-transparent border-b border-white/[0.08] pl-9 pr-8 py-1.5 text-[12px] text-white/50 placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-all tracking-wide"
      />
      {inputValue && (
        <button onClick={handleClear} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#111] border border-white/[0.08] shadow-2xl z-[100] max-h-[380px] overflow-y-auto">
          {isSearching && (
            <div className="px-4 py-3 text-[12px] text-white/30 tracking-wide">
              Søker…
            </div>
          )}

          {!isSearching && debouncedQuery.length >= 2 && results.length === 0 && (
            <div className="px-4 py-4 text-[12px] text-white/25 tracking-wide">
              Ingen treff for «{debouncedQuery}»
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <>
              {contextResults.length > 0 && currentSection && (
                <div>
                  <div className="px-4 pt-3 pb-1 text-[10px] tracking-[0.15em] uppercase text-white/20">
                    I {SECTION_LABELS[currentSection]}
                  </div>
                  {contextResults.map((r) => (
                    <ResultRow key={r.id} result={r} onSelect={handleSelect} />
                  ))}
                </div>
              )}

              {otherResults.length > 0 && (
                <div>
                  {contextResults.length > 0 && (
                    <div className="px-4 pt-3 pb-1 text-[10px] tracking-[0.15em] uppercase text-white/20">
                      Resten av siden
                    </div>
                  )}
                  {otherResults.map((r) => (
                    <ResultRow key={r.id} result={r} onSelect={handleSelect} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ResultRow({
  result,
  onSelect,
}: {
  result: SearchResult;
  onSelect: (r: SearchResult) => void;
}) {
  return (
    <button
      onClick={() => onSelect(result)}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors text-left group"
    >
      <div className="w-9 h-9 rounded overflow-hidden flex-shrink-0 bg-white/[0.04]">
        {result.thumbnail ? (
          <img src={result.thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[12px] text-white/70 group-hover:text-white/90 truncate transition-colors">
          {result.title}
        </div>
        {result.subtitle && (
          <div className="text-[11px] text-white/25 truncate">
            {result.subtitle}
          </div>
        )}
      </div>

      <span className={`text-[9px] tracking-[0.12em] uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${SECTION_COLORS[result.section] || "bg-white/10 text-white/30"}`}>
        {result.sectionLabel}
      </span>
    </button>
  );
}
