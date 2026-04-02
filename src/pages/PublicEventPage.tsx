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
import { Calendar, MapPin, Clock, Users, Globe, Mail, ExternalLink } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  meet: "Biltreff", show: "Show", market: "Delemarked", drive: "Kjøretur",
  club_night: "Klubbkveld", exhibition: "Utstilling", open_day: "Åpen dag", other: "Arrangement",
};

export default function PublicEventPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading } = usePublicEventBySlug(slug);
  const [activeTab, setActiveTab] = useState<"info" | "galleri">("info");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (isLoading)
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-amber-400/60 rounded-full animate-spin" />
      </div>
    );

  if (!event)
    return (
      <div className="min-h-screen bg-[#0f1115] flex flex-col items-center justify-center gap-3">
        <p className="text-2xl font-bold text-white">Fant ikke arrangementet</p>
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

  const organizerName = event.owner_page?.title || event.owner_profile?.display_name || null;
  const organizerLogo = event.owner_page?.logo_url || event.owner_profile?.avatar_url;
  const organizerLink = event.owner_page ? `/s/${event.owner_page.slug}` : null;

  return (
    <div className="min-h-screen bg-[#0f1115] text-white">
      <Helmet>
        <title>{event.title} | Bilgarasje</title>
        <meta name="description" content={event.short_description || `${event.title} – ${event.location}`} />
      </Helmet>

      {/* ── CINEMATIC HERO ── */}
      <div className="relative w-full h-[56vh] sm:h-[62vh] md:h-[70vh] overflow-hidden">
        {heroImage ? (
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-[1.02]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#151922] to-[#0f1115]" />
        )}
        {/* Overlay: darker left, lighter right */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-transparent to-transparent" />

        {/* Hero content */}
        <div className="absolute inset-0 flex items-end">
          <div className="w-full max-w-6xl mx-auto px-6 sm:px-10 pb-12 md:pb-16">
            <div className="max-w-2xl space-y-5">
              {/* Badge */}
              <div className="flex items-center gap-3">
                {organizerLogo && (
                  <img src={organizerLogo} alt="" className="w-8 h-8 rounded-full ring-2 ring-white/20 object-cover" />
                )}
                <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-amber-300/80">
                  {TYPE_LABELS[event.event_type] || event.event_type}
                </span>
                {event.status === "cancelled" && (
                  <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-red-400 bg-red-400/10 px-2.5 py-0.5 rounded-full">
                    Avlyst
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-[2.4rem] sm:text-[3.2rem] md:text-[4rem] font-black leading-[0.98] tracking-[-0.03em] text-white drop-shadow-2xl">
                {event.title}
              </h1>

              {event.short_description && (
                <p className="text-base sm:text-lg text-white/50 leading-relaxed max-w-lg">
                  {event.short_description}
                </p>
              )}

              {/* Meta chips */}
              <div className="flex flex-wrap items-center gap-3 text-[13px]">
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/70 px-3 py-1.5 rounded-full">
                  <Calendar className="w-3.5 h-3.5" />
                  {dateStr}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/70 px-3 py-1.5 rounded-full">
                  <Clock className="w-3.5 h-3.5" />
                  {timeStr}{endTimeStr ? ` – ${endTimeStr}` : ""}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/70 px-3 py-1.5 rounded-full">
                  <MapPin className="w-3.5 h-3.5" />
                  {event.location}
                </span>
              </div>

              {/* CTA */}
              <div className="flex items-center gap-4 pt-2">
                <EventHeroCTA eventId={event.id} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STICKY TAB NAV ── */}
      <div className="sticky top-0 z-30 bg-[#0f1115]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 flex items-center gap-8 h-12">
          {(["info", "galleri"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative text-[13px] font-medium tracking-wide capitalize transition-colors h-full flex items-center ${
                activeTab === tab ? "text-white" : "text-white/30 hover:text-white/50"
              }`}
            >
              {tab === "info" ? "Informasjon" : "Galleri"}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-12 md:py-16">
        {activeTab === "info" ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 lg:gap-16">
            {/* Left – Content */}
            <div className="space-y-12">
              {event.description && (
                <section>
                  <h2 className="text-xs font-semibold tracking-[0.14em] uppercase text-amber-400/60 mb-5">
                    Om arrangementet
                  </h2>
                  <div className="text-[15px] sm:text-base text-white/55 leading-[1.9] whitespace-pre-wrap">
                    {event.description}
                  </div>
                </section>
              )}

              {event.program && (
                <section>
                  <h2 className="text-xs font-semibold tracking-[0.14em] uppercase text-amber-400/60 mb-5">
                    Program
                  </h2>
                  <div className="text-[14px] text-white/45 leading-[2.1] whitespace-pre-wrap font-mono tracking-wide">
                    {event.program}
                  </div>
                </section>
              )}

              {event.practical_info && (
                <section>
                  <h2 className="text-xs font-semibold tracking-[0.14em] uppercase text-amber-400/60 mb-5">
                    Praktisk info
                  </h2>
                  <div className="text-[15px] sm:text-base text-white/55 leading-[1.9] whitespace-pre-wrap">
                    {event.practical_info}
                  </div>
                </section>
              )}
            </div>

            {/* Right – Sidebar */}
            <div className="hidden lg:block">
              <EventSidebar
                eventId={event.id}
                dateStr={dateStr}
                timeStr={timeStr}
                endTimeStr={endTimeStr}
                location={event.location}
                maxAttendees={event.max_attendees}
                organizerName={organizerName}
                organizerLogo={organizerLogo}
                organizerLink={organizerLink}
                registrationUrl={event.registration_url}
                contactEmail={event.owner_page?.contact_email}
                website={event.owner_page?.website}
                eventType={event.event_type}
              />
            </div>
          </div>
        ) : (
          /* ── GALLERY TAB ── */
          <div>
            {galleryImages.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setLightboxIndex(idx)}
                      className="relative aspect-[4/5] overflow-hidden group cursor-pointer bg-white/5 rounded-lg"
                    >
                      <img
                        src={getOptimizedImageUrl(img.image_url, { width: 600 })}
                        alt={img.alt_text ?? ""}
                        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                    </button>
                  ))}
                </div>
                <ImageLightbox
                  images={lightboxImages}
                  initialIndex={lightboxIndex ?? 0}
                  isOpen={lightboxIndex !== null}
                  onClose={() => setLightboxIndex(null)}
                />
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-white/20 text-sm">Ingen bilder er lagt til ennå.</p>
              </div>
            )}
          </div>
        )}

        {/* Mobile sidebar (below content) */}
        <div className="lg:hidden mt-12">
          <EventSidebar
            eventId={event.id}
            dateStr={dateStr}
            timeStr={timeStr}
            endTimeStr={endTimeStr}
            location={event.location}
            maxAttendees={event.max_attendees}
            organizerName={organizerName}
            organizerLogo={organizerLogo}
            organizerLink={organizerLink}
            registrationUrl={event.registration_url}
            contactEmail={event.owner_page?.contact_email}
            website={event.owner_page?.website}
            eventType={event.event_type}
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SIDEBAR — glass panel, sticky
   ───────────────────────────────────────────── */
function EventSidebar({
  eventId, dateStr, timeStr, endTimeStr, location, maxAttendees,
  organizerName, organizerLogo, organizerLink, registrationUrl,
  contactEmail, website, eventType,
}: {
  eventId: string; dateStr: string; timeStr: string; endTimeStr: string | null;
  location: string; maxAttendees?: number | null; organizerName: string | null;
  organizerLogo?: string | null; organizerLink: string | null;
  registrationUrl?: string | null; contactEmail?: string | null;
  website?: string | null; eventType: string;
}) {
  const { data: count } = useEventAttendeeCount(eventId);

  return (
    <div className="sticky top-16 space-y-4">
      {/* Event info card */}
      <div className="rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/[0.08] p-6 space-y-5">
        <div className="space-y-4">
          <InfoRow icon={<Calendar className="w-4 h-4" />} label="Dato" value={dateStr} />
          <InfoRow icon={<Clock className="w-4 h-4" />} label="Tid" value={`${timeStr}${endTimeStr ? ` – ${endTimeStr}` : ""}`} />
          <InfoRow icon={<MapPin className="w-4 h-4" />} label="Sted" value={location} />
          <InfoRow icon={<Users className="w-4 h-4" />} label="Påmeldt" value={`${count ?? 0}${maxAttendees ? ` / ${maxAttendees}` : ""}`} />
        </div>

        <div className="pt-1">
          <EventHeroCTA eventId={eventId} />
        </div>

        {registrationUrl && (
          <a href={registrationUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-[13px] text-white/25 hover:text-white/50 transition-colors">
            Ekstern påmelding <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Organizer card */}
      {organizerName && (
        <div className="rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/[0.08] p-6">
          <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white/20 mb-4">Arrangør</p>
          <div className="flex items-center gap-3">
            {organizerLogo && (
              <img src={organizerLogo} alt="" className="w-10 h-10 rounded-full ring-2 ring-white/10 object-cover" />
            )}
            <div>
              {organizerLink ? (
                <Link to={organizerLink} className="text-sm text-white/70 font-medium hover:text-white transition-colors">
                  {organizerName}
                </Link>
              ) : (
                <span className="text-sm text-white/70 font-medium">{organizerName}</span>
              )}
              <p className="text-[11px] text-white/20 mt-0.5">
                {TYPE_LABELS[eventType] || eventType}
              </p>
            </div>
          </div>

          {/* Contact links */}
          {(contactEmail || website) && (
            <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2">
              {contactEmail && (
                <a href={`mailto:${contactEmail}`} className="flex items-center gap-2 text-[13px] text-white/30 hover:text-white/50 transition-colors">
                  <Mail className="w-3.5 h-3.5" /> {contactEmail}
                </a>
              )}
              {website && (
                <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[13px] text-white/30 hover:text-white/50 transition-colors">
                  <Globe className="w-3.5 h-3.5" /> Nettside
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-[12px] text-white/25 uppercase tracking-wide">
        {icon} {label}
      </span>
      <span className="text-[13px] text-white/60 font-medium">{value}</span>
    </div>
  );
}
