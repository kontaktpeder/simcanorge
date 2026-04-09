import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogIn, Search as SearchIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { HeroSearch } from "@/components/layout/HeroSearch";
import bilgarasjeLogo from "@/assets/bilgarasje-logo.png";

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
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#f0ebe3]/95 backdrop-blur-md shadow-[0_1px_3px_rgba(58,46,36,0.06)]">
      <div className="max-w-[1400px] mx-auto px-5 md:px-8">
        <div className="flex items-center h-14 md:h-16 gap-4">

          <Link to="/" className="flex-shrink-0 group -my-2">
            <img
              src={bilgarasjeLogo}
              alt="Bilgarasje.no"
              className="h-20 md:h-[92px] w-auto opacity-90 group-hover:opacity-100 transition-opacity duration-300"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-1 flex-shrink-0">
            {navLinks.map((link, i) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`relative px-4 py-1.5 text-[13px] tracking-[0.12em] uppercase font-medium transition-all duration-300 ${
                    isActive
                      ? "text-[#3a2e24]"
                      : "text-[#3a2e24]/40 hover:text-[#3a2e24]/70"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute -bottom-[7px] left-4 right-4 h-px bg-[#c4962c]" />
                  )}
                  {i < navLinks.length - 1 && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-2.5 bg-[#3a2e24]/10" />
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
                className="p-2 text-[#3a2e24]/30 hover:text-[#3a2e24]/60 transition-colors"
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
                to="/dashboard"
                className="px-5 py-2 text-[13px] tracking-[0.1em] uppercase font-medium text-[#3a2e24]/50 hover:text-[#3a2e24]/80 border border-[#3a2e24]/15 hover:border-[#3a2e24]/30 transition-all duration-300"
              >
                Min garasje
              </Link>
            ) : (
              <Link
                to="/login?returnUrl=/dashboard"
                className="flex items-center gap-2 px-5 py-2 text-[13px] tracking-[0.1em] uppercase font-medium text-[#3a2e24]/50 hover:text-[#3a2e24]/80 border border-[#3a2e24]/15 hover:border-[#3a2e24]/30 transition-all duration-300"
              >
                <LogIn className="w-3.5 h-3.5" />
                Logg inn
              </Link>
            )}
            <Link
              to="/dashboard/opprett-bil"
              className="px-5 py-2 text-[13px] tracking-[0.1em] uppercase text-[#0f0d0b] font-bold transition-all duration-300 hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #d4a017, #e8c547, #c4962c)' }}
            >
              Send inn bil
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden ml-auto p-2 text-[#3a2e24]/40 hover:text-[#3a2e24]/80 transition-colors"
            aria-label="Meny"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="h-px bg-[#c4962c]/10" />

      {navSearchOpen && showCompactIcon && (
        <div className="hidden md:block bg-[#f0ebe3] border-t border-[#3a2e24]/[0.06] px-5 md:px-8 py-3">
          <div className="max-w-md mx-auto">
            <HeroSearch compact />
          </div>
        </div>
      )}

      {mobileMenuOpen && (
        <nav className="lg:hidden bg-[#f0ebe3] border-t border-[#3a2e24]/[0.06]">
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
                  className={`py-2.5 text-[11px] tracking-[0.15em] uppercase border-b border-[#3a2e24]/[0.06] transition-all ${
                    isActive ? "text-[#3a2e24]" : "text-[#3a2e24]/35 hover:text-[#3a2e24]/65"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="flex flex-col gap-2 mt-3 pb-2">
              {user ? (
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-center text-[11px] tracking-[0.15em] uppercase text-[#3a2e24]/50 border border-[#3a2e24]/15">
                  Min garasje
                </Link>
              ) : (
                <Link to="/login?returnUrl=/dashboard" onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-center text-[11px] tracking-[0.15em] uppercase text-[#3a2e24]/50 border border-[#3a2e24]/15 flex items-center justify-center gap-2">
                  <LogIn className="w-3.5 h-3.5" /> Logg inn
                </Link>
              )}
              <Link to="/send-inn" onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-center text-[11px] tracking-[0.15em] uppercase text-[#0a0a0a] font-semibold"
                style={{ background: 'linear-gradient(135deg, #d4a017, #e8c547, #c4962c)' }}>
                Send inn bil
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
