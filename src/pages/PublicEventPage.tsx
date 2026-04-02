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

export default function PublicEventPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading } = usePublicEventBySlug(slug);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (isLoading)
    return (
      <div className="min-h-screen bg-[#f5f3ef] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-700 rounded-full animate-spin" />
      </div>
    );

  if (!event)
    return (
      <div className="min-h-screen bg-[#f5f3ef] flex flex-col items-center justify-center gap-3">
        <p className="text-6xl text-neutral-900" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>404</p>
        <p className="text-neutral-400" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>Arrangementet finnes ikke.</p>
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

  // Font shortcuts
  const serif = { fontFamily: "'Playfair Display', serif" };
  const display = { fontFamily: "'Bebas Neue', sans-serif" };
  const body = { fontFamily: "'Source Sans 3', sans-serif" };

  return (
    <div className="min-h-screen bg-[#f5f3ef] text-neutral-900" style={body}>
      <Helmet>
        <title>{event.title} | Bilgarasje</title>
        <meta name="description" content={event.short_description || `${event.title} – ${event.location}`} />
      </Helmet>

      {/* ═══════════════════════════════════════
          HERO — text left, image right
         ═══════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 pt-10 md:pt-16 pb-0">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-8 md:gap-12 items-end">
          {/* Left: editorial text */}
          <div className="space-y-6 pb-6 md:pb-10">
            {/* Type + countdown */}
            <div className="flex items-center gap-4">
              <span
                className="text-[11px] uppercase tracking-[0.2em] text-neutral-500"
                style={body}
              >
                {TYPE_LABELS[event.event_type] || event.event_type}
              </span>
              {event.status === "cancelled" && (
                <span className="text-[11px] uppercase tracking-[0.2em] text-red-500">Avlyst</span>
              )}
              {!eventPassed && daysUntil >= 0 && (
                <span className="text-[11px] uppercase tracking-[0.2em] text-emerald-600">
                  {daysUntil === 0 ? "I dag" : daysUntil === 1 ? "I morgen" : `Om ${daysUntil} dager`}
                </span>
              )}
            </div>

            {/* Title — serif, editorial */}
            <h1
              className="text-[2.4rem] sm:text-[3rem] md:text-[3.6rem] leading-[1.05] tracking-[-0.01em] text-neutral-900"
              style={serif}
            >
              {event.title}
            </h1>

            {event.short_description && (
              <p className="text-lg sm:text-xl text-neutral-500 leading-relaxed max-w-lg" style={body}>
                {event.short_description}
              </p>
            )}

            {/* Date strip — Bebas Neue numbers */}
            <div className="flex items-baseline gap-3 pt-2">
              <span className="text-[3.5rem] md:text-[4.5rem] leading-none text-neutral-900" style={display}>
                {dayNum}
              </span>
              <div>
                <span className="block text-base text-neutral-600 capitalize" style={body}>{monthStr}</span>
                <span className="block text-sm text-neutral-400" style={body}>{yearStr}</span>
              </div>
              <div className="ml-6 pl-6 border-l border-neutral-300">
                <span className="block text-sm text-neutral-500 capitalize" style={body}>{dayName}</span>
                <span className="block text-lg text-neutral-700" style={display}>
                  {timeStr}{endTimeStr ? ` – ${endTimeStr}` : ""}
                </span>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-[15px] text-neutral-500" style={body}>
              <MapPin className="w-4 h-4 text-neutral-400" />
              {event.location}
            </div>

            <EventHeroCTA eventId={event.id} />
          </div>

          {/* Right: hero image */}
          <div className="relative aspect-[4/3] md:aspect-[3/4] lg:aspect-[4/3] overflow-hidden rounded-sm">
            {heroImage ? (
              <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-neutral-200" />
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          THIN LINE
         ═══════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-2">
        <div className="h-px bg-neutral-300" />
      </div>

      {/* ═══════════════════════════════════════
          INFO STRIP — flat, editorial
         ═══════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-5">
        <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
          <InfoBlock label="Dato" value={`${dayNum}. ${monthStr} ${yearStr}`} display={display} body={body} />
          <InfoBlock label="Tid" value={`${timeStr}${endTimeStr ? ` – ${endTimeStr}` : ""}`} display={display} body={body} />
          <InfoBlock label="Sted" value={event.location} display={display} body={body} />
          <AttendeeInfo eventId={event.id} maxAttendees={event.max_attendees} display={display} body={body} />

          {organizerName && (
            <div className="ml-auto flex items-center gap-3">
              {organizerLogo && (
                <img src={organizerLogo} alt="" className="w-7 h-7 rounded-full object-cover" />
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

      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <div className="h-px bg-neutral-300" />
      </div>

      {/* ═══════════════════════════════════════
          CONTENT — editorial, no cards
         ═══════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-14 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-12 md:gap-20">
          {/* Left: content */}
          <div className="space-y-16">
            {event.description && (
              <EditorialSection title="Om arrangementet" serif={serif} body={body}>
                <p className="text-[17px] sm:text-[18px] text-neutral-600 leading-[1.9] whitespace-pre-wrap" style={body}>
                  {event.description}
                </p>
              </EditorialSection>
            )}

            {/* Mid-content image break */}
            {galleryImages.length > 0 && (
              <div className="overflow-hidden rounded-sm cursor-pointer" onClick={() => setLightboxIndex(0)}>
                <img
                  src={getOptimizedImageUrl(galleryImages[0].image_url, { width: 1200 })}
                  alt={galleryImages[0].alt_text ?? ""}
                  className="w-full aspect-[16/9] object-cover hover:scale-[1.01] transition-transform duration-700"
                />
              </div>
            )}

            {event.program && (
              <EditorialSection title="Program" serif={serif} body={body}>
                <div className="space-y-0">
                  {event.program.split("\n").filter(Boolean).map((line, i) => {
                    const timeMatch = line.match(/^\d{1,2}[:.]\d{2}/);
                    return (
                      <div
                        key={i}
                        className="flex items-baseline gap-5 py-3.5 border-b border-neutral-200 last:border-0"
                      >
                        <span className="text-[22px] text-neutral-400 shrink-0 w-20" style={display}>
                          {timeMatch?.[0] || ""}
                        </span>
                        <span className="text-[16px] text-neutral-600" style={body}>
                          {line.replace(/^\d{1,2}[:.]\d{2}\s*[-–—]?\s*/, "")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </EditorialSection>
            )}

            {event.practical_info && (
              <EditorialSection title="Praktisk info" serif={serif} body={body}>
                <p className="text-[17px] sm:text-[18px] text-neutral-600 leading-[1.9] whitespace-pre-wrap" style={body}>
                  {event.practical_info}
                </p>
              </EditorialSection>
            )}
          </div>

          {/* Right: sidebar — no cards, just structured info with lines */}
          <div className="hidden md:block">
            <div className="sticky top-8">
              <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 mb-4" style={body}>Detaljer</p>
              <div className="border-t border-neutral-300">
                <SideRow label="Dato" value={`${dayNum}. ${monthStr}`} display={display} body={body} />
                <SideRow label="Tid" value={`${timeStr}${endTimeStr ? ` – ${endTimeStr}` : ""}`} display={display} body={body} />
                <SideRow label="Sted" value={event.location} display={display} body={body} />
              </div>

              <div className="mt-8">
                <EventHeroCTA eventId={event.id} />
              </div>

              {event.registration_url && (
                <a
                  href={event.registration_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[13px] text-neutral-400 hover:text-neutral-600 transition mt-4"
                  style={body}
                >
                  Ekstern påmelding <ArrowRight className="w-3 h-3" />
                </a>
              )}

              {organizerName && (
                <div className="mt-10 pt-6 border-t border-neutral-200">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 mb-4" style={body}>Arrangør</p>
                  <div className="flex items-center gap-3">
                    {organizerLogo && (
                      <img src={organizerLogo} alt="" className="w-10 h-10 rounded-full object-cover" />
                    )}
                    <div>
                      {organizerLink ? (
                        <Link to={organizerLink} className="text-[15px] text-neutral-700 hover:text-neutral-900 transition" style={body}>
                          {organizerName}
                        </Link>
                      ) : (
                        <span className="text-[15px] text-neutral-700" style={body}>{organizerName}</span>
                      )}
                    </div>
                  </div>
                  {(event.owner_page?.contact_email || event.owner_page?.website) && (
                    <div className="mt-3 space-y-1 text-[13px]">
                      {event.owner_page?.contact_email && (
                        <a href={`mailto:${event.owner_page.contact_email}`} className="block text-neutral-400 hover:text-neutral-600 transition" style={body}>
                          {event.owner_page.contact_email}
                        </a>
                      )}
                      {event.owner_page?.website && (
                        <a href={event.owner_page.website} target="_blank" rel="noopener noreferrer" className="block text-neutral-400 hover:text-neutral-600 transition" style={body}>
                          Nettside →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          GALLERY
         ═══════════════════════════════════════ */}
      {galleryImages.length > 1 && (
        <>
          <div className="max-w-7xl mx-auto px-6 sm:px-10">
            <div className="h-px bg-neutral-300" />
          </div>
          <div className="max-w-7xl mx-auto px-6 sm:px-10 py-14 md:py-20">
            <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 mb-8" style={body}>
              Bilder fra arrangementet
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {galleryImages.slice(1).map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setLightboxIndex(idx + 1)}
                  className="relative aspect-[4/3] overflow-hidden rounded-sm group cursor-pointer"
                >
                  <img
                    src={getOptimizedImageUrl(img.image_url, { width: 700 })}
                    alt={img.alt_text ?? ""}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
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

      {/* ═══════════════════════════════════════
          BOTTOM CTA
         ═══════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <div className="h-px bg-neutral-300" />
      </div>
      <div className="max-w-4xl mx-auto px-6 sm:px-10 py-16 md:py-24 text-center">
        <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 mb-4" style={body}>
          {dayNum}. {monthStr} {yearStr} · {event.location}
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-5xl text-neutral-900 mb-8" style={serif}>
          Vi sees der.
        </h2>
        <EventHeroCTA eventId={event.id} />
      </div>

      {/* Mobile sidebar */}
      <div className="md:hidden border-t border-neutral-300 px-6 py-8 space-y-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 mb-2" style={body}>Detaljer</p>
        <div className="border-t border-neutral-300">
          <SideRow label="Dato" value={`${dayNum}. ${monthStr} ${yearStr}`} display={display} body={body} />
          <SideRow label="Tid" value={`${timeStr}${endTimeStr ? ` – ${endTimeStr}` : ""}`} display={display} body={body} />
          <SideRow label="Sted" value={event.location} display={display} body={body} />
        </div>
        <EventHeroCTA eventId={event.id} />
        {organizerName && (
          <div className="pt-4 border-t border-neutral-200 flex items-center gap-3">
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
  );
}

/* ─── Sub-components ─── */

function EditorialSection({
  title, children, serif, body,
}: {
  title: string; children: React.ReactNode;
  serif: React.CSSProperties; body: React.CSSProperties;
}) {
  return (
    <section>
      <h2 className="text-xl sm:text-2xl text-neutral-900 mb-6" style={serif}>{title}</h2>
      <div className="h-px bg-neutral-300 mb-6" />
      {children}
    </section>
  );
}

function InfoBlock({
  label, value, display, body,
}: {
  label: string; value: string;
  display: React.CSSProperties; body: React.CSSProperties;
}) {
  return (
    <div>
      <span className="block text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-0.5" style={body}>{label}</span>
      <span className="text-[15px] text-neutral-700" style={body}>{value}</span>
    </div>
  );
}

function SideRow({
  label, value, display, body,
}: {
  label: string; value: string;
  display: React.CSSProperties; body: React.CSSProperties;
}) {
  return (
    <div className="flex justify-between items-baseline py-3 border-b border-neutral-200">
      <span className="text-[13px] text-neutral-400" style={body}>{label}</span>
      <span className="text-[15px] text-neutral-700" style={body}>{value}</span>
    </div>
  );
}

function AttendeeInfo({
  eventId, maxAttendees, display, body,
}: {
  eventId: string; maxAttendees?: number | null;
  display: React.CSSProperties; body: React.CSSProperties;
}) {
  const { data: count } = useEventAttendeeCount(eventId);
  return (
    <div>
      <span className="block text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-0.5" style={body}>Påmeldt</span>
      <span className="text-[15px] text-neutral-700" style={body}>
        {count ?? 0}{maxAttendees ? ` / ${maxAttendees}` : ""}
      </span>
    </div>
  );
}
