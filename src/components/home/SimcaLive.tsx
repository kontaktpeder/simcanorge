import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// Generate or retrieve session ID
const getSessionId = (): string => {
  let sessionId = localStorage.getItem("simca_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("simca_session_id", sessionId);
  }
  return sessionId;
};

// Animated counter hook
const useAnimatedCounter = (targetValue: number, duration: number = 1500) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (targetValue === 0) {
      setDisplayValue(0);
      return;
    }

    const startTime = Date.now();
    const startValue = displayValue;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.round(startValue + (targetValue - startValue) * easeOutQuart);
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration]);

  return displayValue;
};

interface SimcaLiveProps {
  isHeaderMode?: boolean;
}

export const SimcaLive = ({ isHeaderMode = false }: SimcaLiveProps) => {
  const [activeUsers, setActiveUsers] = useState(0);
  const [totalVisits, setTotalVisits] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const displayActiveUsers = useAnimatedCounter(activeUsers);
  const displayTotalVisits = useAnimatedCounter(totalVisits);

  // Use Realtime Presence for accurate live user count
  useEffect(() => {
    const sessionId = getSessionId();
    const channel = supabase.channel('simca_live_presence', {
      config: {
        presence: {
          key: sessionId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setActiveUsers(count);
        setIsLoaded(true);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
            session_id: sessionId,
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Track page view for every visit (each page load = one visit)
  useEffect(() => {
    const sessionId = getSessionId();
    const trackVisit = async () => {
      try {
        await supabase.from("page_views").insert({
          session_id: sessionId,
        });
      } catch (error) {
        console.error("Error tracking visit:", error);
      }
    };
    trackVisit();
  }, []);

  // Fetch total visits (all visits in last 30 days)
  useEffect(() => {
    const fetchTotalVisits = async () => {
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { count, error } = await supabase
          .from("page_views")
          .select("id", { count: "exact", head: true })
          .gte("created_at", thirtyDaysAgo);

        if (error) throw error;

        setTotalVisits(count ?? 0);
        setHasError(false);
      } catch (error) {
        console.error("Error fetching total visits:", error);
        setHasError(true);
      }
    };

    fetchTotalVisits();
    // Refresh less frequently since this doesn't change much
    const interval = setInterval(fetchTotalVisits, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fallback text for low active users
  const getActiveUsersText = () => {
    if (hasError) return "Oppdateres…";
    if (!isLoaded) return "Oppdateres…";
    if (displayActiveUsers <= 2 && displayActiveUsers > 0) {
      return "Få entusiaster aktive nå";
    }
    return `${displayActiveUsers} ser på nå`;
  };

  const getTotalVisitsText = () => {
    if (hasError) return "Oppdateres…";
    if (!isLoaded) return "Oppdateres…";
    return `${displayTotalVisits} besøk siste 30 dager`;
  };

  // Header mode: ultra compact for mobile header
  if (isHeaderMode) {
    return (
      <div
        className={`
          transition-all duration-500 ease-out
          ${isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"}
        `}
      >
        <div
          className="relative rounded-md p-[1.5px]"
          style={{
            background: `linear-gradient(145deg, #e0e0e0 0%, #a8a8a8 50%, #c8c8c8 100%)`,
            boxShadow: `0 2px 8px rgba(0,0,0,0.25)`,
          }}
        >
          <div
            className="relative rounded-[5px] overflow-hidden px-2 py-1"
            style={{
              background: `linear-gradient(160deg, hsl(212, 75%, 28%) 0%, hsl(212, 68%, 18%) 100%)`,
              boxShadow: `inset 0 1px 3px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.3)`,
            }}
          >
            <div className="flex items-center gap-1.5">
              {/* Pulsing red indicator */}
              <div className="relative flex items-center justify-center w-1.5 h-1.5">
                <div 
                  className="absolute inset-0 rounded-full animate-ping opacity-75"
                  style={{ background: "hsl(2, 85%, 45%)", animationDuration: "2s" }}
                />
                <div 
                  className="relative w-1 h-1 rounded-full"
                  style={{
                    background: "radial-gradient(circle at 35% 35%, #ff6666 0%, #d41515 50%, #9a0a0a 100%)",
                    boxShadow: "0 0 3px rgba(212, 21, 21, 0.6)",
                  }}
                />
              </div>
              <span
                className="font-display text-[7px] tracking-[0.1em] uppercase text-white/90"
                style={{ textShadow: `0 1px 1px rgba(0,0,0,0.5)` }}
              >
                live
              </span>
              <span className="text-white/40 text-[7px]">·</span>
              <span
                className="font-display text-[8px] font-bold tabular-nums text-white"
                style={{ textShadow: `0 1px 1px rgba(0,0,0,0.5)` }}
              >
                {displayActiveUsers > 0 ? displayActiveUsers : "–"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop mode: fixed position with full details
  return (
    <div
      className={`
        hidden md:block fixed top-24 left-4 z-40
        transition-opacity duration-700 ease-out
        ${isLoaded ? "opacity-100" : "opacity-0"}
      `}
    >
      {/* Outer chrome frame - tighter radius */}
      <div
        className="relative rounded-lg p-[2px] md:p-[3px]"
        style={{
          background: `linear-gradient(145deg, 
            #ffffff 0%, 
            #e0e0e0 15%, 
            #a8a8a8 35%,
            #c8c8c8 50%, 
            #888888 70%,
            #b0b0b0 85%,
            #d8d8d8 100%)`,
          boxShadow: `
            0 6px 24px rgba(0,0,0,0.35),
            0 3px 12px rgba(0,0,0,0.25),
            inset 0 1px 0 rgba(255,255,255,0.9)
          `,
        }}
      >
        {/* Inner enamel body - darker metallic blue */}
        <div
          className="relative rounded-md overflow-hidden"
          style={{
            background: `linear-gradient(160deg, 
              hsl(212, 75%, 28%) 0%, 
              hsl(212, 70%, 22%) 40%,
              hsl(212, 68%, 18%) 100%)`,
            boxShadow: `
              inset 0 2px 6px rgba(255,255,255,0.15),
              inset 0 -3px 8px rgba(0,0,0,0.4),
              inset 2px 0 6px rgba(0,0,0,0.15),
              inset -2px 0 6px rgba(0,0,0,0.15)
            `,
          }}
        >
          {/* Glass/enamel shine overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(140deg,
                rgba(255,255,255,0.18) 0%,
                rgba(255,255,255,0.08) 25%,
                transparent 45%,
                rgba(0,0,0,0.15) 100%)`,
            }}
          />

          {/* Subtle instrument panel texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 0%, rgba(255,255,255,0.1) 0%, transparent 60%)`,
            }}
          />

          {/* Content */}
          <div className="relative z-10 px-2 md:px-4 py-1.5 md:py-3">
            {/* Header with live indicator */}
            <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2 pb-1 md:pb-1.5 border-b border-white/10">
              {/* Pulsing red indicator */}
              <div className="relative flex items-center justify-center w-2 h-2 md:w-3.5 md:h-3.5">
                <div 
                  className="absolute inset-0 rounded-full animate-ping opacity-75"
                  style={{
                    background: "hsl(2, 85%, 45%)",
                    animationDuration: "2s",
                  }}
                />
                <div 
                  className="relative w-1.5 h-1.5 md:w-2.5 md:h-2.5 rounded-full"
                  style={{
                    background: "radial-gradient(circle at 35% 35%, #ff6666 0%, #d41515 50%, #9a0a0a 100%)",
                    boxShadow: "0 0 4px rgba(212, 21, 21, 0.6), 0 0 8px rgba(212, 21, 21, 0.3)",
                  }}
                />
              </div>
              <span
                className="font-display text-[8px] md:text-xs tracking-[0.12em] md:tracking-[0.2em] uppercase"
                style={{
                  color: "rgba(255,255,255,0.9)",
                  textShadow: `0 1px 2px rgba(0,0,0,0.5)`,
                }}
              >
                simca live
              </span>
            </div>

            {/* Stats - horizontal on mobile, stacked on desktop */}
            <div className="flex md:flex-col items-center md:items-start gap-2 md:gap-1">
              <p
                className="text-[8px] md:text-[11px] font-medium leading-tight whitespace-nowrap"
                style={{
                  color: "rgba(255,255,255,0.85)",
                  textShadow: "0 1px 2px rgba(0,0,0,0.4)",
                }}
              >
                {displayActiveUsers > 2 && (
                  <span 
                    className="font-display text-xs md:text-lg font-bold tabular-nums mr-0.5 md:mr-1"
                    style={{
                      color: "#ffffff",
                      textShadow: `0 1px 2px rgba(0,0,0,0.5), 0 0 20px rgba(255,255,255,0.2)`,
                    }}
                  >
                    {displayActiveUsers}
                  </span>
                )}
                {getActiveUsersText().replace(/^\d+\s*/, displayActiveUsers > 2 ? '' : getActiveUsersText())}
              </p>
              
              <span className="text-white/30 md:hidden">·</span>
              
              <p
                className="text-[8px] md:text-[11px] font-medium leading-tight whitespace-nowrap"
                style={{
                  color: "rgba(255,255,255,0.7)",
                  textShadow: "0 1px 2px rgba(0,0,0,0.4)",
                }}
              >
                {!hasError && isLoaded && (
                  <span 
                    className="font-display text-xs md:text-lg font-bold tabular-nums mr-0.5 md:mr-1"
                    style={{
                      color: "#ffffff",
                      textShadow: `0 1px 2px rgba(0,0,0,0.5), 0 0 20px rgba(255,255,255,0.2)`,
                    }}
                  >
                    {displayTotalVisits}
                  </span>
                )}
                {hasError || !isLoaded ? getTotalVisitsText() : "besøk siste 30 dager"}
              </p>
            </div>
          </div>

          {/* Bottom decorative screws/rivets */}
          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-6 md:gap-8">
            <div 
              className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full"
              style={{
                background: "linear-gradient(145deg, #a0a0a0, #606060)",
                boxShadow: "inset 0 0.5px 0.5px rgba(255,255,255,0.4), 0 0.5px 1px rgba(0,0,0,0.3)",
              }}
            />
            <div 
              className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full"
              style={{
                background: "linear-gradient(145deg, #a0a0a0, #606060)",
                boxShadow: "inset 0 0.5px 0.5px rgba(255,255,255,0.4), 0 0.5px 1px rgba(0,0,0,0.3)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
