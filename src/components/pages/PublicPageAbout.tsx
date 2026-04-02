import type { Database } from "@/integrations/supabase/types";
import { MapPin, Calendar } from "lucide-react";

type Page = Database["public"]["Tables"]["pages"]["Row"];

export function PublicPageAbout({ page }: { page: Page }) {
  if (!page.about && !page.founded_year && !page.location) return null;

  return (
    <div className="rounded-2xl border border-[hsl(var(--page-card-border))] bg-[hsl(var(--page-card))] p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--page-accent))] mb-4">
        Om oss
      </h2>
      {page.about && (
        <p className="text-sm text-[hsl(var(--page-text)/0.85)] whitespace-pre-wrap leading-relaxed">
          {page.about}
        </p>
      )}
      <div className="flex flex-wrap gap-4 text-sm text-[hsl(var(--page-text-muted))] mt-4">
        {page.location && (
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[hsl(var(--page-accent))]" />
            {page.location}
          </span>
        )}
        {page.founded_year && (
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[hsl(var(--page-accent))]" />
            Grunnlagt {page.founded_year}
          </span>
        )}
      </div>
    </div>
  );
}
