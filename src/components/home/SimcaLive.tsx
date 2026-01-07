import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Radio } from "lucide-react";

// Generate or retrieve session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem("simca_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("simca_session_id", sessionId);
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

export const SimcaLive = () => {
  const [activeUsers, setActiveUsers] = useState(0);
  const [totalVisits, setTotalVisits] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const displayActiveUsers = useAnimatedCounter(activeUsers);
  const displayTotalVisits = useAnimatedCounter(totalVisits);

  // Track current session
  useEffect(() => {
    const sessionId = getSessionId();

    const trackSession = async () => {
      try {
        const { data: existing } = await supabase
          .from("page_views")
          .select("id")
          .eq("session_id", sessionId)
          .single();

        if (existing) {
          await supabase
            .from("page_views")
            .update({ last_seen_at: new Date().toISOString() })
            .eq("session_id", sessionId);
        } else {
          await supabase.from("page_views").insert({
            session_id: sessionId,
          });
        }
      } catch (error) {
        console.error("Error tracking session:", error);
      }
    };

    trackSession();
    const interval = setInterval(trackSession, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
        const { count: activeCount } = await supabase
          .from("page_views")
          .select("*", { count: "exact", head: true })
          .gte("last_seen_at", threeMinutesAgo);

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { count: totalCount } = await supabase
          .from("page_views")
          .select("*", { count: "exact", head: true })
          .gte("created_at", thirtyDaysAgo);

        setActiveUsers(activeCount || 0);
        setTotalVisits(totalCount || 0);
        setIsLoaded(true);
      } catch (error) {
        console.error("Error fetching stats:", error);
        setIsLoaded(true);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`
        fixed top-24 left-4 z-40
        transition-all duration-700 ease-out
        ${isLoaded ? "opacity-100 translate-x-0 scale-100" : "opacity-0 -translate-x-8 scale-95"}
      `}
    >
      {/* Outer chrome frame */}
      <div
        className="relative rounded-xl p-[3px]"
        style={{
          background: `linear-gradient(145deg, 
            #e8e8e8 0%, 
            #ffffff 15%, 
            #b0b0b0 30%,
            #d4d4d4 50%, 
            #9a9a9a 70%,
            #c0c0c0 85%,
            #e0e0e0 100%)`,
          boxShadow: `
            0 8px 32px rgba(0,0,0,0.4),
            0 4px 16px rgba(0,0,0,0.3),
            inset 0 1px 0 rgba(255,255,255,0.8)
          `,
        }}
      >
        {/* Inner enamel body */}
        <div
          className="relative rounded-lg overflow-hidden"
          style={{
            background: `linear-gradient(145deg, 
              hsl(210, 75%, 38%) 0%, 
              hsl(210, 70%, 32%) 40%,
              hsl(210, 65%, 28%) 100%)`,
            boxShadow: `
              inset 0 2px 4px rgba(255,255,255,0.2),
              inset 0 -2px 4px rgba(0,0,0,0.3),
              inset 2px 0 4px rgba(0,0,0,0.1),
              inset -2px 0 4px rgba(0,0,0,0.1)
            `,
          }}
        >
          {/* Glass/enamel shine overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(135deg,
                rgba(255,255,255,0.25) 0%,
                rgba(255,255,255,0.1) 30%,
                transparent 50%,
                rgba(0,0,0,0.1) 100%)`,
            }}
          />

          {/* Content */}
          <div className="relative z-10 px-4 py-3">
            {/* Header with live indicator */}
            <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-white/10">
              <div className="relative">
                <Radio 
                  className="w-4 h-4 text-simca-red animate-pulse" 
                  style={{ 
                    filter: "drop-shadow(0 0 4px hsl(var(--simca-red)))",
                  }} 
                />
                <div 
                  className="absolute inset-0 animate-ping"
                  style={{
                    background: "radial-gradient(circle, hsl(var(--simca-red) / 0.4) 0%, transparent 70%)",
                  }}
                />
              </div>
              <span
                className="font-display text-xs font-bold tracking-[0.2em] uppercase"
                style={{
                  color: "#ffffff",
                  textShadow: `
                    0 1px 2px rgba(0,0,0,0.5),
                    0 0 20px rgba(255,255,255,0.2)
                  `,
                }}
              >
                SIMCA LIVE
              </span>
            </div>

            {/* Stats */}
            <div className="space-y-1.5">
              <div className="flex items-baseline gap-1.5">
                <span
                  className="font-display text-xl font-bold tabular-nums"
                  style={{
                    color: "#ffffff",
                    textShadow: `
                      0 2px 4px rgba(0,0,0,0.4),
                      0 0 30px rgba(255,255,255,0.3)
                    `,
                  }}
                >
                  {displayActiveUsers}
                </span>
                <span
                  className="text-[11px] font-medium"
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                  }}
                >
                  {displayActiveUsers === 1 ? "entusiast" : "entusiaster"} online
                </span>
              </div>
              
              <div className="flex items-baseline gap-1.5">
                <span
                  className="font-display text-xl font-bold tabular-nums"
                  style={{
                    color: "#ffffff",
                    textShadow: `
                      0 2px 4px rgba(0,0,0,0.4),
                      0 0 30px rgba(255,255,255,0.3)
                    `,
                  }}
                >
                  {displayTotalVisits}
                </span>
                <span
                  className="text-[11px] font-medium"
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                  }}
                >
                  besøk siste 30 dager
                </span>
              </div>
            </div>
          </div>

          {/* Bottom rivets/details */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-6">
            <div 
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: "linear-gradient(145deg, #c0c0c0, #808080)",
                boxShadow: "inset 0 1px 1px rgba(255,255,255,0.5), 0 1px 2px rgba(0,0,0,0.3)",
              }}
            />
            <div 
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: "linear-gradient(145deg, #c0c0c0, #808080)",
                boxShadow: "inset 0 1px 1px rgba(255,255,255,0.5), 0 1px 2px rgba(0,0,0,0.3)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
