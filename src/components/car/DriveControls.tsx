import { useEffect, useState } from "react";
import { Play, Square, Loader2 } from "lucide-react";
import { useDriveSession } from "@/hooks/useDriveSession";
import { FEATURES } from "@/config/features";
import { cn } from "@/lib/utils";

interface DriveControlsProps {
  carId: string;
  className?: string;
}

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

export function DriveControls({ carId, className }: DriveControlsProps) {
  if (!FEATURES.driveMode) return null;
  return <DriveControlsInner carId={carId} className={className} />;
}

function DriveControlsInner({ carId, className }: DriveControlsProps) {
  const { activeSession, startDrive, stopDrive, cancelDrive, isStarting, isStopping } = useDriveSession();
  const [elapsedMin, setElapsedMin] = useState(0);

  const isThisCar = activeSession?.carId === carId;
  const isOtherCar = !!activeSession && !isThisCar;

  useEffect(() => {
    if (!isThisCar || !activeSession) return;
    const tick = () => {
      const start = new Date(activeSession.startedAt).getTime();
      setElapsedMin(Math.max(0, Math.floor((Date.now() - start) / 60000)));
    };
    tick();
    const id = window.setInterval(tick, 30000);
    return () => window.clearInterval(id);
  }, [isThisCar, activeSession]);

  return (
    <div className={cn("w-full flex flex-col gap-3", className)}>
      {!activeSession && (
        <button
          type="button"
          onClick={() => startDrive(carId)}
          disabled={isStarting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-3 text-sm font-bold uppercase tracking-wider min-h-[48px] hover:bg-primary/90 transition-colors"
          style={oswald}
        >
          {isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Start kjøretur
        </button>
      )}

      {isThisCar && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-lg border border-primary/30 bg-primary/[0.06] p-3">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-[0.12em] text-primary/70 font-bold" style={oswald}>
              Kjøretur pågår
            </div>
            <div className="text-sm text-foreground/80 mt-0.5">
              {elapsedMin < 1 ? "Akkurat startet" : `${elapsedMin} min`}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={stopDrive}
              disabled={isStopping}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-bold uppercase tracking-wider min-h-[44px] hover:bg-primary/90 transition-colors"
              style={oswald}
            >
              {isStopping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
              Avslutt
            </button>
            <button
              type="button"
              onClick={cancelDrive}
              disabled={isStopping}
              className="text-xs text-muted-foreground hover:text-foreground px-3 py-2.5 min-h-[44px]"
            >
              Forkast
            </button>
          </div>
        </div>
      )}

      {isOtherCar && (
        <div className="rounded-lg border border-border/40 bg-muted/20 p-3 text-xs text-muted-foreground">
          En kjøretur pågår på en annen bil.
        </div>
      )}

      <p className="text-[11px] text-muted-foreground/70" style={oswald}>
        Kjøreturer er private som standard.
      </p>
    </div>
  );
}
