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
import { motion } from "framer-motion";

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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );

  if (!event)
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <p className="text-4xl font-black text-white">404</p>
        <p className="text-white/30 text-sm">Arrangementet finnes ikke.</p>
      </div>
    );

  const images = [...(event.event_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const heroImage = images.length > 0 ? images[0].image_url : null;
  const galleryImages = images.slice(1);
  const lightboxImages = galleryImages.map((img) => ({ url: img.image_url, alt: img.alt_text ?? undefined }));

  const startDate = new Date(event.starts_at);
  const endDate = event.ends_at ? new Date(event.ends_at) : null;
  const dateStr = format(startDate, "d. MMMM", { locale: nb });
  const yearStr = format(startDate, "yyyy");
  const dayStr = format(startDate, "EEEE", { locale: nb });
  const timeStr = format(startDate, "HH:mm");
  const endTimeStr = endDate ? format(endDate, "HH:mm") : null;

  const organizerName = event.owner_page?.title || event.owner_profile?.display_name || null;
  const organizerLogo = event.owner_page?.logo_url || event.owner_profile?.avatar_url;
  const organizerLink = event.owner_page ? `/s/${event.owner_page.slug}` : null;

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white overflow-x-hidden">
      <Helmet>
        <title>{event.title} | Bilgarasje</title>
        <meta name="description" content={event.short_description || `${event.title} – ${event.location}`} />
      </Helmet>

      {/* ═══════════════════════════════════════
          HERO — full bleed, poster-style
         ═══════════════════════════════════════ */}
      <div className="relative w-full min-h-[100svh] flex flex-col justify-end overflow-hidden">
        {/* Background image */}
        {heroImage && (
          <motion.img
            src={heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
          />
        )}

        {/* Heavy bottom gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />

        {/* Warm color wash */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-transparent to-orange-900/10" />

        {/* Content */}
        <div className="relative z-10 px-6 sm:px-10 pb-10 pt-32 max-w-7xl mx-auto w-full">
          {/* Type badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mb-6"
          >
            <span className="inline-block bg-amber-400 text-black text-[11px] font-black tracking-[0.2em] uppercase px-4 py-1.5 rounded-sm">
              {TYPE_LABELS[event.event_type] || event.event_type}
            </span>
            {event.status === "cancelled" && (
              <span className="inline-block ml-3 bg-red-500 text-white text-[11px] font-black tracking-[0.2em] uppercase px-4 py-1.5 rounded-sm">
                Avlyst
              </span>
            )}
          </motion.div>

          {/* Title — massive, festival poster style */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-[3rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[7.5rem] font-black leading-[0.88] tracking-[-0.04em] uppercase text-white mb-6"
          >
            {event.title}
          </motion.h1>

          {/* Date + Location — big, typographic */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="flex flex-wrap items-end gap-x-6 gap-y-2 mb-8"
          >
            <span className="text-2xl sm:text-3xl md:text-4xl font-light text-white/80 uppercase tracking-wide">
              {dateStr}
            </span>
            <span className="text-2xl sm:text-3xl md:text-4xl font-light text-amber-400/70 uppercase tracking-wide">
              {yearStr}
            </span>
            <span className="text-lg sm:text-xl text-white/40 font-light">
              {event.location}
            </span>
          </motion.div>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex flex-wrap items-center gap-4"
          >
            <EventHeroCTA eventId={event.id} />
            <AttendeeCount eventId={event.id} maxAttendees={event.max_attendees} />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10"
        >
          <div className="w-5 h-8 rounded-full border-2 border-white/20 flex items-start justify-center p-1">
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              className="w-1 h-2 bg-white/40 rounded-full"
            />
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════
          INFO STRIP — horizontal, punchy
         ═══════════════════════════════════════ */}
      <div className="border-y border-white/[0.08] bg-[#0e0e0e]">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-6 flex flex-wrap gap-y-4 gap-x-10 items-center justify-between">
          <div className="flex flex-wrap gap-x-10 gap-y-4">
            <InfoChip label="Dag" value={`${dayStr.charAt(0).toUpperCase()}${dayStr.slice(1)}`} />
            <InfoChip label="Tid" value={`${timeStr}${endTimeStr ? ` – ${endTimeStr}` : ""}`} />
            <InfoChip label="Sted" value={event.location} />
          </div>
          {organizerName && (
            <div className="flex items-center gap-3">
              {organizerLogo && (
                <img src={organizerLogo} alt="" className="w-8 h-8 rounded-full ring-1 ring-white/10 object-cover" />
              )}
              {organizerLink ? (
                <Link to={organizerLink} className="text-sm text-white/50 hover:text-white transition font-medium">
                  {organizerName}
                </Link>
              ) : (
                <span className="text-sm text-white/50 font-medium">{organizerName}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════
          CONTENT — wide, editorial
         ═══════════════════════════════════════ */}
      <div className="max-w-4xl mx-auto px-6 sm:px-10 py-16 md:py-24 space-y-20">
        {/* Short description — pulled quote style */}
        {event.short_description && (
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="text-xl sm:text-2xl md:text-3xl text-white/60 font-light leading-relaxed border-l-2 border-amber-400/40 pl-6 sm:pl-10"
          >
            {event.short_description}
          </motion.p>
        )}

        {/* Description */}
        {event.description && (
          <ContentBlock title="Om arrangementet">
            <p className="text-base sm:text-lg text-white/50 leading-[1.9] whitespace-pre-wrap">
              {event.description}
            </p>
          </ContentBlock>
        )}

        {/* Program */}
        {event.program && (
          <ContentBlock title="Program">
            <div className="text-sm sm:text-base text-white/40 leading-[2.2] whitespace-pre-wrap font-mono">
              {event.program}
            </div>
          </ContentBlock>
        )}

        {/* Practical info */}
        {event.practical_info && (
          <ContentBlock title="Praktisk info">
            <p className="text-base sm:text-lg text-white/50 leading-[1.9] whitespace-pre-wrap">
              {event.practical_info}
            </p>
          </ContentBlock>
        )}
      </div>

      {/* ═══════════════════════════════════════
          GALLERY — edge-to-edge, immersive
         ═══════════════════════════════════════ */}
      {galleryImages.length > 0 && (
        <div className="pb-16 md:pb-24">
          <div className="max-w-4xl mx-auto px-6 sm:px-10 mb-8">
            <h2 className="text-xs font-black tracking-[0.25em] uppercase text-amber-400/50">
              Galleri
            </h2>
          </div>

          {/* Masonry-ish grid — alternating sizes */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
              {galleryImages.map((img, idx) => {
                // Alternate between tall and square for visual rhythm
                const isTall = idx % 5 === 0 || idx % 5 === 3;
                return (
                  <motion.button
                    key={img.id}
                    onClick={() => setLightboxIndex(idx)}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: (idx % 3) * 0.1 }}
                    className={`relative overflow-hidden rounded-lg group cursor-pointer ${
                      isTall ? "row-span-2 aspect-[3/5]" : "aspect-square"
                    }`}
                  >
                    <img
                      src={getOptimizedImageUrl(img.image_url, { width: 800 })}
                      alt={img.alt_text ?? ""}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-500" />
                  </motion.button>
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
          BOTTOM CTA — final push
         ═══════════════════════════════════════ */}
      <div className="border-t border-white/[0.06] bg-[#0e0e0e]">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 py-16 md:py-20 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-3">
            Vi sees der?
          </h2>
          <p className="text-white/30 mb-8 text-sm">
            {dateStr} {yearStr} · {event.location}
          </p>
          <EventHeroCTA eventId={event.id} />
        </div>
      </div>

      {/* Contact footer */}
      {(event.owner_page?.contact_email || event.owner_page?.website || event.registration_url) && (
        <div className="border-t border-white/[0.04] py-10">
          <div className="max-w-4xl mx-auto px-6 sm:px-10 flex flex-wrap gap-6 justify-center text-[13px] text-white/25">
            {event.owner_page?.contact_email && (
              <a href={`mailto:${event.owner_page.contact_email}`} className="hover:text-white/50 transition">
                {event.owner_page.contact_email}
              </a>
            )}
            {event.owner_page?.website && (
              <a href={event.owner_page.website} target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition">
                Nettside →
              </a>
            )}
            {event.registration_url && (
              <a href={event.registration_url} target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition">
                Ekstern påmelding →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[10px] font-bold tracking-[0.2em] uppercase text-white/20 mb-1">{label}</span>
      <span className="text-sm text-white/70 font-medium">{value}</span>
    </div>
  );
}

function ContentBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7 }}
    >
      <h2 className="text-xs font-black tracking-[0.25em] uppercase text-amber-400/50 mb-6">
        {title}
      </h2>
      {children}
    </motion.section>
  );
}

function AttendeeCount({ eventId, maxAttendees }: { eventId: string; maxAttendees?: number | null }) {
  const { data: count } = useEventAttendeeCount(eventId);
  return (
    <span className="text-sm text-white/30 font-medium">
      {count ?? 0}{maxAttendees ? `/${maxAttendees}` : ""} påmeldt
    </span>
  );
}
