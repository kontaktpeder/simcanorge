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
    <section className="relative w-full min-h-[65vh] md:min-h-[75vh] flex items-end overflow-hidden">
      {/* Background image */}
      {heroImage ? (
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1209] to-[#0d0a06]" />
      )}

      {/* Cinematic gradient — left-heavy + bottom */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0d0a06]/95 via-[#0d0a06]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0a06] via-[#0d0a06]/40 to-transparent" />

      {/* Warm ambient glow */}
      <div className="absolute bottom-0 left-0 w-[60%] h-[40%] bg-gradient-to-tr from-amber-900/20 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 pb-14 md:pb-20">
        <div className="max-w-2xl space-y-5">
          <div className="flex items-center gap-3">
            <EventTypeBadge type={eventType} />
            {status === "cancelled" && (
              <span className="text-sm font-medium text-red-400 tracking-wide">Avlyst</span>
            )}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.1]">
            {title}
          </h1>

          {shortDescription && (
            <p className="text-base sm:text-lg text-white/70 max-w-xl leading-relaxed">
              {shortDescription}
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-white/60">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-400" />
              {dateStr} kl. {timeStr}
            </span>
            <span className="hidden sm:block text-white/20">·</span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-400" />
              {location}
            </span>
          </div>

          <div className="pt-3">
            <EventHeroCTA eventId={eventId} />
          </div>
        </div>
      </div>
    </section>
  );
}
