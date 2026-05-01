import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ActiveSession } from "./useActivitySession";
import type { ActivityMoment } from "./useActivityMoments";

export interface CompletedSessionSummary {
  session: ActiveSession;
  moments: ActivityMoment[];
  momentCount: number;
  linkedCarCount: number;
  durationMinutes: number;
}

export function useLatestCompletedSession() {
  const { user, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ["latest-completed-session", user?.id],
    queryFn: async (): Promise<CompletedSessionSummary | null> => {
      if (!user) return null;
      try {
        const { data: session } = await supabase
          .from("activity_sessions")
          .select("*")
          .eq("user_id", user.id)
          .not("ended_at", "is", null)
          .order("ended_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!session) return null;

        const { data: momentRows } = await supabase
          .from("car_events")
          .select("id, occurred_at, data, visibility, activity_session_id, car_id")
          .eq("activity_session_id", session.id)
          .order("occurred_at", { ascending: false });

        const moments = (momentRows ?? []) as ActivityMoment[];
        const linkedCarCount = new Set(moments.map((m) => m.car_id).filter(Boolean)).size;
        const start = new Date(session.started_at).getTime();
        const end = session.ended_at ? new Date(session.ended_at).getTime() : Date.now();
        const durationMinutes = Math.max(0, Math.floor((end - start) / 60000));

        return {
          session: session as ActiveSession,
          moments,
          momentCount: moments.length,
          linkedCarCount,
          durationMinutes,
        };
      } catch (err) {
        console.warn("useLatestCompletedSession failed (returning null):", err);
        return null;
      }
    },
    enabled: !!user && !authLoading,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
