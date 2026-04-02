import { Link } from "react-router-dom";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { MapPin } from "lucide-react";
import { usePageEvents } from "@/hooks/usePageEvents";
import { EventTypeBadge } from "@/components/events/EventTypeBadge";

export function PublicPageEvents({ pageId }: { pageId: string }) {
  const { data: events, isLoading } = usePageEvents(pageId);

  if (isLoading || !events || events.length === 0) return null;

  return (
    <div>
      <h2
        className="text-[1.4rem] md:text-[1.6rem] uppercase text-white font-bold leading-[1] tracking-[0.06em] mb-5"
        style={{ fontFamily: "'Oswald', 'Impact', sans-serif" }}
      >
        Arrangementer
      </h2>
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
              className="flex items-center gap-4 py-3 border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors group -mx-2 px-2 rounded"
            >
              {/* Date */}
              <div className="flex-shrink-0 text-center w-12">
                <div className="text-[10px] uppercase tracking-wider text-white/30">
                  {format(startDate, "MMM", { locale: nb })}
                </div>
                <div className="text-xl font-bold leading-tight text-[hsl(var(--page-accent))]">
                  {format(startDate, "d")}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="mb-0.5">
                  <EventTypeBadge type={event.event_type} />
                </div>
                <p className="font-medium text-sm truncate text-white/80 group-hover:text-[hsl(var(--page-accent))] transition-colors">
                  {event.title}
                </p>
                <p className="text-xs text-white/35 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {event.location}
                </p>
              </div>

              {/* Thumbnail */}
              {heroImage && (
                <div className="hidden sm:block flex-shrink-0 w-16 h-12 rounded overflow-hidden">
                  <img src={heroImage} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
