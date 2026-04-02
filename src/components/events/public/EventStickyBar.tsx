import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { useEventAttendeeCount } from "@/hooks/useEventAttendees";
import { EventHeroCTA } from "./EventHeroCTA";

interface EventStickyBarProps {
  startsAt: string;
  location: string;
  eventId: string;
}

export function EventStickyBar({ startsAt, location, eventId }: EventStickyBarProps) {
  const startDate = new Date(startsAt);
  const { data: count } = useEventAttendeeCount(eventId);

  return (
    <div className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-5 text-sm text-stone-500 font-medium">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-amber-500" />
            {format(startDate, "d. MMM yyyy", { locale: nb })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-500" />
            {format(startDate, "HH:mm")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-amber-500" />
            {location}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-500" />
            {count ?? 0} påmeldt
          </span>
        </div>
        <div className="hidden sm:block">
          <EventHeroCTA eventId={eventId} />
        </div>
      </div>
    </div>
  );
}
