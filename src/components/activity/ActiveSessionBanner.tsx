import { useState } from "react";
import { Camera, Flag, Car, Footprints, Users } from "lucide-react";
import { useActivitySession } from "@/hooks/useActivitySession";
import { useActivityMoments } from "@/hooks/useActivityMoments";
import { AddMomentDialog } from "./AddMomentDialog";
import { StopSessionDialog } from "./StopSessionDialog";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

const TYPE_LABEL = {
  drive: { label: "Kjøretur", icon: <Car className="w-4 h-4" /> },
  walk_spotting: { label: "Spotting", icon: <Footprints className="w-4 h-4" /> },
  meetup: { label: "Treff", icon: <Users className="w-4 h-4" /> },
} as const;

export function ActiveSessionBanner({ onStopped }: { onStopped?: () => void } = {}) {
  const { activeSession, elapsedMinutes } = useActivitySession();
  const { moments } = useActivityMoments(activeSession?.id);
  const [momentOpen, setMomentOpen] = useState(false);
  const [stopOpen, setStopOpen] = useState(false);

  if (!activeSession) return null;
  const meta = TYPE_LABEL[activeSession.type];

  return (
    <>
      <div
        className="rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3"
        style={{
          background: "linear-gradient(135deg, rgba(45,212,168,0.10) 0%, rgba(45,212,168,0.04) 100%)",
          borderColor: "rgba(45,212,168,0.35)",
          boxShadow: "0 0 30px rgba(45,212,168,0.10)",
        }}
        role="status"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34eab8] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#34eab8]" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[#34eab8]">
              {meta.icon}
              <span className="text-[12px] uppercase tracking-[0.15em] font-bold" style={chakra}>{meta.label} pågår</span>
            </div>
            <div className="text-[11px] text-white/50 mt-0.5" style={oswald}>
              {elapsedMinutes} min · {moments.length} {moments.length === 1 ? "øyeblikk" : "øyeblikk"}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMomentOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] uppercase tracking-[0.1em] font-bold text-[#070b10] transition-all hover:scale-[1.02]"
            style={{ ...chakra, background: "linear-gradient(135deg, #34eab8 0%, #2ab89a 100%)" }}
          >
            <Camera className="w-3.5 h-3.5" />
            Bilde
          </button>
          <button
            type="button"
            onClick={() => setStopOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] uppercase tracking-[0.1em] font-bold border border-white/15 text-white/80 hover:text-white hover:border-white/30 transition-all"
            style={chakra}
          >
            <Flag className="w-3.5 h-3.5" />
            Avslutt
          </button>
        </div>
      </div>
      <AddMomentDialog sessionId={activeSession.id} open={momentOpen} onOpenChange={setMomentOpen} />
      <StopSessionDialog open={stopOpen} onOpenChange={setStopOpen} />
    </>
  );
}
