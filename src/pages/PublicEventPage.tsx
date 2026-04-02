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
      <div className="min-h-screen bg-[#f5f4f0] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-700 rounded-full animate-spin" />
      </div>
    );

  if (!event)
    return (
      <div className="min-h-screen bg-[#f5f4f0] flex flex-col items-center justify-center gap-3">
        <p className="text-6xl font-black text-neutral-900">404</p>
        <p className="text-neutral-400">Arrangementet finnes ikke.</p>
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
    <div className="min-h-screen bg-[#f5f4f0] text-neutral-900">
      <Helmet>
        <title>{event.title} | Bilgarasje</title>
        <meta name="description" content={event.short_description || `${event.title} – ${event.location}`} />
      </Helmet>

      {/* ═══════════════════════════════════════
          HERO — full bleed image
         ═══════════════════════════════════════ */}
      <div className="relative w-full h-[65vh] sm:h-[72vh] md:h-[82vh] overflow-hidden">
        {heroImage ? (
          <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-neutral-200" />
        )}
        {event.status === "cancelled" && (
          <div className="absolute top-6 right-6 z-10 bg-red-600 text-white text-xs font-bold uppercase tracking-widest px-4 py-2">
            Avlyst
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════
          TITLE + DATE — editorial split layout
         ═══════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10">
        <div className="py-12 md:py-16 flex flex-col md:flex-row md:items-start gap-8 md:gap-16">
          {/* Left: Big date poster */}
          <div className="shrink-0 md:w-48 flex flex-row md:flex-col items-baseline md:items-start gap-3 md:gap-0">
            <span className="text-[5rem] md:text-[7rem] font-black leading-none tracking-tighter text-neutral-900">
              {dayNum}
            </span>
            <div className="md:mt-1">
              <span className="block text-lg md:text-xl font-medium text-neutral-500 capitalize">{monthStr}</span>
              <span className="block text-sm text-neutral-400">{yearStr}</span>
            </div>
          </div>

          {/* Right: Title + meta */}
          <div className="flex-1 space-y-5">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-400 border border-neutral-300 px-3 py-1 rounded-full">
                {TYPE_LABELS[event.event_type] || event.event_type}
              </span>
              {!eventPassed && daysUntil >= 0 && (
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-600">
                  {daysUntil === 0 ? "I dag!" : daysUntil === 1 ? "I morgen" : `Om ${daysUntil} dager`}
                </span>
              )}
            </div>

            <h1 className="text-[2rem] sm:text-[2.8rem] md:text-[3.6rem] font-bold leading-[1.05] tracking-[-0.025em]">
              {event.title}
            </h1>

            {event.short_description && (
              <p className="text-lg text-neutral-500 leading-relaxed max-w-2xl">
                {event.short_description}
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] text-neutral-500 pt-1">
              <span className="capitalize">{dayName}</span>
              <span>kl. {timeStr}{endTimeStr ? ` – ${endTimeStr}` : ""}</span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {event.location}
              </span>
              <AttendeeChip eventId={event.id} maxAttendees={event.max_attendees} />
            </div>

            <div className="pt-3">
              <EventHeroCTA eventId={event.id} />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          DIVIDER — thin warm line
         ═══════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10">
        <div className="h-px bg-neutral-300/60" />
      </div>

      {/* ═══════════════════════════════════════
          CONTENT — staggered blocks
         ═══════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-14 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-12 md:gap-20">
          {/* Left: main content */}
          <div className="space-y-14">
            {event.description && (
              <ContentSection title="Om arrangementet">
                <p className="text-[16px] text-neutral-600 leading-[1.85] whitespace-pre-wrap">
                  {event.description}
                </p>
              </ContentSection>
            )}

            {/* Mid-content image break */}
            {galleryImages.length > 0 && (
              <div className="rounded-2xl overflow-hidden -mx-2 sm:mx-0">
                <img
                  src={getOptimizedImageUrl(galleryImages[0].image_url, { width: 1200 })}
                  alt={galleryImages[0].alt_text ?? ""}
                  className="w-full aspect-[16/9] object-cover cursor-pointer"
                  onClick={() => setLightboxIndex(0)}
                />
              </div>
            )}

            {event.program && (
              <ContentSection title="Program">
                <div className="space-y-0">
                  {event.program.split("\n").filter(Boolean).map((line, i) => (
                    <div
                      key={i}
                      className="flex items-baseline gap-4 py-3 border-b border-neutral-200/60 last:border-0"
                    >
                      <span className="text-[14px] text-neutral-400 font-mono shrink-0 w-16">
                        {line.match(/^\d{1,2}[:.]\d{2}/)?.[0] || ""}
                      </span>
                      <span className="text-[15px] text-neutral-600">
                        {line.replace(/^\d{1,2}[:.]\d{2}\s*[-–—]?\s*/, "")}
                      </span>
                    </div>
                  ))}
                </div>
              </ContentSection>
            )}

            {event.practical_info && (
              <ContentSection title="Praktisk info">
                <p className="text-[16px] text-neutral-600 leading-[1.85] whitespace-pre-wrap">
                  {event.practical_info}
                </p>
              </ContentSection>
            )}
          </div>

          {/* Right: sticky sidebar */}
          <div className="hidden md:block">
            <div className="sticky top-8 space-y-5">
              {/* Quick facts card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200/50 space-y-4">
                <FactRow label="Dato" value={`${dayNum}. ${monthStr} ${yearStr}`} />
                <FactRow label="Dag" value={dayName.charAt(0).toUpperCase() + dayName.slice(1)} />
                <FactRow label="Tid" value={`${timeStr}${endTimeStr ? ` – ${endTimeStr}` : ""}`} />
                <FactRow label="Sted" value={event.location} />
                <div className="pt-2">
                  <EventHeroCTA eventId={event.id} />
                </div>
                {event.registration_url && (
                  <a
                    href={event.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 text-[13px] text-neutral-400 hover:text-neutral-600 transition pt-1"
                  >
                    Ekstern påmelding <ArrowRight className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Organizer card */}
              {organizerName && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200/50">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400 mb-4">
                    Arrangør
                  </p>
                  <div className="flex items-center gap-3">
                    {organizerLogo && (
                      <img src={organizerLogo} alt="" className="w-10 h-10 rounded-full object-cover border border-neutral-200" />
                    )}
                    <div>
                      {organizerLink ? (
                        <Link to={organizerLink} className="text-sm font-medium text-neutral-700 hover:text-neutral-900 transition">
                          {organizerName}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium text-neutral-700">{organizerName}</span>
                      )}
                    </div>
                  </div>
                  {(event.owner_page?.contact_email || event.owner_page?.website) && (
                    <div className="mt-4 pt-3 border-t border-neutral-100 space-y-1.5 text-[13px]">
                      {event.owner_page?.contact_email && (
                        <a href={`mailto:${event.owner_page.contact_email}`} className="block text-neutral-400 hover:text-neutral-600 transition">
                          {event.owner_page.contact_email}
                        </a>
                      )}
                      {event.owner_page?.website && (
                        <a href={event.owner_page.website} target="_blank" rel="noopener noreferrer" className="block text-neutral-400 hover:text-neutral-600 transition">
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
          GALLERY — full-width mosaic
         ═══════════════════════════════════════ */}
      {galleryImages.length > 1 && (
        <div className="py-14 md:py-20">
          <div className="max-w-6xl mx-auto px-6 sm:px-10 mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
              Fra treffet
            </h2>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-6 gap-2 sm:gap-3 auto-rows-[180px] sm:auto-rows-[220px] md:auto-rows-[260px]">
              {galleryImages.slice(1).map((img, idx) => {
                // Create visual rhythm: first is wide, then alternate
                const spanClass =
                  idx === 0 ? "col-span-4 row-span-2" :
                  idx === 1 ? "col-span-2 row-span-1" :
                  idx === 2 ? "col-span-2 row-span-1" :
                  idx === 3 ? "col-span-3 row-span-1" :
                  idx === 4 ? "col-span-3 row-span-1" :
                  idx % 3 === 0 ? "col-span-4 row-span-2" :
                  "col-span-2 row-span-1";

                return (
                  <button
                    key={img.id}
                    onClick={() => setLightboxIndex(idx + 1)}
                    className={`relative overflow-hidden rounded-xl group cursor-pointer ${spanClass}`}
                  >
                    <img
                      src={getOptimizedImageUrl(img.image_url, { width: 900 })}
                      alt={img.alt_text ?? ""}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  </button>
                );
              })}
            </div>
          </div>

          <ImageLightbox
            images={lightboxImages}
            initialIndex={lightboxIndex ?? 0}
            isOpen={lightboxIndex !== null}
            onClose={() => setLightboxIndex(null)}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════
          BOTTOM CTA — warm, inviting
         ═══════════════════════════════════════ */}
      <div className="bg-neutral-900 text-white">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 py-16 md:py-24 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-neutral-500 text-sm mb-2 uppercase tracking-wider font-medium">
              {dayNum}. {monthStr} {yearStr} · {event.location}
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Vi sees der.
            </h2>
          </div>
          <EventHeroCTA eventId={event.id} />
        </div>
      </div>

      {/* Mobile sidebar (stacked at bottom) */}
      <div className="md:hidden bg-white border-t border-neutral-200 px-6 py-8 space-y-5">
        <div className="space-y-3">
          <FactRow label="Dato" value={`${dayNum}. ${monthStr} ${yearStr}`} />
          <FactRow label="Tid" value={`${timeStr}${endTimeStr ? ` – ${endTimeStr}` : ""}`} />
          <FactRow label="Sted" value={event.location} />
        </div>
        <EventHeroCTA eventId={event.id} />
        {organizerName && (
          <div className="pt-4 border-t border-neutral-100 flex items-center gap-3">
            {organizerLogo && (
              <img src={organizerLogo} alt="" className="w-8 h-8 rounded-full object-cover border border-neutral-200" />
            )}
            {organizerLink ? (
              <Link to={organizerLink} className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition">
                {organizerName}
              </Link>
            ) : (
              <span className="text-sm font-medium text-neutral-600">{organizerName}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function ContentSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 mb-5">{title}</h2>
      {children}
    </section>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline py-2 border-b border-neutral-100 last:border-0">
      <span className="text-[13px] text-neutral-400">{label}</span>
      <span className="text-[14px] text-neutral-700 font-medium">{value}</span>
    </div>
  );
}

function AttendeeChip({ eventId, maxAttendees }: { eventId: string; maxAttendees?: number | null }) {
  const { data: count } = useEventAttendeeCount(eventId);
  return (
    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[13px] font-medium px-3 py-1 rounded-full">
      {count ?? 0}{maxAttendees ? ` / ${maxAttendees}` : ""} påmeldt
    </span>
  );
}
