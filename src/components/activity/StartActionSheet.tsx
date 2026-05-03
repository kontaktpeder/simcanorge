import { useNavigate } from "react-router-dom";
import { Camera, Car, Eye, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { SpotCarDialog } from "@/components/car/SpotCarDialog";
import { AddMomentDialog } from "@/components/activity/AddMomentDialog";
import { useActivitySession } from "@/hooks/useActivitySession";

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;
const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  activitiesEnabled?: boolean;
}

/**
 * Felles handling-meny brukt fra BottomNav (Start-knappen) og Start-siden.
 * Fire valg: Spot bil · Start kjøretur · Legg til øyeblikk · Registrer bil.
 */
export function StartActionSheet({ open, onOpenChange, activitiesEnabled = true }: Props) {
  const navigate = useNavigate();
  const { startSession, isStarting, activeSession } = useActivitySession({ enabled: activitiesEnabled });
  const [momentOpen, setMomentOpen] = useState(false);
  const [spotTrigger, setSpotTrigger] = useState(0);

  const handleStartDrive = async () => {
    if (!activitiesEnabled) return;
    const result = await startSession("drive");
    if (result) {
      onOpenChange(false);
      navigate("/aktiv");
    }
  };

  const handleOpenMoment = () => {
    onOpenChange(false);
    setMomentOpen(true);
  };

  const handleRegisterCar = () => {
    onOpenChange(false);
    navigate("/legg-til-bil");
  };


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="border-white/10" style={{ background: "hsl(215 25% 10%)" }}>
          <DialogHeader>
            <DialogTitle className="text-white" style={chakra}>Hva vil du gjøre nå?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            <SpotCarDialog
              trigger={
                <ActionButton
                  Icon={Eye}
                  label="Spot bil"
                  desc="Sett en bil du har sett ute"
                  onClick={() => onOpenChange(false)}
                />
              }
            />
            <ActionButton
              Icon={Car}
              label="Start kjøretur"
              desc="Logg en tur med øyeblikk underveis"
              onClick={handleStartDrive}
              disabled={!activitiesEnabled || isStarting}
            />
            <ActionButton
              Icon={Camera}
              label="Legg til øyeblikk"
              desc="Et bilde, en bil eller et notat"
              onClick={handleOpenMoment}
            />
            <ActionButton
              Icon={Plus}
              label="Registrer bil"
              desc="Legg en bil inn i garasjen"
              onClick={handleRegisterCar}
            />
          </div>
        </DialogContent>
      </Dialog>

      <AddMomentDialog
        sessionId={activeSession?.id ?? null}
        open={momentOpen}
        onOpenChange={setMomentOpen}
      />
    </>
  );
}

function ActionButton({
  Icon,
  label,
  desc,
  onClick,
  disabled,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 rounded-lg border border-white/[0.08] hover:border-[#2dd4a8]/40 transition-all text-left disabled:opacity-50"
      style={{ background: "hsl(215 25% 8%)" }}
    >
      <Icon className="w-5 h-5 text-[#2dd4a8]" />
      <div>
        <div className="text-[13px] text-white font-bold uppercase tracking-[0.05em]" style={chakra}>{label}</div>
        <div className="text-[11px] text-white/40" style={oswald}>{desc}</div>
      </div>
    </button>
  );
}
