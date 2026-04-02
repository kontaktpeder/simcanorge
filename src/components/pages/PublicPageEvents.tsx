import { Link } from "react-router-dom";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { MapPin, ArrowRight } from "lucide-react";
import { usePageEvents } from "@/hooks/usePageEvents";
import { EventTypeBadge } from "@/components/events/EventTypeBadge";

export function PublicPageEvents({ pageId }: { pageId: string }) {
  const { data: events, isLoading } = usePageEvents(pageId);

  if (isLoading || !events || events.length === 0) return null;

  return (
    <div>
      <h2
        className="text-[1.3rem] md:text-[1.5rem] uppercase text-white font-bold leading-[1] tracking-[0.06em] mb-6"
        style={{ fontFamily: "'Oswald', 'Bebas Neue', sans-serif" }}
      >
        Arrangementer
      </h2>
      <div className="space-y-2">
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
              className="flex items-center gap-4 py-4 border-b border-white/[0.05] hover:bg-white/[0.02] transition-all duration-300 group -mx-3 px-3 rounded-lg"
            >
              {/* Date */}
              <div className="flex-shrink-0 text-center w-14">
                <div className="text-[10px] uppercase tracking-widest text-white/25 font-medium">
                  {format(startDate, "MMM", { locale: nb })}
                </div>
                <div
                  className="text-2xl font-bold leading-tight"
                  style={{ color: "hsl(var(--page-accent))" }}
                >
                  {format(startDate, "d")}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[15px] truncate text-white/85 group-hover:text-[hsl(var(--page-accent))] transition-colors duration-300">
                  {event.title}
                </p>
                <p className="text-xs text-white/30 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {event.location}
                </p>
              </div>

              {/* Thumbnail or arrow */}
              {heroImage ? (
                <div className="hidden sm:block flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden">
                  <img src={heroImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              ) : (
                <ArrowRight className="w-4 h-4 text-white/15 group-hover:text-[hsl(var(--page-accent))] transition-colors" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
