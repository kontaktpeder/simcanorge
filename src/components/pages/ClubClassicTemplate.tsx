import { Link } from "react-router-dom";
import { MapPin, Calendar, Mail, Globe } from "lucide-react";
import { PublicPageEvents } from "./PublicPageEvents";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { FeedCard } from "@/components/feed/FeedCard";

interface Page {
  id: string;
  title: string;
  slug: string;
  tagline: string | null;
  about: string | null;
  logo_url: string | null;
  cover_url: string | null;
  location: string | null;
  founded_year: number | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  page_type: string;
}

const serif = { fontFamily: "'Playfair Display', 'Georgia', 'Times New Roman', serif" } as const;
const mono = { fontFamily: "'Courier New', 'Courier', monospace" } as const;

export function ClubClassicTemplate({ page }: { page: Page }) {
  const { data: feedPosts } = useFeedPosts({ pageId: page.id, limit: 8 });

  return (
    <div className="min-h-screen bg-[#0f0d0b] text-white/90">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ minHeight: "420px" }}>
        {page.cover_url ? (
          <>
            <img
              src={page.cover_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f0d0b]/70 via-[#0f0d0b]/50 to-[#0f0d0b]" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f0d0b]/60 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1714] to-[#0f0d0b]" />
        )}

        {/* Top rule */}
        <div className="relative z-10 flex items-center gap-4 px-6 md:px-12 pt-8">
          <div className="flex-1 h-px bg-[#c4a882]/30" />
          <span className="text-[10px] tracking-[0.3em] uppercase text-[#c4a882]/60" style={mono}>
            Bilgarasjen · Klubb
          </span>
          <div className="flex-1 h-px bg-[#c4a882]/30" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 md:px-12 py-16 md:py-24">
          {page.logo_url && (
            <img src={page.logo_url} alt="" className="w-20 h-20 rounded-full object-cover mb-6 border-2 border-[#c4a882]/30" />
          )}

          {page.founded_year && (
            <p className="text-[11px] tracking-[0.35em] uppercase text-[#c4a882]/70 mb-4" style={mono}>
              Est. {page.founded_year}
            </p>
          )}

          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] text-white max-w-3xl"
            style={serif}
          >
            {page.title}
          </h1>

          {page.tagline && (
            <p
              className="text-lg md:text-xl text-white/50 mt-4 max-w-xl italic"
              style={serif}
            >
              {page.tagline}
            </p>
          )}

          <div className="flex items-center gap-6 mt-8 text-[12px] text-white/40" style={mono}>
            {page.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#c4a882]/60" />
                {page.location}
              </span>
            )}
            {page.founded_year && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#c4a882]/60" />
                Siden {page.founded_year}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── THIN RULE ── */}
      <div className="max-w-[900px] mx-auto px-6 md:px-12">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-[#c4a882]/20" />
          <span className="text-[9px] tracking-[0.4em] uppercase text-[#c4a882]/40" style={mono}>
            {page.page_type}
          </span>
          <div className="flex-1 h-px bg-[#c4a882]/20" />
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="max-w-[900px] mx-auto px-6 md:px-12 py-12 md:py-16">

        {/* Om klubben — two-column editorial */}
        {page.about && (
          <div className="grid md:grid-cols-[280px_1fr] gap-8 md:gap-12">
            <div className="space-y-4">
              <p className="text-[10px] tracking-[0.35em] uppercase text-[#c4a882]/60" style={mono}>
                Om klubben
              </p>
              <h2 className="text-2xl font-bold text-white" style={serif}>
                Hvem er vi?
              </h2>
              <div className="flex flex-col gap-2 mt-4">
                {page.contact_email && (
                  <a href={`mailto:${page.contact_email}`} className="flex items-center gap-2 text-[13px] text-[#c4a882]/80 hover:text-[#c4a882] transition-colors">
                    <Mail className="w-3.5 h-3.5" />
                    Kontakt oss
                  </a>
                )}
                {page.website && (
                  <a href={page.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[13px] text-[#c4a882]/80 hover:text-[#c4a882] transition-colors">
                    <Globe className="w-3.5 h-3.5" />
                    Nettside
                  </a>
                )}
              </div>
            </div>

            <div className="md:border-l md:border-[#c4a882]/15 md:pl-12">
              <p className="text-[15px] leading-[1.8] text-white/60 whitespace-pre-line" style={serif}>
                {page.about}
              </p>
            </div>
          </div>
        )}

        {/* Divider dot */}
        <div className="flex items-center justify-center gap-3 my-12 md:my-16">
          <div className="w-12 h-px bg-[#c4a882]/20" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#c4a882]/30" />
          <div className="w-12 h-px bg-[#c4a882]/20" />
        </div>

        {/* Arrangementer */}
        <div className="space-y-6">
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#c4a882]/60" style={mono}>
            Kommende
          </p>
          <h2 className="text-2xl font-bold text-white" style={serif}>
            Arrangementer
          </h2>
          <PublicPageEvents pageId={page.id} />
        </div>

        {/* Divider dot + Klubb-feed */}
        {feedPosts && feedPosts.length > 0 && (
          <>
            <div className="flex items-center justify-center gap-3 my-12 md:my-16">
              <div className="w-12 h-px bg-[#c4a882]/20" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#c4a882]/30" />
              <div className="w-12 h-px bg-[#c4a882]/20" />
            </div>

            <div className="space-y-6">
              <p className="text-[10px] tracking-[0.35em] uppercase text-[#c4a882]/60" style={mono}>
                Siste nytt
              </p>
              <h2 className="text-2xl font-bold text-white" style={serif}>
                Fra klubben
              </h2>
              <div className="space-y-6">
                {feedPosts.map((post) => (
                  <div key={post.id} className="[&_*]:text-white/80">
                    <FeedCard post={post} />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── FOOTER ── */}
      <div className="border-t border-[#c4a882]/15 py-8">
        <div className="max-w-[900px] mx-auto px-6 md:px-12 flex items-center justify-between">
          <span className="text-[11px] text-white/30" style={mono}>
            {page.title}{page.founded_year ? ` · Est. ${page.founded_year}` : ""}
          </span>
          <Link to="/" className="text-[11px] text-[#c4a882]/40 hover:text-[#c4a882]/70 transition-colors" style={mono}>
            Bilgarasjen.no
          </Link>
        </div>
      </div>
    </div>
  );
}
