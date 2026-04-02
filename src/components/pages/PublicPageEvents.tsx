import { Link } from "react-router-dom";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Calendar, MapPin } from "lucide-react";
import { usePageEvents } from "@/hooks/usePageEvents";
import { EventTypeBadge } from "@/components/events/EventTypeBadge";

export function PublicPageEvents({ pageId }: { pageId: string }) {
  const { data: events, isLoading } = usePageEvents(pageId);

  if (isLoading || !events || events.length === 0) return null;

  return (
    <section className="col-span-full mt-4">
      <h2 className="text-lg font-semibold mb-4">Kommende arrangement</h2>
      <div className="space-y-3">
        {events.map((event) => {
          const imgs = [...((event as any).event_images ?? [])].sort(
            (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
          );
          const heroImage = imgs[0]?.image_url ?? null;
          const startDate = new Date(event.starts_at);

          return (
            <Link
              key={event.id}
              to={`/e/${event.slug}`}
              className="flex items-center gap-4 p-3 rounded-lg border border-border/50 hover:border-border transition-colors group"
            >
              {/* Date badge */}
              <div className="flex-shrink-0 text-center w-12">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {format(startDate, "MMM", { locale: nb })}
                </div>
                <div className="text-xl font-bold leading-tight">
                  {format(startDate, "d")}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="mb-0.5">
                  <EventTypeBadge type={event.event_type} />
                </div>
                <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                  {event.title}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {event.location}
                </p>
              </div>

              {/* Thumbnail */}
              {heroImage && (
                <div className="hidden sm:block flex-shrink-0 w-20 h-14 rounded overflow-hidden">
                  <img src={heroImage} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {events.length === 6 && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Viser de 6 neste arrangementene
        </p>
      )}
    </section>
  );
}
