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
      {/* Background image — bright, no dark overlay */}
      {heroImage ? (
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-50" />
      )}

      {/* Subtle bottom gradient so text is readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/30 to-transparent" />

      {/* Content card */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 pb-8 md:pb-14">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200/60 p-6 sm:p-8 max-w-xl space-y-4">
          <div className="flex items-center gap-3">
            <EventTypeBadge type={eventType} />
            {status === "cancelled" && (
              <span className="text-sm font-semibold text-red-500">Avlyst</span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-stone-900 leading-[1.1]">
            {title}
          </h1>

          {shortDescription && (
            <p className="text-base sm:text-lg text-stone-600 leading-relaxed">
              {shortDescription}
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 text-sm text-stone-500">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-500" />
              {dateStr} kl. {timeStr}
            </span>
            <span className="hidden sm:block text-stone-300">·</span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-500" />
              {location}
            </span>
          </div>

          <div className="pt-2">
            <EventHeroCTA eventId={eventId} />
          </div>
        </div>
      </div>
    </section>
  );
}
