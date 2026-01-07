import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

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
        // Try to upsert the session
        const { data: existing } = await supabase
          .from("page_views")
          .select("id")
          .eq("session_id", sessionId)
          .single();

        if (existing) {
          // Update last_seen_at
          await supabase
            .from("page_views")
            .update({ last_seen_at: new Date().toISOString() })
            .eq("session_id", sessionId);
        } else {
          // Insert new session
          await supabase.from("page_views").insert({
            session_id: sessionId,
          });
        }
      } catch (error) {
        console.error("Error tracking session:", error);
      }
    };

    trackSession();

    // Update session every 30 seconds
    const interval = setInterval(trackSession, 30000);

    return () => clearInterval(interval);
  }, []);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get active users (last 3 minutes)
        const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
        const { count: activeCount } = await supabase
          .from("page_views")
          .select("*", { count: "exact", head: true })
          .gte("last_seen_at", threeMinutesAgo);

        // Get total visits last 30 days
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

    // Refresh active users every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`
        fixed top-24 left-4 z-40
        bg-gradient-to-br from-simca-blue via-simca-blue to-simca-blue/90
        border-2 border-chrome-light
        rounded-lg shadow-lg
        px-4 py-3
        transition-all duration-500
        ${isLoaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}
      `}
      style={{
        boxShadow: `
          inset 0 1px 2px rgba(255,255,255,0.3),
          inset 0 -1px 2px rgba(0,0,0,0.2),
          0 4px 12px rgba(0,0,0,0.3),
          0 0 0 1px rgba(255,255,255,0.1)
        `,
        background: `
          linear-gradient(135deg, 
            hsl(var(--simca-blue)) 0%, 
            hsl(210, 70%, 35%) 50%,
            hsl(210, 65%, 30%) 100%)
        `,
      }}
    >
      {/* Chrome frame effect */}
      <div
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          background: `
            linear-gradient(180deg,
              rgba(255,255,255,0.15) 0%,
              transparent 50%,
              rgba(0,0,0,0.1) 100%)
          `,
        }}
      />

      {/* Header with live indicator */}
      <div className="flex items-center gap-2 mb-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
        </span>
        <span
          className="text-xs font-bold tracking-wider"
          style={{
            color: "rgba(255,255,255,0.95)",
            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
            fontFamily: "var(--font-display)",
          }}
        >
          SIMCA LIVE
        </span>
      </div>

      {/* Stats */}
      <div className="space-y-1 relative z-10">
        <div
          className="text-sm"
          style={{
            color: "rgba(255,255,255,0.9)",
            textShadow: "0 1px 1px rgba(0,0,0,0.2)",
          }}
        >
          <span
            className="font-bold text-white"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {displayActiveUsers}
          </span>{" "}
          <span className="text-xs opacity-90">
            {displayActiveUsers === 1 ? "entusiast" : "entusiaster"} på siden nå
          </span>
        </div>
        <div
          className="text-sm"
          style={{
            color: "rgba(255,255,255,0.9)",
            textShadow: "0 1px 1px rgba(0,0,0,0.2)",
          }}
        >
          <span
            className="font-bold text-white"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {displayTotalVisits}
          </span>{" "}
          <span className="text-xs opacity-90">besøk siste 30 dager</span>
        </div>
      </div>
    </div>
  );
};
