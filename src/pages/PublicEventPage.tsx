import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { usePublicEventBySlug } from "@/hooks/useEventBySlug";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { useState } from "react";
import { EventHeroCTA } from "@/components/events/public/EventHeroCTA";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { useEventAttendeeCount } from "@/hooks/useEventAttendees";
import { getOptimizedImageUrl } from "@/lib/imageUtils";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function PublicEventPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading } = usePublicEventBySlug(slug);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (isLoading)
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
      </div>
    );

  if (!event)
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-3">
        <p className="text-3xl font-bold text-white">Fant ikke arrangementet</p>
        <p className="text-white/30 text-sm">Denne lenken er ugyldig eller arrangementet er fjernet.</p>
      </div>
    );

  const images = [...(event.event_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const heroImage = images.length > 0 ? images[0].image_url : null;
  const galleryImages = images.slice(1);
  const lightboxImages = galleryImages.map((img) => ({ url: img.image_url, alt: img.alt_text ?? undefined }));

  const startDate = new Date(event.starts_at);
  const endDate = event.ends_at ? new Date(event.ends_at) : null;
  const dateStr = format(startDate, "d. MMMM yyyy", { locale: nb });
  const timeStr = format(startDate, "HH:mm");
  const endTimeStr = endDate ? format(endDate, "HH:mm") : null;

  const typeLabels: Record<string, string> = {
    meet: "Biltreff", show: "Show", market: "Delemarked", drive: "Kjøretur",
    club_night: "Klubbkveld", exhibition: "Utstilling", open_day: "Åpen dag", other: "Arrangement",
  };

  const organizerName = event.owner_page?.title || event.owner_profile?.display_name || null;
  const organizerLogo = event.owner_page?.logo_url || event.owner_profile?.avatar_url;
  const organizerLink = event.owner_page ? `/s/${event.owner_page.slug}` : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Helmet>
        <title>{event.title} | Bilgarasje</title>
        <meta name="description" content={event.short_description || `${event.title} – ${event.location}`} />
      </Helmet>

      <div className="max-w-[920px] mx-auto px-5 sm:px-8 pt-10 pb-24">

        {/* ── HERO IMAGE ── */}
        {heroImage && (
          <div className="relative w-full aspect-[2.2/1] rounded-3xl overflow-hidden mb-8">
            <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
          </div>
        )}

        {/* ── TITLE BLOCK ── */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-amber-400/80">
              {typeLabels[event.event_type] || event.event_type}
            </span>
            {event.status === "cancelled" && (
              <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-red-400">Avlyst</span>
            )}
          </div>

          <h1 className="text-[2.8rem] sm:text-[3.5rem] md:text-[4.2rem] font-black leading-[1.02] tracking-[-0.03em] text-white mb-5">
            {event.title}
          </h1>

          {event.short_description && (
            <p className="text-lg sm:text-xl text-white/40 leading-relaxed max-w-[640px] mb-6">
              {event.short_description}
            </p>
          )}

          {/* Meta line */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px] text-white/30 mb-8">
            <span>{dateStr}</span>
            <span>kl. {timeStr}{endTimeStr ? ` – ${endTimeStr}` : ""}</span>
            <span>{event.location}</span>
          </div>

          <EventHeroCTA eventId={event.id} />
        </div>

        {/* ── DIVIDER ── */}
        <div className="h-px bg-white/[0.06] mb-10" />

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-12 md:gap-16">

          {/* LEFT — CONTENT */}
          <div className="space-y-12">
            {event.description && (
              <div>
                <h2 className="text-sm font-semibold tracking-[0.12em] uppercase text-white/20 mb-4">Om arrangementet</h2>
                <div className="text-[16px] text-white/50 leading-[1.85] whitespace-pre-wrap">
                  {event.description}
                </div>
              </div>
            )}

            {event.program && (
              <div>
                <h2 className="text-sm font-semibold tracking-[0.12em] uppercase text-white/20 mb-4">Program</h2>
                <div className="text-[15px] text-white/45 leading-[2] whitespace-pre-wrap font-mono">
                  {event.program}
                </div>
              </div>
            )}

            {event.practical_info && (
              <div>
                <h2 className="text-sm font-semibold tracking-[0.12em] uppercase text-white/20 mb-4">Praktisk info</h2>
                <div className="text-[16px] text-white/50 leading-[1.85] whitespace-pre-wrap">
                  {event.practical_info}
                </div>
              </div>
            )}

            {/* GALLERY */}
            {galleryImages.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold tracking-[0.12em] uppercase text-white/20 mb-4">Bilder</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-2xl overflow-hidden">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setLightboxIndex(idx)}
                      className="relative aspect-square overflow-hidden group cursor-pointer bg-white/5"
                    >
                      <img
                        src={getOptimizedImageUrl(img.image_url, { width: 480 })}
                        alt={img.alt_text ?? ""}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
                <ImageLightbox
                  images={lightboxImages}
                  initialIndex={lightboxIndex ?? 0}
                  isOpen={lightboxIndex !== null}
                  onClose={() => setLightboxIndex(null)}
                />
              </div>
            )}
          </div>

          {/* RIGHT — SIDEBAR */}
          <div className="hidden md:block">
            <SideInfo
              dateStr={dateStr}
              timeStr={timeStr}
              endTimeStr={endTimeStr}
              location={event.location}
              maxAttendees={event.max_attendees}
              eventId={event.id}
              organizerName={organizerName}
              organizerLogo={organizerLogo}
              organizerLink={organizerLink}
              registrationUrl={event.registration_url}
            />
          </div>
        </div>

        {/* MOBILE SIDEBAR (stacked below) */}
        <div className="md:hidden mt-12">
          <SideInfo
            dateStr={dateStr}
            timeStr={timeStr}
            endTimeStr={endTimeStr}
            location={event.location}
            maxAttendees={event.max_attendees}
            eventId={event.id}
            organizerName={organizerName}
            organizerLogo={organizerLogo}
            organizerLink={organizerLink}
            registrationUrl={event.registration_url}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Sidebar (inline, no Card component) ── */
function SideInfo({
  dateStr, timeStr, endTimeStr, location, maxAttendees, eventId,
  organizerName, organizerLogo, organizerLink, registrationUrl,
}: {
  dateStr: string; timeStr: string; endTimeStr: string | null;
  location: string; maxAttendees?: number | null; eventId: string;
  organizerName: string | null; organizerLogo?: string | null;
  organizerLink: string | null; registrationUrl?: string | null;
}) {
  const { data: count } = useEventAttendeeCount(eventId);

  return (
    <div className="sticky top-8 space-y-5">
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
        <Row label="Dato" value={dateStr} />
        <Row label="Tid" value={`${timeStr}${endTimeStr ? ` – ${endTimeStr}` : ""}`} />
        <Row label="Sted" value={location} />
        <Row label="Påmeldt" value={`${count ?? 0}${maxAttendees ? ` / ${maxAttendees}` : ""}`} />

        <div className="pt-2">
          <EventHeroCTA eventId={eventId} />
        </div>

        {registrationUrl && (
          <a href={registrationUrl} target="_blank" rel="noopener noreferrer"
            className="block text-center text-sm text-white/25 hover:text-white/50 transition-colors pt-1">
            Ekstern påmelding →
          </a>
        )}
      </div>

      {organizerName && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-white/20 mb-3">Arrangør</p>
          <div className="flex items-center gap-3">
            {organizerLogo && (
              <Avatar className="h-9 w-9">
                <AvatarImage src={organizerLogo} alt={organizerName} />
                <AvatarFallback className="bg-white/10 text-white/40 text-xs">{organizerName[0]}</AvatarFallback>
              </Avatar>
            )}
            {organizerLink ? (
              <Link to={organizerLink} className="text-sm text-white/60 font-medium hover:text-white transition-colors">
                {organizerName}
              </Link>
            ) : (
              <span className="text-sm text-white/60 font-medium">{organizerName}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-xs text-white/20 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-white/60">{value}</span>
    </div>
  );
}
