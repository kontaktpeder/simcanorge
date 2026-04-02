import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { usePublicEventBySlug } from "@/hooks/useEventBySlug";
import { EventAttendButton } from "@/components/events/EventAttendButton";
import { EventTypeBadge } from "@/components/events/EventTypeBadge";
import { Layout } from "@/components/layout/Layout";
import { format, isSameDay } from "date-fns";
import { nb } from "date-fns/locale";
import { Calendar, MapPin, Users, ExternalLink, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function PublicEventPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading } = usePublicEventBySlug(slug);

  if (isLoading)
    return (
      <Layout>
        <div className="container py-20 text-center text-muted-foreground">
          Laster arrangement…
        </div>
      </Layout>
    );

  if (!event)
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-display text-2xl uppercase tracking-wider mb-2">
            Arrangement ikke funnet
          </h1>
          <p className="text-muted-foreground">
            Det finnes ingen publisert arrangement med denne adressen.
          </p>
        </div>
      </Layout>
    );

  const images = [...(event.event_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const heroImage = images.length > 0 ? images[0].image_url : null;
  const ownerPage = event.owner_page;
  const ownerProfile = event.owner_profile;

  const startDate = new Date(event.starts_at);
  const endDate = event.ends_at ? new Date(event.ends_at) : null;

  const dateDisplay = (() => {
    const start = format(startDate, "EEEE d. MMMM yyyy 'kl.' HH:mm", { locale: nb });
    if (!endDate) return start;
    if (isSameDay(startDate, endDate)) {
      return `${start} – ${format(endDate, "HH:mm")}`;
    }
    return `${start} – ${format(endDate, "EEEE d. MMMM yyyy 'kl.' HH:mm", { locale: nb })}`;
  })();

  return (
    <Layout>
      <Helmet>
        <title>{event.title} | Bilgarasje</title>
        <meta
          name="description"
          content={event.short_description || `${event.title} – ${event.location}`}
        />
      </Helmet>

      {/* Hero image or colored fallback */}
      {heroImage ? (
        <div className="w-full h-64 sm:h-80 md:h-96 overflow-hidden bg-muted">
          <img
            src={heroImage}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-40 sm:h-52 bg-gradient-to-br from-primary/20 to-primary/5" />
      )}

      <div className="container max-w-6xl py-8">
        {/* Title section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <EventTypeBadge type={event.event_type} />
            {event.status === "cancelled" && (
              <span className="text-sm font-medium text-destructive">Avlyst</span>
            )}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wider">
            {event.title}
          </h1>
          {event.short_description && (
            <p className="text-lg text-muted-foreground mt-3">
              {event.short_description}
            </p>
          )}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left column – content */}
          <div className="md:col-span-2 space-y-8">
            {event.description && (
              <div>
                <h2 className="font-display text-xl uppercase tracking-wider mb-3">
                  Om arrangementet
                </h2>
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {event.description}
                </div>
              </div>
            )}

            {event.program && (
              <div>
                <h2 className="font-display text-xl uppercase tracking-wider mb-3">
                  Program
                </h2>
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {event.program}
                </div>
              </div>
            )}

            {event.practical_info && (
              <div>
                <h2 className="font-display text-xl uppercase tracking-wider mb-3">
                  Praktisk informasjon
                </h2>
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {event.practical_info}
                </div>
              </div>
            )}

            {/* Gallery */}
            {images.length > 1 && (
              <div>
                <h2 className="font-display text-xl uppercase tracking-wider mb-3">
                  Bilder
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {images.slice(1).map((img) => (
                    <div
                      key={img.id}
                      className="aspect-square overflow-hidden rounded bg-muted"
                    >
                      <img
                        src={img.image_url}
                        alt={img.alt_text || event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Organizer card */}
            {ownerPage && (
              <div className="border-2 border-foreground/10 p-5">
                <h3 className="font-display text-sm uppercase tracking-wider text-muted-foreground mb-3">
                  Arrangør
                </h3>
                <div className="flex items-center gap-3">
                  {ownerPage.logo_url && (
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={ownerPage.logo_url} alt={ownerPage.title} />
                      <AvatarFallback>{ownerPage.title?.[0]}</AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <Link
                      to={`/s/${ownerPage.slug}`}
                      className="font-display text-lg uppercase tracking-wider hover:text-primary transition-colors"
                    >
                      {ownerPage.title}
                    </Link>
                    {ownerPage.tagline && (
                      <p className="text-sm text-muted-foreground">{ownerPage.tagline}</p>
                    )}
                  </div>
                </div>
                {ownerPage.website && (
                  <a
                    href={ownerPage.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary mt-3 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Besøk nettside
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Right column – sticky info card */}
          <div className="md:col-span-1 md:sticky md:top-8 md:self-start">
            <div className="border-2 border-foreground/15 bg-card p-6 space-y-5">
              {/* Date */}
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium capitalize">{dateDisplay}</p>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">{event.location}</span>
              </div>

              {/* Max attendees */}
              {event.max_attendees && (
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Maks {event.max_attendees} deltakere</span>
                </div>
              )}

              {/* Organizer name */}
              <div className="text-sm text-muted-foreground">
                Arrangert av{" "}
                <span className="font-medium text-foreground">
                  {ownerPage?.title || ownerProfile?.display_name || "Ukjent"}
                </span>
              </div>

              <div className="border-t border-foreground/10 pt-4">
                <EventAttendButton eventId={event.id} />
              </div>

              {event.registration_url && (
                <Button asChild variant="outline" className="w-full">
                  <a href={event.registration_url} target="_blank" rel="noopener noreferrer">
                    Påmelding <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
