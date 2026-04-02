import type { Database } from "@/integrations/supabase/types";
import { MapPin, Calendar } from "lucide-react";

type Page = Database["public"]["Tables"]["pages"]["Row"];

export function PublicPageAbout({ page }: { page: Page }) {
  if (!page.about && !page.founded_year && !page.location) return null;

  return (
    <div>
      <h2
        className="text-[1.6rem] md:text-[2rem] uppercase text-white font-bold leading-[1] tracking-[0.06em] mb-6"
        style={{ fontFamily: "'Oswald', 'Impact', sans-serif" }}
      >
        Om oss
      </h2>

      {page.about && (
        <p className="text-[15px] text-white/70 whitespace-pre-wrap leading-relaxed max-w-[700px]">
          {page.about}
        </p>
      )}

      <div className="flex flex-wrap gap-6 mt-6">
        {page.location && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(page.location)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-white/50 hover:text-[hsl(var(--page-accent))] transition-colors"
          >
            <MapPin className="w-4 h-4 text-[hsl(var(--page-accent))]" />
            <span className="underline underline-offset-2 decoration-white/20 hover:decoration-[hsl(var(--page-accent)/0.5)]">
              {page.location}
            </span>
          </a>
        )}
        {page.founded_year && (
          <span className="flex items-center gap-2 text-sm text-white/50">
            <Calendar className="w-4 h-4 text-[hsl(var(--page-accent))]" />
            Grunnlagt {page.founded_year}
          </span>
        )}
      </div>
    </div>
  );
}
