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
import { MapPin, ArrowRight, Users, ExternalLink } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  meet: "Biltreff", show: "Show", market: "Delemarked", drive: "Kjøretur",
  club_night: "Klubbkveld", exhibition: "Utstilling", open_day: "Åpen dag", other: "Arrangement",
};

const serif = { fontFamily: "'DM Serif Display', 'Playfair Display', serif" };
const display = { fontFamily: "'DM Serif Display', serif" };
const body = { fontFamily: "'Source Sans 3', sans-serif" };

// Linen / woven texture as inline SVG data URI
const TEXTURE_BG = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

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

  // All images — full set for lightbox
  const images = [...(event.event_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const heroImage = images.length > 0 ? images[0].image_url : null;
  const allLightboxImages = images.map((img) => ({ url: img.image_url, alt: img.alt_text ?? undefined }));
  const extraImages = images.slice(1);

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
    <div className="min-h-screen text-neutral-900" style={{ ...body, backgroundColor: '#f6f4f0', backgroundImage: TEXTURE_BG }}>
      <Helmet>
        <title>{event.title} | Bilgarasje</title>
        <meta name="description" content={event.short_description || `${event.title} – ${event.location}`} />
      </Helmet>

      {/* ── HERO ── */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 pt-8 md:pt-14">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-6 md:gap-10 items-end">

          {/* Left: text */}
          <div className="space-y-4 pb-2 md:pb-6">
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

            {/* Date + time + place */}
            <div className="pt-2">
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

            {/* Attendees + CTA row */}
            <div className="flex items-center gap-4 pt-2 flex-wrap">
              <EventHeroCTA eventId={event.id} />
              <AttendeeCount eventId={event.id} maxAttendees={event.max_attendees} />
            </div>

            {/* External link */}
            {event.registration_url && (
              <a
                href={event.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[14px] text-neutral-500 hover:text-neutral-800 transition mt-1"
                style={body}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Mer info / kjøp billetter
              </a>
            )}
          </div>

          {/* Right: hero image — clickable, natural aspect */}
          {heroImage && (
            <button
              onClick={() => setLightboxIndex(0)}
              className="block w-full overflow-hidden cursor-pointer group"
            >
              <img
                src={getOptimizedImageUrl(heroImage, { width: 1200, quality: 85 })}
                srcSet={`${getOptimizedImageUrl(heroImage, { width: 800, quality: 85 })} 800w, ${getOptimizedImageUrl(heroImage, { width: 1200, quality: 85 })} 1200w, ${getOptimizedImageUrl(heroImage, { width: 1600, quality: 80 })} 1600w`}
                sizes="(max-width: 768px) 100vw, 55vw"
                alt=""
                loading="eager"
                fetchPriority="high"
                className="w-full h-auto object-contain group-hover:opacity-95 transition-opacity duration-300"
              />
            </button>
          )}
        </div>
      </div>

      <Line />

      {/* ── CONTENT — compact, single column ── */}
      <div className="max-w-3xl mx-auto px-6 sm:px-10 py-10 md:py-14 space-y-12">

        {event.description && (
          <section>
            <SectionLabel>Om arrangementet</SectionLabel>
            <div className="h-px bg-neutral-300/50 mb-6" />
            <p className="text-[19px] sm:text-[20px] text-neutral-600 leading-[1.85] whitespace-pre-wrap" style={body}>
              {event.description}
            </p>
          </section>
        )}

        {/* Inline image — full width, natural aspect, clickable */}
        {extraImages.length > 0 && (
          <button
            onClick={() => setLightboxIndex(1)}
            className="block w-full -mx-6 sm:-mx-10 md:-mx-16 cursor-pointer group"
            style={{ width: 'calc(100% + 3rem)' }}
          >
            <img
              src={getOptimizedImageUrl(extraImages[0].image_url, { width: 1400 })}
              alt={extraImages[0].alt_text ?? ""}
              className="w-full h-auto object-contain group-hover:opacity-95 transition-opacity duration-300"
            />
          </button>
        )}

        {event.program && (
          <section>
            <SectionLabel>Program</SectionLabel>
            <div className="h-px bg-neutral-300/50 mb-1" />
            {event.program.split("\n").filter(Boolean).map((line, i) => {
              const timeMatch = line.match(/^\d{1,2}[:.]\d{2}/);
              return (
                <div key={i} className="flex items-baseline gap-5 py-3 border-b border-neutral-200/50 last:border-0">
                  <span className="text-[26px] text-neutral-300 shrink-0 w-14 text-right italic" style={display}>
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

        {event.practical_info && (
          <section>
            <SectionLabel>Praktisk info</SectionLabel>
            <div className="h-px bg-neutral-300/50 mb-6" />
            <p className="text-[19px] sm:text-[20px] text-neutral-600 leading-[1.85] whitespace-pre-wrap" style={body}>
              {event.practical_info}
            </p>
          </section>
        )}

        {/* More images — natural aspect, clickable */}
        {extraImages.length > 1 && (
          <section>
            <SectionLabel>Bilder</SectionLabel>
            <div className="space-y-3">
              {extraImages.slice(1).map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setLightboxIndex(idx + 2)}
                  className="block w-full overflow-hidden cursor-pointer group"
                >
                  <img
                    src={getOptimizedImageUrl(img.image_url, { width: 1200 })}
                    alt={img.alt_text ?? ""}
                    className="w-full h-auto object-contain group-hover:opacity-95 transition-opacity duration-300"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Organizer */}
        {organizerName && (
          <section>
            <SectionLabel>Arrangør</SectionLabel>
            <div className="h-px bg-neutral-300/50 mb-5" />
            <div className="flex items-center gap-4">
              {organizerLogo && (
                <img src={organizerLogo} alt="" className="w-11 h-11 rounded-full object-cover" />
              )}
              <div>
                {organizerLink ? (
                  <Link to={organizerLink} className="text-[16px] text-neutral-800 hover:text-neutral-900 transition" style={body}>
                    {organizerName}
                  </Link>
                ) : (
                  <span className="text-[16px] text-neutral-800" style={body}>{organizerName}</span>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* ── BOTTOM CTA ── */}
      <Line />
      <div className="max-w-3xl mx-auto px-6 sm:px-10 py-14 md:py-20 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 mb-4" style={body}>
          {dayNum}. {monthStr} {yearStr} · {event.location}
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-[3.6rem] leading-[1.1] mb-8 italic" style={serif}>
          Vi sees der.
        </h2>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <EventHeroCTA eventId={event.id} />
          {event.registration_url && (
            <a
              href={event.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[14px] text-neutral-400 hover:text-neutral-700 transition"
              style={body}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Mer info / kjøp billetter
            </a>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <ImageLightbox
        images={allLightboxImages}
        initialIndex={lightboxIndex ?? 0}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
      />

      {/* ── MOBILE DETAILS ── */}
      <div className="md:hidden">
        <Line />
        <div className="px-6 py-6 space-y-3">
          <SectionLabel>Detaljer</SectionLabel>
          <div className="border-t border-neutral-300/50 pt-1 space-y-0">
            <MobileRow label="Dato" value={`${dayNum}. ${monthStr} ${yearStr}`} />
            <MobileRow label="Tid" value={`${timeStr}${endTimeStr ? ` – ${endTimeStr}` : ""}`} />
            <MobileRow label="Sted" value={event.location} />
            <MobileAttendees eventId={event.id} maxAttendees={event.max_attendees} />
          </div>
          <div className="pt-1">
            <EventHeroCTA eventId={event.id} />
          </div>
          {event.registration_url && (
            <a
              href={event.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[14px] text-neutral-500 hover:text-neutral-800 transition"
              style={body}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Mer info / kjøp billetter
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */

function Line() {
  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 py-1">
      <div className="h-px bg-neutral-300/40" />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-3" style={body}>
      {children}
    </p>
  );
}

function AttendeeCount({ eventId, maxAttendees }: { eventId: string; maxAttendees?: number | null }) {
  const { data: count } = useEventAttendeeCount(eventId);
  if (!count && count !== 0) return null;
  return (
    <span className="flex items-center gap-1.5 text-[13px] text-neutral-400" style={body}>
      <Users className="w-3.5 h-3.5" />
      {count} påmeldt{maxAttendees ? ` av ${maxAttendees}` : ""}
    </span>
  );
}

function MobileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline py-2.5 border-b border-neutral-200/50">
      <span className="text-[13px] text-neutral-400" style={body}>{label}</span>
      <span className="text-[15px] text-neutral-700" style={body}>{value}</span>
    </div>
  );
}

function MobileAttendees({ eventId, maxAttendees }: { eventId: string; maxAttendees?: number | null }) {
  const { data: count } = useEventAttendeeCount(eventId);
  return (
    <div className="flex justify-between items-baseline py-2.5 border-b border-neutral-200/50">
      <span className="text-[13px] text-neutral-400" style={body}>Påmeldt</span>
      <span className="text-[15px] text-neutral-700" style={body}>
        {count ?? 0}{maxAttendees ? ` / ${maxAttendees}` : ""}
      </span>
    </div>
  );
}
