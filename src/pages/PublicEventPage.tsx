import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { usePublicEventBySlug } from "@/hooks/useEventBySlug";
import { useEventAttendeeCount } from "@/hooks/useEventAttendees";
import { format, differenceInDays, isPast } from "date-fns";
import { nb } from "date-fns/locale";
import { useState } from "react";
import { EventHeroCTA } from "@/components/events/public/EventHeroCTA";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { getOptimizedImageUrl } from "@/lib/imageUtils";
import { MapPin, ArrowRight } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  meet: "Biltreff", show: "Show", market: "Delemarked", drive: "Kjøretur",
  club_night: "Klubbkveld", exhibition: "Utstilling", open_day: "Åpen dag", other: "Arrangement",
};

// Font shortcuts — rounder, warmer feel
const serif = { fontFamily: "'DM Serif Display', 'Playfair Display', serif" };
const display = { fontFamily: "'DM Serif Display', serif" };
const body = { fontFamily: "'Source Sans 3', sans-serif" };

export default function PublicEventPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading } = usePublicEventBySlug(slug);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (isLoading)
    return (
      <div className="min-h-screen bg-[#f6f4f0] flex items-center justify-center">
        <div className="w-6 h-6 border border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
      </div>
    );

  if (!event)
    return (
      <div className="min-h-screen bg-[#f6f4f0] flex flex-col items-center justify-center gap-3">
        <p className="text-5xl text-neutral-900" style={display}>404</p>
        <p className="text-neutral-400 text-sm" style={body}>Arrangementet finnes ikke.</p>
      </div>
    );

  const images = [...(event.event_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const heroImage = images.length > 0 ? images[0].image_url : null;
  const galleryImages = images.slice(1);
  const lightboxImages = galleryImages.map((img) => ({ url: img.image_url, alt: img.alt_text ?? undefined }));

  const startDate = new Date(event.starts_at);
  const endDate = event.ends_at ? new Date(event.ends_at) : null;
  const dayNum = format(startDate, "d");
  const monthStr = format(startDate, "MMMM", { locale: nb });
  const yearStr = format(startDate, "yyyy");
  const dayName = format(startDate, "EEEE", { locale: nb });
  const timeStr = format(startDate, "HH:mm");
  const endTimeStr = endDate ? format(endDate, "HH:mm") : null;
  const daysUntil = differenceInDays(startDate, new Date());
  const eventPassed = isPast(startDate);

  const organizerName = event.owner_page?.title || event.owner_profile?.display_name || null;
  const organizerLogo = event.owner_page?.logo_url || event.owner_profile?.avatar_url;
  const organizerLink = event.owner_page ? `/s/${event.owner_page.slug}` : null;

  return (
    <div className="min-h-screen bg-[#f6f4f0] text-neutral-900" style={body}>
      <Helmet>
        <title>{event.title} | Bilgarasje</title>
        <meta name="description" content={event.short_description || `${event.title} – ${event.location}`} />
      </Helmet>

      {/* ── HERO ── */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 pt-12 md:pt-20 pb-0">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.3fr] gap-8 md:gap-14 items-end">

          {/* Left: text */}
          <div className="space-y-5 pb-4 md:pb-8">
            {/* Overline */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-[0.25em] text-neutral-400" style={body}>
                {TYPE_LABELS[event.event_type] || event.event_type}
              </span>
              {event.status === "cancelled" && (
                <span className="text-[10px] uppercase tracking-[0.25em] text-red-500">Avlyst</span>
              )}
              {!eventPassed && daysUntil >= 0 && (
                <span className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">
                  · {daysUntil === 0 ? "I dag" : daysUntil === 1 ? "I morgen" : `Om ${daysUntil} dager`}
                </span>
              )}
            </div>

            {/* Title */}
            <h1
              className="text-[2.6rem] sm:text-[3.4rem] md:text-[4.2rem] leading-[1.08] tracking-[-0.02em]"
              style={serif}
            >
              {event.title}
            </h1>

            {event.short_description && (
              <p className="text-[19px] sm:text-[21px] text-neutral-500 leading-[1.6] max-w-md" style={body}>
                {event.short_description}
              </p>
            )}

            {/* Date + time + place — stacked, quiet */}
            <div className="pt-3 space-y-2.5">
              <div className="flex items-baseline gap-3">
                <span className="text-[3.5rem] md:text-[4.5rem] leading-none italic" style={display}>
                  {dayNum}
                </span>
                <div className="space-y-0.5">
                  <span className="block text-[16px] text-neutral-600 capitalize" style={body}>{monthStr} {yearStr}</span>
                  <span className="block text-[14px] text-neutral-400 capitalize" style={body}>{dayName}</span>
                </div>
                <div className="ml-5 pl-5 border-l border-neutral-300/70 space-y-0.5">
                  <span className="block text-[24px] leading-tight italic" style={display}>
                    {timeStr}{endTimeStr ? ` – ${endTimeStr}` : ""}
                  </span>
                  <span className="flex items-center gap-1.5 text-[14px] text-neutral-500" style={body}>
                    <MapPin className="w-3 h-3 text-neutral-400" />
                    {event.location}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <EventHeroCTA eventId={event.id} />
            </div>
          </div>

          {/* Right: image */}
          <div className="relative aspect-[16/10] overflow-hidden">
            {heroImage ? (
              <img
                src={getOptimizedImageUrl(heroImage, { width: 1200, quality: 85 })}
                srcSet={`${getOptimizedImageUrl(heroImage, { width: 800, quality: 85 })} 800w, ${getOptimizedImageUrl(heroImage, { width: 1200, quality: 85 })} 1200w, ${getOptimizedImageUrl(heroImage, { width: 1600, quality: 80 })} 1600w`}
                sizes="(max-width: 768px) 100vw, 55vw"
                alt=""
                loading="eager"
                fetchPriority="high"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-neutral-200" />
            )}
          </div>
        </div>
      </div>

      {/* ── LINE ── */}
      <Line />

      {/* ── SINGLE COLUMN CONTENT ── */}
      <div className="max-w-3xl mx-auto px-6 sm:px-10 py-14 md:py-20 space-y-20">

        {/* Description */}
        {event.description && (
          <section>
            <SectionLabel>Om arrangementet</SectionLabel>
            <div className="h-px bg-neutral-300/60 mb-8" />
            <p className="text-[19px] sm:text-[20px] text-neutral-600 leading-[1.9] whitespace-pre-wrap" style={body}>
              {event.description}
            </p>
          </section>
        )}

        {/* Editorial image break */}
        {galleryImages.length > 0 && (
          <div
            className="-mx-6 sm:-mx-10 md:-mx-20 overflow-hidden cursor-pointer"
            onClick={() => setLightboxIndex(0)}
          >
            <img
              src={getOptimizedImageUrl(galleryImages[0].image_url, { width: 1400 })}
              alt={galleryImages[0].alt_text ?? ""}
              className="w-full aspect-[2.2/1] object-cover hover:scale-[1.005] transition-transform duration-1000"
            />
          </div>
        )}

        {/* Program */}
        {event.program && (
          <section>
            <SectionLabel>Program</SectionLabel>
            <div className="h-px bg-neutral-300/60 mb-2" />
            {event.program.split("\n").filter(Boolean).map((line, i) => {
              const timeMatch = line.match(/^\d{1,2}[:.]\d{2}/);
              return (
                <div
                  key={i}
                  className="flex items-baseline gap-6 py-4 border-b border-neutral-200/60 last:border-0"
                >
                  <span className="text-[28px] text-neutral-300 shrink-0 w-16 text-right italic" style={display}>
                    {timeMatch?.[0] || ""}
                  </span>
                  <span className="text-[17px] text-neutral-600 leading-relaxed" style={body}>
                    {line.replace(/^\d{1,2}[:.]\d{2}\s*[-–—]?\s*/, "")}
                  </span>
                </div>
              );
            })}
          </section>
        )}

        {/* Second editorial image */}
        {galleryImages.length > 1 && (
          <div
            className="-mx-6 sm:-mx-10 md:-mx-20 overflow-hidden cursor-pointer"
            onClick={() => setLightboxIndex(1)}
          >
            <img
              src={getOptimizedImageUrl(galleryImages[1].image_url, { width: 1400 })}
              alt={galleryImages[1].alt_text ?? ""}
              className="w-full aspect-[2.2/1] object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Practical info */}
        {event.practical_info && (
          <section>
            <SectionLabel>Praktisk info</SectionLabel>
            <div className="h-px bg-neutral-300/60 mb-8" />
            <p className="text-[17px] sm:text-[18px] text-neutral-600 leading-[1.95] whitespace-pre-wrap" style={body}>
              {event.practical_info}
            </p>
          </section>
        )}

        {/* Organizer */}
        {organizerName && (
          <section>
            <SectionLabel>Arrangør</SectionLabel>
            <div className="h-px bg-neutral-300/60 mb-6" />
            <div className="flex items-center gap-4">
              {organizerLogo && (
                <img src={organizerLogo} alt="" className="w-12 h-12 rounded-full object-cover" />
              )}
              <div>
                {organizerLink ? (
                  <Link to={organizerLink} className="text-[16px] text-neutral-800 hover:text-neutral-900 transition" style={body}>
                    {organizerName}
                  </Link>
                ) : (
                  <span className="text-[16px] text-neutral-800" style={body}>{organizerName}</span>
                )}
                {event.owner_page?.website && (
                  <a
                    href={event.owner_page.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[13px] text-neutral-400 hover:text-neutral-600 transition mt-0.5"
                    style={body}
                  >
                    Nettside →
                  </a>
                )}
              </div>
            </div>
            {event.registration_url && (
              <a
                href={event.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[13px] text-neutral-400 hover:text-neutral-600 transition mt-5"
                style={body}
              >
                Ekstern påmelding <ArrowRight className="w-3 h-3" />
              </a>
            )}
          </section>
        )}
      </div>

      {/* ── MORE IMAGES (editorial, not grid) ── */}
      {galleryImages.length > 2 && (
        <>
          <Line />
          <div className="max-w-6xl mx-auto px-6 sm:px-10 py-14 md:py-20">
            <SectionLabel>Bilder</SectionLabel>
            <div className="space-y-4 mt-6">
              {galleryImages.slice(2).map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setLightboxIndex(idx + 2)}
                  className="block w-full overflow-hidden cursor-pointer group"
                >
                  <img
                    src={getOptimizedImageUrl(img.image_url, { width: 1200 })}
                    alt={img.alt_text ?? ""}
                    className="w-full aspect-[2.2/1] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
          <ImageLightbox
            images={lightboxImages}
            initialIndex={lightboxIndex ?? 0}
            isOpen={lightboxIndex !== null}
            onClose={() => setLightboxIndex(null)}
          />
        </>
      )}

      {/* ── BOTTOM ── */}
      <Line />
      <div className="max-w-3xl mx-auto px-6 sm:px-10 py-20 md:py-28 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 mb-5" style={body}>
          {dayNum}. {monthStr} {yearStr} · {event.location}
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-[3.2rem] leading-[1.1] mb-10" style={serif}>
          Vi sees der.
        </h2>
        <EventHeroCTA eventId={event.id} />
      </div>

      {/* ── MOBILE DETAILS ── */}
      <div className="md:hidden">
        <Line />
        <div className="px-6 py-8 space-y-4">
          <SectionLabel>Detaljer</SectionLabel>
          <div className="border-t border-neutral-300/60 pt-2 space-y-0">
            <MobileRow label="Dato" value={`${dayNum}. ${monthStr} ${yearStr}`} />
            <MobileRow label="Tid" value={`${timeStr}${endTimeStr ? ` – ${endTimeStr}` : ""}`} />
            <MobileRow label="Sted" value={event.location} />
            <MobileAttendees eventId={event.id} maxAttendees={event.max_attendees} />
          </div>
          <div className="pt-2">
            <EventHeroCTA eventId={event.id} />
          </div>
          {organizerName && (
            <div className="pt-4 border-t border-neutral-200/60 flex items-center gap-3">
              {organizerLogo && (
                <img src={organizerLogo} alt="" className="w-8 h-8 rounded-full object-cover" />
              )}
              {organizerLink ? (
                <Link to={organizerLink} className="text-sm text-neutral-600 hover:text-neutral-900 transition" style={body}>
                  {organizerName}
                </Link>
              ) : (
                <span className="text-sm text-neutral-600" style={body}>{organizerName}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Tiny helpers ─── */

function Line() {
  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10">
      <div className="h-px bg-neutral-300/50" />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-4" style={body}>
      {children}
    </p>
  );
}

function MobileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline py-3 border-b border-neutral-200/60">
      <span className="text-[13px] text-neutral-400" style={body}>{label}</span>
      <span className="text-[15px] text-neutral-700" style={body}>{value}</span>
    </div>
  );
}

function MobileAttendees({ eventId, maxAttendees }: { eventId: string; maxAttendees?: number | null }) {
  const { data: count } = useEventAttendeeCount(eventId);
  return (
    <div className="flex justify-between items-baseline py-3 border-b border-neutral-200/60">
      <span className="text-[13px] text-neutral-400" style={body}>Påmeldt</span>
      <span className="text-[15px] text-neutral-700" style={body}>
        {count ?? 0}{maxAttendees ? ` / ${maxAttendees}` : ""}
      </span>
    </div>
  );
}
