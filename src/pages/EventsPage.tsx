import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useState } from "react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { MapPin, Calendar } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { EventTypeBadge } from "@/components/events/EventTypeBadge";
import { usePublicEvents } from "@/hooks/usePublicEvents";
import { CreateCTA } from "@/components/ui/CreateCTA";

const TYPE_FILTERS = [
  { value: "", label: "Alle" },
  { value: "meet", label: "Biltreff" },
  { value: "show", label: "Show" },
  { value: "market", label: "Delemarked" },
  { value: "drive", label: "Kjøretur" },
  { value: "club_night", label: "Klubbkveld" },
  { value: "exhibition", label: "Utstilling" },
  { value: "open_day", label: "Åpen dag" },
];

export default function EventsPage() {
  const [activeType, setActiveType] = useState("");
  const { data: events, isLoading } = usePublicEvents(
    activeType ? { type: activeType } : undefined
  );

  return (
    <Layout>
      <Helmet>
        <title>Arrangement | Bilgarasje</title>
        <meta name="description" content="Kommende biltreff, show og events i Norge" />
      </Helmet>

      <div className="container max-w-5xl py-8 space-y-8">
        <CreateCTA
          createUrl="/dashboard/events/ny"
          label="Opprett arrangement"
          description="Planlegger du et biltreff eller arrangement?"
          variant="strip"
        />
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wider">
            Arrangement
          </h1>
          <p className="text-muted-foreground">
            Kommende biltreff, show og events i Norge
          </p>
        </div>

        {/* Type filter */}
        <div className="flex flex-wrap justify-center gap-2">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveType(f.value)}
              className={`px-3 py-1.5 text-xs uppercase tracking-wider border transition-colors ${
                activeType === f.value
                  ? "bg-foreground text-background border-foreground"
                  : "border-foreground/20 text-muted-foreground hover:border-foreground/40"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <p className="text-center text-muted-foreground py-12">Laster…</p>
        )}

        {/* Empty */}
        {!isLoading && events?.length === 0 && (
          <div className="text-center py-16 space-y-2">
            <Calendar className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground">
              Ingen kommende arrangement funnet
            </p>
          </div>
        )}

        {/* Events grid */}
        {!isLoading && events && events.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const imgs = [...((event as any).event_images ?? [])].sort(
                (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
              );
              const heroImage = imgs[0]?.image_url ?? null;
              const startDate = new Date(event.starts_at);
              const ownerPage = (event as any).owner_page;

              return (
                <Link
                  key={event.id}
                  to={`/e/${event.slug}`}
                  className="group block border border-border/50 hover:border-border transition-all"
                >
                  {/* Image */}
                  <div className="aspect-[16/10] bg-muted overflow-hidden">
                    {heroImage ? (
                      <img src={heroImage} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-muted-foreground/30 text-sm">
                          {event.title}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-2">
                    <div>
                      <EventTypeBadge type={event.event_type} />
                    </div>

                    <h2 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                      {event.title}
                    </h2>

                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {format(startDate, "EEEE d. MMMM yyyy", { locale: nb })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {event.location}
                      </div>
                    </div>

                    {ownerPage && (
                      <p className="text-xs text-muted-foreground/70">
                        {ownerPage.title}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
