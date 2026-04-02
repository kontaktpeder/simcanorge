import type { Database } from "@/integrations/supabase/types";
import { Mail, Phone, Globe } from "lucide-react";

type Page = Database["public"]["Tables"]["pages"]["Row"];

export function PublicPageContact({ page }: { page: Page }) {
  if (!page.contact_email && !page.contact_phone && !page.website) return null;

  return (
    <div>
      <h2
        className="text-[1.4rem] md:text-[1.6rem] uppercase text-white font-bold leading-[1] tracking-[0.06em] mb-5"
        style={{ fontFamily: "'Oswald', 'Impact', sans-serif" }}
      >
        Kontakt
      </h2>
      <div className="space-y-4">
        {page.contact_email && (
          <a
            href={`mailto:${page.contact_email}`}
            className="flex items-center gap-3 text-[15px] text-white/70 hover:text-[hsl(var(--page-accent))] transition-colors group"
          >
            <Mail className="w-4 h-4 text-[hsl(var(--page-accent)/0.7)] group-hover:text-[hsl(var(--page-accent))]" />
            {page.contact_email}
          </a>
        )}
        {page.contact_phone && (
          <a
            href={`tel:${page.contact_phone}`}
            className="flex items-center gap-3 text-[15px] text-white/70 hover:text-[hsl(var(--page-accent))] transition-colors group"
          >
            <Phone className="w-4 h-4 text-[hsl(var(--page-accent)/0.7)] group-hover:text-[hsl(var(--page-accent))]" />
            {page.contact_phone}
          </a>
        )}
        {page.website && (
          <a
            href={page.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-[15px] text-white/70 hover:text-[hsl(var(--page-accent))] transition-colors group"
          >
            <Globe className="w-4 h-4 text-[hsl(var(--page-accent)/0.7)] group-hover:text-[hsl(var(--page-accent))]" />
            {page.website.replace(/^https?:\/\//, "")}
          </a>
        )}
      </div>
    </div>
  );
}
