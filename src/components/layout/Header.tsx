import { useState, useEffect, useRef } from "react";
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
  { href: "/historie", label: "Simcaens historie", description: "Lær om Simcas rike historie" },
  { href: "/om-oss", label: "Om oss", description: "Hvem står bak Simca Norge" },
];

export function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSpeedBoost, setIsSpeedBoost] = useState(false);
  const [isDrivingToGarage, setIsDrivingToGarage] = useState(false);
  const [isParked, setIsParked] = useState(location.pathname !== "/");
  const [roadVisible, setRoadVisible] = useState(location.pathname === "/");
  const prevPathRef = useRef<string>(location.pathname);
  const { itemCount } = useCart();

  const isHome = location.pathname === "/";

  // Handle navigation changes - only animate when leaving home
  useEffect(() => {
    const prevPath = prevPathRef.current;
    const currentPath = location.pathname;
    
    // Only act if path actually changed
    if (prevPath === currentPath) return;
    
    // Navigating between non-home pages - just update ref, no state changes
    if (prevPath !== "/" && currentPath !== "/") {
      prevPathRef.current = currentPath;
      return;
    }
    
    // If navigating away from home to another page - animate!
    if (prevPath === "/" && currentPath !== "/") {
      setIsDrivingToGarage(true);
      setIsParked(false);
      setRoadVisible(true);
      
      const parkTimer = setTimeout(() => {
        setIsDrivingToGarage(false);
        setIsParked(true);
        setRoadVisible(false);
      }, 800);
      
      prevPathRef.current = currentPath;
      return () => clearTimeout(parkTimer);
    }
    
    // If navigating to home - reset state instantly
    if (currentPath === "/") {
      setIsParked(false);
      setIsDrivingToGarage(false);
      setRoadVisible(true);
      prevPathRef.current = currentPath;
    }
  }, [location.pathname]);

  const handleCarClick = () => {
    if (isSpeedBoost || !isHome) return;
    setIsSpeedBoost(true);
  };

  useEffect(() => {
    if (isSpeedBoost) {
      const timer = setTimeout(() => setIsSpeedBoost(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isSpeedBoost]);

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

          {/* Garage with parked car - visible when parked (desktop only) */}
          {isParked && !isHome && (
            <div className="hidden lg:flex items-center mx-4 animate-fade-in">
              <div className="relative bg-gradient-to-b from-gray-700 to-gray-800 rounded-t-lg px-3 py-1 border-2 border-b-0 border-gray-600 shadow-inner">
                {/* Garage roof */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-full h-2 bg-gradient-to-b from-gray-500 to-gray-600 rounded-t-lg" />
                {/* Parked car */}
                <img 
                  src={simcaRallye} 
                  alt="Parkert Simca" 
                  className="h-[24px] w-auto object-contain drop-shadow-md"
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
                  onClick={() => setMobileMenuOpen(false)}
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

      {/* Animated car lane - visible on home OR during driving animation */}
      {(isHome || isDrivingToGarage || roadVisible) && (
        <div 
          className={`hidden sm:block relative w-full h-[30px] md:h-[45px] overflow-hidden bg-gradient-to-b from-gray-500 to-gray-600 transition-opacity duration-500 ${
            !roadVisible && !isHome ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {/* Center road stripe - static */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-center gap-6 pointer-events-none">
            {[...Array(40)].map((_, i) => (
              <div key={i} className="w-6 h-1 bg-yellow-400/80 rounded-sm flex-shrink-0" />
            ))}
          </div>
          
          {/* Road edges */}
          <div className="absolute top-0.5 left-0 right-0 h-0.5 bg-white/40 pointer-events-none" />
          <div className="absolute bottom-0.5 left-0 right-0 h-0.5 bg-white/40 pointer-events-none" />

          {/* Exhaust smoke - only when driving normally on home */}
          {isHome && !isDrivingToGarage && (
            <div 
              className="absolute bottom-[6px] md:bottom-[10px] animate-header-drive pointer-events-none" 
              style={{ animationDuration: isSpeedBoost ? '3s' : '10s' }}
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
              className="absolute bottom-[4px] md:bottom-[6px] animate-header-drive cursor-pointer" 
              style={{ animationDuration: isSpeedBoost ? '3s' : '10s', pointerEvents: 'auto' }}
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
