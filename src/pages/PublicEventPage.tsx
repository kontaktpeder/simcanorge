import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { usePublicEventBySlug } from "@/hooks/useEventBySlug";
import { EventAttendButton } from "@/components/events/EventAttendButton";
import { EventTypeBadge } from "@/components/events/EventTypeBadge";
import { Layout } from "@/components/layout/Layout";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Calendar, MapPin, Users, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const ev = event as any;
  const images = ev.event_images ?? [];
  const heroImage = images.length > 0 ? images[0].image_url : null;

  return (
    <Layout>
      <Helmet>
        <title>{ev.title} | Bilgarasje</title>
        <meta
          name="description"
          content={ev.short_description || `${ev.title} – ${ev.location}`}
        />
      </Helmet>

      {/* Hero image */}
      {heroImage && (
        <div className="w-full h-64 sm:h-80 md:h-96 overflow-hidden bg-muted">
          <img
            src={heroImage}
            alt={ev.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="container max-w-3xl py-8 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <EventTypeBadge type={ev.event_type} />
            {ev.status === "cancelled" && (
              <span className="text-sm font-medium text-destructive">Avlyst</span>
            )}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wider">
            {ev.title}
          </h1>

          {ev.short_description && (
            <p className="text-lg text-muted-foreground mt-3">
              {ev.short_description}
            </p>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-primary" />
            {format(new Date(ev.starts_at), "d. MMMM yyyy 'kl.' HH:mm", {
              locale: nb,
            })}
            {ev.ends_at &&
              ` – ${format(new Date(ev.ends_at), "d. MMMM yyyy 'kl.' HH:mm", {
                locale: nb,
              })}`}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary" />
            {ev.location}
          </span>
          {ev.max_attendees && (
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" />
              Maks {ev.max_attendees} deltakere
            </span>
          )}
        </div>

        {/* Attend */}
        <EventAttendButton eventId={ev.id} />

        {/* Registration */}
        {ev.registration_url && (
          <Button asChild variant="outline">
            <a href={ev.registration_url} target="_blank" rel="noopener noreferrer">
              Påmelding <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </a>
          </Button>
        )}

        {/* Description */}
        {ev.description && (
          <div>
            <h2 className="font-display text-xl uppercase tracking-wider mb-3">
              Om arrangementet
            </h2>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {ev.description}
            </div>
          </div>
        )}

        {/* Program */}
        {ev.program && (
          <div>
            <h2 className="font-display text-xl uppercase tracking-wider mb-3">
              Program
            </h2>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {ev.program}
            </div>
          </div>
        )}

        {/* Practical info */}
        {ev.practical_info && (
          <div>
            <h2 className="font-display text-xl uppercase tracking-wider mb-3">
              Praktisk informasjon
            </h2>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {ev.practical_info}
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
              {images.slice(1).map((img: any) => (
                <div
                  key={img.id}
                  className="aspect-square overflow-hidden rounded bg-muted"
                >
                  <img
                    src={img.image_url}
                    alt={img.alt_text || ev.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
