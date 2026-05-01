import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, Share2 } from "lucide-react";
import { useActivitySession } from "@/hooks/useActivitySession";
import { useActivityMoments } from "@/hooks/useActivityMoments";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

export function StopSessionDialog({
  open,
  onOpenChange,
  onStopped,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onStopped?: () => void;
}) {
  const { activeSession, stopSession, isStopping, elapsedMinutes } = useActivitySession();
  const { moments } = useActivityMoments(activeSession?.id);
  const [summaryNote, setSummaryNote] = useState("");

  if (!activeSession) return null;

  const handleStop = async () => {
    // Always save as private. Sharing is handled in a separate step later.
    const result = await stopSession({
      summaryNote: summaryNote.trim() || undefined,
      visibility: "private",
    });
    setSummaryNote("");
    onOpenChange(false);
    if (result) onStopped?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="border-white/10 p-5 sm:rounded-2xl rounded-t-2xl rounded-b-none sm:rounded-b-2xl bottom-0 top-auto sm:top-[50%] translate-y-0 sm:translate-y-[-50%] data-[state=open]:slide-in-from-bottom-4 sm:data-[state=open]:slide-in-from-top-[48%]"
        style={{
          background: "linear-gradient(180deg, hsl(215 30% 11%) 0%, hsl(215 30% 8%) 100%)",
          boxShadow: "0 -20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(232,74,74,0.08)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-white" style={chakra}>
            Avslutt tur
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Varighet" value={`${elapsedMinutes} min`} />
            <Stat label="Øyeblikk" value={String(moments.length)} />
          </div>

          <div>
            <Label
              className="text-[11px] uppercase tracking-[0.15em] text-white/40"
              style={oswald}
            >
              Oppsummering
            </Label>
            <Textarea
              placeholder="Hvordan var turen? (valgfri)"
              value={summaryNote}
              onChange={(e) => setSummaryNote(e.target.value)}
              rows={3}
              className="mt-1.5 bg-[hsl(215_25%_8%)] border-white/10 text-white placeholder:text-white/30"
            />
          </div>

          {/* Privacy info — always private. Sharing is a separate step (coming soon). */}
          <div
            className="rounded-lg border border-white/[0.08] p-3 flex items-start gap-3"
            style={{ background: "hsl(215 25% 8%)" }}
          >
            <div className="mt-0.5 rounded-md bg-white/[0.06] p-1.5 text-[#34eab8]">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-white font-semibold" style={chakra}>
                Lagres privat
              </div>
              <div className="text-[11px] text-white/50 mt-0.5" style={oswald}>
                Bare du ser turen og øyeblikkene. Du kan dele etterpå.
              </div>
            </div>
            <div
              className="hidden sm:flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-white/30 px-2 py-1 rounded-full border border-white/[0.06]"
              style={chakra}
              title="Deling kommer snart"
            >
              <Share2 className="w-3 h-3" />
              Del — kommer snart
            </div>
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
    <div
      className="rounded-lg p-3 border border-white/[0.06]"
      style={{ background: "hsl(215 25% 8%)" }}
    >
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/30" style={oswald}>
        {label}
      </div>
      <div className="text-[18px] font-bold text-white mt-0.5" style={chakra}>
        {value}
      </div>
    </div>
  );
}
