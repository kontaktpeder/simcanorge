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
    <div className="rounded-2xl bg-card border border-border shadow-sm p-5 space-y-4">
      {/* Date */}
      <div className="flex items-start gap-3">
        <Calendar className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-card-foreground capitalize">{dateDisplay}</p>
          <p className="text-sm text-muted-foreground">kl. {timeDisplay}</p>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-start gap-3">
        <MapPin className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-sm font-medium text-card-foreground">{location}</p>
      </div>

      {/* Attendees */}
      <div className="flex items-start gap-3">
        <Users className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-sm font-medium text-card-foreground">
          {count ?? 0} deltar
          {maxAttendees && <span className="text-muted-foreground"> / {maxAttendees} plasser</span>}
        </p>
      </div>

      <div className="border-t border-border" />

      {/* Organizer */}
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          {organizerLogo && <AvatarImage src={organizerLogo} alt={organizerName} />}
          <AvatarFallback className="bg-secondary text-muted-foreground text-xs font-bold">
            {organizerName[0]}
          </AvatarFallback>
        </Avatar>
        <div className="text-sm">
          <p className="text-muted-foreground text-xs">Arrangert av</p>
          {organizerLink ? (
            <Link to={organizerLink} className="text-card-foreground font-medium hover:text-amber-600 transition-colors">
              {organizerName}
            </Link>
          ) : (
            <span className="text-card-foreground font-medium">{organizerName}</span>
          )}
        </div>
      </div>

      <div className="border-t border-border" />

      {/* CTA */}
      <EventHeroCTA eventId={eventId} />

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

      {ownerPage?.website && (
        <a
          href={ownerPage.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Globe className="w-3.5 h-3.5" />
          Besøk nettside
        </a>
      )}
    </div>
  );
}
