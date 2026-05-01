import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Car, Footprints, Users, ImageOff, Sparkles } from "lucide-react";
import type { CompletedSessionSummary } from "@/hooks/useLatestCompletedSession";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

const TYPE_LABEL = {
  drive: { label: "Kjøretur", icon: <Car className="w-4 h-4" /> },
  walk_spotting: { label: "Spotting", icon: <Footprints className="w-4 h-4" /> },
  meetup: { label: "Treff", icon: <Users className="w-4 h-4" /> },
} as const;

const VIS_LABEL: Record<string, string> = {
  private: "Privat",
  link_only: "Med lenke",
  public: "Offentlig",
};

export function TripSummaryDialog({
  summary,
  open,
  onOpenChange,
}: {
  summary: CompletedSessionSummary | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!summary) return null;
  const { session, moments, momentCount, linkedCarCount, durationMinutes } = summary;
  const meta = TYPE_LABEL[session.type as keyof typeof TYPE_LABEL] ?? TYPE_LABEL.drive;
  const thumbs = moments
    .map((m) => m.data?.image_url || null)
    .filter((u): u is string => !!u)
    .slice(0, 3);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10" style={{ background: "hsl(215 25% 10%)" }}>
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2" style={chakra}>
            <Sparkles className="w-4 h-4 text-[#34eab8]" />
            Turen din er lagret
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="flex items-center gap-2 text-[#34eab8]">
            {meta.icon}
            <span className="text-[12px] uppercase tracking-[0.15em] font-bold" style={chakra}>
              {meta.label}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Stat label="Varighet" value={`${durationMinutes} min`} />
            <Stat label="Øyeblikk" value={String(momentCount)} />
            <Stat label="Biler" value={String(linkedCarCount)} />
          </div>

          {thumbs.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {thumbs.map((src, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg overflow-hidden border border-white/[0.08]"
                  style={{ background: "hsl(215 25% 8%)" }}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : momentCount > 0 ? (
            <div
              className="rounded-lg p-4 flex items-center gap-3 border border-white/[0.06]"
              style={{ background: "hsl(215 25% 8%)" }}
            >
              <ImageOff className="w-4 h-4 text-white/40 flex-shrink-0" />
              <p className="text-[11px] text-white/50" style={oswald}>
                {momentCount} {momentCount === 1 ? "øyeblikk" : "øyeblikk"} lagret uten bilde.
              </p>
            </div>
          ) : (
            <div
              className="rounded-lg p-4 border border-dashed border-white/[0.08]"
              style={{ background: "hsl(215 25% 8%)" }}
            >
              <p className="text-[11px] text-white/40" style={oswald}>
                Ingen øyeblikk denne gangen — neste tur kan du fange flere.
              </p>
            </div>
          )}

          {session.summary_note && (
            <div
              className="rounded-lg p-3 border border-white/[0.06]"
              style={{ background: "hsl(215 25% 8%)" }}
            >
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/30 mb-1" style={oswald}>
                Oppsummering
              </div>
              <p className="text-[12px] text-white/75 leading-snug">{session.summary_note}</p>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-white/40" style={oswald}>
            <span>Synlighet</span>
            <span className="text-white/70">{VIS_LABEL[session.visibility] ?? session.visibility}</span>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="bg-[#2dd4a8] text-[#070b10] hover:bg-[#34eab8]"
            >
              Lukk
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
