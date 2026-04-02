import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { usePublicEventBySlug } from "@/hooks/useEventBySlug";
import { EventHero } from "@/components/events/public/EventHero";
import { EventStickyBar } from "@/components/events/public/EventStickyBar";
import { EventContent } from "@/components/events/public/EventContent";
import { EventSidebar } from "@/components/events/public/EventSidebar";

export default function PublicEventPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading } = usePublicEventBySlug(slug);

  if (isLoading)
    return (
      <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center">
        <p className="text-[#8B98A5] text-sm">Laster arrangement…</p>
      </div>
    );

  if (!event)
    return (
      <div className="min-h-screen bg-[#0B0F14] flex flex-col items-center justify-center gap-2">
        <h1 className="text-xl font-semibold text-[#E6EDF3]">Arrangement ikke funnet</h1>
        <p className="text-sm text-[#8B98A5]">
          Det finnes ingen publisert arrangement med denne adressen.
        </p>
      </div>
    );

  const images = [...(event.event_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const heroImage = images.length > 0 ? images[0].image_url : null;

  return (
    <div className="min-h-screen bg-[#0B0F14]">
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Left – content */}
          <div className="md:col-span-2">
            <EventContent
              description={event.description}
              program={event.program}
              practicalInfo={event.practical_info}
            />
          </div>

          {/* Right – sidebar */}
          <div className="md:col-span-1">
            <div className="md:sticky md:top-16">
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
