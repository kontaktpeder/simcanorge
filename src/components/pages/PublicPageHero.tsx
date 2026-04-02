import { PageTypeBadge } from "./PageTypeBadge";
import { getPageTheme } from "@/lib/pageThemes";
import type { Database } from "@/integrations/supabase/types";

type Page = Database["public"]["Tables"]["pages"]["Row"];

export function PublicPageHero({ page }: { page: Page }) {
  const theme = getPageTheme(page.page_type);

  return (
    <section className="relative overflow-hidden h-[320px] sm:h-[400px] md:h-[460px]">
      {/* Background */}
      {page.cover_url ? (
        <>
          <img
            src={page.cover_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-[1.02]"
          />
          {/* Cinematic overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0C] via-[#0B0B0C]/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0B0B0C] to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#0B0B0C]/50 to-transparent" />
          {/* Subtle accent glow at bottom */}
          <div
            className="absolute bottom-0 left-0 w-[400px] h-[200px] opacity-[0.07] blur-3xl pointer-events-none"
            style={{ background: theme.gradient }}
          />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-[#0B0B0C]" />
          <div
            className="absolute bottom-0 left-0 w-[500px] h-[300px] opacity-[0.06] blur-3xl pointer-events-none"
            style={{ background: theme.gradient }}
          />
        </>
      )}

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end max-w-[1000px] mx-auto px-5 md:px-8 pb-10">
        <div className="flex items-end gap-5 md:gap-6">
          {/* Logo */}
          {page.logo_url ? (
            <img
              src={page.logo_url}
              alt={page.title}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-white/10 object-cover shadow-2xl"
              style={{ boxShadow: `0 8px 32px -8px hsl(var(--page-accent) / 0.2)` }}
            />
          ) : (
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-white/10 bg-[#111214] flex items-center justify-center shadow-2xl"
              style={{ boxShadow: `0 8px 32px -8px hsl(var(--page-accent) / 0.2)` }}
            >
              <span
                className="text-3xl font-bold"
                style={{ background: theme.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                {page.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div className="pb-1 flex-1 min-w-0">
            <PageTypeBadge type={page.page_type} dark />
            <h1
              className="text-[2.2rem] sm:text-[3rem] md:text-[3.8rem] leading-[0.95] uppercase tracking-[0.06em] text-white font-bold mt-2"
              style={{ fontFamily: "'Oswald', 'Bebas Neue', sans-serif" }}
            >
              {page.title}
            </h1>
            {page.tagline && (
              <p className="text-white/45 mt-2 text-sm sm:text-base tracking-wide max-w-[500px]">
                {page.tagline}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
