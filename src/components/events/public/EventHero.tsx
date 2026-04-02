import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Calendar, MapPin } from "lucide-react";
import { EventTypeBadge } from "@/components/events/EventTypeBadge";
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

  return (
    <div className="relative w-full aspect-[16/7] sm:aspect-[16/6] rounded-2xl overflow-hidden">
      {/* Background */}
      {heroImage ? (
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-200 via-orange-100 to-amber-50" />
      )}

      {/* Bottom-left gradient for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Content pinned bottom-left */}
      <div className="absolute inset-0 flex items-end">
        <div className="p-5 sm:p-8 max-w-xl space-y-3">
          <div className="flex items-center gap-2.5">
            <EventTypeBadge type={eventType} />
            {status === "cancelled" && (
              <span className="text-sm font-semibold text-red-400">Avlyst</span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.08] drop-shadow-sm">
            {title}
          </h1>

          {shortDescription && (
            <p className="text-base sm:text-lg text-white/80 leading-relaxed">
              {shortDescription}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-white/70 font-medium">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-400" />
              {dateStr} kl. {timeStr}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-400" />
              {location}
            </span>
          </div>

          <div className="pt-1">
            <EventHeroCTA eventId={eventId} />
          </div>
        </div>
      </div>
    </div>
  );
}
