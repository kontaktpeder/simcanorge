import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { usePublicEventBySlug } from "@/hooks/useEventBySlug";
import { Layout } from "@/components/layout/Layout";
import { EventHero } from "@/components/events/public/EventHero";
import { EventStickyBar } from "@/components/events/public/EventStickyBar";
import { EventContent } from "@/components/events/public/EventContent";
import { EventGallery } from "@/components/events/public/EventGallery";
import { EventSidebar } from "@/components/events/public/EventSidebar";

export default function PublicEventPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading } = usePublicEventBySlug(slug);

  if (isLoading)
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Laster arrangement…</p>
        </div>
      </Layout>
    );

  if (!event)
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-2">
          <h1 className="text-xl font-bold text-foreground">Arrangement ikke funnet</h1>
          <p className="text-sm text-muted-foreground">
            Det finnes ingen publisert arrangement med denne adressen.
          </p>
        </div>
      </Layout>
    );

  const images = [...(event.event_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const heroImage = images.length > 0 ? images[0].image_url : null;
  const galleryImages = images.slice(1);

  return (
    <Layout>
      <Helmet>
        <title>{event.title} | Bilgarasje</title>
        <meta
          name="description"
          content={event.short_description || `${event.title} – ${event.location}`}
        />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-8">
        {/* Hero */}
        <EventHero
          title={event.title}
          shortDescription={event.short_description}
          eventType={event.event_type}
          status={event.status}
          startsAt={event.starts_at}
          endsAt={event.ends_at}
          location={event.location}
          heroImage={heroImage}
          eventId={event.id}
        />

        {/* Meta bar */}
        <EventStickyBar
          startsAt={event.starts_at}
          location={event.location}
          eventId={event.id}
        />

        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          <div className="md:col-span-2 space-y-10">
            <EventContent
              description={event.description}
              program={event.program}
              practicalInfo={event.practical_info}
            />

            {galleryImages.length > 0 && (
              <EventGallery images={galleryImages} />
            )}
          </div>

          <div className="md:col-span-1">
            <div className="md:sticky md:top-24">
              <EventSidebar
                startsAt={event.starts_at}
                endsAt={event.ends_at}
                location={event.location}
                maxAttendees={event.max_attendees}
                registrationUrl={event.registration_url}
                ownerPage={event.owner_page}
                ownerProfile={event.owner_profile}
                eventId={event.id}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
