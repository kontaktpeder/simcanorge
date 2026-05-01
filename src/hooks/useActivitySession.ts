import { useCallback, useEffect, useState } from "react";
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

export function useActivitySession() {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // Tick elapsed
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

  const recoverSession = useCallback(async () => {
    if (!user) {
      setActiveSession(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const cachedId = readCache();
      if (cachedId) {
        const { data } = await supabase
          .from("activity_sessions")
          .select("*")
          .eq("id", cachedId)
          .eq("user_id", user.id)
          .is("ended_at", null)
          .maybeSingle();
        if (data) {
          setActiveSession(data as ActiveSession);
          setIsLoading(false);
          return;
        }
        writeCache(null);
      }
      // DB fallback: latest open session for user
      const { data: latest } = await supabase
        .from("activity_sessions")
        .select("*")
        .eq("user_id", user.id)
        .is("ended_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latest) {
        writeCache(latest.id);
        setActiveSession(latest as ActiveSession);
      } else {
        setActiveSession(null);
      }
    } catch (err) {
      console.error("recoverSession error", err);
      setActiveSession(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void recoverSession();
  }, [recoverSession]);

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CACHE_KEY) void recoverSession();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [recoverSession]);

  const startSession = useCallback(
    async (type: ActivityType, visibility: ActivityVisibility = "private") => {
      if (!user) {
        toast.error("Logg inn for å starte tur");
        return;
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
        setActiveSession(data as ActiveSession);
        toast.success("Tur startet");
      } catch (err) {
        console.error("startSession error", err);
        toast.error("Kunne ikke starte tur");
      } finally {
        setIsStarting(false);
      }
    },
    [user]
  );

  const stopSession = useCallback(
    async (opts?: { summaryNote?: string; visibility?: ActivityVisibility }) => {
      const current = activeSession;
      if (!current || !user) return;
      setIsStopping(true);
      try {
        const { error } = await supabase
          .from("activity_sessions")
          .update({
            ended_at: new Date().toISOString(),
            summary_note: opts?.summaryNote ?? current.summary_note,
            visibility: opts?.visibility ?? current.visibility,
          })
          .eq("id", current.id)
          .eq("user_id", user.id);
        if (error) throw error;
        writeCache(null);
        setActiveSession(null);
        toast.success("Tur avsluttet");
      } catch (err) {
        console.error("stopSession error", err);
        toast.error("Kunne ikke avslutte tur");
      } finally {
        setIsStopping(false);
      }
    },
    [activeSession, user]
  );

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
