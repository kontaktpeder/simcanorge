import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { usePublicEventBySlug } from "@/hooks/useEventBySlug";
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
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-stone-400 text-sm">Laster arrangement…</p>
      </div>
    );

  if (!event)
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-2">
        <h1 className="text-xl font-bold text-stone-800">Arrangement ikke funnet</h1>
        <p className="text-sm text-stone-400">
          Det finnes ingen publisert arrangement med denne adressen.
        </p>
      </div>
    );

  const images = [...(event.event_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const heroImage = images.length > 0 ? images[0].image_url : null;
  const galleryImages = images.slice(1);

  return (
    <div className="min-h-screen bg-stone-50">
      <Helmet>
        <title>{event.title} | Bilgarasje</title>
        <meta
          name="description"
          content={event.short_description || `${event.title} – ${event.location}`}
        />
      </Helmet>

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

      {/* Sticky info bar */}
      <EventStickyBar
        startsAt={event.starts_at}
        location={event.location}
        eventId={event.id}
      />

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14">
          {/* Left – content */}
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

          {/* Right – sidebar */}
          <div className="md:col-span-1">
            <div className="md:sticky md:top-20">
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
    </div>
  );
}
