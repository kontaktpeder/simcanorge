import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Calendar, MapPin } from "lucide-react";
import { EventHeroCTA } from "./EventHeroCTA";

interface EventHeroProps {
  title: string;
  shortDescription?: string | null;
  eventType: string;
  status: string;
  startsAt: string;
  endsAt?: string | null;
  location: string;
  heroImage?: string | null;
  eventId: string;
}

export function EventHero({
  title,
  shortDescription,
  eventType,
  status,
  startsAt,
  location,
  heroImage,
  eventId,
}: EventHeroProps) {
  const startDate = new Date(startsAt);
  const dateStr = format(startDate, "d. MMMM yyyy", { locale: nb });
  const timeStr = format(startDate, "HH:mm", { locale: nb });

  const typeLabels: Record<string, string> = {
    meet: "Biltreff",
    show: "Show",
    market: "Delemarked",
    drive: "Kjøretur",
    club_night: "Klubbkveld",
    exhibition: "Utstilling",
    open_day: "Åpen dag",
    other: "Arrangement",
  };

  return (
    <div className="space-y-5">
      {/* Image */}
      <div className="relative w-full aspect-[2/1] sm:aspect-[2.4/1] rounded-2xl overflow-hidden bg-white/5">
        {heroImage ? (
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5" />
        )}
      </div>

      {/* Info below image */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold tracking-wider uppercase text-white/40 bg-white/5 px-3 py-1.5 rounded-full">
            {typeLabels[eventType] || eventType}
          </span>
          {status === "cancelled" && (
            <span className="text-xs font-semibold tracking-wider uppercase text-red-400 bg-red-400/10 px-3 py-1.5 rounded-full">
              Avlyst
            </span>
          )}
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-extrabold text-white leading-[1.05] tracking-tight">
          {title}
        </h1>

        {shortDescription && (
          <p className="text-lg sm:text-xl text-white/50 leading-relaxed max-w-2xl">
            {shortDescription}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px] text-white/40">
          <span className="inline-flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {dateStr} kl. {timeStr}
          </span>
          <span className="inline-flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {location}
          </span>
        </div>

        <div className="pt-2">
          <EventHeroCTA eventId={eventId} />
        </div>
      </div>
    </div>
  );
}
