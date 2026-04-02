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
import { useAuth } from "@/hooks/useAuth";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";
import { PostComposer } from "@/components/feed/PostComposer";
import { MapPin, Users, ExternalLink, Clock, Share2, Pencil } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  meet: "Biltreff", show: "Show", market: "Delemarked", drive: "Kjøretur",
  club_night: "Klubbkveld", exhibition: "Utstilling", open_day: "Åpen dag", other: "Arrangement",
};

const serif = { fontFamily: "'DM Serif Display', 'Playfair Display', serif" };
const display = { fontFamily: "'DM Serif Display', serif" };
const body = { fontFamily: "'Source Sans 3', sans-serif" };

// Very subtle paper grain
const TEXTURE_BG = `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.018'/%3E%3C/svg%3E")`;

export default function PublicEventPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading } = usePublicEventBySlug(slug);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { user } = useAuth();
  const { data: myProfile } = useMyPersonProfile();
  const [showFeedComposer, setShowFeedComposer] = useState(false);
  const isEventOwner = !!(myProfile && (event as any)?.owner_profile_id === myProfile.id);

  if (isLoading)
    return (
      <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center">
        <div className="w-6 h-6 border border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
      </div>
    );

  if (!event)
    return (
      <div className="min-h-screen bg-[#f5f3ee] flex flex-col items-center justify-center gap-3">
        <p className="text-5xl text-neutral-900" style={display}>404</p>
        <p className="text-neutral-500 text-lg" style={body}>Arrangementet finnes ikke.</p>
      </div>
    );

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
    <div className="min-h-screen text-neutral-900" style={{ ...body, backgroundColor: '#f5f3ee', backgroundImage: TEXTURE_BG }}>
      {isEventOwner && (
        <div className="bg-[#111315] border-b border-white/[0.08]">
          <div className="max-w-6xl mx-auto px-6 sm:px-10 py-3 flex items-center justify-between">
            <span className="text-[12px] uppercase tracking-[0.12em] text-white/40 font-sans font-medium">
              Ditt arrangement
            </span>
            <div className="flex items-center gap-2">
              <Link
                to={`/dashboard/events/${event.id}`}
                className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-white/60 hover:text-white bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10] px-3 py-1.5 transition-all font-sans"
              >
                <Pencil className="w-3 h-3" />
                Rediger
              </Link>
              {!showFeedComposer && (
                <button
                  onClick={() => setShowFeedComposer(true)}
                  className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-white/60 hover:text-white bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10] px-3 py-1.5 transition-all font-sans"
                >
                  <Share2 className="w-3 h-3" />
                  Del til feed
                </button>
              )}
            </div>
          </div>
          {showFeedComposer && (
            <div className="max-w-6xl mx-auto px-6 sm:px-10 pb-4">
              <PostComposer
                compact
                postType="event_published"
                eventId={event.id}
                snapshotTitle={event.title}
                snapshotImageUrl={heroImage}
                snapshotEntityType="event"
                onClose={() => setShowFeedComposer(false)}
              />
            </div>
          )}
        </div>
      )}
      <Helmet>
        <title>{event.title} | Bilgarasje</title>
        <meta name="description" content={event.short_description || `${event.title} – ${event.location}`} />
      </Helmet>

      {/* ── HERO ── */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 pt-6 md:pt-10">
        {/* Type + countdown */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[13px] uppercase tracking-[0.15em] text-neutral-500 font-medium" style={body}>
            {TYPE_LABELS[event.event_type] || event.event_type}
          </span>
          {event.status === "cancelled" && (
            <span className="text-[13px] uppercase tracking-[0.15em] text-red-600 font-medium">Avlyst</span>
          )}
          {!eventPassed && daysUntil >= 0 && (
            <span className="text-[13px] text-neutral-500" style={body}>
              · {daysUntil === 0 ? "I dag" : daysUntil === 1 ? "I morgen" : `Om ${daysUntil} dager`}
            </span>
          )}
        </div>

        {/* Title */}
        <h1
          className="text-[2.4rem] sm:text-[3rem] md:text-[3.6rem] leading-[1.08] tracking-[-0.015em] mb-3"
          style={serif}
        >
          {event.title}
        </h1>

        {event.short_description && (
          <p className="text-[20px] sm:text-[22px] text-neutral-600 leading-[1.55] max-w-2xl mb-5" style={body}>
            {event.short_description}
          </p>
        )}

        {/* Meta row: date + time + place + attendees */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[16px] text-neutral-600 mb-4" style={body}>
          <span className="capitalize">{dayName} {dayNum}. {monthStr} {yearStr}</span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-neutral-400" />
            {timeStr}{endTimeStr ? ` – ${endTimeStr}` : ""}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-neutral-400" />
            {event.location}
          </span>
          <AttendeeCount eventId={event.id} maxAttendees={event.max_attendees} />
        </div>

        {/* CTA + external link */}
        <div className="flex items-center gap-4 flex-wrap mb-6">
          <EventHeroCTA eventId={event.id} />
          {event.registration_url && (
            <a
              href={event.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[15px] text-neutral-500 hover:text-neutral-800 transition"
              style={body}
            >
              <ExternalLink className="w-4 h-4" />
              Mer info / kjøp billetter
            </a>
          )}
        </div>

        {/* Hero image — right-aligned feel on desktop via max-width */}
        {heroImage && (
          <button
            onClick={() => setLightboxIndex(0)}
            className="block w-full overflow-hidden cursor-pointer group"
          >
            <img
              src={getOptimizedImageUrl(heroImage, { width: 1200, quality: 85 })}
              srcSet={`${getOptimizedImageUrl(heroImage, { width: 800, quality: 85 })} 800w, ${getOptimizedImageUrl(heroImage, { width: 1200, quality: 85 })} 1200w, ${getOptimizedImageUrl(heroImage, { width: 1600, quality: 80 })} 1600w`}
              sizes="(max-width: 768px) 100vw, 70vw"
              alt=""
              loading="eager"
              fetchPriority="high"
              className="w-full h-auto object-contain group-hover:opacity-95 transition-opacity duration-300"
            />
          </button>
        )}
      </div>

      <Divider />

      {/* ── CONTENT — two-column on desktop ── */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8 md:gap-14">

          {/* Main column */}
          <div className="space-y-8">
            {event.description && (
              <section>
                <SectionLabel>Om arrangementet</SectionLabel>
                <p className="text-[18px] sm:text-[19px] text-neutral-700 leading-[1.8] whitespace-pre-wrap" style={body}>
                  {event.description}
                </p>
              </section>
            )}

            {event.program && (
              <section>
                <SectionLabel>Program</SectionLabel>
                {event.program.split("\n").filter(Boolean).map((line, i) => {
                  const timeMatch = line.match(/^\d{1,2}[:.]\d{2}/);
                  return (
                    <div key={i} className="flex items-baseline gap-5 py-2.5 border-b border-neutral-200/60 last:border-0">
                      <span className="text-[22px] text-neutral-400 shrink-0 w-14 text-right italic" style={display}>
                        {timeMatch?.[0] || ""}
                      </span>
                      <span className="text-[17px] text-neutral-700 leading-relaxed" style={body}>
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
                <p className="text-[18px] sm:text-[19px] text-neutral-700 leading-[1.8] whitespace-pre-wrap" style={body}>
                  {event.practical_info}
                </p>
              </section>
            )}

            {/* Gallery images — stacked, clickable */}
            {extraImages.length > 0 && (
              <section className="space-y-3">
                {extraImages.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setLightboxIndex(idx + 1)}
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
              </section>
            )}
          </div>

          {/* Sidebar — details + organizer */}
          <aside className="hidden md:block space-y-6 pt-1">
            <div>
              <SectionLabel>Detaljer</SectionLabel>
              <div className="space-y-3 text-[16px] text-neutral-700" style={body}>
                <SideRow icon={<span className="text-[28px] leading-none italic text-neutral-800" style={display}>{dayNum}</span>}>
                  <span className="capitalize">{monthStr} {yearStr}</span>
                  <span className="block text-[14px] text-neutral-500 capitalize">{dayName}</span>
                </SideRow>
                <div className="h-px bg-neutral-200/60" />
                <SideRow icon={<Clock className="w-5 h-5 text-neutral-400" />}>
                  {timeStr}{endTimeStr ? ` – ${endTimeStr}` : ""}
                </SideRow>
                <div className="h-px bg-neutral-200/60" />
                <SideRow icon={<MapPin className="w-5 h-5 text-neutral-400" />}>
                  {event.location}
                </SideRow>
                <div className="h-px bg-neutral-200/60" />
                <AttendeeCount eventId={event.id} maxAttendees={event.max_attendees} />
              </div>
            </div>

            {organizerName && (
              <div>
                <SectionLabel>Arrangør</SectionLabel>
                <div className="flex items-center gap-3">
                  {organizerLogo && (
                    <img src={organizerLogo} alt="" className="w-10 h-10 rounded-full object-cover" />
                  )}
                  {organizerLink ? (
                    <Link to={organizerLink} className="text-[16px] text-neutral-800 hover:text-neutral-900 transition" style={body}>
                      {organizerName}
                    </Link>
                  ) : (
                    <span className="text-[16px] text-neutral-800" style={body}>{organizerName}</span>
                  )}
                </div>
              </div>
            )}

            {event.registration_url && (
              <a
                href={event.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[15px] text-neutral-500 hover:text-neutral-800 transition"
                style={body}
              >
                <ExternalLink className="w-4 h-4" />
                Mer info / kjøp billetter
              </a>
            )}
          </aside>
        </div>
      </div>

      {/* ── BOTTOM CTA ── */}
      <Divider />
      <div className="max-w-3xl mx-auto px-6 sm:px-10 py-10 md:py-14 text-center">
        <p className="text-[14px] text-neutral-500 mb-3 capitalize" style={body}>
          {dayNum}. {monthStr} {yearStr} · {event.location}
        </p>
        <h2 className="text-3xl sm:text-4xl md:text-[3.2rem] leading-[1.1] mb-6 italic" style={serif}>
          Vi sees der.
        </h2>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <EventHeroCTA eventId={event.id} />
          {event.registration_url && (
            <a
              href={event.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[15px] text-neutral-500 hover:text-neutral-800 transition"
              style={body}
            >
              <ExternalLink className="w-4 h-4" />
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
        <Divider />
        <div className="px-6 py-5 space-y-3">
          <SectionLabel>Detaljer</SectionLabel>
          <div className="space-y-0">
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
              className="inline-flex items-center gap-2 text-[15px] text-neutral-500 hover:text-neutral-800 transition"
              style={body}
            >
              <ExternalLink className="w-4 h-4" />
              Mer info / kjøp billetter
            </a>
          )}

          {organizerName && (
            <div className="pt-2">
              <SectionLabel>Arrangør</SectionLabel>
              <div className="flex items-center gap-3">
                {organizerLogo && (
                  <img src={organizerLogo} alt="" className="w-10 h-10 rounded-full object-cover" />
                )}
                {organizerLink ? (
                  <Link to={organizerLink} className="text-[16px] text-neutral-800" style={body}>{organizerName}</Link>
                ) : (
                  <span className="text-[16px] text-neutral-800" style={body}>{organizerName}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 pb-10">
        <CommentSection eventId={event.id} />
      </div>
    </div>
  );
}

/* ─── Helpers ─── */

function Divider() {
  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10">
      <div className="h-px bg-neutral-300/50" />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] uppercase tracking-[0.12em] text-neutral-500 font-medium mb-3" style={body}>
      {children}
    </p>
  );
}

function SideRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div className="text-[16px] text-neutral-700 leading-snug" style={body}>{children}</div>
    </div>
  );
}

function AttendeeCount({ eventId, maxAttendees }: { eventId: string; maxAttendees?: number | null }) {
  const { data: count } = useEventAttendeeCount(eventId);
  if (!count && count !== 0) return null;
  return (
    <span className="flex items-center gap-1.5 text-[15px] text-neutral-500" style={body}>
      <Users className="w-4 h-4 text-neutral-400" />
      {count} påmeldt{maxAttendees ? ` av ${maxAttendees}` : ""}
    </span>
  );
}

function MobileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline py-2.5 border-b border-neutral-200/60">
      <span className="text-[15px] text-neutral-500" style={body}>{label}</span>
      <span className="text-[16px] text-neutral-800" style={body}>{value}</span>
    </div>
  );
}

function MobileAttendees({ eventId, maxAttendees }: { eventId: string; maxAttendees?: number | null }) {
  const { data: count } = useEventAttendeeCount(eventId);
  return (
    <div className="flex justify-between items-baseline py-2.5 border-b border-neutral-200/60">
      <span className="text-[15px] text-neutral-500" style={body}>Påmeldt</span>
      <span className="text-[16px] text-neutral-800" style={body}>
        {count ?? 0}{maxAttendees ? ` / ${maxAttendees}` : ""}
      </span>
    </div>
  );
}
