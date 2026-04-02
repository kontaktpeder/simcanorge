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
    <div className="rounded-lg bg-[#11161D] border border-[#1F2730] p-5 space-y-5">
      {/* Date */}
      <div className="flex items-start gap-3">
        <Calendar className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-[#E6EDF3] capitalize">{dateDisplay}</p>
          <p className="text-sm text-[#8B98A5]">kl. {timeDisplay}</p>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-start gap-3">
        <MapPin className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-sm text-[#E6EDF3]">{location}</p>
      </div>

      {/* Attendees */}
      <div className="flex items-start gap-3">
        <Users className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-sm text-[#E6EDF3]">
          {count ?? 0} påmeldt
          {maxAttendees && <span className="text-[#8B98A5]"> / {maxAttendees} plasser</span>}
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-[#1F2730]" />

      {/* Organizer */}
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          {organizerLogo && <AvatarImage src={organizerLogo} alt={organizerName} />}
          <AvatarFallback className="bg-[#1F2730] text-[#8B98A5] text-xs">
            {organizerName[0]}
          </AvatarFallback>
        </Avatar>
        <div className="text-sm">
          <p className="text-[#8B98A5] text-xs">Arrangert av</p>
          {organizerLink ? (
            <Link to={organizerLink} className="text-[#E6EDF3] hover:text-amber-500 transition-colors">
              {organizerName}
            </Link>
          ) : (
            <span className="text-[#E6EDF3]">{organizerName}</span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#1F2730]" />

      {/* CTA */}
      <EventHeroCTA eventId={eventId} />

      {/* External registration */}
      {registrationUrl && (
        <a
          href={registrationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-amber-500 hover:text-amber-400 transition-colors"
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
          className="inline-flex items-center gap-1.5 text-sm text-[#8B98A5] hover:text-[#E6EDF3] transition-colors"
        >
          <Globe className="w-3.5 h-3.5" />
          Besøk nettside
        </a>
      )}
    </div>
  );
}
