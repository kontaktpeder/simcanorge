import { useState } from "react";
import { Flag, Camera, Car, Footprints, Users } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useActivitySession } from "@/hooks/useActivitySession";
import { useActivityMoments } from "@/hooks/useActivityMoments";
import { AddMomentDialog } from "@/components/activity/AddMomentDialog";
import { StopSessionDialog } from "@/components/activity/StopSessionDialog";

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

const META = {
  drive: { label: "Kjøretur", Icon: Car },
  walk_spotting: { label: "Spotting", Icon: Footprints },
  meetup: { label: "Treff", Icon: Users },
} as const;

/**
 * Floating pill shown while an activity session is active.
 * Replaces the bottom navbar to keep focus on the activity.
 * Stays visible across all routes so the user can always exit.
 */
export function FocusModePill() {
  const { activeSession, elapsedMinutes } = useActivitySession();
  const { moments } = useActivityMoments(activeSession?.id);
  const { pathname } = useLocation();
  const [stopOpen, setStopOpen] = useState(false);
  const [momentOpen, setMomentOpen] = useState(false);

  if (!activeSession) return null;
  // Hide on auth flows so we don't block login
  if (pathname.startsWith("/login") || pathname.startsWith("/registrer")) return null;

  const meta = META[activeSession.type];
  const Icon = meta.Icon;

  return (
    <>
      <div
        className="fixed left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 pointer-events-none"
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
        }}
        role="status"
      >
        {/* Status pill */}
        <div
          className="pointer-events-auto flex items-center gap-2 pl-3 pr-2 py-2 rounded-full backdrop-blur-xl border"
          style={{
            background: "rgba(8,12,17,0.85)",
            borderColor: "rgba(52,234,184,0.35)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5), 0 0 24px rgba(52,234,184,0.18)",
          }}
        >
          <span className="relative flex h-2 w-2 ml-0.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34eab8] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34eab8]" />
          </span>
          <Icon className="w-3.5 h-3.5 text-[#34eab8]" />
          <span
            className="text-[11px] uppercase tracking-[0.12em] font-bold text-white/90"
            style={chakra}
          >
            {meta.label}
          </span>
          <span className="text-[11px] text-white/50 tabular-nums" style={chakra}>
            · {elapsedMinutes}m
            {moments.length > 0 ? ` · ${moments.length}` : ""}
          </span>

          <button
            type="button"
            onClick={() => setMomentOpen(true)}
            className="ml-1 w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] transition-colors"
            aria-label="Legg til øyeblikk"
          >
            <Camera className="w-3.5 h-3.5 text-white/80" />
          </button>

          <button
            type="button"
            onClick={() => setStopOpen(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#070b10] transition-all hover:scale-[1.05]"
            style={{
              background: "linear-gradient(135deg, #ff7a7a 0%, #e84a4a 100%)",
              boxShadow: "0 0 12px rgba(232,74,74,0.35)",
            }}
            aria-label="Avslutt aktivitet"
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <AddMomentDialog
        sessionId={activeSession.id}
        open={momentOpen}
        onOpenChange={setMomentOpen}
      />
      <StopSessionDialog open={stopOpen} onOpenChange={setStopOpen} />
    </>
  );
}
