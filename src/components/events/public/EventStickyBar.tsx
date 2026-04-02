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
    <div className="sticky top-0 z-30 w-full bg-[#0B0F14]/95 backdrop-blur-md border-b border-[#1F2730]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-sm text-[#8B98A5]">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {format(startDate, "d. MMM yyyy", { locale: nb })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {format(startDate, "HH:mm")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            {location}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
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
