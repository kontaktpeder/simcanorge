import { PageTypeBadge } from "./PageTypeBadge";
import type { Database } from "@/integrations/supabase/types";

type Page = Database["public"]["Tables"]["pages"]["Row"];

export function PublicPageHero({ page }: { page: Page }) {
  return (
    <section className="relative overflow-hidden h-[280px] sm:h-[340px] md:h-[400px]">
      {page.cover_url ? (
        <>
          <img src={page.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--page-bg))] via-[hsl(var(--page-bg)/0.6)] to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[hsl(var(--page-bg))] to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[hsl(var(--page-bg)/0.4)] to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--page-card))] to-[hsl(var(--page-bg))]" />
      )}

      <div className="relative z-10 h-full flex flex-col justify-end max-w-[1000px] mx-auto px-5 md:px-8 pb-8">
        <div className="flex items-end gap-5">
          {page.logo_url ? (
            <img
              src={page.logo_url}
              alt={page.title}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-[hsl(var(--page-accent)/0.3)] object-cover shadow-lg shadow-[hsl(var(--page-accent)/0.1)]"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-[hsl(var(--page-accent)/0.3)] bg-[hsl(var(--page-card))] flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-[hsl(var(--page-accent))]">
                {page.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div className="pb-1">
            <PageTypeBadge type={page.page_type} dark />
            <h1
              className="text-[2rem] sm:text-[2.8rem] md:text-[3.5rem] leading-[1] uppercase tracking-[0.08em] text-white font-bold mt-2"
              style={{ fontFamily: "'Oswald', 'Bebas Neue', sans-serif" }}
            >
              {page.title}
            </h1>
            {page.tagline && (
              <p className="text-white/50 mt-1.5 text-sm sm:text-base tracking-wide">{page.tagline}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
