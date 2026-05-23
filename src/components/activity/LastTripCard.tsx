import { Car, Footprints, Users, ChevronRight, ImageOff } from "lucide-react";
import type { CompletedSessionSummary } from "@/hooks/useLatestCompletedSession";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

const TYPE_LABEL = {
  drive: { label: "Kjøretur", icon: <Car className="w-3.5 h-3.5" /> },
  walk_spotting: { label: "Spotting", icon: <Footprints className="w-3.5 h-3.5" /> },
  meetup: { label: "Treff", icon: <Users className="w-3.5 h-3.5" /> },
} as const;

interface Props {
  summary: CompletedSessionSummary;
  onOpen: () => void;
  variant?: "dark" | "light";
}

export function LastTripCard({ summary, onOpen, variant = "dark" }: Props) {
  const isLight = variant === "light";
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

  const bg = isLight ? "#f1ede4" : "hsl(215 25% 10%)";
  const thumbBorder = isLight ? "#e9e7e1" : "hsl(215 25% 10%)";
  const thumbBg = isLight ? "#ebe7dd" : "hsl(215 25% 8%)";
  const labelColor = isLight ? "text-[#1a1a1a]/60" : "text-white/60";
  const chevronColor = isLight ? "text-[#1a1a1a]/25" : "text-white/25";
  const titleColor = isLight ? "text-[#1a1a1a]/80" : "text-white/80";
  const dateColor = isLight ? "text-[#1a1a1a]/35" : "text-white/35";
  const borderColor = isLight ? "border-[#1a1a1a]/8" : "border-white/[0.06]";
  const hoverBorder = isLight ? "hover:border-[#1f3a34]/20" : "hover:border-[#2dd4a8]/30";

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full text-left rounded-2xl border ${borderColor} ${hoverBorder} transition-all p-4`}
      style={{ background: bg }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-2 ${labelColor}`}>
          {meta.icon}
          <span className="text-[11px] uppercase tracking-[0.15em] font-bold" style={chakra}>
            Siste tur · {meta.label}
          </span>
        </div>
        <ChevronRight className={`w-4 h-4 ${chevronColor}`} />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] ${titleColor} font-semibold`} style={chakra}>
            {durationMinutes} min · {momentCount} {momentCount === 1 ? "øyeblikk" : "øyeblikk"}
          </p>
          {dateLabel && (
            <p className={`text-[11px] ${dateColor} mt-0.5`} style={oswald}>{dateLabel}</p>
          )}
        </div>
        {thumbs.length > 0 ? (
          <div className="flex -space-x-2">
            {thumbs.map((src, i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-lg overflow-hidden border"
                style={{ borderColor: thumbBorder, background: thumbBg }}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <div className={`w-10 h-10 rounded-lg border ${borderColor} flex items-center justify-center`} style={{ background: thumbBg }}>
            <ImageOff className={`w-4 h-4 ${chevronColor}`} />
          </div>
        )}
      </div>
    </button>
  );
}
