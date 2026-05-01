import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type ActivityType = "drive" | "walk_spotting" | "meetup";
export type ActivityVisibility = "private" | "public" | "link_only";

export interface ActiveSession {
  id: string;
  type: ActivityType;
  started_at: string;
  ended_at: string | null;
  visibility: ActivityVisibility;
  summary_note: string | null;
  user_id: string;
}

const CACHE_KEY = "active_activity_session_id_v1";
const sessionKey = (userId: string | undefined) => ["active-activity-session", userId ?? "anon"] as const;

function readCache(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(CACHE_KEY);
  } catch {
    return null;
  }
}

function writeCache(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(CACHE_KEY, id);
  else localStorage.removeItem(CACHE_KEY);
}

async function fetchActiveSession(userId: string): Promise<ActiveSession | null> {
  const cachedId = readCache();
  if (cachedId) {
    const { data } = await supabase
      .from("activity_sessions")
      .select("*")
      .eq("id", cachedId)
      .eq("user_id", userId)
      .is("ended_at", null)
      .maybeSingle();
    if (data) return data as ActiveSession;
    writeCache(null);
  }
  const { data: latest } = await supabase
    .from("activity_sessions")
    .select("*")
    .eq("user_id", userId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest) {
    writeCache(latest.id);
    return latest as ActiveSession;
  }
  return null;
}

export function useActivitySession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  const { data: activeSession = null, isLoading } = useQuery({
    queryKey: sessionKey(user?.id),
    queryFn: () => (user ? fetchActiveSession(user.id) : Promise.resolve(null)),
    enabled: !!user,
    staleTime: 30_000,
  });

  // Tick elapsed minutes
  useEffect(() => {
    if (!activeSession || activeSession.ended_at) {
      setElapsedMinutes(0);
      return;
    }
    const tick = () => {
      const start = new Date(activeSession.started_at).getTime();
      setElapsedMinutes(Math.max(0, Math.floor((Date.now() - start) / 60000)));
    };
    tick();
    const id = window.setInterval(tick, 30000);
    return () => window.clearInterval(id);
  }, [activeSession]);

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CACHE_KEY) {
        queryClient.invalidateQueries({ queryKey: sessionKey(user?.id) });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [queryClient, user?.id]);

  const startSession = useCallback(
    async (type: ActivityType, visibility: ActivityVisibility = "private") => {
      if (!user) {
        toast.error("Logg inn for å starte tur");
        return null;
      }
      setIsStarting(true);
      try {
        const { data, error } = await supabase
          .from("activity_sessions")
          .insert({
            user_id: user.id,
            type,
            visibility,
            started_at: new Date().toISOString(),
          })
          .select("*")
          .single();
        if (error) throw error;
        writeCache(data.id);
        // Update shared cache immediately so all consumers re-render NOW
        queryClient.setQueryData(sessionKey(user.id), data as ActiveSession);
        toast.success("Tur startet");
        return data as ActiveSession;
      } catch (err) {
        console.error("startSession error", err);
        toast.error("Kunne ikke starte tur");
        return null;
      } finally {
        setIsStarting(false);
      }
    },
    [user, queryClient]
  );

  const stopSession = useCallback(
    async (opts?: { summaryNote?: string; visibility?: ActivityVisibility }) => {
      const current = activeSession;
      if (!current || !user) return null;
      setIsStopping(true);
      try {
        const { data, error } = await supabase
          .from("activity_sessions")
          .update({
            ended_at: new Date().toISOString(),
            summary_note: opts?.summaryNote ?? current.summary_note,
            visibility: opts?.visibility ?? current.visibility,
          })
          .eq("id", current.id)
          .eq("user_id", user.id)
          .select("*")
          .single();
        if (error) throw error;
        writeCache(null);
        // Clear active session immediately for all consumers
        queryClient.setQueryData(sessionKey(user.id), null);
        queryClient.invalidateQueries({ queryKey: ["latest-completed-session", user.id] });
        toast.success("Tur avsluttet");
        return data as ActiveSession;
      } catch (err) {
        console.error("stopSession error", err);
        toast.error("Kunne ikke avslutte tur");
        return null;
      } finally {
        setIsStopping(false);
      }
    },
    [activeSession, user, queryClient]
  );

  const recoverSession = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: sessionKey(user?.id) });
  }, [queryClient, user?.id]);

  return {
    activeSession,
    isLoading,
    isStarting,
    isStopping,
    startSession,
    stopSession,
    recoverSession,
    elapsedMinutes,
  };
}
