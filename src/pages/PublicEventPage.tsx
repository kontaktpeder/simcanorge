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

const TYPE_LABELS: Record<string, string> = {
  meet: "Biltreff", show: "Show", market: "Delemarked", drive: "Kjøretur",
  club_night: "Klubbkveld", exhibition: "Utstilling", open_day: "Åpen dag", other: "Arrangement",
};

export default function PublicEventPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading } = usePublicEventBySlug(slug);
  const [tab, setTab] = useState<"info" | "galleri">("info");
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
    <div className="bg-[#0f1115] min-h-screen text-white">
      <Helmet>
        <title>{event.title} | Bilgarasje</title>
        <meta name="description" content={event.short_description || `${event.title} – ${event.location}`} />
      </Helmet>

      {/* ── HERO ── */}
      <div className="relative w-full h-[420px] md:h-[520px] overflow-hidden">
        {heroImage ? (
          <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#151922] to-[#0f1115]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f1115]/85 via-[#0f1115]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 h-full flex items-end pb-10">
          <div className="max-w-xl">
            <div className="text-xs tracking-widest uppercase text-amber-400 mb-3">
              {TYPE_LABELS[event.event_type] || event.event_type}
              {event.status === "cancelled" && (
                <span className="ml-3 text-red-400">Avlyst</span>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-semibold text-white leading-tight">
              {event.title}
            </h1>

            {event.short_description && (
              <p className="text-white/70 mt-3 text-base">{event.short_description}</p>
            )}

            <div className="flex gap-4 text-sm text-white/60 mt-4">
              <span>{dateStr}</span>
              <span>kl. {timeStr}{endTimeStr ? ` – ${endTimeStr}` : ""}</span>
              <span>{event.location}</span>
            </div>

            <div className="flex gap-3 mt-6">
              <EventHeroCTA eventId={event.id} />
            </div>
          </div>
        </div>
      </div>

      {/* ── SUBNAV ── */}
      <div className="border-b border-white/10 bg-[#151922]/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 flex gap-8">
          {(["info", "galleri"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-4 text-sm capitalize transition ${
                tab === t
                  ? "text-white border-b border-amber-400"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {t === "info" ? "Informasjon" : "Galleri"}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="max-w-6xl mx-auto px-6 mt-8 grid md:grid-cols-[2fr_1fr] gap-10 pb-20">
        {/* Left */}
        <div>
          {tab === "info" && (
            <div className="space-y-10">
              {event.description && (
                <div>
                  <h3 className="text-white mb-4 font-medium">Om arrangementet</h3>
                  <p className="text-white/70 leading-relaxed whitespace-pre-wrap">{event.description}</p>
                </div>
              )}
              {event.program && (
                <div>
                  <h3 className="text-white mb-4 font-medium">Program</h3>
                  <div className="text-white/60 leading-[2] whitespace-pre-wrap font-mono text-sm">{event.program}</div>
                </div>
              )}
              {event.practical_info && (
                <div>
                  <h3 className="text-white mb-4 font-medium">Praktisk info</h3>
                  <p className="text-white/70 leading-relaxed whitespace-pre-wrap">{event.practical_info}</p>
                </div>
              )}
            </div>
          )}

          {tab === "galleri" && (
            galleryImages.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {galleryImages.map((img, idx) => (
                    <div
                      key={img.id}
                      className="relative overflow-hidden rounded-xl group cursor-pointer"
                      onClick={() => setLightboxIndex(idx)}
                    >
                      <img
                        src={getOptimizedImageUrl(img.image_url, { width: 600 })}
                        alt={img.alt_text ?? ""}
                        className="w-full aspect-[4/5] object-cover group-hover:scale-105 transition"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition" />
                    </div>
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
              <div className="text-center py-20 text-white/20 text-sm">Ingen bilder lagt til ennå.</div>
            )
          )}
        </div>

        {/* Right — Sidebar */}
        <div className="space-y-4 sticky top-16 self-start hidden md:block">
          <SidebarCard>
            <h3 className="text-white mb-4">Event</h3>
            <div className="text-sm text-white/70 space-y-2">
              <div>{dateStr}</div>
              <div>kl. {timeStr}{endTimeStr ? ` – ${endTimeStr}` : ""}</div>
              <div>{event.location}</div>
            </div>
            <div className="mt-4">
              <AttendeeCount eventId={event.id} maxAttendees={event.max_attendees} />
            </div>
            <div className="mt-4">
              <EventHeroCTA eventId={event.id} />
            </div>
            {event.registration_url && (
              <a href={event.registration_url} target="_blank" rel="noopener noreferrer"
                className="block text-center text-sm text-white/30 hover:text-white/50 transition mt-3">
                Ekstern påmelding →
              </a>
            )}
          </SidebarCard>

          {organizerName && (
            <SidebarCard>
              <h3 className="text-white mb-4">Arrangør</h3>
              <div className="flex items-center gap-3">
                {organizerLogo && (
                  <img src={organizerLogo} alt="" className="w-10 h-10 rounded-full border border-white/10 object-cover" />
                )}
                <div>
                  {organizerLink ? (
                    <Link to={organizerLink} className="text-sm text-white/70 font-medium hover:text-white transition">
                      {organizerName}
                    </Link>
                  ) : (
                    <span className="text-sm text-white/70 font-medium">{organizerName}</span>
                  )}
                </div>
              </div>
              {(event.owner_page?.contact_email || event.owner_page?.website) && (
                <div className="mt-4 pt-3 border-t border-white/10 text-sm text-white/50 space-y-1">
                  {event.owner_page?.contact_email && <div>{event.owner_page.contact_email}</div>}
                  {event.owner_page?.website && (
                    <a href={event.owner_page.website} target="_blank" rel="noopener noreferrer" className="hover:text-white/70 transition">
                      Nettside →
                    </a>
                  )}
                </div>
              )}
            </SidebarCard>
          )}
        </div>

        {/* Mobile sidebar */}
        <div className="md:hidden space-y-4">
          <SidebarCard>
            <h3 className="text-white mb-4">Event</h3>
            <div className="text-sm text-white/70 space-y-2">
              <div>{dateStr}</div>
              <div>kl. {timeStr}{endTimeStr ? ` – ${endTimeStr}` : ""}</div>
              <div>{event.location}</div>
            </div>
            <div className="mt-4">
              <AttendeeCount eventId={event.id} maxAttendees={event.max_attendees} />
            </div>
            <div className="mt-4">
              <EventHeroCTA eventId={event.id} />
            </div>
          </SidebarCard>
        </div>
      </div>
    </div>
  );
}

function SidebarCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur">
      {children}
    </div>
  );
}

function AttendeeCount({ eventId, maxAttendees }: { eventId: string; maxAttendees?: number | null }) {
  const { data: count } = useEventAttendeeCount(eventId);
  return (
    <div className="text-sm text-white/50">
      {count ?? 0}{maxAttendees ? ` / ${maxAttendees}` : ""} påmeldt
    </div>
  );
}
