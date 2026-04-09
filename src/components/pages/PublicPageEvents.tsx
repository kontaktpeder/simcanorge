import { Link } from "react-router-dom";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { MapPin, ArrowRight } from "lucide-react";
import { usePageEvents } from "@/hooks/usePageEvents";
import { EventTypeBadge } from "@/components/events/EventTypeBadge";

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

export function PublicPageEvents({ pageId, light }: { pageId: string; light?: boolean }) {
  const { data: events, isLoading } = usePageEvents(pageId);

  if (isLoading || !events || events.length === 0) return null;

  const heading = light ? "text-[#3a2e24]" : "text-white";
  const dateAccent = light ? "text-[#c4962c]" : "color: hsl(var(--page-accent))";
  const dateMuted = light ? "text-[#3a2e24]/25" : "text-white/25";
  const titleColor = light ? "text-[#3a2e24]/85" : "text-white/85";
  const titleHover = light ? "group-hover:text-[#c4962c]" : "group-hover:text-[hsl(var(--page-accent))]";
  const locationColor = light ? "text-[#3a2e24]/30" : "text-white/30";
  const borderColor = light ? "border-[#3a2e24]/[0.08]" : "border-white/[0.05]";
  const hoverBg = light ? "hover:bg-[#3a2e24]/[0.03]" : "hover:bg-white/[0.02]";

  return (
    <div>
      <h2
        className={`text-[1.3rem] md:text-[1.5rem] uppercase font-bold leading-[1] tracking-[0.06em] mb-6 ${heading}`}
        style={light ? chakra : { fontFamily: "'Oswald', 'Bebas Neue', sans-serif" }}
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
              className={`flex items-center gap-4 py-4 border-b ${borderColor} ${hoverBg} transition-all duration-300 group -mx-3 px-3 rounded-lg`}
            >
              {/* Date */}
              <div className="flex-shrink-0 text-center w-14">
                <div className={`text-[10px] uppercase tracking-widest ${dateMuted} font-medium`}>
                  {format(startDate, "MMM", { locale: nb })}
                </div>
                <div
                  className="text-2xl font-bold leading-tight"
                  style={light ? { color: '#c4962c' } : { color: 'hsl(var(--page-accent))' }}
                >
                  {format(startDate, "d")}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-[15px] truncate ${titleColor} ${titleHover} transition-colors duration-300`}>
                  {event.title}
                </p>
                <p className={`text-xs ${locationColor} flex items-center gap-1 mt-0.5`}>
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
                <ArrowRight className={`w-4 h-4 ${light ? 'text-[#3a2e24]/15 group-hover:text-[#c4962c]' : 'text-white/15 group-hover:text-[hsl(var(--page-accent))]'} transition-colors`} />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
