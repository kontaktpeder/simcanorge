import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Search as SearchIcon, X, User } from "lucide-react";
import { HeroSearch } from "@/components/layout/HeroSearch";
import { useHideOnScroll } from "@/hooks/useHideOnScroll";
import { useAuth } from "@/hooks/useAuth";
import { useFeatures } from "@/hooks/useFeatures";
import bilgarasjeLogo from "@/assets/bilgarasje-logo.png";

// Vegvesen-inspirert lys palett (matcher /min-garasje, PublishComposer, BilDetalj)
const VV_BG = "#f3f3f3";
const VV_YELLOW = "#fcc419";
const VV_DARK = "#2b2b2b";
const VV_ORANGE = "#ff8a00";

const inter = { fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" } as const;

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `relative text-[12px] uppercase tracking-[0.12em] font-bold px-2.5 py-1.5 rounded-md transition-colors ${
    isActive ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-900"
  }`;

const ActiveDot = ({ active }: { active: boolean }) =>
  active ? (
    <span
      className="absolute left-1/2 -translate-x-1/2 -bottom-0.5 h-[3px] w-5 rounded-full"
      style={{ backgroundColor: VV_YELLOW }}
    />
  ) : null;

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

  useEffect(() => {
    setMobileSearchOpen(false);
  }, [location.pathname]);

  const showFullNavSearch = !isHome;
  const showCompactIcon = isHome && heroVisible;
  const showExpandedNavSearch = isHome && !heroVisible;

  const profileHref = user ? "/konto" : "/login";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-out will-change-transform"
      style={{
        backgroundColor: "rgba(255,255,255,0.92)",
        backdropFilter: "saturate(180%) blur(14px)",
        WebkitBackdropFilter: "saturate(180%) blur(14px)",
        borderBottom: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 1px 0 rgba(0,0,0,0.02), 0 8px 24px -16px rgba(0,0,0,0.12)",
        transform: navVisible || mobileSearchOpen ? "translateY(0)" : "translateY(-110%)",
        ...inter,
      }}
    >
      {/* Subtil oransje top-stripe (samme aksent som composer-progress) */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${VV_ORANGE} 35%, ${VV_YELLOW} 65%, transparent 100%)`,
          opacity: 0.7,
        }}
      />

      <div className="relative max-w-[720px] mx-auto px-5 md:px-8">
        <div className="grid grid-cols-[auto_1fr_auto] items-center h-14 md:h-16 gap-3">
          {/* LEFT — Profile icon only */}
          <Link
            to={profileHref}
            className="relative p-2 -ml-2 text-neutral-600 hover:text-neutral-950 transition-colors flex-shrink-0 rounded-full hover:bg-black/[0.04]"
            aria-label={user ? "Min profil" : "Logg inn"}
          >
            <User className="w-5 h-5 md:w-[22px] md:h-[22px]" strokeWidth={2} />
          </Link>

          {/* CENTER — Logo */}
          <Link
            to="/"
            className="flex justify-center items-center group min-w-0 h-14 md:h-16 overflow-hidden"
            aria-label="Bilgarasje.no — hjem"
          >
            <img
              src={bilgarasjeLogo}
              alt="Bilgarasje.no"
              className="h-20 md:h-24 w-auto transition-opacity duration-200 group-hover:opacity-80 pointer-events-none"
              style={{ filter: "contrast(1.05)" }}
            />
          </Link>

          {/* RIGHT — Desktop nav + Search */}
          <div className="flex items-center justify-end flex-shrink-0 gap-2 md:gap-3">
            <nav className="hidden md:flex items-center gap-0.5 lg:gap-1" aria-label="Hovedmeny">
              <NavLink to="/hjem" className={navLinkClass} style={inter}>
                {({ isActive }) => (
                  <>
                    Utforsk
                    <ActiveDot active={isActive || location.pathname.startsWith("/biler")} />
                  </>
                )}
              </NavLink>
              {!features.simpleLaunchMode && (
                <>
                  <NavLink to="/markedsplass" className={navLinkClass} style={inter}>
                    {({ isActive }) => (<>Marked<ActiveDot active={isActive} /></>)}
                  </NavLink>
                  <NavLink to="/arrangement" className={navLinkClass} style={inter}>
                    {({ isActive }) => (<>Treff<ActiveDot active={isActive} /></>)}
                  </NavLink>
                  <NavLink to="/klubber" className={navLinkClass} style={inter}>
                    {({ isActive }) => (<>Klubber<ActiveDot active={isActive} /></>)}
                  </NavLink>
                </>
              )}
              {user && (
                <NavLink to="/min-garasje" className={navLinkClass} style={inter}>
                  {({ isActive }) => (<>Min garasje<ActiveDot active={isActive} /></>)}
                </NavLink>
              )}
              <NavLink to="/om-oss" className={navLinkClass} style={inter}>
                {({ isActive }) => (<>Om oss<ActiveDot active={isActive} /></>)}
              </NavLink>
            </nav>

            {/* Desktop / tablet search */}
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
                    className="p-2 text-neutral-600 hover:text-neutral-950 transition-colors rounded-full hover:bg-black/[0.04]"
                    aria-label="Søk"
                  >
                    <SearchIcon className="w-5 h-5" strokeWidth={2} />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile search toggle */}
            <button
              onClick={() => setMobileSearchOpen((v) => !v)}
              className="md:hidden p-2 -mr-2 text-neutral-600 hover:text-neutral-950 transition-colors rounded-full hover:bg-black/[0.04]"
              aria-label={mobileSearchOpen ? "Lukk søk" : "Søk"}
            >
              {mobileSearchOpen ? <X className="w-5 h-5" strokeWidth={2} /> : <SearchIcon className="w-5 h-5" strokeWidth={2} />}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop compact-icon expanded panel */}
      {navSearchOpen && showCompactIcon && (
        <div
          className="hidden md:block border-t border-black/[0.06] px-5 md:px-8 py-3"
          style={{ backgroundColor: VV_BG }}
        >
          <div className="max-w-xl ml-auto">
            <HeroSearch compact />
          </div>
        </div>
      )}

      {/* Mobile expanded search */}
      {mobileSearchOpen && (
        <div
          className="md:hidden border-t border-black/[0.06] px-5 py-3"
          style={{ backgroundColor: VV_BG }}
        >
          <HeroSearch compact />
        </div>
      )}
    </header>
  );
}
