import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { EventTypeBadge } from "./EventTypeBadge";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Calendar, MapPin, Pencil } from "lucide-react";

const statusLabel: Record<string, string> = {
  draft: "Utkast",
  published: "Publisert",
  cancelled: "Avlyst",
  archived: "Arkivert",
};

const statusColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  archived: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

interface EventCardProps {
  event: {
    id: string;
    title: string;
    slug: string;
    event_type: string;
    location: string;
    starts_at: string;
    ends_at?: string | null;
    status: string;
    short_description?: string | null;
  };
}

export function EventCard({ event }: EventCardProps) {
  return (
    <div className="border-2 border-foreground/15 bg-card/90 backdrop-blur-sm group hover:border-foreground/25 transition-all p-5">
      <div className="flex items-start gap-4">
        {/* Date badge */}
        <div className="flex-shrink-0 w-14 h-14 border-2 border-foreground/15 flex flex-col items-center justify-center text-center">
          <span className="text-xs uppercase font-display tracking-wider text-muted-foreground">
            {format(new Date(event.starts_at), "MMM", { locale: nb })}
          </span>
          <span className="text-lg font-display font-bold leading-none">
            {format(new Date(event.starts_at), "d")}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <EventTypeBadge type={event.event_type} />
            <Badge variant="secondary" className={statusColor[event.status] || ""}>
              {statusLabel[event.status] || event.status}
            </Badge>
          </div>

          <h3 className="font-display text-lg uppercase tracking-wider group-hover:text-primary transition-colors truncate">
            {event.title}
          </h3>

          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(event.starts_at), "d. MMM yyyy 'kl.' HH:mm", { locale: nb })}
            </span>
            {event.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {event.location}
              </span>
            )}
          </div>

          {event.short_description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {event.short_description}
            </p>
          )}
        </div>

        {/* Edit link */}
        <Link
          to={`/dashboard/events/${event.id}`}
          className="flex-shrink-0 p-2 border border-foreground/15 hover:bg-foreground/5 transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
