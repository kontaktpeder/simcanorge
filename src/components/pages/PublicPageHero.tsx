import { PageTypeBadge } from "./PageTypeBadge";
import type { Database } from "@/integrations/supabase/types";

type Page = Database["public"]["Tables"]["pages"]["Row"];

export function PublicPageHero({ page }: { page: Page }) {
  return (
    <div className="relative">
      {page.cover_url ? (
        <div className="relative h-56 sm:h-72 overflow-hidden">
          <img src={page.cover_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--page-bg))] via-[hsl(var(--page-bg)/0.6)] to-transparent" />
        </div>
      ) : (
        <div className="h-40 bg-gradient-to-br from-[hsl(var(--page-card))] to-[hsl(var(--page-bg))]" />
      )}

      <div className="max-w-4xl mx-auto px-4 -mt-12 relative z-10">
        <div className="flex items-end gap-5">
          {page.logo_url ? (
            <img
              src={page.logo_url}
              alt={page.title}
              className="w-24 h-24 rounded-2xl border-[3px] border-[hsl(var(--page-accent)/0.4)] object-cover shadow-lg shadow-[hsl(var(--page-accent)/0.15)]"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl border-[3px] border-[hsl(var(--page-accent)/0.3)] bg-[hsl(var(--page-card))] flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-[hsl(var(--page-accent))]">
                {page.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div className="pb-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-[hsl(var(--page-text))] tracking-tight font-display">
                {page.title}
              </h1>
              <PageTypeBadge type={page.page_type} dark />
            </div>
            {page.tagline && (
              <p className="text-[hsl(var(--page-text-muted))] mt-1 text-base">{page.tagline}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
