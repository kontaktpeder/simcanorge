import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Search as SearchIcon, X, User } from "lucide-react";
import { HeroSearch } from "@/components/layout/HeroSearch";
import { useHideOnScroll } from "@/hooks/useHideOnScroll";
import { useAuth } from "@/hooks/useAuth";
import { useFeatures } from "@/hooks/useFeatures";
import bilgarasjeLogo from "@/assets/bilgarasje-logo.png";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

export function Header() {
  const location = useLocation();
  const { user } = useAuth();
  const features = useFeatures();
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
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl transition-transform duration-300 ease-out will-change-transform"
      style={{
        background:
          "linear-gradient(180deg, rgba(14,20,28,0.96) 0%, rgba(10,14,20,0.92) 60%, rgba(8,12,17,0.88) 100%)",
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.04) inset, 0 -1px 0 rgba(52,234,184,0.18)",
        transform: navVisible || mobileSearchOpen ? "translateY(0)" : "translateY(-110%)",
      }}
    >
      {/* Glassy top sheen */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[60%]"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.015) 50%, transparent 100%)",
        }}
      />
      {/* Soft teal aura behind logo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 420px 80px at 50% 0%, rgba(52,234,184,0.18) 0%, rgba(52,234,184,0.06) 40%, transparent 70%)",
        }}
      />

      <div className="relative max-w-[1400px] mx-auto px-5 md:px-8">
        <div className="grid grid-cols-[auto_1fr_auto] items-center h-14 md:h-16 gap-3">
          {/* LEFT — Profile icon only */}
          <Link
            to={profileHref}
            className="relative p-2 -ml-2 text-white/65 hover:text-[#34eab8] transition-all flex-shrink-0 rounded-full hover:bg-white/[0.04]"
            aria-label={user ? "Min profil" : "Logg inn"}
            style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}
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
              className="h-24 md:h-28 w-auto transition-all duration-300 group-hover:opacity-90"
              style={{
                filter:
                  "brightness(1.9) invert(1) drop-shadow(0 0 14px rgba(52,234,184,0.35)) drop-shadow(0 2px 6px rgba(0,0,0,0.5))",
                opacity: 0.7,
              }}
            />
          </Link>

          {/* RIGHT — Desktop nav links + Search */}
          <div className="flex items-center justify-end flex-shrink-0 gap-2 md:gap-3">
            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center gap-0.5 lg:gap-1" aria-label="Hovedmeny">
              <NavLink
                to="/hjem"
                className={({ isActive }) =>
                  `text-[11px] uppercase tracking-[0.14em] font-bold px-2 py-1 rounded transition-colors ${
                    isActive || location.pathname.startsWith("/biler")
                      ? "text-[#34eab8]"
                      : "text-white/55 hover:text-white/90"
                  }`
                }
                style={oswald}
              >
                Utforsk
              </NavLink>
              {!features.simpleLaunchMode && (
                <>
                  <NavLink
                    to="/markedsplass"
                    className={({ isActive }) =>
                      `text-[11px] uppercase tracking-[0.14em] font-bold px-2 py-1 rounded transition-colors ${
                        isActive ? "text-[#34eab8]" : "text-white/55 hover:text-white/90"
                      }`
                    }
                    style={oswald}
                  >
                    Marked
                  </NavLink>
                  <NavLink
                    to="/arrangement"
                    className={({ isActive }) =>
                      `text-[11px] uppercase tracking-[0.14em] font-bold px-2 py-1 rounded transition-colors ${
                        isActive ? "text-[#34eab8]" : "text-white/55 hover:text-white/90"
                      }`
                    }
                    style={oswald}
                  >
                    Treff
                  </NavLink>
                  <NavLink
                    to="/klubber"
                    className={({ isActive }) =>
                      `text-[11px] uppercase tracking-[0.14em] font-bold px-2 py-1 rounded transition-colors ${
                        isActive ? "text-[#34eab8]" : "text-white/55 hover:text-white/90"
                      }`
                    }
                    style={oswald}
                  >
                    Klubber
                  </NavLink>
                </>
              )}
              <NavLink
                to="/om-oss"
                className={({ isActive }) =>
                  `text-[11px] uppercase tracking-[0.14em] font-bold px-2 py-1 rounded transition-colors ${
                    isActive ? "text-[#34eab8]" : "text-white/55 hover:text-white/90"
                  }`
                }
                style={oswald}
              >
                Om oss
              </NavLink>
            </nav>

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
                    className="p-2 text-white/65 hover:text-[#34eab8] transition-all rounded-full hover:bg-white/[0.04]"
                    aria-label="Søk"
                    style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}
                  >
                    <SearchIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile search toggle */}
            <button
              onClick={() => setMobileSearchOpen((v) => !v)}
              className="md:hidden p-2 -mr-2 text-white/65 hover:text-[#34eab8] transition-all rounded-full hover:bg-white/[0.04]"
              aria-label={mobileSearchOpen ? "Lukk søk" : "Søk"}
              style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}
            >
              {mobileSearchOpen ? <X className="w-5 h-5" /> : <SearchIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Glowing teal underline */}
      <div
        className="relative h-[2px] overflow-hidden"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(52,234,184,0.55) 30%, rgba(52,234,184,0.85) 50%, rgba(52,234,184,0.55) 70%, transparent 100%)",
          boxShadow: "0 0 12px rgba(52,234,184,0.45)",
        }}
      />

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
