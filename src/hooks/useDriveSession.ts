import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const STORAGE_KEY = "active_drive_session_v1";

export interface ActiveDriveSession {
  carId: string;
  startedAt: string; // ISO
  note?: string;
}

function readSession(): ActiveDriveSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveDriveSession;
  } catch {
    return null;
  }
}

function writeSession(s: ActiveDriveSession | null) {
  if (typeof window === "undefined") return;
  if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  else localStorage.removeItem(STORAGE_KEY);
}

export function useDriveSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeSession, setActiveSession] = useState<ActiveDriveSession | null>(() => readSession());
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setActiveSession(readSession());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const startDrive = useCallback((carId: string, note?: string) => {
    setIsStarting(true);
    const session: ActiveDriveSession = {
      carId,
      startedAt: new Date().toISOString(),
      note,
    };
    writeSession(session);
    setActiveSession(session);
    setIsStarting(false);
    toast.success("Kjøretur startet");
  }, []);

  const cancelDrive = useCallback(() => {
    writeSession(null);
    setActiveSession(null);
  }, []);

  const stopDrive = useCallback(async () => {
    const current = readSession();
    if (!current || !user) {
      writeSession(null);
      setActiveSession(null);
      return;
    }
    setIsStopping(true);
    try {
      const endedAt = new Date();
      const startedAt = new Date(current.startedAt);
      const durationMinutes = Math.max(1, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000));

      const { error } = await supabase.from("car_events").insert({
        car_id: current.carId,
        category: "ownership",
        event_type: "drive",
        title: "Kjøretur",
        visibility: "private",
        occurred_at: current.startedAt,
        year: startedAt.getFullYear(),
        description: current.note ?? null,
        created_by: user.id,
        data: {
          started_at: current.startedAt,
          ended_at: endedAt.toISOString(),
          duration_minutes: durationMinutes,
          note: current.note ?? null,
        },
      });

      if (error) throw error;

      writeSession(null);
      setActiveSession(null);
      queryClient.invalidateQueries({ queryKey: ["car-events", current.carId] });
      toast.success(`Kjøretur lagret (${durationMinutes} min)`);
    } catch (err) {
      console.error("stopDrive error", err);
      toast.error("Kunne ikke lagre kjøretur");
    } finally {
      setIsStopping(false);
    }
  }, [user, queryClient]);

  return { activeSession, startDrive, stopDrive, cancelDrive, isStarting, isStopping };
}
