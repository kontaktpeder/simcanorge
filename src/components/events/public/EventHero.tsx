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
  endsAt,
  location,
  heroImage,
  eventId,
}: EventHeroProps) {
  const startDate = new Date(startsAt);

  const dateStr = format(startDate, "d. MMMM yyyy", { locale: nb });
  const timeStr = format(startDate, "HH:mm", { locale: nb });

  return (
    <section className="relative w-full min-h-[60vh] md:min-h-[65vh] flex items-end overflow-hidden">
      {/* Background image */}
      {heroImage ? (
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-[#0B0F14]" />
      )}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F14] via-[#0B0F14]/80 to-transparent" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 pb-12 md:pb-16">
        <div className="max-w-2xl space-y-4">
          <div className="flex items-center gap-2">
            <EventTypeBadge type={eventType} />
            {status === "cancelled" && (
              <span className="text-sm font-medium text-red-400">Avlyst</span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#E6EDF3] leading-tight">
            {title}
          </h1>

          {shortDescription && (
            <p className="text-base sm:text-lg text-[#8B98A5] max-w-xl">
              {shortDescription}
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-[#8B98A5]">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-500" />
              {dateStr} kl. {timeStr}
            </span>
            <span className="hidden sm:block text-[#1F2730]">·</span>
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
