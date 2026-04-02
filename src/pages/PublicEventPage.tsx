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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
      </div>
    );

  if (!event)
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-3">
        <h1 className="text-2xl font-bold text-white">Fant ikke arrangementet</h1>
        <p className="text-white/40">Denne lenken er ugyldig eller arrangementet er fjernet.</p>
      </div>
    );

  const images = [...(event.event_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const heroImage = images.length > 0 ? images[0].image_url : null;
  const galleryImages = images.slice(1);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Helmet>
        <title>{event.title} | Bilgarasje</title>
        <meta
          name="description"
          content={event.short_description || `${event.title} – ${event.location}`}
        />
      </Helmet>

      <div className="max-w-[980px] mx-auto px-4 sm:px-6 pt-8 pb-20 space-y-6">
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

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8">
          <div className="space-y-8">
            <EventContent
              description={event.description}
              program={event.program}
              practicalInfo={event.practical_info}
            />
            {galleryImages.length > 0 && <EventGallery images={galleryImages} />}
          </div>

          <div>
            <div className="md:sticky md:top-8">
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
