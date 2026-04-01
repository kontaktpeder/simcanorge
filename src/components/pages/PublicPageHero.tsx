import { PageTypeBadge } from "./PageTypeBadge";
import type { Database } from "@/integrations/supabase/types";

type Page = Database["public"]["Tables"]["pages"]["Row"];

export function PublicPageHero({ page }: { page: Page }) {
  return (
    <div className="relative">
      {page.cover_url ? (
        <div className="relative h-48 sm:h-64 overflow-hidden">
          <img src={page.cover_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      ) : (
        <div className="h-32 bg-muted" />
      )}

      <div className="max-w-4xl mx-auto px-4 -mt-10 relative z-10">
        <div className="flex items-end gap-4">
          {page.logo_url ? (
            <img src={page.logo_url} alt={page.title} className="w-20 h-20 rounded-xl border-4 border-background object-cover shadow-md" />
          ) : (
            <div className="w-20 h-20 rounded-xl border-4 border-background bg-muted flex items-center justify-center shadow-md">
              <span className="text-2xl font-bold text-muted-foreground">
                {page.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div className="pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{page.title}</h1>
              <PageTypeBadge type={page.page_type} />
            </div>
            {page.tagline && (
              <p className="text-muted-foreground mt-0.5">{page.tagline}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
