import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import simcaBadge from "@/assets/simca-badge.png";
import toolboxIcon from "@/assets/toolbox-icon.png";
import simcaRallye from "@/assets/simca-rallye-yellow.png";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { href: "/", label: "Hjem", description: "Tilbake til forsiden" },
  { href: "/manedens-bil", label: "Månedens bil", description: "Se denne månedens utvalgte Simca" },
  { href: "/biler", label: "Biler", description: "Utforsk Simca-biler og historier" },
  { href: "/deler", label: "Deler", description: "Finn deler til din Simca" },
  { href: "/send-inn", label: "Send inn din bil", description: "Del din Simca-historie med oss" },
  { href: "/historie", label: "Simcaens historie" , description: "Lær om Simcas rike historie" },
  { href: "/om-oss", label: "Om oss", description: "Hvem står bak Simca Norge" },
];

const LEAVE_HOME_ANIM_KEY = "simca_leave_home_anim";

// Animation settings (JS-driven so it never jumps when boosting)
const CAR_START_X = -100; // px
const CAR_END_MARGIN = 100; // px beyond viewport
const NORMAL_TRAVEL_TIME = 10; // seconds for one full pass
const BOOST_MULTIPLIER = 3.2; // speed multiplier during boost
const BOOST_MS = 1000; // boost duration

