import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { useActivitySession, type ActivityVisibility } from "@/hooks/useActivitySession";
import { useActivityMoments } from "@/hooks/useActivityMoments";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

export function StopSessionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { activeSession, stopSession, isStopping, elapsedMinutes } = useActivitySession();
  const { moments } = useActivityMoments(activeSession?.id);
  const [summaryNote, setSummaryNote] = useState("");
  const [visibility, setVisibility] = useState<ActivityVisibility>(
    (activeSession?.visibility as ActivityVisibility) ?? "private"
  );

  if (!activeSession) return null;

  const handleStop = async () => {
    await stopSession({ summaryNote: summaryNote.trim() || undefined, visibility });
    setSummaryNote("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10" style={{ background: "hsl(215 25% 10%)" }}>
        <DialogHeader>
          <DialogTitle className="text-white" style={chakra}>Avslutt tur</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Varighet" value={`${elapsedMinutes} min`} />
            <Stat label="Øyeblikk" value={String(moments.length)} />
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-[0.15em] text-white/40" style={oswald}>Oppsummering</Label>
            <Textarea
              placeholder="Hvordan var turen? (valgfri)"
              value={summaryNote}
              onChange={(e) => setSummaryNote(e.target.value)}
              rows={3}
              className="mt-1.5 bg-[hsl(215_25%_8%)] border-white/10 text-white placeholder:text-white/30"
            />
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-[0.15em] text-white/40" style={oswald}>Synlighet</Label>
            <RadioGroup value={visibility} onValueChange={(v) => setVisibility(v as ActivityVisibility)} className="mt-1.5 space-y-1.5">
              <VisOption value="private" label="Privat" desc="Kun du ser denne turen" />
              <VisOption value="link_only" label="Med lenke" desc="Kun de du deler lenke med" />
              <VisOption value="public" label="Offentlig" desc="Synlig for alle" />
            </RadioGroup>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-white/60 hover:text-white"
            >
              Lukk
            </Button>
            <Button
              type="button"
              onClick={handleStop}
              disabled={isStopping}
              className="bg-[#2dd4a8] text-[#070b10] hover:bg-[#34eab8]"
            >
              {isStopping ? <Loader2 className="w-4 h-4 animate-spin" /> : "Avslutt tur"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-3 border border-white/[0.06]" style={{ background: "hsl(215 25% 8%)" }}>
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/30" style={oswald}>{label}</div>
      <div className="text-[18px] font-bold text-white mt-0.5" style={chakra}>{value}</div>
    </div>
  );
}

function VisOption({ value, label, desc }: { value: string; label: string; desc: string }) {
  return (
    <label className="flex items-start gap-3 p-2.5 rounded-md border border-white/[0.06] cursor-pointer hover:border-white/15" style={{ background: "hsl(215 25% 8%)" }}>
      <RadioGroupItem value={value} className="mt-0.5 border-white/30" />
      <div>
        <div className="text-[12px] text-white font-semibold" style={chakra}>{label}</div>
        <div className="text-[10px] text-white/40" style={oswald}>{desc}</div>
      </div>
    </label>
  );
}
