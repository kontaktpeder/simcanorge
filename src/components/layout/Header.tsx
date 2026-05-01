import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search as SearchIcon, X, User } from "lucide-react";
import { HeroSearch } from "@/components/layout/HeroSearch";
import { useHideOnScroll } from "@/hooks/useHideOnScroll";
import { useAuth } from "@/hooks/useAuth";
import bilgarasjeLogo from "@/assets/bilgarasje-logo.png";

export function Header() {
  const location = useLocation();
  const { user } = useAuth();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [navSearchOpen, setNavSearchOpen] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);
  const navVisible = useHideOnScroll(10);

  const isHome = location.pathname === "/";

  useEffect(() => {
    if (!isHome) {
      setHeroVisible(false);
      return;
    }
    const onScroll = () => setHeroVisible(window.scrollY < 200);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  // Close mobile search on route change
  useEffect(() => {
    setMobileSearchOpen(false);
  }, [location.pathname]);

  const showFullNavSearch = !isHome;
  const showCompactIcon = isHome && heroVisible;
  const showExpandedNavSearch = isHome && !heroVisible;

  const profileHref = user ? "/konto" : "/login";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-transform duration-300 ease-out will-change-transform"
      style={{
        background: "rgba(12,17,23,0.92)",
        transform: navVisible || mobileSearchOpen ? "translateY(0)" : "translateY(-110%)",
      }}
    >
      <div className="max-w-[1400px] mx-auto px-5 md:px-8">
        <div className="grid grid-cols-[auto_1fr_auto] items-center h-14 md:h-16 gap-3">
          {/* LEFT — Profile icon only */}
          <Link
            to={profileHref}
            className="p-2 -ml-2 text-white/55 hover:text-white transition-colors flex-shrink-0"
            aria-label={user ? "Min profil" : "Logg inn"}
          >
            <User className="w-5 h-5 md:w-[22px] md:h-[22px]" />
          </Link>

          {/* CENTER — Logo */}
          <Link
            to="/"
            className="flex justify-center items-center group -my-2 min-w-0"
            aria-label="Bilgarasje.no — hjem"
          >
            <img
              src={bilgarasjeLogo}
              alt="Bilgarasje.no"
              className="h-24 md:h-28 w-auto transition-all duration-300 group-hover:opacity-80"
              style={{ filter: "brightness(1.8) invert(1)", opacity: 0.55 }}
            />
          </Link>

          {/* RIGHT — Search */}
          <div className="flex items-center justify-end flex-shrink-0">
            {/* Desktop / tablet */}
            <div className="hidden md:flex items-center justify-end">
              <div className="w-full max-w-xl">
                {(showFullNavSearch || showExpandedNavSearch) && (
                  <div className={showExpandedNavSearch ? "animate-in fade-in duration-200" : ""}>
                    <HeroSearch compact />
                  </div>
                )}
                {showCompactIcon && (
                  <button
                    onClick={() => setNavSearchOpen((v) => !v)}
                    className="p-2 text-white/55 hover:text-white transition-colors"
                    aria-label="Søk"
                  >
                    <SearchIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile search toggle */}
            <button
              onClick={() => setMobileSearchOpen((v) => !v)}
              className="md:hidden p-2 -mr-2 text-white/55 hover:text-white transition-colors"
              aria-label={mobileSearchOpen ? "Lukk søk" : "Søk"}
            >
              {mobileSearchOpen ? <X className="w-5 h-5" /> : <SearchIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="h-px bg-[#2dd4a8]/10" />

      {/* Desktop compact-icon expanded panel */}
      {navSearchOpen && showCompactIcon && (
        <div
          className="hidden md:block border-t border-white/[0.06] px-5 md:px-8 py-3"
          style={{ background: "rgba(12,17,23,0.95)" }}
        >
          <div className="max-w-xl ml-auto">
            <HeroSearch compact />
          </div>
        </div>
      )}

      {/* Mobile expanded search */}
      {mobileSearchOpen && (
        <div
          className="md:hidden border-t border-white/[0.06] px-5 py-3"
          style={{ background: "rgba(12,17,23,0.98)" }}
        >
          <HeroSearch compact />
        </div>
      )}
    </header>
  );
}
