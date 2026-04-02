import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { usePublicEventBySlug } from "@/hooks/useEventBySlug";
import { useEventAttendeeCount } from "@/hooks/useEventAttendees";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { useState } from "react";
import { EventHeroCTA } from "@/components/events/public/EventHeroCTA";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { getOptimizedImageUrl } from "@/lib/imageUtils";
import { ArrowDown } from "lucide-react";

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
      </div>
    );

  if (!event)
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <p className="text-3xl font-bold text-neutral-900">Fant ikke arrangementet</p>
        <p className="text-neutral-400 text-sm">Denne lenken er ugyldig eller arrangementet er fjernet.</p>
      </div>
    );

  const images = [...(event.event_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const heroImage = images.length > 0 ? images[0].image_url : null;
  const galleryImages = images.slice(1);
  const lightboxImages = galleryImages.map((img) => ({ url: img.image_url, alt: img.alt_text ?? undefined }));

  const startDate = new Date(event.starts_at);
  const endDate = event.ends_at ? new Date(event.ends_at) : null;
  const dateStr = format(startDate, "d. MMMM yyyy", { locale: nb });
  const dayStr = format(startDate, "EEEE", { locale: nb });
  const timeStr = format(startDate, "HH:mm");
  const endTimeStr = endDate ? format(endDate, "HH:mm") : null;

  const organizerName = event.owner_page?.title || event.owner_profile?.display_name || null;
  const organizerLogo = event.owner_page?.logo_url || event.owner_profile?.avatar_url;
  const organizerLink = event.owner_page ? `/s/${event.owner_page.slug}` : null;

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{event.title} | Bilgarasje</title>
        <meta name="description" content={event.short_description || `${event.title} – ${event.location}`} />
      </Helmet>

      {/* ═══════════════════════════════════════
          HERO — full bleed image, Porsche-style
         ═══════════════════════════════════════ */}
      <div className="relative w-full h-[70vh] sm:h-[75vh] md:h-[85vh]">
        {heroImage ? (
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-neutral-100" />
        )}

        {/* Minimal bottom gradient — just enough for scroll arrow */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Scroll hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <ArrowDown className="w-5 h-5 text-white/70 animate-bounce" />
        </div>
      </div>

      {/* ═══════════════════════════════════════
          TITLE BLOCK — VW-style, below image
          Stor tittel, dato, CTA — på hvit bakgrunn
         ═══════════════════════════════════════ */}
      <div className="bg-white">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="space-y-3">
              <h1 className="text-[2.2rem] sm:text-[3rem] md:text-[3.8rem] font-bold leading-[1.05] tracking-[-0.02em] text-neutral-900">
                {event.title}
              </h1>
              <p className="text-lg sm:text-xl text-neutral-500 font-light">
                {event.short_description || `${dayStr.charAt(0).toUpperCase()}${dayStr.slice(1)} ${dateStr}`}
              </p>
            </div>
            <div className="shrink-0">
              <EventHeroCTA eventId={event.id} />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          INFO BAR — clean divider with key facts
         ═══════════════════════════════════════ */}
      <div className="border-y border-neutral-200 bg-neutral-50">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 py-5 flex flex-wrap items-center gap-x-10 gap-y-3">
          <Fact label="Dato" value={dateStr} />
          <Fact label="Tid" value={`${timeStr}${endTimeStr ? ` – ${endTimeStr}` : ""}`} />
          <Fact label="Sted" value={event.location} />
          <AttendeeCount eventId={event.id} maxAttendees={event.max_attendees} />

          {organizerName && (
            <div className="ml-auto flex items-center gap-2.5">
              {organizerLogo && (
                <img src={organizerLogo} alt="" className="w-7 h-7 rounded-full object-cover" />
              )}
              {organizerLink ? (
                <Link to={organizerLink} className="text-sm text-neutral-600 hover:text-neutral-900 transition font-medium">
                  {organizerName}
                </Link>
              ) : (
                <span className="text-sm text-neutral-600 font-medium">{organizerName}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════
          CONTENT — clean sections, lots of space
         ═══════════════════════════════════════ */}
      <div className="max-w-3xl mx-auto px-6 sm:px-10 py-14 md:py-20 space-y-16">
        {event.description && (
          <Section title="Om arrangementet">
            <p className="text-base sm:text-[17px] text-neutral-600 leading-[1.85] whitespace-pre-wrap">
              {event.description}
            </p>
          </Section>
        )}

        {event.program && (
          <Section title="Program">
            <div className="text-[15px] text-neutral-500 leading-[2.1] whitespace-pre-wrap font-mono">
              {event.program}
            </div>
          </Section>
        )}

        {event.practical_info && (
          <Section title="Praktisk info">
            <p className="text-base sm:text-[17px] text-neutral-600 leading-[1.85] whitespace-pre-wrap">
              {event.practical_info}
            </p>
          </Section>
        )}
      </div>

      {/* ═══════════════════════════════════════
          GALLERY — clean grid, no effects
         ═══════════════════════════════════════ */}
      {galleryImages.length > 0 && (
        <div className="bg-neutral-50 border-t border-neutral-200">
          <div className="max-w-6xl mx-auto px-6 sm:px-10 py-14 md:py-20">
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-8">
              Bilder
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {galleryImages.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setLightboxIndex(idx)}
                  className="relative aspect-[4/3] overflow-hidden rounded-lg cursor-pointer group"
                >
                  <img
                    src={getOptimizedImageUrl(img.image_url, { width: 700 })}
                    alt={img.alt_text ?? ""}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
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
        </div>
      )}

      {/* ═══════════════════════════════════════
          BOTTOM CTA
         ═══════════════════════════════════════ */}
      <div className="border-t border-neutral-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 sm:px-10 py-14 md:py-20 text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900">
            Vi sees der.
          </h2>
          <p className="text-neutral-400 text-sm">
            {dateStr} · {event.location}
          </p>
          <div className="pt-2">
            <EventHeroCTA eventId={event.id} />
          </div>
        </div>
      </div>

      {/* Contact footer */}
      {(event.owner_page?.contact_email || event.owner_page?.website || event.registration_url) && (
        <div className="border-t border-neutral-100 py-8 bg-white">
          <div className="max-w-3xl mx-auto px-6 sm:px-10 flex flex-wrap gap-6 justify-center text-[13px] text-neutral-300">
            {event.owner_page?.contact_email && (
              <a href={`mailto:${event.owner_page.contact_email}`} className="hover:text-neutral-500 transition">
                {event.owner_page.contact_email}
              </a>
            )}
            {event.owner_page?.website && (
              <a href={event.owner_page.website} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-500 transition">
                Nettside
              </a>
            )}
            {event.registration_url && (
              <a href={event.registration_url} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-500 transition">
                Ekstern påmelding
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-0.5">{label}</span>
      <span className="text-sm text-neutral-700">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-5">{title}</h2>
      {children}
    </section>
  );
}

function AttendeeCount({ eventId, maxAttendees }: { eventId: string; maxAttendees?: number | null }) {
  const { data: count } = useEventAttendeeCount(eventId);
  return (
    <Fact label="Påmeldt" value={`${count ?? 0}${maxAttendees ? ` / ${maxAttendees}` : ""}`} />
  );
}
