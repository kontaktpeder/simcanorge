import { Link, useLocation } from "react-router-dom";
import { Camera, Flag, Car, Footprints, Users, Maximize2 } from "lucide-react";
import { useActivitySession } from "@/hooks/useActivitySession";
import { useActivityMoments } from "@/hooks/useActivityMoments";
import { useFeatures } from "@/hooks/useFeatures";

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

const META = {
  drive: { label: "Kjøretur", Icon: Car },
  walk_spotting: { label: "Spotting", Icon: Footprints },
  meetup: { label: "Treff", Icon: Users },
} as const;

function formatDuration(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0) return `${h}t ${m.toString().padStart(2, "0")}m`;
  return `${m}m`;
}

/**
 * Minimized pill shown when an activity session is active and the user
 * has navigated AWAY from /aktiv. Tapping it returns to the focus page.
 * The actual fullscreen focus view lives at /aktiv (AktivTur page).
 */
export function FocusModeOverlay() {
  const features = useFeatures();
  const { activeSession, elapsedMinutes } = useActivitySession();
  const { moments } = useActivityMoments(activeSession?.id);
  const { pathname } = useLocation();

  if (!features.activitySessions) return null;
  if (!activeSession) return null;
  // Don't show on the focus page itself or auth pages.
  if (pathname.startsWith("/aktiv")) return null;
  if (pathname.startsWith("/login") || pathname.startsWith("/registrer")) return null;

  const meta = META[activeSession.type];
  const Icon = meta.Icon;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
      role="status"
    >
      <Link
        to="/aktiv"
        className="flex items-center gap-2 pl-3 pr-3 py-2 rounded-full backdrop-blur-xl border hover:bg-white/[0.05] transition-colors"
        style={{
          background: "rgba(8,12,17,0.9)",
          borderColor: "rgba(52,234,184,0.4)",
          boxShadow:
            "0 8px 24px rgba(0,0,0,0.5), 0 0 24px rgba(52,234,184,0.2)",
        }}
        aria-label="Åpne fokusmodus"
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
          · {formatDuration(elapsedMinutes)}
          {moments.length > 0 ? ` · ${moments.length}` : ""}
        </span>
        <Maximize2 className="w-3.5 h-3.5 text-white/50 ml-0.5" />
      </Link>
    </div>
  );
}
