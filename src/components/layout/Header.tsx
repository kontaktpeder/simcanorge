import { forwardRef, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogIn, User, AlertTriangle } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { SimcaLive } from "@/components/home/SimcaLive";
import { GuideHelpButton } from "@/components/guide";
import { FadeImage } from "@/components/ui/FadeImage";
import { GarageIcon } from "@/components/ui/GarageIcon";
import { ReportProblemButton, ReportProblemModal } from "@/components/support";
import { getNavItems } from "@/routes/routes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Get navigation items from centralized routes config
const navItems = getNavItems();

const LEAVE_HOME_ANIM_KEY = "simca_leave_home_anim";

// Animation settings (JS-driven so it never jumps when boosting)
const CAR_START_X = -100; // px
const CAR_END_MARGIN = 100; // px beyond viewport
const NORMAL_TRAVEL_TIME = 10; // seconds for one full pass
const BOOST_MULTIPLIER = 3.2; // speed multiplier during boost
const BOOST_MS = 1000; // boost duration
const DRIVE_HOME_DURATION = 900; // ms

// Component for JS-controlled drive-home animation - drives smoothly to garage
const DriveHomeAnimation = forwardRef<HTMLDivElement, { 
  startX: number; 
  simcaRallye: string;
  garageRef: React.RefObject<HTMLDivElement>;
}>(function DriveHomeAnimation({ 
  startX, 
  simcaRallye, 
  garageRef 
}, _ref) {
  const carRef = useRef<HTMLDivElement | null>(null);
  const startRef = useRef<number | null>(null);
  const [showGarage, setShowGarage] = useState(false);
  const trackPointsRef = useRef<number[]>([]);
  const [tracks, setTracks] = useState<number[]>([]);

  const TOTAL_DURATION = 2200; // ms total
  const PHASE1_DURATION = 1000; // ms - drive left on road until off-screen
  const PHASE2_DURATION = 1200; // ms - appear under logo and drive into garage
  const GARAGE_LEFT_SM = 120;
  const GARAGE_LEFT_MD = 160;

  useEffect(() => {
    const initialX = startX;
    const isMd = window.matchMedia("(min-width: 768px)").matches;

    // Phase 1 target: drive off the left edge of the screen
    const offScreenX = -100;
    
    // Phase 2: appear from left under the logo and drive into garage
    const garageX = (isMd ? GARAGE_LEFT_MD : GARAGE_LEFT_SM) + 25;
    const logoAreaY = isMd ? -95 : -75; // Y position under the logo
    const startPhase2X = -80; // Start just off-screen on the left

    const animate = (ts: number) => {
      if (!carRef.current) return;
      if (startRef.current === null) startRef.current = ts;

      const elapsed = ts - startRef.current;
      
      let currentX: number;
      let currentY: number;
      let opacity = 1;

      if (elapsed < PHASE1_DURATION) {
        // Phase 1: Drive left on the road until off-screen
        const phase1Progress = elapsed / PHASE1_DURATION;
        const eased = phase1Progress < 0.5
          ? 2 * phase1Progress * phase1Progress
          : 1 - Math.pow(-2 * phase1Progress + 2, 2) / 2;
        currentX = initialX + (offScreenX - initialX) * eased;
        currentY = 0;
        
        // Fade out as it exits
        if (phase1Progress > 0.7) {
          opacity = 1 - (phase1Progress - 0.7) / 0.3;
        }
        
        // Add tire tracks on the road
        const trackSpacing = 30;
        const distanceTraveled = Math.abs(currentX - initialX);
        const numTracks = Math.floor(distanceTraveled / trackSpacing);

        if (numTracks > trackPointsRef.current.length) {
          const newTrackX = initialX - (trackPointsRef.current.length + 1) * trackSpacing;
          trackPointsRef.current.push(newTrackX);
          setTracks([...trackPointsRef.current]);
        }
      } else {
        // Phase 2: Appear under the logo and drive into garage
        const phase2Elapsed = elapsed - PHASE1_DURATION;
        const phase2Progress = Math.min(phase2Elapsed / PHASE2_DURATION, 1);
        
        // Show garage when phase 2 starts
        if (!showGarage) setShowGarage(true);
        
        const eased = phase2Progress < 0.5
          ? 4 * phase2Progress * phase2Progress * phase2Progress
          : 1 - Math.pow(-2 * phase2Progress + 2, 3) / 2;
        
        currentX = startPhase2X + (garageX - startPhase2X) * eased;
        currentY = logoAreaY; // Stay at logo level
        
        // Fade in at start, fade out at end
        if (phase2Progress < 0.2) {
          opacity = phase2Progress / 0.2;
        } else if (phase2Progress > 0.85) {
          opacity = 1 - (phase2Progress - 0.85) / 0.15;
        }
      }

      carRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scaleX(-1)`;
      carRef.current.style.opacity = String(opacity);

      if (elapsed < TOTAL_DURATION) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [startX, showGarage]);

  return (
    <>
      {/* Tire tracks on the road */}
      {tracks.map((trackX, i) => (
        <div key={i} className="absolute bottom-[10px] md:bottom-[14px] pointer-events-none" style={{ left: 0 }}>
          {/* Left tire track */}
          <div 
            className="absolute w-[3px] h-[6px] rounded-sm"
            style={{ 
              left: trackX + 15,
              background: 'rgba(60, 60, 60, 0.4)',
              opacity: Math.max(0.2, 1 - i * 0.08)
            }} 
          />
          {/* Right tire track */}
          <div 
            className="absolute w-[3px] h-[6px] rounded-sm"
            style={{ 
              left: trackX + 45,
              background: 'rgba(60, 60, 60, 0.4)',
              opacity: Math.max(0.2, 1 - i * 0.08)
            }} 
          />
        </div>
      ))}

      
      {/* The driving car */}
      <div 
        ref={carRef}
        className="absolute bottom-[4px] md:bottom-[6px] pointer-events-none z-50"
        style={{ transform: `translateX(${startX}px) scaleX(-1)`, opacity: 1 }}
      >
        <div className="relative">
          <img 
            src="/simca-rallye-yellow.png" 
            alt="Simca Rallye" 
            className="h-[32px] md:h-[42px] w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
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
    </>
  );
});

export function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSpeedBoost, setIsSpeedBoost] = useState(false);
  const [roadFading, setRoadFading] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const { itemCount } = useCart();
  const { user } = useAuth();

  const isHome = location.pathname === "/";
  
  // Initialize isDrivingToGarage based on sessionStorage to prevent flash
  const [isDrivingToGarage, setIsDrivingToGarage] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !isHome && sessionStorage.getItem(LEAVE_HOME_ANIM_KEY) === "1";
  });

  // Refs for JS-driven animation
  const carWrapRef = useRef<HTMLDivElement | null>(null);
  const smokeWrapRef = useRef<HTMLDivElement | null>(null);
  const xRef = useRef(CAR_START_X);
  const lastTsRef = useRef<number | null>(null);
  const boostUntilRef = useRef<number>(0);
  const driveHomeCarRef = useRef<HTMLDivElement | null>(null);
  const driveHomeStartXRef = useRef<number | null>(null);
  const garageAnimRef = useRef<HTMLDivElement>(null);

  // Trigger drive-to-garage ONLY when we left home via a click
  useEffect(() => {
    if (isHome) {
      setIsDrivingToGarage(false);
      setRoadFading(false);
      driveHomeStartXRef.current = null;
      return;
    }

    const shouldAnimate = sessionStorage.getItem(LEAVE_HOME_ANIM_KEY) === "1";
    if (!shouldAnimate) return;

    // Get car's current position before animating home
    const savedX = sessionStorage.getItem("simca_car_x");
    if (savedX) {
      driveHomeStartXRef.current = parseFloat(savedX);
      sessionStorage.removeItem("simca_car_x");
    } else {
      driveHomeStartXRef.current = window.innerWidth * 0.5;
    }

    sessionStorage.removeItem(LEAVE_HOME_ANIM_KEY);
    setIsDrivingToGarage(true);
    setRoadFading(false);

    const fadeTimer = setTimeout(() => setRoadFading(true), 650);
    const endTimer = setTimeout(() => setIsDrivingToGarage(false), 1900);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
    };
  }, [isHome]);

  const markLeavingHome = (to: string) => {
    if (!isHome) return;
    if (to === "/") return;
    // Save the car's current position so the drive-home animation starts from there
    sessionStorage.setItem("simca_car_x", String(xRef.current));
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
    <>
    <header className="sticky top-0 z-50 will-change-transform overflow-hidden" style={{ background: 'linear-gradient(180deg, hsl(210 85% 55%) 0%, hsl(210 80% 48%) 60%, hsl(210 75% 40%) 100%)' }}>
      {/* Animated diffuse clouds - slim & elegant */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="animate-cloud-1 absolute top-[6px]" style={{ width: 100, height: 14 }}>
          <div className="absolute inset-0 rounded-full bg-white/35" style={{ filter: 'blur(6px)' }} />
          <div className="absolute top-[-2px] left-[20px] w-[40px] h-[12px] rounded-full bg-white/45" style={{ filter: 'blur(5px)' }} />
          <div className="absolute top-[-1px] left-[45px] w-[35px] h-[10px] rounded-full bg-white/40" style={{ filter: 'blur(6px)' }} />
        </div>
        <div className="animate-cloud-2 absolute top-[3px]" style={{ width: 140, height: 16 }}>
          <div className="absolute inset-0 rounded-full bg-white/30" style={{ filter: 'blur(8px)' }} />
          <div className="absolute top-[-3px] left-[25px] w-[50px] h-[14px] rounded-full bg-white/40" style={{ filter: 'blur(7px)' }} />
          <div className="absolute top-[-2px] left-[60px] w-[40px] h-[12px] rounded-full bg-white/35" style={{ filter: 'blur(7px)' }} />
          <div className="absolute top-[-1px] left-[90px] w-[30px] h-[10px] rounded-full bg-white/30" style={{ filter: 'blur(6px)' }} />
        </div>
        <div className="animate-cloud-3 absolute top-[8px]" style={{ width: 70, height: 10 }}>
          <div className="absolute inset-0 rounded-full bg-white/30" style={{ filter: 'blur(5px)' }} />
          <div className="absolute top-[-1px] left-[15px] w-[28px] h-[8px] rounded-full bg-white/40" style={{ filter: 'blur(4px)' }} />
        </div>
        <div className="animate-cloud-4 absolute top-[10px] md:top-[4px]" style={{ width: 110, height: 14 }}>
          <div className="absolute inset-0 rounded-full bg-white/25" style={{ filter: 'blur(7px)' }} />
          <div className="absolute top-[-2px] left-[22px] w-[45px] h-[12px] rounded-full bg-white/35" style={{ filter: 'blur(6px)' }} />
          <div className="absolute top-[-1px] left-[55px] w-[35px] h-[10px] rounded-full bg-white/30" style={{ filter: 'blur(7px)' }} />
        </div>
        <div className="animate-cloud-5 absolute top-[5px]" style={{ width: 85, height: 12 }}>
          <div className="absolute inset-0 rounded-full bg-white/30" style={{ filter: 'blur(6px)' }} />
          <div className="absolute top-[-2px] left-[18px] w-[32px] h-[10px] rounded-full bg-white/40" style={{ filter: 'blur(5px)' }} />
          <div className="absolute top-[-1px] left-[40px] w-[28px] h-[8px] rounded-full bg-white/35" style={{ filter: 'blur(6px)' }} />
        </div>
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover-lift flex-shrink-0">
            <FadeImage 
              src="/simca-badge.png" 
              alt="Simca Norge" 
              className="h-10 md:h-12 w-auto drop-shadow-md flex-shrink-0"
              fadeDuration={400}
              onError={(e) => {
                const el = e.currentTarget;
                el.onerror = null;
                el.src = '/favicon.png';
              }}
            />
            <div className="hidden sm:flex items-baseline flex-shrink-0">
              <span className="font-display text-lg md:text-xl text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] whitespace-nowrap">SIMCA</span>
              <span className="font-display text-lg md:text-xl text-yellow-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] ml-1 whitespace-nowrap">NORGE</span>
            </div>
          </Link>


          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 flex-shrink min-w-0">
            <TooltipProvider delayDuration={200}>
              {navItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = location.pathname === item.href;
                const isGlow = item.glow;
                
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.href}
                        onClick={() => markLeavingHome(item.href)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-display text-sm uppercase tracking-wide transition-all hover:bg-white/20 ${
                          isActive
                            ? "text-white bg-white/25 shadow-sm"
                            : "text-white/90 hover:text-white"
                        }`}
                      >
                        <IconComponent 
                          className={`w-4 h-4 ${
                            isGlow && isActive 
                              ? "text-yellow-300 fill-yellow-300 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]" 
                              : isGlow 
                                ? "text-yellow-300" 
                                : "text-white"
                          }`} 
                        />
                        <span className="hidden xl:inline">{item.label}</span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{item.description}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}

              {/* Toolbox Icon */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/foresporsel"
                    onClick={() => markLeavingHome("/foresporsel")}
                    className="relative p-1.5 hover:bg-white/20 rounded-lg transition-colors ml-1"
                    aria-label="Min verktøykasse"
                  >
                    <img src="/toolbox-blue.png" alt="Verktøykasse" className="h-10 w-auto object-contain" />
                    {itemCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground w-4 h-4 rounded-full text-[10px] font-display flex items-center justify-center shadow-md">
                        {itemCount}
                      </span>
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{itemCount > 0 ? `${itemCount} deler i verktøykassen` : "Min verktøykasse"}</p>
                </TooltipContent>
              </Tooltip>


              {/* User/Login button */}
              {user ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to="/dashboard"
                      onClick={() => markLeavingHome("/dashboard")}
                      className="relative p-0 hover:bg-white/20 rounded-lg transition-colors ml-4 flex items-end self-stretch"
                    >
                      <GarageIcon size={52} animate={isDrivingToGarage} hideCar={isHome} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Gå til din garasje</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to="/login?returnUrl=/dashboard"
                      onClick={() => markLeavingHome("/login")}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-display text-sm uppercase tracking-wide bg-white/25 text-white hover:bg-white/35 transition-all ml-1 border border-white/30"
                    >
                      <LogIn className="w-4 h-4" />
                      <span className="hidden xl:inline">Logg inn</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Logg inn i din bil</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {/* Report Problem */}
            </TooltipProvider>
          </nav>

          {/* Mobile: SimcaLive + Toolbox + Menu */}
          <div className="lg:hidden flex items-center gap-1.5">
            {/* SimcaLive in header on mobile */}
            <div className="flex-shrink-0">
              <SimcaLive isHeaderMode />
            </div>
            <Link
              to="/foresporsel"
              onClick={() => markLeavingHome("/foresporsel")}
              className="relative p-1.5 hover:bg-muted/50 rounded-lg transition-colors"
              aria-label="Min verktøykasse"
            >
              <img src="/toolbox-blue.png" alt="Verktøykasse" className="h-10 w-auto object-contain" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground w-4 h-4 rounded-full text-[10px] font-display flex items-center justify-center shadow-md">
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
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden pb-4 border-t border-border/50 mt-2 pt-3 bg-background/95 backdrop-blur-md">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = location.pathname === item.href;
                const isGlow = item.glow;
                
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => {
                      markLeavingHome(item.href);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 font-display text-base uppercase tracking-wide py-2.5 px-4 rounded-lg transition-all ${
                      isActive
                        ? "text-accent bg-muted/50"
                        : "text-foreground/80 hover:bg-muted/30"
                    }`}
                  >
                    <IconComponent 
                      className={`w-5 h-5 ${
                        isGlow && isActive 
                          ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]" 
                          : isGlow 
                            ? "text-yellow-500" 
                            : ""
                      }`} 
                    />
                    {item.label}
                  </Link>
                );
              })}
              
              {/* User/Login button for mobile */}
              {user ? (
                <Link
                  to="/dashboard"
                  onClick={() => {
                    markLeavingHome("/dashboard");
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 font-display text-base uppercase tracking-wide py-2 px-3 rounded-lg bg-primary/10 text-primary mt-2"
                >
                  <GarageIcon size={48} hideCar={isHome} />
                  Gå til din garasje
                </Link>
              ) : (
                <Link
                  to="/login?returnUrl=/dashboard"
                  onClick={() => {
                    markLeavingHome("/login");
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 font-display text-base uppercase tracking-wide py-2.5 px-4 rounded-lg bg-accent text-accent-foreground mt-2"
                >
                  <LogIn className="w-5 h-5" />
                  Logg inn i din bil
                </Link>
              )}

            </div>
          </nav>
        )}
      </div>

      {/* Animated car lane - only on home page OR during drive-to-garage animation */}
      {(isHome || isDrivingToGarage) && (
        <div 
          className={`relative w-full transition-all duration-500 ease-out ${
            roadFading ? 'h-0 opacity-0' : 'h-[30px] sm:h-[36px] md:h-[42px] opacity-100'
          }`}
          style={{
            background: 'linear-gradient(to bottom, #3a3a3a, #2a2a2a 30%, #1f1f1f 70%, #151515)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(255,255,255,0.05)'
          }}
        >
          {/* Inner container that slides up together */}
          <div className={`absolute inset-0 transition-transform duration-500 ease-out ${roadFading ? '-translate-y-full' : 'translate-y-0'}`}>
            {/* Asphalt texture overlay */}
            <div 
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")'
              }}
            />
            
            {/* Center road stripe - yellow dashed line (static) */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-center gap-6 pointer-events-none">
              {[...Array(40)].map((_, i) => (
                <div key={i} className="w-6 h-1 bg-yellow-400/90 rounded-sm flex-shrink-0" />
              ))}
            </div>
            
            {/* Road edges - white lines */}
            <div className="absolute top-1 left-0 right-0 h-0.5 bg-white/50 pointer-events-none" />
            <div className="absolute bottom-1 left-0 right-0 h-0.5 bg-white/50 pointer-events-none" />
          </div>

          {/* Exhaust smoke - only when driving normally on home */}
          {isHome && !isDrivingToGarage && (
            <div
              ref={smokeWrapRef}
              className="absolute bottom-[6px] md:bottom-[10px] pointer-events-none"
              style={{ transform: `translateX(${CAR_START_X}px)` }}
            >
              <div className="relative">
                <div className="absolute left-full ml-2 top-1 flex gap-1">
                  <div className={`w-2.5 h-2.5 md:w-3.5 md:h-3.5 bg-gray-400/50 rounded-full animate-smoke-1 blur-[1px] ${isSpeedBoost ? 'scale-150' : ''}`} />
                  <div className={`w-2 h-2 md:w-3 md:h-3 bg-gray-400/40 rounded-full animate-smoke-2 blur-[1px] ml-0.5 ${isSpeedBoost ? 'scale-150' : ''}`} />
                  <div className={`w-3 h-3 md:w-4 md:h-4 bg-gray-400/30 rounded-full animate-smoke-3 blur-[2px] ml-0.5 ${isSpeedBoost ? 'scale-150' : ''}`} />
                  <div className={`w-2 h-2 md:w-3 md:h-3 bg-gray-300/35 rounded-full animate-smoke-4 blur-[1px] ml-0.5 ${isSpeedBoost ? 'scale-150' : ''}`} />
                  <div className={`w-1.5 h-1.5 md:w-2.5 md:h-2.5 bg-gray-300/25 rounded-full animate-smoke-1 blur-[2px] ml-1 ${isSpeedBoost ? 'scale-150' : ''}`} />
                  {isSpeedBoost && (
                    <>
                      <div className="w-3 h-3 md:w-4 md:h-4 bg-gray-300/40 rounded-full animate-smoke-4 blur-[2px] ml-0.5" />
                      <div className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 bg-gray-300/30 rounded-full animate-smoke-2 blur-[2px] ml-0.5" />
                      <div className="w-2 h-2 md:w-3 md:h-3 bg-gray-200/25 rounded-full animate-smoke-3 blur-[3px] ml-0.5" />
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
              className="absolute bottom-[2px] md:bottom-[3px] cursor-pointer z-[100]"
              style={{ transform: `translateX(${CAR_START_X}px)`, pointerEvents: 'auto' }}
              onClick={handleCarClick}
            >
              <div className="animate-car-bump-subtle relative">
                <img 
                  src="/simca-rallye-yellow.png" 
                  alt="Simca Rallye" 
                  className="h-[42px] md:h-[52px] w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                />
                {/* Wheel spin effect */}
                <div className="absolute bottom-0.5 left-[18%] w-2 h-2 md:w-2.5 md:h-2.5 rounded-full border border-dashed border-gray-600/40 animate-wheel-spin" />
                <div className="absolute bottom-0.5 right-[22%] w-2 h-2 md:w-2.5 md:h-2.5 rounded-full border border-dashed border-gray-600/40 animate-wheel-spin" />
                
                {/* Dust clouds behind wheels */}
                {/* Dust clouds behind wheels */}
                <div className="absolute -bottom-0.5 left-[8%] flex gap-0.5">
                  <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-amber-200/40 rounded-full animate-dust-1 blur-[1px]" />
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-amber-200/30 rounded-full animate-dust-2 blur-[1px]" />
                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-amber-100/25 rounded-full animate-dust-3 blur-[2px]" />
                </div>
                <div className="absolute -bottom-0.5 right-[12%] flex gap-0.5">
                  <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-amber-200/40 rounded-full animate-dust-3 blur-[1px]" />
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-amber-200/30 rounded-full animate-dust-1 blur-[1px]" />
                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-amber-100/25 rounded-full animate-dust-2 blur-[2px]" />
                </div>
                {/* Extra ground dust */}
                <div className="absolute -bottom-1 left-[25%] flex gap-1">
                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-gray-400/20 rounded-full animate-dust-2 blur-[2px]" />
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-400/15 rounded-full animate-dust-3 blur-[2px]" />
                </div>
              </div>
            </div>
          )}

          {/* Car driving to garage animation - JS controlled from current position */}
          {isDrivingToGarage && (
            <DriveHomeAnimation 
              startX={driveHomeStartXRef.current ?? window.innerWidth * 0.5} 
              simcaRallye="/simca-rallye-yellow.png"
              garageRef={garageAnimRef}
            />
          )}
        </div>
      )}
    </header>
    <ReportProblemModal
      open={reportModalOpen}
      onOpenChange={setReportModalOpen}
      userId={user?.id}
    />
    </>
  );
}
