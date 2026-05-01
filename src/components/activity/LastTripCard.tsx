import { Car, Footprints, Users, ChevronRight, ImageOff } from "lucide-react";
import type { CompletedSessionSummary } from "@/hooks/useLatestCompletedSession";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

const TYPE_LABEL = {
  drive: { label: "Kjøretur", icon: <Car className="w-3.5 h-3.5" /> },
  walk_spotting: { label: "Spotting", icon: <Footprints className="w-3.5 h-3.5" /> },
  meetup: { label: "Treff", icon: <Users className="w-3.5 h-3.5" /> },
} as const;

export function LastTripCard({
  summary,
  onOpen,
}: {
  summary: CompletedSessionSummary;
  onOpen: () => void;
}) {
  const { session, moments, momentCount, durationMinutes } = summary;
  const meta = TYPE_LABEL[session.type as keyof typeof TYPE_LABEL] ?? TYPE_LABEL.drive;
  const thumbs = moments
    .map((m) => m.data?.image_url || null)
    .filter((u): u is string => !!u)
    .slice(0, 3);

  const endedDate = session.ended_at ? new Date(session.ended_at) : null;
  const dateLabel = endedDate
    ? endedDate.toLocaleDateString("no-NO", { day: "numeric", month: "short" })
    : "";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left rounded-2xl border border-white/[0.06] hover:border-[#2dd4a8]/30 transition-all p-4"
      style={{ background: "hsl(215 25% 10%)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-white/60">
          {meta.icon}
          <span className="text-[11px] uppercase tracking-[0.15em] font-bold" style={chakra}>
            Siste tur · {meta.label}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-white/25" />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-white/80 font-semibold" style={chakra}>
            {durationMinutes} min · {momentCount} {momentCount === 1 ? "øyeblikk" : "øyeblikk"}
          </p>
          {dateLabel && (
            <p className="text-[11px] text-white/35 mt-0.5" style={oswald}>{dateLabel}</p>
          )}
        </div>
        {thumbs.length > 0 ? (
          <div className="flex -space-x-2">
            {thumbs.map((src, i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-lg overflow-hidden border border-[hsl(215_25%_10%)]"
                style={{ background: "hsl(215 25% 8%)" }}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg border border-white/[0.06] flex items-center justify-center" style={{ background: "hsl(215 25% 8%)" }}>
            <ImageOff className="w-4 h-4 text-white/25" />
          </div>
        )}
      </div>
    </button>
  );
}
