import { format, isSameDay } from "date-fns";
import { nb } from "date-fns/locale";
import { Calendar, MapPin, Users, ExternalLink, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { useEventAttendeeCount } from "@/hooks/useEventAttendees";
import { EventHeroCTA } from "./EventHeroCTA";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface OwnerPage {
  id: string;
  title: string;
  slug: string;
  logo_url?: string | null;
  tagline?: string | null;
  website?: string | null;
}

interface OwnerProfile {
  id: string;
  display_name: string;
  slug: string;
  avatar_url?: string | null;
}

interface EventSidebarProps {
  startsAt: string;
  endsAt?: string | null;
  location: string;
  maxAttendees?: number | null;
  registrationUrl?: string | null;
  ownerPage?: OwnerPage | null;
  ownerProfile?: OwnerProfile | null;
  eventId: string;
}

export function EventSidebar({
  startsAt,
  endsAt,
  location,
  maxAttendees,
  registrationUrl,
  ownerPage,
  ownerProfile,
  eventId,
}: EventSidebarProps) {
  const startDate = new Date(startsAt);
  const endDate = endsAt ? new Date(endsAt) : null;
  const { data: count } = useEventAttendeeCount(eventId);

  const dateDisplay = (() => {
    const start = format(startDate, "EEEE d. MMMM yyyy", { locale: nb });
    if (!endDate) return start;
    if (isSameDay(startDate, endDate)) return start;
    return `${start} – ${format(endDate, "EEEE d. MMMM yyyy", { locale: nb })}`;
  })();

  const timeDisplay = (() => {
    const start = format(startDate, "HH:mm");
    if (!endDate) return start;
    return `${start} – ${format(endDate, "HH:mm")}`;
  })();

  const organizerName = ownerPage?.title || ownerProfile?.display_name || "Ukjent";
  const organizerLogo = ownerPage?.logo_url || ownerProfile?.avatar_url;
  const organizerLink = ownerPage ? `/s/${ownerPage.slug}` : null;

  return (
    <div className="rounded-2xl bg-white shadow-lg border border-stone-100 p-6 space-y-5">
      {/* Date */}
      <div className="flex items-start gap-3">
        <Calendar className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-stone-800 capitalize">{dateDisplay}</p>
          <p className="text-sm text-stone-500">kl. {timeDisplay}</p>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-start gap-3">
        <MapPin className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-sm font-medium text-stone-700">{location}</p>
      </div>

      {/* Attendees */}
      <div className="flex items-start gap-3">
        <Users className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-sm font-medium text-stone-700">
          {count ?? 0} påmeldt
          {maxAttendees && <span className="text-stone-400"> / {maxAttendees} plasser</span>}
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-stone-100" />

      {/* Organizer */}
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          {organizerLogo && <AvatarImage src={organizerLogo} alt={organizerName} />}
          <AvatarFallback className="bg-amber-100 text-amber-700 text-xs font-bold">
            {organizerName[0]}
          </AvatarFallback>
        </Avatar>
        <div className="text-sm">
          <p className="text-stone-400 text-xs">Arrangert av</p>
          {organizerLink ? (
            <Link to={organizerLink} className="text-stone-800 font-medium hover:text-amber-600 transition-colors">
              {organizerName}
            </Link>
          ) : (
            <span className="text-stone-800 font-medium">{organizerName}</span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-stone-100" />

      {/* CTA */}
      <EventHeroCTA eventId={eventId} />

      {/* External registration */}
      {registrationUrl && (
        <a
          href={registrationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Ekstern påmelding
        </a>
      )}

      {/* Website */}
      {ownerPage?.website && (
        <a
          href={ownerPage.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 transition-colors"
        >
          <Globe className="w-3.5 h-3.5" />
          Besøk nettside
        </a>
      )}
    </div>
  );
}
