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
    <section className="relative w-full min-h-[55vh] md:min-h-[65vh] flex items-end overflow-hidden">
      {heroImage ? (
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-50" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/30 to-transparent" />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 pb-8 md:pb-14">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200/60 p-7 sm:p-10 max-w-2xl space-y-5">
          <div className="flex items-center gap-3">
            <EventTypeBadge type={eventType} />
            {status === "cancelled" && (
              <span className="text-base font-semibold text-red-500">Avlyst</span>
            )}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-stone-900 leading-[1.05]">
            {title}
          </h1>

          {shortDescription && (
            <p className="text-lg sm:text-xl text-stone-600 leading-relaxed">
              {shortDescription}
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-base text-stone-500 font-medium">
            <span className="inline-flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              {dateStr} kl. {timeStr}
            </span>
            <span className="hidden sm:block text-stone-300">·</span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-500" />
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