export function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSpeedBoost, setIsSpeedBoost] = useState(false);
  const [isDrivingToGarage, setIsDrivingToGarage] = useState(false);
  const [roadFading, setRoadFading] = useState(false);
  const { itemCount } = useCart();

  const isHome = location.pathname === "/";

  // Refs for JS-driven animation
  const carWrapRef = useRef<HTMLDivElement | null>(null);
  const smokeWrapRef = useRef<HTMLDivElement | null>(null);
  const xRef = useRef(CAR_START_X);
  const lastTsRef = useRef<number | null>(null);
  const boostUntilRef = useRef<number>(0);

  // Trigger drive-to-garage ONLY when we left home via a click
  useEffect(() => {
    if (isHome) {
      setIsDrivingToGarage(false);
      setRoadFading(false);
      return;
    }

    const shouldAnimate = sessionStorage.getItem(LEAVE_HOME_ANIM_KEY) === "1";
    if (!shouldAnimate) return;

    sessionStorage.removeItem(LEAVE_HOME_ANIM_KEY);
    setIsDrivingToGarage(true);
    setRoadFading(false);

    const fadeTimer = setTimeout(() => setRoadFading(true), 400);
    const endTimer = setTimeout(() => setIsDrivingToGarage(false), 900);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
    };
  }, [isHome]);

  const markLeavingHome = (to: string) => {
    if (!isHome) return;
    if (to === "/") return;
    sessionStorage.setItem(LEAVE_HOME_ANIM_KEY, "1");
  };

  // JS-driven continuous driving animation on home (no resets when boosting)
  useEffect(() => {
    if (!isHome || isDrivingToGarage) return;

    const tick = (ts: number) => {
      if (!carWrapRef.current || !smokeWrapRef.current) {
        lastTsRef.current = ts;
        requestAnimationFrame(tick);
        return;
      }

      const last = lastTsRef.current;
      lastTsRef.current = ts;
      if (last == null) {
        requestAnimationFrame(tick);
        return;
      }

      const dt = (ts - last) / 1000;
      const endX = window.innerWidth + CAR_END_MARGIN;
      const distance = endX - CAR_START_X;
      const baseSpeed = distance / NORMAL_TRAVEL_TIME; // px/s
      const speed = ts < boostUntilRef.current ? baseSpeed * BOOST_MULTIPLIER : baseSpeed;

      xRef.current += speed * dt;
      if (xRef.current > endX) xRef.current = CAR_START_X;

      const x = xRef.current;
      const transform = `translateX(${x}px)`;
      carWrapRef.current.style.transform = transform;
      smokeWrapRef.current.style.transform = transform;

      requestAnimationFrame(tick);
    };

    const raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      lastTsRef.current = null;
    };
  }, [isHome, isDrivingToGarage]);

  const handleCarClick = () => {
    if (!isHome || isDrivingToGarage) return;

    const now = performance.now();
    boostUntilRef.current = now + BOOST_MS;
    setIsSpeedBoost(true);

    window.setTimeout(() => setIsSpeedBoost(false), BOOST_MS);
  };

  return (
    <header className="sticky top-0 z-50 header-chrome">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover-lift">
            <img 
              src={simcaBadge} 
              alt="Simca Norge" 
              className="h-14 w-auto drop-shadow-md"
            />
            <div className="hidden sm:block">
              <span className="font-display text-2xl text-primary">SIMCA</span>
              <span className="font-display text-2xl text-accent ml-1">NORGE</span>
            </div>
          </Link>

          {/* Garage with parked car - visible on non-home pages (desktop only) */}
          {!isHome && !isDrivingToGarage && (
            <div className="hidden lg:flex items-center mx-4">
              <div 
                className="relative px-4 py-2 rounded-t-xl"
                style={{
                  background: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 50%, #0f0f0f 100%)',
                  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6), inset 0 -1px 0 rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.4)',
                  border: '1px solid #333',
                  borderBottom: 'none'
                }}
              >
                {/* Garage roof with realistic shingles look */}
                <div 
                  className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-t-lg"
                  style={{
                    width: 'calc(100% + 16px)',
                    height: '12px',
                    background: 'linear-gradient(180deg, #4a3728 0%, #3d2d22 50%, #2a1f18 100%)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                    borderRadius: '6px 6px 0 0'
                  }}
                />
                {/* Concrete floor */}
                <div 
                  className="absolute bottom-0 left-0 right-0 h-1"
                  style={{
                    background: 'linear-gradient(90deg, #555 0%, #666 50%, #555 100%)'
                  }}
                />
                {/* Parked car */}
                <img 
                  src={simcaRallye} 
                  alt="Parkert Simca" 
                  className="h-[24px] w-auto object-contain drop-shadow-md relative z-10"
                />
              </div>
            </div>
          )}

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <TooltipProvider delayDuration={200}>
              {navItems.map((item) => (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                      <Link
                        to={item.href}
                        onClick={() => markLeavingHome(item.href)}
                        className={`font-display text-lg uppercase tracking-wide transition-all hover:text-accent relative py-1 ${
                          location.pathname === item.href
                            ? "text-accent"
                            : "text-foreground"
                        }`}
                      >
                      {item.label}
                      {location.pathname === item.href && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{item.description}</p>
                  </TooltipContent>
                </Tooltip>
              ))}

              {/* Toolbox Icon */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/foresporsel"
                    onClick={() => markLeavingHome("/foresporsel")}
                    className="relative p-2 hover:bg-muted/50 rounded-lg transition-colors ml-2"
                    aria-label="Min verktøykasse"
                  >
                    <img src={toolboxIcon} alt="Verktøykasse" className="h-12 w-auto object-contain" />
                    {itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground w-5 h-5 rounded-full text-xs font-display flex items-center justify-center shadow-md">
                        {itemCount}
                      </span>
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{itemCount > 0 ? `${itemCount} deler i verktøykassen` : "Min verktøykasse"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </nav>

          {/* Mobile: Toolbox + Menu */}
          <div className="lg:hidden flex items-center gap-2">
              <Link
                to="/foresporsel"
                onClick={() => markLeavingHome("/foresporsel")}
                className="relative p-2 hover:bg-muted/50 rounded-lg transition-colors"
                aria-label="Min verktøykasse"
              >
              <img src={toolboxIcon} alt="Verktøykasse" className="h-10 w-auto object-contain" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground w-5 h-5 rounded-full text-xs font-display flex items-center justify-center shadow-md">
                  {itemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-muted/50 rounded-lg"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden pb-6 border-t border-chrome-mid mt-2 pt-4">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => {
                    markLeavingHome(item.href);
                    setMobileMenuOpen(false);
                  }}
                  className={`font-display text-xl uppercase tracking-wide py-2 px-4 rounded-lg transition-all hover:bg-muted/50 ${
                    location.pathname === item.href
                      ? "text-accent bg-muted/30"
                      : "text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>

      {/* Animated car lane - only on home page OR during drive-to-garage animation */}
      {(isHome || isDrivingToGarage) && (
        <div 
          className={`hidden sm:block relative w-full overflow-hidden transition-all duration-500 ease-out ${
            roadFading ? 'h-0' : 'h-[30px] md:h-[45px]'
          }`}
          style={{
            background: 'linear-gradient(to bottom, #3a3a3a, #2a2a2a 30%, #1f1f1f 70%, #151515)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(255,255,255,0.05)'
          }}
        >
          {/* Asphalt texture overlay */}
          <div 
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")'
            }}
          />
          
          {/* Center road stripe - yellow dashed line */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-center gap-6 pointer-events-none">
            {[...Array(40)].map((_, i) => (
              <div key={i} className="w-6 h-1 bg-yellow-400/90 rounded-sm flex-shrink-0" />
            ))}
          </div>
          
          {/* Road edges - white lines */}
          <div className="absolute top-1 left-0 right-0 h-0.5 bg-white/50 pointer-events-none" />
          <div className="absolute bottom-1 left-0 right-0 h-0.5 bg-white/50 pointer-events-none" />

          {/* Exhaust smoke - only when driving normally on home */}
          {isHome && !isDrivingToGarage && (
            <div
              ref={smokeWrapRef}
              className="absolute bottom-[6px] md:bottom-[10px] pointer-events-none"
              style={{ transform: `translateX(${CAR_START_X}px)` }}
            >
              <div className="relative">
                <div className="absolute left-full ml-2 top-1 flex gap-1">
                  <div className={`w-2 h-2 md:w-3 md:h-3 bg-gray-400/50 rounded-full animate-smoke-1 blur-[1px] ${isSpeedBoost ? 'scale-125' : ''}`} />
                  <div className={`w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-400/40 rounded-full animate-smoke-2 blur-[1px] ml-1 ${isSpeedBoost ? 'scale-125' : ''}`} />
                  <div className={`w-2.5 h-2.5 md:w-3.5 md:h-3.5 bg-gray-400/30 rounded-full animate-smoke-3 blur-[2px] ml-1 ${isSpeedBoost ? 'scale-125' : ''}`} />
                  {isSpeedBoost && (
                    <>
                      <div className="w-2 h-2 md:w-3 md:h-3 bg-gray-300/40 rounded-full animate-smoke-4 blur-[1px] ml-1" />
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-300/30 rounded-full animate-smoke-1 blur-[1px] ml-0.5" />
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* The Simca car - driving normally on home */}
          {isHome && !isDrivingToGarage && (
            <div
              ref={carWrapRef}
              className="absolute bottom-[4px] md:bottom-[6px] cursor-pointer"
              style={{ transform: `translateX(${CAR_START_X}px)`, pointerEvents: 'auto' }}
              onClick={handleCarClick}
            >
              <div className="animate-car-bump-subtle relative">
                <img 
                  src={simcaRallye} 
                  alt="Simca Rallye" 
                  className="h-[22px] md:h-[34px] w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                />
                {/* Wheel spin effect */}
                <div className="absolute bottom-0.5 left-[18%] w-2 h-2 md:w-2.5 md:h-2.5 rounded-full border border-dashed border-gray-600/40 animate-wheel-spin" />
                <div className="absolute bottom-0.5 right-[22%] w-2 h-2 md:w-2.5 md:h-2.5 rounded-full border border-dashed border-gray-600/40 animate-wheel-spin" />
                
                {/* Dust clouds behind wheels */}
                <div className="absolute -bottom-0.5 left-[10%] flex gap-0.5">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-amber-200/40 rounded-full animate-dust-1 blur-[1px]" />
                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-amber-200/30 rounded-full animate-dust-2 blur-[1px]" />
                </div>
                <div className="absolute -bottom-0.5 right-[15%] flex gap-0.5">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-amber-200/40 rounded-full animate-dust-3 blur-[1px]" />
                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-amber-200/30 rounded-full animate-dust-1 blur-[1px]" />
                </div>
              </div>
            </div>
          )}

          {/* Car driving to garage animation */}
          {isDrivingToGarage && (
            <div 
              className="absolute bottom-[4px] md:bottom-[6px] animate-drive-to-garage pointer-events-none"
            >
              <div className="relative">
                <img 
                  src={simcaRallye} 
                  alt="Simca Rallye" 
                  className="h-[22px] md:h-[34px] w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                />
                {/* Wheel spin effect */}
                <div className="absolute bottom-0.5 left-[18%] w-2 h-2 md:w-2.5 md:h-2.5 rounded-full border border-dashed border-gray-600/40 animate-wheel-spin" />
                <div className="absolute bottom-0.5 right-[22%] w-2 h-2 md:w-2.5 md:h-2.5 rounded-full border border-dashed border-gray-600/40 animate-wheel-spin" />
                
                {/* Dust clouds */}
                <div className="absolute -bottom-0.5 left-[10%] flex gap-0.5">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-amber-200/40 rounded-full animate-dust-1 blur-[1px]" />
                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-amber-200/30 rounded-full animate-dust-2 blur-[1px]" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
