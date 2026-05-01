import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Car, Footprints, Users, Play } from "lucide-react";
import { useActivitySession, type ActivityType } from "@/hooks/useActivitySession";
import { track } from "@/lib/analytics";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

const TYPES: { value: ActivityType; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: "drive", label: "Kjøretur", desc: "Du kjører en bil", icon: <Car className="w-5 h-5" /> },
  { value: "walk_spotting", label: "Går og ser biler", desc: "Spotting til fots", icon: <Footprints className="w-5 h-5" /> },
  { value: "meetup", label: "Treff / utstilling", desc: "Du er på et arrangement", icon: <Users className="w-5 h-5" /> },
];

export function StartSessionButton({ className }: { className?: string }) {
  const { startSession, isStarting } = useActivitySession();
  const [open, setOpen] = useState(false);

  const handleStart = async (type: ActivityType) => {
    const intent = type === "drive" ? "drive" : type === "walk_spotting" ? "spot" : "meetup";
    void track(`${intent}_intent_click`, "start", { intent, activity_type: type });
    const result = await startSession(type);
    if (result) {
      void track("session_started", "start", { activity_type: type, source: "start_intent" });
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-[12px] tracking-[0.1em] uppercase font-bold text-[#070b10] transition-all hover:scale-[1.02] ${className ?? ""}`}
          style={{ ...chakra, background: "linear-gradient(135deg, #34eab8 0%, #2ab89a 100%)", boxShadow: "0 0 20px rgba(45,212,168,0.25)" }}
        >
          <Play className="w-4 h-4" />
          Start tur
        </button>
      </DialogTrigger>
      <DialogContent className="border-white/10" style={{ background: "hsl(215 25% 10%)" }}>
        <DialogHeader>
          <DialogTitle className="text-white" style={chakra}>Hva gjør du nå?</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              disabled={isStarting}
              onClick={() => handleStart(t.value)}
              className="w-full flex items-center gap-3 p-4 rounded-lg border border-white/[0.08] hover:border-[#2dd4a8]/40 transition-all text-left disabled:opacity-50"
              style={{ background: "hsl(215 25% 8%)" }}
            >
              <span className="text-[#2dd4a8]">{t.icon}</span>
              <div>
                <div className="text-[13px] text-white font-bold uppercase tracking-[0.05em]" style={chakra}>{t.label}</div>
                <div className="text-[11px] text-white/40" style={oswald}>{t.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
