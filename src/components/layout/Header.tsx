import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogIn, Search as SearchIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { HeroSearch } from "@/components/layout/HeroSearch";
import bilgarasjeLogo from "@/assets/bilgarasje-logo.png";

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

const navLinks = [
  { href: "/", label: "Hjem" },
  { href: "/om-oss", label: "Om oss" },
];

export function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const [navSearchOpen, setNavSearchOpen] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);

  const isHome = location.pathname === "/";

  useEffect(() => {
    if (!isHome) {
      setHeroVisible(false);
      return;
    }
    const onScroll = () => {
      setHeroVisible(window.scrollY < 200);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  const showFullNavSearch = !isHome;
  const showCompactIcon = isHome && heroVisible;
  const showExpandedNavSearch = isHome && !heroVisible;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
      style={{ background: 'rgba(12,17,23,0.92)' }}>
      <div className="max-w-[1400px] mx-auto px-5 md:px-8">
        <div className="flex items-center h-14 md:h-16 gap-4">

          <Link to="/" className="flex-shrink-0 group -my-2">
            <img
              src={bilgarasjeLogo}
              alt="Bilgarasje.no"
              className="h-28 md:h-32 w-auto transition-all duration-300 group-hover:opacity-80"
              style={{ filter: 'brightness(1.8) invert(1)', opacity: 0.55 }}
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-1 flex-shrink-0">
            {navLinks.map((link, i) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`relative px-4 py-1.5 text-[13px] tracking-[0.1em] uppercase font-bold transition-all duration-300 ${
                    isActive
                      ? "text-white"
                      : "text-white/40 hover:text-white/70"
                  }`}
                  style={chakra}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute -bottom-[7px] left-4 right-4 h-px bg-[#2dd4a8]" />
                  )}
                  {i < navLinks.length - 1 && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-2.5 bg-white/10" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Search area */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 items-center justify-center">
            {(showFullNavSearch || showExpandedNavSearch) && (
              <div className={`w-full ${showExpandedNavSearch ? 'animate-in fade-in duration-200' : ''}`}>
                <HeroSearch compact />
              </div>
            )}
            {showCompactIcon && (
              <button
                onClick={() => setNavSearchOpen(!navSearchOpen)}
                className="p-2 text-white/30 hover:text-white/60 transition-colors"
                aria-label="Søk"
              >
                <SearchIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex-1 md:hidden" />
          <div className="hidden lg:block flex-1" />

          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
            {user ? (
              <Link
                to="/garasje"
                className="px-4 py-1.5 text-[12px] tracking-[0.1em] uppercase font-bold text-white/30 hover:text-white/55 transition-all duration-300 rounded"
                style={chakra}
              >
                Min garasje
              </Link>
            ) : (
              <Link
                to="/login?returnUrl=/garasje"
                className="flex items-center gap-2 px-4 py-1.5 text-[12px] tracking-[0.1em] uppercase font-bold text-white/35 hover:text-white/60 transition-all duration-300 rounded"
                style={chakra}
              >
                <LogIn className="w-3.5 h-3.5" />
                Logg inn
              </Link>
            )}
            <Link
              to={user ? "/dashboard/opprett-bil" : "/send-inn"}
              className="px-6 py-2.5 text-[13px] tracking-[0.12em] uppercase font-bold transition-all duration-300 hover:scale-[1.03] hover:brightness-115 rounded-lg text-[#0a0f14]"
              style={{ ...chakra, background: 'linear-gradient(135deg, #34eab8 0%, #2dd4a8 40%, #1cb896 100%)', boxShadow: '0 0 24px rgba(45,212,168,0.35), 0 2px 8px rgba(0,0,0,0.3)' }}
            >
              Del bilen din +
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden ml-auto p-2 text-white/40 hover:text-white/80 transition-colors"
            aria-label="Meny"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="h-px bg-[#2dd4a8]/10" />

      {navSearchOpen && showCompactIcon && (
        <div className="hidden md:block border-t border-white/[0.06] px-5 md:px-8 py-3" style={{ background: 'rgba(12,17,23,0.95)' }}>
          <div className="max-w-md mx-auto">
            <HeroSearch compact />
          </div>
        </div>
      )}

      {mobileMenuOpen && (
        <nav className="lg:hidden border-t border-white/[0.06]" style={{ background: 'rgba(12,17,23,0.98)' }}>
          <div className="px-5 py-2 flex flex-col">
            <div className="py-3">
              <HeroSearch compact />
            </div>
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-2.5 text-[11px] tracking-[0.12em] uppercase font-bold border-b border-white/[0.06] transition-all ${
                    isActive ? "text-white" : "text-white/35 hover:text-white/65"
                  }`}
                  style={chakra}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="flex flex-col gap-2 mt-3 pb-2">
              {user ? (
                <Link to="/garasje" onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-center text-[11px] tracking-[0.12em] uppercase font-bold text-white/50 border border-white/15 rounded"
                  style={chakra}>
                  Min garasje
                </Link>
              ) : (
                <Link to="/login?returnUrl=/garasje" onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-center text-[11px] tracking-[0.12em] uppercase font-bold text-white/50 border border-white/15 flex items-center justify-center gap-2 rounded"
                  style={chakra}>
                  <LogIn className="w-3.5 h-3.5" /> Logg inn
                </Link>
              )}
              <Link to={user ? "/dashboard/opprett-bil" : "/send-inn"} onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-center text-[11px] tracking-[0.12em] uppercase font-bold rounded text-[#0c1117]"
                style={{ ...chakra, background: 'linear-gradient(135deg, #2dd4a8, #14b8a6)' }}>
                Legg til bil +
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
